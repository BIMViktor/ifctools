import type { IfcDataStore } from "@ifc-lite/parser";
import { extractPropertiesOnDemand } from "@ifc-lite/parser";
import { MutablePropertyView } from "@ifc-lite/mutations";
import { PropertyValueType } from "@ifc-lite/data";
import { patchIfcColours } from "@/lib/exportColorizedIfc";
import {
  COLORABLE_PRODUCT_TYPES,
  getIfcTypeLabel,
  isColorableIfcType,
} from "@/lib/ifcTypes";
import { collectDesignationsForIds } from "@/lib/ifcDesignations";

export type RecolourMode = "class" | "discipline" | "system";

export interface ColourGroup {
  id: string;
  label: string;
  expressIds: number[];
  color: string;
  meta?: string;
}

export interface RecolourProgress {
  phase: "parsing" | "grouping" | "mutating" | "exporting" | "done";
  percent: number;
  label: string;
}

export interface RecolourResult {
  blob: Blob;
  filename: string;
  groupCount: number;
  elementCount: number;
}

export const DISCIPLINE_PALETTE = {
  architecture: "#C0C0C0",
  structure: "#808080",
  mep: "#2563EB",
  electrical: "#F59E0B",
  plumbing: "#0D9488",
  fire: "#DC2626",
  default: "#B0B0B0",
} as const;

export type DisciplineKey = keyof typeof DISCIPLINE_PALETTE;

const ARCHITECTURE_TYPES = new Set([
  "IFCWALL",
  "IFCWALLSTANDARDCASE",
  "IFCDOOR",
  "IFCWINDOW",
  "IFCROOF",
  "IFCCOVERING",
  "IFCSTAIR",
  "IFCSTAIRFLIGHT",
  "IFCRAILING",
  "IFCRAMP",
  "IFCRAMPFLIGHT",
  "IFCFURNISHINGELEMENT",
  "IFCFURNITURE",
  "IFCCURTAINWALL",
  "IFCCHIMNEY",
]);

const STRUCTURE_TYPES = new Set([
  "IFCBEAM",
  "IFCCOLUMN",
  "IFCMEMBER",
  "IFCPLATE",
  "IFCFOOTING",
  "IFCPILE",
  "IFCREINFORCINGBAR",
  "IFCREINFORCINGMESH",
  "IFCTENDON",
  "IFCTENDONANCHOR",
]);

const MEP_TYPES = new Set([
  "IFCDUCTSEGMENT",
  "IFCDUCTFITTING",
  "IFCDUCTSILENCER",
  "IFCAIRTERMINAL",
  "IFCAIRTERMINALBOX",
  "IFCAIRTOAIRHEATRECOVERY",
  "IFCFAN",
  "IFCFILTER",
  "IFCBOILER",
  "IFCCHILLER",
  "IFCCOIL",
  "IFCCONDENSER",
  "IFCCOOLINGTOWER",
  "IFCENERGYCONVERSIONDEVICE",
  "IFCUNITARYEQUIPMENT",
  "IFCHEATEXCHANGER",
  "IFCHUMIDIFIER",
]);

const PLUMBING_TYPES = new Set([
  "IFCPIPESEGMENT",
  "IFCPIPEFITTING",
  "IFCPIPEACCESSORY",
  "IFCVALVE",
  "IFCPUMP",
  "IFCSANITARYTERMINAL",
  "IFCWASTETERMINAL",
  "IFCGASTERMINAL",
  "IFCFLOWSEGMENT",
  "IFCFLOWTERMINAL",
  "IFCFLOWFITTING",
  "IFCFLOWCONTROLLER",
  "IFCFLOWMOVINGDEVICE",
  "IFCFLOWSTORAGEDEVICE",
]);

const ELECTRICAL_TYPES = new Set([
  "IFCCABLESEGMENT",
  "IFCCABLECARRIERSEGMENT",
  "IFCCABLEFITTING",
  "IFCELECTRICAPPLIANCE",
  "IFCELECTRICDISTRIBUTIONBOARD",
  "IFCLIGHTFIXTURE",
  "IFCOUTLET",
  "IFCSWITCHINGDEVICE",
  "IFCJUNCTIONBOX",
  "IFCALARM",
  "IFCSENSOR",
  "IFCCONTROLLER",
  "IFCMOTORCONNECTION",
]);

export function classifyDiscipline(ifcType: string): DisciplineKey {
  if (ARCHITECTURE_TYPES.has(ifcType)) return "architecture";
  if (STRUCTURE_TYPES.has(ifcType)) return "structure";
  if (ELECTRICAL_TYPES.has(ifcType)) return "electrical";
  if (PLUMBING_TYPES.has(ifcType)) return "plumbing";
  if (MEP_TYPES.has(ifcType)) return "mep";
  return "default";
}

function maxExpressId(store: IfcDataStore): number {
  let max = 0;
  for (const id of store.entityIndex.byId.keys()) {
    if (id > max) max = id;
  }
  return max;
}

function inferSchema(store: IfcDataStore) {
  const raw = (store.schemaVersion ?? "IFC4").toUpperCase();
  if (raw.includes("IFC4X3") || raw.includes("IFC4.3")) return "IFC4X3" as const;
  if (raw.includes("IFC2X3")) return "IFC2X3" as const;
  if (raw.includes("IFC5")) return "IFC5" as const;
  return "IFC4" as const;
}

function disciplineLabel(key: DisciplineKey): string {
  switch (key) {
    case "architecture":
      return "Architecture";
    case "structure":
      return "Structure";
    case "mep":
      return "MEP / Ventilation";
    case "electrical":
      return "Electrical";
    case "plumbing":
      return "Plumbing";
    case "fire":
      return "Fire protection";
    default:
      return "Other";
  }
}

export function buildClassColourGroups(store: IfcDataStore): ColourGroup[] {
  const groups: ColourGroup[] = [];

  for (const [type, ids] of store.entityIndex.byType) {
    if (!isColorableIfcType(type) || ids.length === 0) continue;
    const discipline = classifyDiscipline(type);
    groups.push({
      id: `class-${type}`,
      label: getIfcTypeLabel(type),
      expressIds: [...ids],
      color: DISCIPLINE_PALETTE[discipline],
      meta: type.replace(/^IFC/, "Ifc"),
    });
  }

  return groups.sort((a, b) => b.expressIds.length - a.expressIds.length);
}

export function buildDisciplineColourGroups(store: IfcDataStore): ColourGroup[] {
  const buckets = new Map<DisciplineKey, number[]>();

  for (const [type, ids] of store.entityIndex.byType) {
    if (!COLORABLE_PRODUCT_TYPES.has(type) || ids.length === 0) continue;
    const key = classifyDiscipline(type);
    const bucket = buckets.get(key) ?? [];
    bucket.push(...ids);
    buckets.set(key, bucket);
  }

  return [...buckets.entries()]
    .filter(([, ids]) => ids.length > 0)
    .map(([key, expressIds]) => ({
      id: `discipline-${key}`,
      label: disciplineLabel(key),
      expressIds,
      color: DISCIPLINE_PALETTE[key],
      meta: `${expressIds.length.toLocaleString()} elements`,
    }))
    .sort((a, b) => b.expressIds.length - a.expressIds.length);
}

export function buildSystemColourGroups(store: IfcDataStore): ColourGroup[] {
  const systemToIds = new Map<string, number[]>();
  const palette = [
    DISCIPLINE_PALETTE.mep,
    DISCIPLINE_PALETTE.electrical,
    DISCIPLINE_PALETTE.plumbing,
    DISCIPLINE_PALETTE.architecture,
    DISCIPLINE_PALETTE.structure,
    "#7C3AED",
    "#DB2777",
    "#059669",
  ];

  for (const [type, ids] of store.entityIndex.byType) {
    if (!isColorableIfcType(type)) continue;
    for (const id of ids) {
      const { systemNames } = collectDesignationsForIds(store, [id]);
      const system = systemNames[0] ?? "Unassigned";
      const bucket = systemToIds.get(system) ?? [];
      bucket.push(id);
      systemToIds.set(system, bucket);
    }
  }

  return [...systemToIds.entries()]
    .map(([label, expressIds], index) => ({
      id: `system-${index}-${label}`,
      label,
      expressIds,
      color: palette[index % palette.length],
      meta: "IfcSystem / group",
    }))
    .sort((a, b) => b.expressIds.length - a.expressIds.length);
}

export function buildRecolourGroups(
  store: IfcDataStore,
  mode: RecolourMode
): ColourGroup[] {
  switch (mode) {
    case "class":
      return buildClassColourGroups(store);
    case "discipline":
      return buildDisciplineColourGroups(store);
    case "system":
      return buildSystemColourGroups(store);
    default:
      return [];
  }
}

export function groupsToTypeColorMap(
  store: IfcDataStore,
  groups: ColourGroup[]
): Map<string, string> {
  const colors = new Map<string, string>();
  for (const group of groups) {
    for (const [type, ids] of store.entityIndex.byType) {
      if (ids.some((id) => group.expressIds.includes(id))) {
        colors.set(type, group.color);
      }
    }
  }
  return colors;
}

/**
 * Stamp colour metadata via @ifc-lite/mutations and patch IFCCOLOURRGB chains
 * in the STEP source for visible RGB overrides.
 */
export function applyRecolourMutations(
  store: IfcDataStore,
  groups: ColourGroup[]
): {
  mutationView: MutablePropertyView;
  patchedSource: Uint8Array;
} {
  const mutationView = new MutablePropertyView(store.properties, "recolour");
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

  for (const group of groups) {
    for (const entityId of group.expressIds) {
      mutationView.setProperty(
        entityId,
        "Pset_ifc2go_Colour",
        "Profile",
        group.label,
        PropertyValueType.String
      );
      mutationView.setProperty(
        entityId,
        "Pset_ifc2go_Colour",
        "RGB",
        group.color,
        PropertyValueType.String
      );
    }
  }

  const typeColors = groupsToTypeColorMap(store, groups);
  const patchedSource = patchIfcColours(store, typeColors);

  return { mutationView, patchedSource };
}

export async function exportRecolouredIfc(
  store: IfcDataStore,
  groups: ColourGroup[],
  sourceFilename: string,
  onProgress?: (progress: RecolourProgress) => void
): Promise<RecolourResult> {
  onProgress?.({
    phase: "mutating",
    percent: 0.2,
    label: "Applying colour overrides…",
  });

  const { mutationView, patchedSource } = applyRecolourMutations(store, groups);
  const { StepExporter } = await import("@ifc-lite/export");
  const exporter = new StepExporter(
    { ...store, source: patchedSource },
    mutationView
  );

  const baseName = sourceFilename.replace(/\.ifc$/i, "");
  const filename = `${baseName}-recoloured.ifc`;

  onProgress?.({
    phase: "exporting",
    percent: 0.45,
    label: "Writing colour-coded IFC…",
  });

  const result = await exporter.exportAsync({
    schema: inferSchema(store),
    description: "Recoloured by ifc2go.com",
    application: "ifc2go",
    author: "ifc2go",
    organization: "ifc2go",
    filename,
    applyMutations: true,
    includeGeometry: true,
    includeProperties: true,
    includeQuantities: true,
    includeRelationships: true,
    onProgress: (progress) => {
      onProgress?.({
        phase: "exporting",
        percent: 0.45 + progress.percent * 0.55,
        label: `Writing colour-coded IFC… ${progress.entitiesProcessed.toLocaleString()} / ${progress.entitiesTotal.toLocaleString()}`,
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
    groupCount: groups.length,
    elementCount: groups.reduce((sum, group) => sum + group.expressIds.length, 0),
  };
}

export async function parseIfcForRecolour(
  file: File,
  onProgress?: (progress: RecolourProgress) => void
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
        percent: percent * 0.9,
        label: "Parsing IFC file…",
      });
    },
  });
}

export function downloadRecolouredIfc(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
