/**
 * Praxi värdelista: Färgkodning IFC-modeller (2.0.1)
 * Färger per disciplin + byggdel/system — inte per IFC-klass direkt.
 */

export type PraxiDisciplineCode =
  | "A"
  | "K"
  | "KP"
  | "E"
  | "V"
  | "VS"
  | "SPR"
  | "W"
  | "W1"
  | "M"
  | "T";

export interface PraxiDisciplineOption {
  code: PraxiDisciplineCode;
  label: string;
  model: string;
}

/** Visningsordning A → W (Praxi-discipliner). */
const DISCIPLINE_SORT_ORDER: PraxiDisciplineCode[] = [
  "A",
  "E",
  "K",
  "KP",
  "M",
  "SPR",
  "T",
  "V",
  "VS",
  "W",
  "W1",
];

const DISCIPLINE_OPTIONS: PraxiDisciplineOption[] = [
  { code: "A", label: "A – Alla (inga färger / original)", model: "A-40" },
  { code: "E", label: "E – El", model: "E-60" },
  { code: "K", label: "K – Konstruktion", model: "K-20" },
  { code: "KP", label: "KP – Prefab / produktion", model: "KP-23" },
  { code: "M", label: "M – Mark", model: "M-30" },
  { code: "SPR", label: "SPR – Sprinkler", model: "V-54" },
  { code: "T", label: "T – Tele/data", model: "T-750" },
  { code: "V", label: "V – Ventilation", model: "V-57" },
  { code: "VS", label: "VS – Värme & sanitet", model: "W-56" },
  { code: "W", label: "W – VVS", model: "W-56" },
  { code: "W1", label: "W1 – Sopsug", model: "W1-53" },
];

export const PRAXI_DISCIPLINES: PraxiDisciplineOption[] = [...DISCIPLINE_OPTIONS].sort(
  (a, b) =>
    DISCIPLINE_SORT_ORDER.indexOf(a.code) - DISCIPLINE_SORT_ORDER.indexOf(b.code)
);

interface PraxiRule {
  byggdel: string;
  hex: string;
}

/** Praxi W-56 / VS — samma färglista (VVS). */
const VVS_PRAXI_RULES: PraxiRule[] = [
  { byggdel: "Värmesystem", hex: "#FFAB2F" },
  { byggdel: "Övrigt Tappvattensystem", hex: "#4B5E76" },
  { byggdel: "Kallvatten", hex: "#0000FF" },
  { byggdel: "Varmvatten", hex: "#FF0000" },
  { byggdel: "Spillvattensystem", hex: "#CBA62C" },
  { byggdel: "Dagvatten", hex: "#CBA62C" },
  { byggdel: "Kylsystem", hex: "#00AFF0" },
  { byggdel: "Gassystem", hex: "#FFFFFF" },
  { byggdel: "Vakuumutsug", hex: "#804040" },
];

const VVS_IFC_BYGGDEL: Record<string, string> = {
  IFCPIPESEGMENT: "Kallvatten",
  IFCPIPEFITTING: "Övrigt Tappvattensystem",
  IFCVALVE: "Övrigt Tappvattensystem",
  IFCSANITARYTERMINAL: "Armaturer",
  IFCFLOWTERMINAL: "Varmvatten",
  IFCFLOWSEGMENT: "Kallvatten",
  IFCBOILER: "Värmesystem",
  IFCCHILLER: "Kylsystem",
  IFCPUMP: "Kallvatten",
};

/** Officiella HEX per disciplin och byggdel (utan transparenter). */
const PRAXI_BY_DISCIPLINE: Record<PraxiDisciplineCode, PraxiRule[]> = {
  A: [],
  K: [
    { byggdel: "Stål", hex: "#FF0000" },
    { byggdel: "Betong", hex: "#808080" },
    { byggdel: "Bärande väggar", hex: "#00FFFF" },
    { byggdel: "Limträ", hex: "#BB5E0A" },
    { byggdel: "Bef. konstruktion", hex: "#FF9900" },
  ],
  KP: [
    { byggdel: "Bärande väggar", hex: "#7BA1A8" },
    { byggdel: "Betong", hex: "#FFFFFF" },
    { byggdel: "Stål", hex: "#000000" },
  ],
  E: [
    { byggdel: "Kanalisation", hex: "#800080" },
    { byggdel: "Armaturer", hex: "#FFFFFF" },
    { byggdel: "Eldistributionsnät", hex: "#FF9999" },
    { byggdel: "Tomrör", hex: "#FF5930" },
    { byggdel: "Brandsläckare/larmdon", hex: "#FF0000" },
  ],
  V: [
    { byggdel: "Tilluft", hex: "#FFFF00" },
    { byggdel: "Frånluft", hex: "#00FF00" },
    { byggdel: "Överströmningsdon", hex: "#00FF00" },
    { byggdel: "Ventilationsaggregat", hex: "#FFFFFF" },
  ],
  SPR: [{ byggdel: "Sprinkler", hex: "#FF00FF" }],
  W: VVS_PRAXI_RULES,
  VS: VVS_PRAXI_RULES,
  W1: [],
  M: [],
  T: [{ byggdel: "Rörpost", hex: "#CCCCFF" }],
};

/** IFC-typ → Praxi byggdel, per disciplin (där det är meningsfullt). */
const IFC_BYGGDEL: Partial<
  Record<PraxiDisciplineCode, Record<string, string>>
> = {
  K: {
    IFCWALL: "Bärande väggar",
    IFCWALLSTANDARDCASE: "Bärande väggar",
    IFCSLAB: "Betong",
    IFCBEAM: "Limträ",
    IFCCOLUMN: "Stål",
    IFCMEMBER: "Stål",
    IFCPLATE: "Stål",
    IFCFOOTING: "Betong",
    IFCPILE: "Betong",
    IFCCOVERING: "Bef. konstruktion",
  },
  KP: {
    IFCWALL: "Bärande väggar",
    IFCWALLSTANDARDCASE: "Bärande väggar",
    IFCSLAB: "Betong",
    IFCBEAM: "Stål",
    IFCCOLUMN: "Stål",
    IFCMEMBER: "Stål",
    IFCPLATE: "Stål",
    IFCFOOTING: "Betong",
  },
  E: {
    IFCFLOWSEGMENT: "Kanalisation",
    IFCFLOWTERMINAL: "Armaturer",
    IFCFLOWFITTING: "Tomrör",
    IFCCABLESEGMENT: "Eldistributionsnät",
    IFCELECTRICAPPLIANCE: "Eldistributionsnät",
    IFCLIGHTFIXTURE: "Armaturer",
    IFCELECTRICDISTRIBUTIONBOARD: "Eldistributionsnät",
    IFCJUNCTIONBOX: "Eldistributionsnät",
    IFCOUTLET: "Armaturer",
    IFCALARM: "Brandsläckare/larmdon",
    IFCSENSOR: "Brandsläckare/larmdon",
  },
  V: {
    IFCDUCTSEGMENT: "Tilluft",
    IFCDUCTFITTING: "Tilluft",
    IFCAIRTERMINAL: "Frånluft",
    IFCAIRTERMINALBOX: "Ventilationsaggregat",
    IFCFLOWTERMINAL: "Överströmningsdon",
    IFCFLOWSEGMENT: "Tilluft",
    IFCFLOWFITTING: "Tilluft",
    IFCFAN: "Ventilationsaggregat",
    IFCUNITARYEQUIPMENT: "Ventilationsaggregat",
  },
  SPR: {
    IFCPIPESEGMENT: "Sprinkler",
    IFCPIPEFITTING: "Sprinkler",
    IFCFLOWSEGMENT: "Sprinkler",
  },
  W: VVS_IFC_BYGGDEL,
  VS: VVS_IFC_BYGGDEL,
  T: {
    IFCCABLESEGMENT: "Rörpost",
    IFCCABLECARRIERSEGMENT: "Rörpost",
  },
};

const FALLBACK_HEX = "#B0B0B0";

/** Praxi A-40: lämna IFC-färger oförändrade — ingen Praxi-färgsättning. */
export function isPraxiColoringEnabled(
  discipline: PraxiDisciplineCode
): boolean {
  return discipline !== "A";
}

/**
 * Prefix i filnamn anger disciplin, t.ex. E-60-V-000.ifc → E (El).
 * Längre prefix först: SPR, W1, VS, KP, sedan enstaka bokstäver.
 */
const FILE_PREFIX_TO_DISCIPLINE: Record<string, PraxiDisciplineCode> = {
  SPR: "SPR",
  W1: "W1",
  VS: "VS",
  KP: "KP",
  VVS: "VS",
  V: "V",
  W: "W",
  E: "E",
  K: "K",
  A: "A",
  M: "M",
  T: "T",
};

export function guessDisciplineFromFileName(fileName: string): PraxiDisciplineCode {
  const base = fileName
    .replace(/^.*[/\\]/, "")
    .replace(/\.ifc$/i, "")
    .toUpperCase();

  const prefixMatch = base.match(/^([A-Z]{1,3})(?=[\-_.\d]|$)/);
  if (!prefixMatch) return "KP";

  const letters = prefixMatch[1];
  for (let len = Math.min(3, letters.length); len >= 1; len--) {
    const code = letters.slice(0, len);
    const discipline = FILE_PREFIX_TO_DISCIPLINE[code];
    if (discipline) return discipline;
  }

  return "KP";
}

export function getByggdelForIfcType(
  ifcType: string,
  discipline: PraxiDisciplineCode
): string | null {
  return IFC_BYGGDEL[discipline]?.[ifcType] ?? null;
}

export function getPraxiHex(
  discipline: PraxiDisciplineCode,
  byggdel: string
): string | null {
  if (!isPraxiColoringEnabled(discipline)) return null;
  const rules = PRAXI_BY_DISCIPLINE[discipline];
  const rule = rules.find(
    (r) => r.byggdel.toLowerCase() === byggdel.toLowerCase()
  );
  return rule?.hex ?? null;
}

export function getColorForIfcType(
  ifcType: string,
  discipline: PraxiDisciplineCode
): { hex: string | null; byggdel: string | null } {
  if (!isPraxiColoringEnabled(discipline)) {
    return { hex: null, byggdel: null };
  }
  const byggdel = getByggdelForIfcType(ifcType, discipline);
  if (!byggdel) {
    return { hex: FALLBACK_HEX, byggdel: null };
  }
  const hex = getPraxiHex(discipline, byggdel) ?? FALLBACK_HEX;
  return { hex, byggdel };
}

export function listByggdelForDiscipline(
  discipline: PraxiDisciplineCode
): PraxiRule[] {
  return PRAXI_BY_DISCIPLINE[discipline] ?? [];
}
