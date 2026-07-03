import type { IfcDataStore } from "@ifc-lite/parser";

/**
 * Endast fysiska produkter / byggdelar (IfcElement-liknande).
 * Exkluderar geometri, representation, *Type-objekt, färger, kvantiteter, etc.
 */
export const COLORABLE_PRODUCT_TYPES = new Set([
  "IFCWALL",
  "IFCWALLSTANDARDCASE",
  "IFCSLAB",
  "IFCROOF",
  "IFCCOVERING",
  "IFCMEMBER",
  "IFCPLATE",
  "IFCBEAM",
  "IFCCOLUMN",
  "IFCDOOR",
  "IFCWINDOW",
  "IFCSTAIR",
  "IFCSTAIRFLIGHT",
  "IFCRAILING",
  "IFCRAMP",
  "IFCRAMPFLIGHT",
  "IFCCHIMNEY",
  "IFCFOOTING",
  "IFCPILE",
  "IFCCIVILELEMENT",
  "IFCBUILDINGELEMENTPROXY",
  "IFCBUILDINGELEMENTPART",
  "IFCBUILDINGELEMENTCOMPONENT",
  "IFCCURTAINWALL",
  "IFCFURNISHINGELEMENT",
  "IFCFURNITURE",
  "IFCFLOWSEGMENT",
  "IFCFLOWTERMINAL",
  "IFCFLOWFITTING",
  "IFCFLOWCONTROLLER",
  "IFCFLOWMOVINGDEVICE",
  "IFCFLOWSTORAGEDEVICE",
  "IFCFLOWTREATMENTDEVICE",
  "IFCFLOWINSTRUMENT",
  "IFCFLOWMETER",
  "IFCDISTRIBUTIONCHAMBERELEMENT",
  "IFCDISTRIBUTIONCONTROLELEMENT",
  "IFCDISTRIBUTIONFLOWELEMENT",
  "IFCDISTRIBUTIONBOARD",
  "IFCDUCTSEGMENT",
  "IFCDUCTFITTING",
  "IFCDUCTSILENCER",
  "IFCPIPESEGMENT",
  "IFCPIPEFITTING",
  "IFCPIPEACCESSORY",
  "IFCVALVE",
  "IFCPUMP",
  "IFCFAN",
  "IFCFILTER",
  "IFCAIRTERMINAL",
  "IFCAIRTERMINALBOX",
  "IFCAIRTOAIRHEATRECOVERY",
  "IFCSANITARYTERMINAL",
  "IFCWASTETERMINAL",
  "IFCGASTERMINAL",
  "IFCBOILER",
  "IFCCHILLER",
  "IFCCOIL",
  "IFCCONDENSER",
  "IFCCOOLINGTOWER",
  "IFCENERGYCONVERSIONDEVICE",
  "IFCUNITARYEQUIPMENT",
  "IFCHEATEXCHANGER",
  "IFCHUMIDIFIER",
  "IFCELECTRICAPPLIANCE",
  "IFCELECTRICDISTRIBUTIONBOARD",
  "IFCLIGHTFIXTURE",
  "IFCOUTLET",
  "IFCSWITCHINGDEVICE",
  "IFCJUNCTIONBOX",
  "IFCCABLESEGMENT",
  "IFCCABLECARRIERSEGMENT",
  "IFCALARM",
  "IFCSENSOR",
  "IFCCONTROLLER",
  "IFCMOTORCONNECTION",
  "IFCMECHANICALFASTENER",
  "IFCFASTENER",
  "IFCDISCRETEACCESSORY",
  "IFCTRANSPORTELEMENT",
  "IFCSPACE",
  "IFCOPENINGELEMENT",
  "IFCBRIDGE",
  "IFCBRIDGEPART",
  "IFCREINFORCINGBAR",
  "IFCREINFORCINGMESH",
  "IFCTENDON",
  "IFCTENDONANCHOR",
]);

/** Svenska visningsnamn per IFC-klass (bygg-/MEP-produkter). */
export const IFC_TYPE_LABELS: Record<string, string> = {
  IFCWALL: "Vägg",
  IFCWALLSTANDARDCASE: "Vägg (standard)",
  IFCWALLTYPE: "Väggtyp",
  IFCSLAB: "Bjälklag / platta",
  IFCSLABTYPE: "Bjälklagstyp",
  IFCBEAM: "Balk",
  IFCBEAMTYPE: "Balktyp",
  IFCCOLUMN: "Pelare",
  IFCCOLUMNTYPE: "Pelartyp",
  IFCDOOR: "Dörr",
  IFCDOORTYPE: "Dörrtyp",
  IFCWINDOW: "Fönster",
  IFCWINDOWTYPE: "Fönstertyp",
  IFCROOF: "Tak",
  IFCROOFTYPE: "Taktyp",
  IFCSTAIR: "Trappa",
  IFCSTAIRTYPE: "Trapptyp",
  IFCSTAIRFLIGHT: "Trappsteg",
  IFCRAILING: "Räcke",
  IFCRAILINGTYPE: "Räcketyp",
  IFCFURNISHINGELEMENT: "Inredning",
  IFCFURNITURE: "Möbel",
  IFCFURNITURETYPE: "Möbeltyp",
  IFCBUILDINGELEMENTPROXY: "Generiskt element",
  IFCOPENINGELEMENT: "Öppning / hål",
  IFCSPACE: "Rum",
  IFCSPACETYPE: "Rumstyp",
  IFCPLATE: "Platta",
  IFCPLATETYPE: "Platttyp",
  IFCMEMBER: "Profil",
  IFCMEMBERTYPE: "Profiltyp",
  IFCPILE: "Påle",
  IFCFOOTING: "Fundament",
  IFCCOVERING: "Beklädnad",
  IFCCOVERINGTYPE: "Beklädnadstyp",
  IFCTRANSPORTELEMENT: "Transportelement",
  IFCBUILDING: "Byggnad",
  IFCBUILDINGSTOREY: "Våningsplan",
  IFCSITE: "Tomt",
  IFCFLOWSEGMENT: "Rör / kanal (segment)",
  IFCFLOWTERMINAL: "Terminal (VVS)",
  IFCFLOWFITTING: "Rördel / kanaldel",
  IFCFLOWCONTROLLER: "Styrventil / regulator",
  IFCFLOWMOVINGDEVICE: "Pump / fläkt",
  IFCFLOWSTORAGEDEVICE: "Tank / magasin",
  IFCFLOWTREATMENTDEVICE: "Behandlingsenhet",
  IFCFLOWINSTRUMENT: "Instrument",
  IFCFLOWMETER: "Mätare",
  IFCDISTRIBUTIONELEMENT: "Distributionselement",
  IFCDISTRIBUTIONCHAMBERELEMENT: "Schakt / fördelning",
  IFCDISTRIBUTIONCONTROLELEMENT: "Styrenhet",
  IFCDISTRIBUTIONFLOWELEMENT: "Flödeselement",
  IFCENERGYCONVERSIONDEVICE: "Energikonvertering",
  IFCAIRTERMINAL: "Luftdon",
  IFCAIRTERMINALBOX: "Ventilationsdon",
  IFCAIRTOAIRHEATRECOVERY: "Värmeåtervinning",
  IFCBOILER: "Panna",
  IFCBURNER: "Brännare",
  IFCCHILLER: "Kylmaskin",
  IFCCOIL: "Batteri (VVS)",
  IFCCONDENSER: "Kondensor",
  IFCCOOLINGTOWER: "Kyltorn",
  IFCCABLECARRIERSEGMENT: "Kabelstege",
  IFCCABLESEGMENT: "Kabel",
  IFCDUCTSEGMENT: "Kanal",
  IFCDUCTFITTING: "Kanaldel",
  IFCDUCTSILENCER: "Ljuddämpare",
  IFCPIPESEGMENT: "Rör",
  IFCPIPEFITTING: "Rördel",
  IFCPIPEACCESSORY: "Rörtillbehör",
  IFCVALVE: "Ventil",
  IFCPUMP: "Pump",
  IFCFAN: "Fläkt",
  IFCFILTER: "Filter",
  IFCHEATEXCHANGER: "Värmeväxlare",
  IFCHUMIDIFIER: "Luftfuktare",
  IFCSANITARYTERMINAL: "Sanitet",
  IFCELECTRICAPPLIANCE: "Elapparat",
  IFCELECTRICDISTRIBUTIONBOARD: "Elcentral",
  IFCELECTRICFLOWSTORAGEDEVICE: "Batteri / UPS",
  IFCELECTRICGENERATOR: "Generator",
  IFCMOTORCONNECTION: "Motoranslutning",
  IFCLIGHTFIXTURE: "Belysning",
  IFCLAMPTYPE: "Belysningstyp",
  IFCSWITCHINGDEVICE: "Strömbrytare",
  IFCJUNCTIONBOX: "Kopplingsdosa",
  IFCOUTLET: "Uttag",
  IFCALARM: "Larm",
  IFCSENSOR: "Givare",
  IFCCONTROLLER: "Regulator",
  IFCUNITARYEQUIPMENT: "Aggregat",
  IFCMECHANICALFASTENER: "Förankring",
  IFCFASTENER: "Fästelement",
  IFCMECHANICALFASTENERTYPE: "Förankringstyp",
  IFCDISCRETEACCESSORY: "Tillbehör",
  IFCANNOTATION: "Annotering",
  IFCGRID: "Rutnät",
  IFCPROXY: "Proxy",
  IFCBUILDINGELEMENTPART: "Byggdel",
  IFCCHIMNEY: "Skorsten",
  IFCCHIMNEYTYPE: "Skorstentyp",
  IFCCIVILELEMENT: "Civilt element",
  IFCBRIDGE: "Bro",
  IFCBRIDGEPART: "Brodel",
  IFCTENDON: "Armering (tendon)",
  IFCTENDONANCHOR: "Förankring (tendon)",
  IFCREINFORCINGBAR: "Armeringsjärn",
  IFCREINFORCINGMESH: "Armeringsnät",
};

import {
  getColorForIfcType,
  isPraxiColoringEnabled,
  listByggdelForDiscipline,
  type PraxiDisciplineCode,
} from "./praxiColors";
import {
  collectDesignationsForIds,
  toIfcSchemaName,
} from "./ifcDesignations";

export function isColorableIfcType(type: string): boolean {
  return COLORABLE_PRODUCT_TYPES.has(type);
}

export function getIfcTypeLabel(type: string): string {
  if (IFC_TYPE_LABELS[type]) return IFC_TYPE_LABELS[type];
  const raw = type.startsWith("IFC") ? type.slice(3) : type;
  return raw
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface IfcTypeRow {
  type: string;
  label: string;
  /** IFC schema-typ, t.ex. IfcWallStandardCase */
  ifcSchemaName: string;
  /** Praxi byggdel/system när mappning finns */
  byggdel: string | null;
  /** Vanliga Name/ObjectType/Tag från modellen */
  benamningar: string[];
  /** IfcSystem / grupp från IfcRelAssignsToGroup */
  systemNames: string[];
  count: number;
  /** null = ingen Praxi-färg (disciplin A) */
  color: string | null;
}

export function buildTypeListFromDataStore(
  dataStore: IfcDataStore,
  discipline: PraxiDisciplineCode
): {
  rows: IfcTypeRow[];
  colors: Map<string, string>;
} {
  const rows: IfcTypeRow[] = [];
  const colors = new Map<string, string>();

  for (const [type, ids] of dataStore.entityIndex.byType) {
    if (!isColorableIfcType(type) || ids.length === 0) continue;

    const label = getIfcTypeLabel(type);
    const { hex, byggdel } = getColorForIfcType(type, discipline);
    const { benamningar, systemNames } = collectDesignationsForIds(
      dataStore,
      ids
    );
    rows.push({
      type,
      label,
      ifcSchemaName: toIfcSchemaName(type),
      byggdel,
      benamningar,
      systemNames,
      count: ids.length,
      color: hex,
    });
    if (hex) colors.set(type, hex);
  }

  sortTypeRowsByPraxi(rows, discipline);

  return { rows, colors };
}

function sortTypeRowsByPraxi(
  rows: IfcTypeRow[],
  discipline: PraxiDisciplineCode
): void {
  if (!isPraxiColoringEnabled(discipline)) {
    rows.sort((a, b) => b.count - a.count);
    return;
  }
  const byggdelOrder = listByggdelForDiscipline(discipline).map((r) =>
    r.byggdel.toLowerCase()
  );
  const byggdelRank = (bd: string | null) => {
    if (!bd) return 900;
    const i = byggdelOrder.indexOf(bd.toLowerCase());
    return i >= 0 ? i : 400;
  };

  rows.sort((a, b) => {
    const rank = byggdelRank(a.byggdel) - byggdelRank(b.byggdel);
    if (rank !== 0) return rank;
    return b.count - a.count;
  });
}

export function praxiDefaultsForTypes(
  types: string[],
  discipline: PraxiDisciplineCode
): Map<string, string> {
  const m = new Map<string, string>();
  for (const type of types) {
    const { hex } = getColorForIfcType(type, discipline);
    if (hex) m.set(type, hex);
  }
  return m;
}
