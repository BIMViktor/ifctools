import type { IfcDataStore } from "@ifc-lite/parser";
import { StoreEditor, MutablePropertyView } from "@ifc-lite/mutations";
import type { StepExportResult } from "@ifc-lite/export";
import { isColorableIfcType } from "@/lib/ifcTypes";

export interface KeepPhysicalProgress {
  phase: "parsing" | "analyzing" | "exporting" | "done";
  percent: number;
  label: string;
}

export interface KeepPhysicalStats {
  originalBytes: number;
  outputBytes: number;
  strippedEntities: number;
  keptEntities: number;
}

export interface KeepPhysicalResult {
  blob: Blob;
  filename: string;
  stats: KeepPhysicalStats;
  exportStats: StepExportResult["stats"];
}

/** Non-physical / helper entities stripped from the model. */
const STRIP_TYPES = new Set([
  "IFCSPACE",
  "IFCSPACETYPE",
  "IFCZONE",
  "IFCANNOTATION",
  "IFCGRID",
  "IFCPROXY",
  "IFCEXTERNALSPATIALELEMENT",
  "IFCVIRTUALELEMENT",
  "IFCIMAGETEXTURE",
  "IFCTEXTUREMAP",
  "IFCTEXTUREVERTEX",
  "IFCTEXTURECOORDINATE",
  "IFCTEXTURECOORDINATEGENERATOR",
  "IFCCURVESTYLE",
  "IFCFILLAREASTYLEHATCHING",
  "IFCDRAUGHTINGPREDEFINEDCURVEFONT",
  "IFCDRAUGHTINGPREDEFINEDCOLOUR",
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

export function collectStripEntityIds(store: IfcDataStore): Set<number> {
  const hidden = new Set<number>();

  for (const [type, ids] of store.entityIndex.byType) {
    if (STRIP_TYPES.has(type)) {
      ids.forEach((id) => hidden.add(id));
      continue;
    }

    if (type.includes("ANNOTATION") || type.includes("GRID")) {
      ids.forEach((id) => hidden.add(id));
    }
  }

  return hidden;
}

export function collectKeptPhysicalIds(store: IfcDataStore): number[] {
  const hidden = collectStripEntityIds(store);
  const kept: number[] = [];

  for (const [type, ids] of store.entityIndex.byType) {
    if (!isColorableIfcType(type)) continue;
    if (STRIP_TYPES.has(type)) continue;
    for (const id of ids) {
      if (!hidden.has(id)) kept.push(id);
    }
  }

  return kept;
}

export async function parseIfcForKeepPhysical(
  file: File,
  onProgress?: (progress: KeepPhysicalProgress) => void
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
        percent: percent * 0.2,
        label: "Parsing IFC file…",
      });
    },
  });
}

export async function exportPhysicalOnlyIfc(
  store: IfcDataStore,
  sourceFilename: string,
  onProgress?: (progress: KeepPhysicalProgress) => void
): Promise<KeepPhysicalResult> {
  onProgress?.({
    phase: "analyzing",
    percent: 0.25,
    label: "Identifying non-physical elements…",
  });

  const hiddenEntityIds = collectStripEntityIds(store);
  const keptEntities = collectKeptPhysicalIds(store);

  const mutationView = new MutablePropertyView(store.properties, "keep-physical");
  mutationView.setExpressIdWatermark(maxExpressId(store));
  const editor = new StoreEditor(store, mutationView);
  for (const id of hiddenEntityIds) {
    editor.removeEntity(id);
  }

  const { StepExporter } = await import("@ifc-lite/export");
  const exporter = new StepExporter(store, mutationView);
  const baseName = sourceFilename.replace(/\.ifc$/i, "");
  const filename = `${baseName}-physical-only.ifc`;

  onProgress?.({
    phase: "exporting",
    percent: 0.4,
    label: "Exporting physical-only IFC…",
  });

  const result = await exporter.exportAsync({
    schema: inferSchema(store),
    description: "Physical elements only — stripped by ifc2go.com",
    application: "ifc2go",
    author: "ifc2go",
    organization: "ifc2go",
    filename,
    applyMutations: true,
    visibleOnly: true,
    hiddenEntityIds,
    isolatedEntityIds: null,
    includeGeometry: true,
    includeProperties: true,
    includeQuantities: true,
    includeRelationships: true,
    onProgress: (progress) => {
      onProgress?.({
        phase: "exporting",
        percent: 0.4 + progress.percent * 0.6,
        label: `Exporting physical-only IFC… ${progress.entitiesProcessed.toLocaleString()} / ${progress.entitiesTotal.toLocaleString()}`,
      });
    },
  });

  onProgress?.({
    phase: "done",
    percent: 1,
    label: "Export complete",
  });

  return {
    blob: new Blob([new Uint8Array(result.content)], {
      type: "application/octet-stream",
    }),
    filename,
    stats: {
      originalBytes: store.fileSize,
      outputBytes: result.stats.fileSize,
      strippedEntities: hiddenEntityIds.size,
      keptEntities: keptEntities.length,
    },
    exportStats: result.stats,
  };
}

export function downloadPhysicalIfc(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function formatSizeKb(bytes: number): string {
  return `${Math.round(bytes / 1024).toLocaleString()} KB`;
}
