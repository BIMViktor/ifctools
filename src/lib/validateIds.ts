import type { IfcDataStore } from "@ifc-lite/parser";
import type {
  IDSValidationReport,
  IDSEntityResult,
  IDSSpecificationResult,
  TranslationService,
} from "@ifc-lite/ids";
import type { IDSReportInput } from "@ifc-lite/bcf";

export interface ValidateProgress {
  phase: "parsing-ifc" | "parsing-ids" | "validating" | "done";
  percent: number;
  label: string;
}

export interface ValidateIdsResult {
  report: IDSValidationReport;
  ifcFilename: string;
  idsFilename: string;
}

export interface FailureRow {
  specificationName: string;
  globalId: string;
  expressId: number;
  entityType: string;
  entityName: string;
  checkedDescription: string;
  failureReason: string;
  actualValue: string;
  expectedValue: string;
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function parseIfcForValidation(
  file: File,
  onProgress?: (progress: ValidateProgress) => void
): Promise<IfcDataStore> {
  onProgress?.({
    phase: "parsing-ifc",
    percent: 0,
    label: "Parsing IFC file…",
  });

  const buffer = await file.arrayBuffer();
  const { IfcParser } = await import("@ifc-lite/parser");
  const parser = new IfcParser();

  return parser.parseColumnar(buffer, {
    onProgress: ({ percent }) => {
      onProgress?.({
        phase: "parsing-ifc",
        percent: percent * 0.35,
        label: "Parsing IFC file…",
      });
    },
  });
}

export async function parseIdsFile(
  file: File,
  onProgress?: (progress: ValidateProgress) => void
): Promise<string> {
  onProgress?.({
    phase: "parsing-ids",
    percent: 0.35,
    label: "Reading IDS file…",
  });

  const xml = await file.text();
  onProgress?.({
    phase: "parsing-ids",
    percent: 0.4,
    label: "Reading IDS file…",
  });
  return xml;
}

export async function runIdsValidation(
  store: IfcDataStore,
  idsXml: string,
  ifcFilename: string,
  onProgress?: (progress: ValidateProgress) => void
): Promise<IDSValidationReport> {
  const { parseIDS, validateIDS, createTranslationService } = await import(
    "@ifc-lite/ids"
  );
  const { createDataAccessor } = await import("@ifc-lite/ids/bridge");

  onProgress?.({
    phase: "validating",
    percent: 0.42,
    label: "Parsing IDS specifications…",
  });

  const idsDocument = parseIDS(idsXml);
  const accessor = createDataAccessor(store);
  const translator = createTranslationService("en");

  const report = await validateIDS(
    idsDocument,
    accessor,
    {
      modelId: ifcFilename,
      schemaVersion: store.schemaVersion ?? "IFC4",
      entityCount: store.entityCount,
    },
    {
      translator,
      includePassingEntities: false,
      onProgress: (progress) => {
        const specLabel =
          progress.totalSpecifications > 0
            ? `Specification ${progress.specificationIndex + 1}/${progress.totalSpecifications}`
            : "Validating model";
        const entityLabel =
          progress.totalEntities > 0
            ? ` · ${progress.entitiesProcessed}/${progress.totalEntities} entities`
            : "";

        onProgress?.({
          phase: "validating",
          percent: 0.42 + (progress.percentage / 100) * 0.58,
          label: `${specLabel}${entityLabel}`,
        });
      },
    }
  );

  onProgress?.({
    phase: "done",
    percent: 1,
    label: "Validation complete",
  });

  return report;
}

export async function validateIfcAgainstIds(
  ifcFile: File,
  idsFile: File,
  onProgress?: (progress: ValidateProgress) => void
): Promise<ValidateIdsResult> {
  const store = await parseIfcForValidation(ifcFile, onProgress);
  const idsXml = await parseIdsFile(idsFile, onProgress);
  const report = await runIdsValidation(store, idsXml, ifcFile.name, onProgress);

  return {
    report,
    ifcFilename: ifcFile.name,
    idsFilename: idsFile.name,
  };
}

export function reportToBcfInput(report: IDSValidationReport): IDSReportInput {
  return {
    title: report.document.info.title,
    description: report.document.info.description,
    specificationResults: report.specificationResults.map((spec) => ({
      specification: {
        name: spec.specification.name,
        description: spec.specification.description,
      },
      status: spec.status,
      applicableCount: spec.applicableCount,
      passedCount: spec.passedCount,
      failedCount: spec.failedCount,
      entityResults: spec.entityResults.map((entity) => ({
        expressId: entity.expressId,
        modelId: entity.modelId,
        entityType: entity.entityType,
        entityName: entity.entityName,
        globalId: entity.globalId,
        passed: entity.passed,
        requirementResults: entity.requirementResults.map((req) => ({
          status: req.status,
          facetType: req.facetType,
          checkedDescription: req.checkedDescription,
          failureReason: req.failureReason,
          actualValue: req.actualValue,
          expectedValue: req.expectedValue,
        })),
      })),
    })),
  };
}

export async function exportValidationBcf(
  report: IDSValidationReport,
  ifcFilename: string
): Promise<{ blob: Blob; filename: string; topicCount: number }> {
  const { createBCFFromIDSReport, writeBCF } = await import("@ifc-lite/bcf");

  const baseName = ifcFilename.replace(/\.ifc$/i, "");
  const project = createBCFFromIDSReport(reportToBcfInput(report), {
    author: "ids-validator@ifc2go.com",
    projectName: `${baseName} — IDS validation`,
    version: "2.1",
    topicGrouping: "per-entity",
  });

  const blob = await writeBCF(project);
  const topicCount = project.topics.size;

  return {
    blob,
    filename: `${baseName}-ids-failures.bcfzip`,
    topicCount,
  };
}

export function collectFailedExpressIds(report: IDSValidationReport): number[] {
  const ids = new Set<number>();
  for (const spec of report.specificationResults) {
    for (const entity of spec.entityResults) {
      if (!entity.passed) ids.add(entity.expressId);
    }
  }
  return [...ids];
}

export function collectFailureRows(report: IDSValidationReport): FailureRow[] {
  const rows: FailureRow[] = [];

  for (const spec of report.specificationResults) {
    if (spec.status !== "fail") continue;

    for (const entity of spec.entityResults) {
      if (entity.passed) continue;

      for (const req of entity.requirementResults) {
        if (req.status !== "fail") continue;

        rows.push({
          specificationName: spec.specification.name,
          globalId: entity.globalId ?? "",
          expressId: entity.expressId,
          entityType: entity.entityType,
          entityName: entity.entityName ?? "",
          checkedDescription: req.checkedDescription,
          failureReason: req.failureReason ?? "",
          actualValue: req.actualValue ?? "",
          expectedValue: req.expectedValue ?? "",
        });
      }
    }
  }

  return rows;
}

export function failuresToCsv(rows: FailureRow[]): string {
  const header = [
    "Specification",
    "GlobalId",
    "ExpressId",
    "EntityType",
    "EntityName",
    "Requirement",
    "FailureReason",
    "ActualValue",
    "ExpectedValue",
  ];

  const lines = [
    header.join(","),
    ...rows.map((row) =>
      [
        row.specificationName,
        row.globalId,
        String(row.expressId),
        row.entityType,
        row.entityName,
        row.checkedDescription,
        row.failureReason,
        row.actualValue,
        row.expectedValue,
      ]
        .map((value) => csvEscape(value))
        .join(",")
    ),
  ];

  return `\uFEFF${lines.join("\r\n")}`;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function getFailedEntities(
  spec: IDSSpecificationResult
): IDSEntityResult[] {
  return spec.entityResults.filter((entity) => !entity.passed);
}

export function describeEntityFailures(
  entity: IDSEntityResult,
  translator?: TranslationService
): string[] {
  return entity.requirementResults
    .filter((req) => req.status === "fail")
    .map((req) =>
      translator
        ? translator.describeFailure(req)
        : req.failureReason ?? req.checkedDescription
    );
}
