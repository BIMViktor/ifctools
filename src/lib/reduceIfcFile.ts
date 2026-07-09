import type { IfcDataStore } from "@ifc-lite/parser";
import { extractPropertiesOnDemand } from "@ifc-lite/parser";
import { MutablePropertyView, StoreEditor } from "@ifc-lite/mutations";
import type { StepExportResult } from "@ifc-lite/export";
import { isColorableIfcType } from "@/lib/ifcTypes";

export type ReduceLevel = "light" | "medium" | "aggressive";

export interface ReduceProgress {
  phase: "parsing" | "analyzing" | "mutating" | "simplifying" | "exporting" | "done";
  percent: number;
  label: string;
}

export interface ReduceStats {
  originalBytes: number;
  outputBytes: number;
  hiddenEntities: number;
  purgedPropertySets: number;
  tessellationQuality?: string;
}

export interface ReduceResult {
  blob: Blob;
  filename: string;
  stats: ReduceStats;
  exportStats: StepExportResult["stats"];
}

const NON_PHYSICAL_TYPES = new Set([
  "IFCSPACE",
  "IFCSPACETYPE",
  "IFCZONE",
  "IFCANNOTATION",
  "IFCGRID",
  "IFCPROXY",
  "IFCEXTERNALSPATIALELEMENT",
]);

const HELPER_TYPES_MEDIUM = new Set([
  "IFCBUILDINGELEMENTPROXY",
  "IFCDISCRETEACCESSORY",
  "IFCOPENINGELEMENT",
]);

const TRANSACTION_TYPES = new Set([
  "IFCOWNERHISTORY",
  "IFCPERSON",
  "IFCORGANIZATION",
  "IFCPERSONANDORGANIZATION",
  "IFCAPPLICATION",
  "IFCACTORROLE",
]);

const TEXTURE_TYPES = new Set([
  "IFCIMAGETEXTURE",
  "IFCTEXTUREMAP",
  "IFCTEXTUREVERTEX",
  "IFCTEXTURECOORDINATE",
  "IFCTEXTURECOORDINATEGENERATOR",
  "IFCCURVESTYLE",
  "IFCFILLAREASTYLEHATCHING",
]);

function inferSchema(store: IfcDataStore) {
  const raw = (store.schemaVersion ?? "IFC4").toUpperCase();
  if (raw.includes("IFC4X3") || raw.includes("IFC4.3")) return "IFC4X3" as const;
  if (raw.includes("IFC2X3")) return "IFC2X3" as const;
  if (raw.includes("IFC5")) return "IFC5" as const;
  return "IFC4" as const;
}

function maxExpressId(store: IfcDataStore): number {
  let max = 0;
  for (const id of store.entityIndex.byId.keys()) {
    if (id > max) max = id;
  }
  return max;
}

async function getEntityPropertySets(
  store: IfcDataStore,
  entityId: number
) {
  const direct = store.getProperties(entityId);
  if (direct.length > 0) return direct;
  return extractPropertiesOnDemand(store, entityId);
}

function collectHiddenEntityIds(
  store: IfcDataStore,
  level: ReduceLevel
): Set<number> {
  const hidden = new Set<number>();

  for (const [type, ids] of store.entityIndex.byType) {
    if (level === "light") {
      if (TRANSACTION_TYPES.has(type) && ids.length > 1) {
        ids.slice(1).forEach((id) => hidden.add(id));
      }
      continue;
    }

    if (NON_PHYSICAL_TYPES.has(type)) {
      ids.forEach((id) => hidden.add(id));
      continue;
    }

    if (level === "medium" || level === "aggressive") {
      if (HELPER_TYPES_MEDIUM.has(type)) {
        ids.forEach((id) => hidden.add(id));
      }
      if (TEXTURE_TYPES.has(type)) {
        ids.forEach((id) => hidden.add(id));
      }
    }
  }

  if (level === "aggressive") {
    for (const [type, ids] of store.entityIndex.byType) {
      if (type.includes("ANNOTATION") || type.includes("GRID")) {
        ids.forEach((id) => hidden.add(id));
      }
    }
  }

  return hidden;
}

function collectPhysicalExpressIds(store: IfcDataStore): number[] {
  const ids: number[] = [];
  for (const [type, typeIds] of store.entityIndex.byType) {
    if (!isColorableIfcType(type)) continue;
    if (NON_PHYSICAL_TYPES.has(type)) continue;
    ids.push(...typeIds);
  }
  return ids;
}

export async function buildReduceMutations(
  store: IfcDataStore,
  level: ReduceLevel
): Promise<{
  mutationView: MutablePropertyView;
  purgedPropertySets: number;
}> {
  const mutationView = new MutablePropertyView(store.properties, "reduce");
  mutationView.setExpressIdWatermark(maxExpressId(store));
  mutationView.setOnDemandExtractor((entityId) =>
    extractPropertiesOnDemand(store, entityId).map((pset) => ({
      name: pset.name,
      globalId: pset.globalId,
      properties: pset.properties.map((prop) => ({
        name: prop.name,
        type: prop.type,
        value: prop.value,
        dataType: prop.dataType,
      })),
    }))
  );

  let purgedPropertySets = 0;

  if (level === "light" || level === "medium" || level === "aggressive") {
    const sampleIds = collectPhysicalExpressIds(store).slice(0, 2500);
    for (const entityId of sampleIds) {
      const psets = await getEntityPropertySets(store, entityId);
      for (const pset of psets) {
        if (pset.properties.length === 0) {
          mutationView.deletePropertySet(entityId, pset.name);
          purgedPropertySets += 1;
        }
      }
    }
  }

  if (level === "medium" || level === "aggressive") {
    const editor = new StoreEditor(store, mutationView);
    for (const id of collectHiddenEntityIds(store, level)) {
      editor.removeEntity(id);
    }
  }

  return { mutationView, purgedPropertySets };
}

async function exportReducedStep(
  store: IfcDataStore,
  level: ReduceLevel,
  mutationView: MutablePropertyView | undefined,
  sourceFilename: string,
  onProgress?: (progress: ReduceProgress) => void
): Promise<{ blob: Blob; filename: string; stats: ReduceStats; exportStats: StepExportResult["stats"] }> {
  const hiddenEntityIds = collectHiddenEntityIds(store, level);
  const { StepExporter } = await import("@ifc-lite/export");
  const exporter = new StepExporter(store, mutationView);
  const baseName = sourceFilename.replace(/\.ifc$/i, "");
  const filename = `${baseName}-${level}-optimized.ifc`;

  onProgress?.({
    phase: "exporting",
    percent: 0.55,
    label: "Recompiling optimized IFC…",
  });

  const result = await exporter.exportAsync({
    schema: inferSchema(store),
    description: `Optimized (${level}) by ifc2go.com`,
    application: "ifc2go",
    author: "ifc2go",
    organization: "ifc2go",
    filename,
    applyMutations: Boolean(mutationView),
    visibleOnly: hiddenEntityIds.size > 0,
    hiddenEntityIds,
    isolatedEntityIds: null,
    includeGeometry: true,
    includeProperties: level === "light",
    includeQuantities: level === "light",
    includeRelationships: true,
    onProgress: (progress) => {
      onProgress?.({
        phase: "exporting",
        percent: 0.55 + progress.percent * 0.35,
        label: `Recompiling optimized IFC… ${progress.entitiesProcessed.toLocaleString()} / ${progress.entitiesTotal.toLocaleString()}`,
      });
    },
  });

  return {
    blob: new Blob([new Uint8Array(result.content)], {
      type: "application/octet-stream",
    }),
    filename,
    stats: {
      originalBytes: store.fileSize,
      outputBytes: result.stats.fileSize,
      hiddenEntities: hiddenEntityIds.size,
      purgedPropertySets: 0,
      tessellationQuality: level === "aggressive" ? "lowest" : undefined,
    },
    exportStats: result.stats,
  };
}

async function tryAggressiveGeometryPass(
  store: IfcDataStore,
  hiddenEntityIds: Set<number>,
  onProgress?: (progress: ReduceProgress) => void
): Promise<Uint8Array | null> {
  const physicalIds = collectPhysicalExpressIds(store).filter(
    (id) => !hiddenEntityIds.has(id)
  );
  if (physicalIds.length === 0) return null;

  onProgress?.({
    phase: "simplifying",
    percent: 0.35,
    label: "Simplifying mesh geometry…",
  });

  const { GeometryProcessor } = await import("@ifc-lite/geometry");
  const processor = new GeometryProcessor();
  await processor.init();
  processor.setTessellationQuality("lowest");

  const included = new Uint32Array(physicalIds);
  const output = processor.exportStep(
    store.source,
    inferSchema(store),
    included
  );

  return output;
}

export async function reduceIfcFile(
  store: IfcDataStore,
  level: ReduceLevel,
  sourceFilename: string,
  onProgress?: (progress: ReduceProgress) => void
): Promise<ReduceResult> {
  onProgress?.({
    phase: "analyzing",
    percent: 0.1,
    label: "Analyzing removable entities…",
  });

  const hiddenEntityIds = collectHiddenEntityIds(store, level);
  const { mutationView, purgedPropertySets } = await buildReduceMutations(
    store,
    level
  );

  if (level === "aggressive") {
    const simplified = await tryAggressiveGeometryPass(
      store,
      hiddenEntityIds,
      onProgress
    );

    if (simplified) {
      const { IfcParser } = await import("@ifc-lite/parser");
      const parser = new IfcParser();
      const simplifiedStore = await parser.parseColumnar(
        simplified.buffer.slice(
          simplified.byteOffset,
          simplified.byteOffset + simplified.byteLength
        )
      );

      const exported = await exportReducedStep(
        simplifiedStore,
        level,
        undefined,
        sourceFilename,
        onProgress
      );

      onProgress?.({
        phase: "done",
        percent: 1,
        label: "Optimization complete",
      });

      return {
        ...exported,
        stats: {
          ...exported.stats,
          originalBytes: store.fileSize,
          hiddenEntities: hiddenEntityIds.size,
          purgedPropertySets,
          tessellationQuality: "lowest",
        },
      };
    }
  }

  const exported = await exportReducedStep(
    store,
    level,
    mutationView,
    sourceFilename,
    onProgress
  );

  onProgress?.({
    phase: "done",
    percent: 1,
    label: "Optimization complete",
  });

  return {
    ...exported,
    stats: {
      ...exported.stats,
      originalBytes: store.fileSize,
      hiddenEntities: hiddenEntityIds.size,
      purgedPropertySets,
    },
  };
}

export async function parseIfcForReduce(
  file: File,
  onProgress?: (progress: ReduceProgress) => void
) {
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
        percent: percent * 0.08,
        label: "Parsing IFC file…",
      });
    },
  });
}

export function downloadReducedIfc(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function formatSavings(stats: ReduceStats): string {
  if (stats.originalBytes <= 0) return "0%";
  const saved = Math.max(
    0,
    ((stats.originalBytes - stats.outputBytes) / stats.originalBytes) * 100
  );
  return `${saved.toFixed(1)}%`;
}
