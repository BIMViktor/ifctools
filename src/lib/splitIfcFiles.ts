import type { IfcDataStore } from "@ifc-lite/parser";
import type { SpatialNode } from "@ifc-lite/data";
import type { StepExportOptions, StepExportResult } from "@ifc-lite/export";

export type SplitMode = "storey" | "building" | "class" | "property";

export interface SplitKey {
  id: string;
  label: string;
  elementCount: number;
  expressIds: number[];
  meta?: string;
}

export interface PropertyField {
  id: string;
  psetName: string;
  propName: string;
  label: string;
  valueCount: number;
}

export interface SplitProgress {
  phase: "parsing" | "discovering" | "exporting" | "done";
  percent: number;
  label: string;
  currentKey?: string;
  keyIndex?: number;
  keyCount?: number;
}

export interface SplitOutput {
  key: SplitKey;
  blob: Blob;
  filename: string;
  stats: StepExportResult["stats"];
}

const INFRA_TYPES = new Set([
  "IfcProject",
  "IfcSite",
  "IfcBuilding",
  "IfcBuildingStorey",
  "IfcSpace",
  "IfcZone",
  "IfcExternalSpatialElement",
  "IfcOwnerHistory",
  "IfcPerson",
  "IfcOrganization",
  "IfcApplication",
  "IfcPersonAndOrganization",
  "IfcGeometricRepresentationContext",
  "IfcGeometricRepresentationSubContext",
  "IfcUnitAssignment",
  "IfcPostalAddress",
  "IfcActorRole",
]);

type OutputSchema = StepExportOptions["schema"];

function inferSchema(store: IfcDataStore): OutputSchema {
  const raw = (store.schemaVersion ?? "IFC4").toUpperCase();
  if (raw.includes("IFC4X3") || raw.includes("IFC4.3")) return "IFC4X3";
  if (raw.includes("IFC2X3")) return "IFC2X3";
  if (raw.includes("IFC5")) return "IFC5";
  return "IFC4";
}

function safeSlug(label: string): string {
  return (
    label
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "split"
  );
}

function formatPropValue(value: unknown): string {
  if (value == null) return "(empty)";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) return value.map(formatPropValue).join(", ");
  return String(value);
}

function isSplittableType(type: string): boolean {
  return (
    type.startsWith("Ifc") &&
    !type.startsWith("IfcRel") &&
    !INFRA_TYPES.has(type)
  );
}

function findSpatialNode(
  root: SpatialNode,
  expressId: number
): SpatialNode | null {
  if (root.expressId === expressId) return root;
  for (const child of root.children) {
    const found = findSpatialNode(child, expressId);
    if (found) return found;
  }
  return null;
}

function spatialLabel(
  store: IfcDataStore,
  expressId: number,
  fallback: string
): string {
  const hierarchy = store.spatialHierarchy;
  if (hierarchy) {
    const node = findSpatialNode(hierarchy.project, expressId);
    if (node) {
      return node.longName || node.name || fallback;
    }
  }
  return store.entities.getName(expressId) || fallback;
}

function getAllElementIds(store: IfcDataStore): number[] {
  const ids = new Set<number>();
  const hierarchy = store.spatialHierarchy;

  if (hierarchy) {
    for (const elementIds of hierarchy.byStorey.values()) {
      elementIds.forEach((id) => ids.add(id));
    }
    if (ids.size > 0) return [...ids];
  }

  for (const [type, typeIds] of store.entityIndex.byType) {
    if (isSplittableType(type)) {
      typeIds.forEach((id) => ids.add(id));
    }
  }

  return [...ids];
}

async function getEntityProperties(
  store: IfcDataStore,
  entityId: number
): Promise<
  { name: string; properties: { name: string; value: unknown }[] }[]
> {
  const direct = store.getProperties(entityId);
  if (direct.length > 0) {
    return direct.map((pset) => ({
      name: pset.name,
      properties: pset.properties.map((prop) => ({
        name: prop.name,
        value: prop.value,
      })),
    }));
  }

  const { extractPropertiesOnDemand } = await import("@ifc-lite/parser");
  return extractPropertiesOnDemand(store, entityId).map((pset) => ({
    name: pset.name,
    properties: pset.properties.map((prop) => ({
      name: prop.name,
      value: prop.value,
    })),
  }));
}

export async function parseIfcForSplit(
  file: File,
  onProgress?: (progress: SplitProgress) => void
): Promise<IfcDataStore> {
  onProgress?.({
    phase: "parsing",
    percent: 0,
    label: "Parsing IFC file…",
  });

  const buffer = await file.arrayBuffer();
  const { IfcParser } = await import("@ifc-lite/parser");
  const parser = new IfcParser();

  return parser.parseColumnar(buffer, {
    onProgress: ({ percent }) => {
      onProgress?.({
        phase: "parsing",
        percent: percent * 0.9,
        label: "Parsing IFC file…",
      });
    },
  });
}

export function discoverStoreyKeys(store: IfcDataStore): SplitKey[] {
  const hierarchy = store.spatialHierarchy;
  if (!hierarchy) return [];

  return [...hierarchy.byStorey.entries()]
    .map(([storeyId, expressIds]) => ({
      id: `storey-${storeyId}`,
      label: spatialLabel(store, storeyId, `Storey #${storeyId}`),
      elementCount: expressIds.length,
      expressIds,
      meta: "IfcBuildingStorey",
    }))
    .filter((key) => key.elementCount > 0)
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function discoverBuildingKeys(store: IfcDataStore): SplitKey[] {
  const hierarchy = store.spatialHierarchy;
  if (!hierarchy) return [];

  return [...hierarchy.byBuilding.entries()]
    .map(([buildingId, expressIds]) => ({
      id: `building-${buildingId}`,
      label: spatialLabel(store, buildingId, `Building #${buildingId}`),
      elementCount: expressIds.length,
      expressIds,
      meta: "IfcBuilding",
    }))
    .filter((key) => key.elementCount > 0)
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function discoverClassKeys(store: IfcDataStore): SplitKey[] {
  const keys: SplitKey[] = [];

  for (const [type, expressIds] of store.entityIndex.byType) {
    if (!isSplittableType(type) || expressIds.length === 0) continue;
    keys.push({
      id: `class-${type}`,
      label: type.replace(/^Ifc/, ""),
      elementCount: expressIds.length,
      expressIds: [...expressIds],
      meta: type,
    });
  }

  return keys.sort((a, b) => b.elementCount - a.elementCount);
}

export async function discoverPropertyFields(
  store: IfcDataStore,
  onProgress?: (progress: SplitProgress) => void
): Promise<PropertyField[]> {
  const elementIds = getAllElementIds(store);
  const valuesByField = new Map<string, Set<string>>();

  for (let i = 0; i < elementIds.length; i++) {
    if (i % 50 === 0) {
      onProgress?.({
        phase: "discovering",
        percent: elementIds.length ? i / elementIds.length : 0,
        label: `Scanning properties… ${i.toLocaleString()} / ${elementIds.length.toLocaleString()}`,
      });
    }

    const psets = await getEntityProperties(store, elementIds[i]);
    for (const pset of psets) {
      for (const prop of pset.properties) {
        const fieldId = `${pset.name}::${prop.name}`;
        if (!valuesByField.has(fieldId)) valuesByField.set(fieldId, new Set());
        valuesByField.get(fieldId)!.add(formatPropValue(prop.value));
      }
    }
  }

  return [...valuesByField.entries()]
    .map(([fieldId, values]) => {
      const [psetName, propName] = fieldId.split("::");
      return {
        id: fieldId,
        psetName,
        propName,
        label: `${psetName}.${propName}`,
        valueCount: values.size,
      };
    })
    .filter((field) => field.valueCount > 0)
    .sort((a, b) => b.valueCount - a.valueCount);
}

export async function discoverPropertyValueKeys(
  store: IfcDataStore,
  field: PropertyField,
  onProgress?: (progress: SplitProgress) => void
): Promise<SplitKey[]> {
  const elementIds = getAllElementIds(store);
  const valueToIds = new Map<string, number[]>();

  for (let i = 0; i < elementIds.length; i++) {
    if (i % 50 === 0) {
      onProgress?.({
        phase: "discovering",
        percent: elementIds.length ? i / elementIds.length : 0,
        label: `Grouping by ${field.label}…`,
      });
    }

    const psets = await getEntityProperties(store, elementIds[i]);
    const pset = psets.find((item) => item.name === field.psetName);
    const prop = pset?.properties.find((item) => item.name === field.propName);
    const label = formatPropValue(prop?.value);

    if (!valueToIds.has(label)) valueToIds.set(label, []);
    valueToIds.get(label)!.push(elementIds[i]);
  }

  return [...valueToIds.entries()]
    .map(([label, expressIds]) => ({
      id: `property-${field.id}-${safeSlug(label)}`,
      label,
      elementCount: expressIds.length,
      expressIds,
      meta: field.label,
    }))
    .filter((key) => key.elementCount > 0)
    .sort((a, b) => a.label.localeCompare(b.label));
}

export async function discoverSplitKeys(
  store: IfcDataStore,
  mode: SplitMode,
  propertyField?: PropertyField | null,
  onProgress?: (progress: SplitProgress) => void
): Promise<SplitKey[]> {
  switch (mode) {
    case "storey":
      return discoverStoreyKeys(store);
    case "building":
      return discoverBuildingKeys(store);
    case "class":
      return discoverClassKeys(store);
    case "property":
      if (!propertyField) return [];
      return discoverPropertyValueKeys(store, propertyField, onProgress);
    default:
      return [];
  }
}

export async function exportSplitSlice(
  store: IfcDataStore,
  key: SplitKey,
  baseName: string,
  onProgress?: (progress: SplitProgress) => void
): Promise<SplitOutput> {
  const { StepExporter } = await import("@ifc-lite/export");
  const exporter = new StepExporter(store);
  const filename = `${baseName}-${safeSlug(key.label)}.ifc`;

  onProgress?.({
    phase: "exporting",
    percent: 0,
    label: `Exporting ${key.label}…`,
    currentKey: key.label,
  });

  const result = await exporter.exportAsync({
    schema: inferSchema(store),
    description: `Split by ifc2go.com — ${key.label}`,
    application: "ifc2go",
    author: "ifc2go",
    organization: "ifc2go",
    filename,
    visibleOnly: true,
    hiddenEntityIds: new Set<number>(),
    isolatedEntityIds: new Set(key.expressIds),
    includeGeometry: true,
    includeProperties: true,
    includeQuantities: true,
    includeRelationships: true,
    onProgress: (progress) => {
      onProgress?.({
        phase: "exporting",
        percent: progress.percent,
        label: `Exporting ${key.label}… ${progress.entitiesProcessed.toLocaleString()} / ${progress.entitiesTotal.toLocaleString()}`,
        currentKey: key.label,
      });
    },
  });

  return {
    key,
    blob: new Blob([new Uint8Array(result.content)], {
      type: "application/octet-stream",
    }),
    filename,
    stats: result.stats,
  };
}

export async function runSplitExports(
  store: IfcDataStore,
  keys: SplitKey[],
  sourceFilename: string,
  onProgress?: (progress: SplitProgress) => void
): Promise<SplitOutput[]> {
  if (keys.length === 0) {
    throw new Error("Select at least one split target.");
  }

  const baseName = sourceFilename.replace(/\.ifc$/i, "");
  const outputs: SplitOutput[] = [];

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    onProgress?.({
      phase: "exporting",
      percent: i / keys.length,
      label: `Exporting ${key.label} (${i + 1} of ${keys.length})…`,
      currentKey: key.label,
      keyIndex: i + 1,
      keyCount: keys.length,
    });

    const output = await exportSplitSlice(store, key, baseName, (sliceProgress) => {
      const sliceShare = 1 / keys.length;
      onProgress?.({
        ...sliceProgress,
        percent: i * sliceShare + sliceProgress.percent * sliceShare,
        keyIndex: i + 1,
        keyCount: keys.length,
      });
    });

    outputs.push(output);
  }

  onProgress?.({
    phase: "done",
    percent: 1,
    label: `Created ${outputs.length} IFC file${outputs.length === 1 ? "" : "s"}`,
    keyCount: outputs.length,
  });

  return outputs;
}

export function downloadSplitIfc(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadAllSplitOutputs(outputs: SplitOutput[]): void {
  for (const output of outputs) {
    downloadSplitIfc(output.blob, output.filename);
  }
}
