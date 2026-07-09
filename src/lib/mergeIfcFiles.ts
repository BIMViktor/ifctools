import type { IfcDataStore } from "@ifc-lite/parser";
import type {
  MergeExportOptions,
  MergeExportResult,
  MergeModelInput,
} from "@ifc-lite/export";

export interface MergeFileInput {
  id: string;
  file: File;
  name: string;
}

export type MergePhase =
  | "parsing"
  | "preparing"
  | "entities"
  | "assembling"
  | "done";

export interface MergeProgress {
  phase: MergePhase;
  percent: number;
  label: string;
  currentModel?: string;
  fileIndex?: number;
  fileCount?: number;
  entitiesProcessed?: number;
  entitiesTotal?: number;
}

export interface MergeResult {
  blob: Blob;
  stats: MergeExportResult["stats"];
  filename: string;
}

type OutputSchema = MergeExportOptions["schema"];

function inferSchema(store: IfcDataStore): OutputSchema {
  const raw = (store.schemaVersion ?? "IFC4").toUpperCase();
  if (raw.includes("IFC4X3") || raw.includes("IFC4.3")) return "IFC4X3";
  if (raw.includes("IFC2X3") || raw.includes("IFC2X3")) return "IFC2X3";
  if (raw.includes("IFC5")) return "IFC5";
  return "IFC4";
}

function phaseLabel(
  phase: MergePhase,
  currentModel?: string,
  entitiesProcessed?: number,
  entitiesTotal?: number
): string {
  switch (phase) {
    case "parsing":
      return currentModel ? `Parsing ${currentModel}…` : "Parsing IFC files…";
    case "preparing":
      return "Preparing federated merge…";
    case "entities":
      if (entitiesTotal && entitiesTotal > 0) {
        return `Stitching entities… ${entitiesProcessed?.toLocaleString() ?? 0} / ${entitiesTotal.toLocaleString()}`;
      }
      return "Stitching element headers, geometry and properties…";
    case "assembling":
      return "Assembling consolidated IFC file…";
    case "done":
      return "Merge complete";
    default:
      return "Merging…";
  }
}

/**
 * Parse every input file with ifc-lite, then stitch them into one IFC STEP
 * output using {@link MergedExporter} (IfcOpenShell MergeProjects recipe).
 */
export async function mergeIfcFiles(
  files: MergeFileInput[],
  onProgress?: (progress: MergeProgress) => void
): Promise<MergeResult> {
  if (files.length < 2) {
    throw new Error("Select at least two IFC files to merge.");
  }

  const { IfcParser } = await import("@ifc-lite/parser");
  const { MergedExporter } = await import("@ifc-lite/export");

  const models: MergeModelInput[] = [];
  const parseShare = 0.35;

  for (let i = 0; i < files.length; i++) {
    const input = files[i];
    onProgress?.({
      phase: "parsing",
      percent: (i / files.length) * parseShare,
      label: phaseLabel("parsing", input.name),
      currentModel: input.name,
      fileIndex: i + 1,
      fileCount: files.length,
    });

    const buffer = await input.file.arrayBuffer();
    const parser = new IfcParser();
    const dataStore = await parser.parseColumnar(buffer, {
      onProgress: ({ percent }) => {
        const slice = parseShare / files.length;
        onProgress?.({
          phase: "parsing",
          percent: i * slice + percent * slice,
          label: phaseLabel("parsing", input.name),
          currentModel: input.name,
          fileIndex: i + 1,
          fileCount: files.length,
        });
      },
    });

    models.push({
      id: input.id,
      name: input.name,
      dataStore,
    });
  }

  const exporter = new MergedExporter(models);
  const outputSchema = inferSchema(models[0].dataStore);
  const baseName = files[0].name.replace(/\.ifc$/i, "");
  const filename = `${baseName}-merged.ifc`;

  const result = await exporter.exportBlobAsync({
    schema: outputSchema,
    description: "Federated model merged by ifc2go.com",
    application: "ifc2go",
    author: "ifc2go",
    organization: "ifc2go",
    filename,
    projectStrategy: "keep-first",
    unitReconciliation: "auto",
    onProgress: (progress) => {
      const exportShare = 1 - parseShare;
      onProgress?.({
        phase: progress.phase,
        percent: parseShare + progress.percent * exportShare,
        label: phaseLabel(
          progress.phase,
          progress.currentModel,
          progress.entitiesProcessed,
          progress.entitiesTotal
        ),
        currentModel: progress.currentModel,
        fileIndex: files.length,
        fileCount: files.length,
        entitiesProcessed: progress.entitiesProcessed,
        entitiesTotal: progress.entitiesTotal,
      });
    },
  });

  onProgress?.({
    phase: "done",
    percent: 1,
    label: phaseLabel("done"),
    fileCount: files.length,
  });

  return {
    blob: result.content,
    stats: result.stats,
    filename,
  };
}

export function downloadMergedIfc(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
