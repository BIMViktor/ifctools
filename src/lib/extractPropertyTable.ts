import type { IfcDataStore } from "@ifc-lite/parser";
import {
  extractEntityAttributesOnDemand,
  extractPropertiesOnDemand,
  extractQuantitiesOnDemand,
} from "@ifc-lite/parser";
import { isColorableIfcType } from "@/lib/ifcTypes";

export interface PropertyRow {
  globalId: string;
  expressId: number;
  ifcType: string;
  name: string;
  setType: "Property" | "Quantity";
  setName: string;
  fieldName: string;
  value: string;
  unit?: string;
}

export interface ExtractProgress {
  phase: "parsing" | "extracting" | "done";
  percent: number;
  label: string;
}

export interface ExtractResult {
  blob: Blob;
  filename: string;
  rowCount: number;
  elementCount: number;
}

function isExtractableType(type: string): boolean {
  if (!type.startsWith("IFC")) return false;
  if (type.startsWith("IFCREL")) return false;
  if (type.endsWith("TYPE")) return false;
  return isColorableIfcType(type) || type === "IFCBUILDINGELEMENTPROXY";
}

function collectTargetIds(store: IfcDataStore): number[] {
  const ids = new Set<number>();

  const hierarchy = store.spatialHierarchy;
  if (hierarchy) {
    for (const elementIds of hierarchy.byStorey.values()) {
      elementIds.forEach((id) => ids.add(id));
    }
  }

  for (const [type, typeIds] of store.entityIndex.byType) {
    if (!isExtractableType(type)) continue;
    typeIds.forEach((id) => ids.add(id));
  }

  return [...ids];
}

function formatValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) return value.map(formatValue).join("; ");
  return String(value);
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

async function getProperties(store: IfcDataStore, entityId: number) {
  const direct = store.getProperties(entityId);
  if (direct.length > 0) return direct;
  return extractPropertiesOnDemand(store, entityId);
}

async function getQuantities(store: IfcDataStore, entityId: number) {
  const direct = store.getQuantities(entityId);
  if (direct.length > 0) return direct;
  return extractQuantitiesOnDemand(store, entityId);
}

export async function extractPropertyRows(
  store: IfcDataStore,
  onProgress?: (progress: ExtractProgress) => void
): Promise<PropertyRow[]> {
  const targetIds = collectTargetIds(store);
  const rows: PropertyRow[] = [];

  for (let i = 0; i < targetIds.length; i++) {
    if (i % 25 === 0) {
      onProgress?.({
        phase: "extracting",
        percent: targetIds.length ? i / targetIds.length : 0,
        label: `Extracting properties… ${i.toLocaleString()} / ${targetIds.length.toLocaleString()}`,
      });
    }

    const expressId = targetIds[i];
    const attrs = extractEntityAttributesOnDemand(store, expressId);
    const ifcType = store.entities.getTypeName(expressId) || "Unknown";
    const globalId = store.entities.getGlobalId(expressId) || attrs.globalId || "";
    const name =
      store.entities.getName(expressId) ||
      attrs.name ||
      attrs.objectType ||
      attrs.tag ||
      "";

    const psets = await getProperties(store, expressId);
    for (const pset of psets) {
      for (const prop of pset.properties) {
        rows.push({
          globalId,
          expressId,
          ifcType: ifcType.replace(/^IFC/, "Ifc"),
          name,
          setType: "Property",
          setName: pset.name,
          fieldName: prop.name,
          value: formatValue(prop.value),
          unit: "unit" in prop && typeof prop.unit === "string" ? prop.unit : undefined,
        });
      }
    }

    const qsets = await getQuantities(store, expressId);
    for (const qset of qsets) {
      for (const qty of qset.quantities) {
        rows.push({
          globalId,
          expressId,
          ifcType: ifcType.replace(/^IFC/, "Ifc"),
          name,
          setType: "Quantity",
          setName: qset.name,
          fieldName: qty.name,
          value: formatValue(qty.value),
          unit: "unit" in qty && typeof qty.unit === "string" ? qty.unit : undefined,
        });
      }
    }

    if (psets.length === 0 && qsets.length === 0) {
      rows.push({
        globalId,
        expressId,
        ifcType: ifcType.replace(/^IFC/, "Ifc"),
        name,
        setType: "Property",
        setName: "",
        fieldName: "",
        value: "",
      });
    }
  }

  onProgress?.({
    phase: "done",
    percent: 1,
    label: `Extracted ${rows.length.toLocaleString()} rows`,
  });

  return rows;
}

export function propertyRowsToCsv(rows: PropertyRow[]): string {
  const header = [
    "GlobalId",
    "ExpressId",
    "IFCType",
    "Name",
    "SetType",
    "SetName",
    "FieldName",
    "Value",
    "Unit",
  ];

  const lines = [
    header.join(","),
    ...rows.map((row) =>
      [
        csvEscape(row.globalId),
        String(row.expressId),
        csvEscape(row.ifcType),
        csvEscape(row.name),
        csvEscape(row.setType),
        csvEscape(row.setName),
        csvEscape(row.fieldName),
        csvEscape(row.value),
        csvEscape(row.unit ?? ""),
      ].join(",")
    ),
  ];

  return `\uFEFF${lines.join("\n")}`;
}

export async function parseIfcForExtract(
  file: File,
  onProgress?: (progress: ExtractProgress) => void
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
        percent: percent * 0.15,
        label: "Parsing IFC file…",
      });
    },
  });
}

export async function exportPropertyCsv(
  store: IfcDataStore,
  sourceFilename: string,
  onProgress?: (progress: ExtractProgress) => void
): Promise<ExtractResult> {
  const rows = await extractPropertyRows(store, (progress) => {
    onProgress?.({
      ...progress,
      percent: 0.15 + progress.percent * 0.85,
    });
  });

  const csv = propertyRowsToCsv(rows);
  const baseName = sourceFilename.replace(/\.ifc$/i, "");
  const filename = `${baseName}-properties.csv`;

  return {
    blob: new Blob([csv], { type: "text/csv;charset=utf-8" }),
    filename,
    rowCount: rows.length,
    elementCount: new Set(rows.map((row) => row.expressId)).size,
  };
}

export function downloadPropertyCsv(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
