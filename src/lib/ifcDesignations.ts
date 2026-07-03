import type { IfcDataStore } from "@ifc-lite/parser";
import { extractEntityAttributesOnDemand } from "@ifc-lite/parser";
import { RelationshipType } from "@ifc-lite/data";

const EMPTY = new Set(["", "$", "*", "-", ".", "NULL"]);

function clean(s: string | undefined): string | null {
  if (!s) return null;
  const t = s.trim();
  if (EMPTY.has(t.toUpperCase())) return null;
  return t;
}

const MAX_SAMPLE = 120;
const MAX_BENAMNINGAR = 4;
const MAX_SYSTEMS = 3;

function entityName(store: IfcDataStore, id: number): string | null {
  const fromTable = store.entities?.getName(id);
  const c = clean(fromTable);
  if (c) return c;
  const attrs = extractEntityAttributesOnDemand(store, id);
  return (
    clean(attrs.name) ?? clean(attrs.objectType) ?? clean(attrs.tag) ?? null
  );
}

function groupNamesForEntity(store: IfcDataStore, entityId: number): string[] {
  if (!store.relationships) return [];
  const groupIds = store.relationships.getRelated(
    entityId,
    RelationshipType.AssignsToGroup,
    "inverse"
  );
  const names: string[] = [];
  for (const id of groupIds) {
    const n = entityName(store, id);
    if (n) names.push(n);
  }
  return names;
}

function topByCount(map: Map<string, number>, max: number): string[] {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([k]) => k);
}

/** Vanliga objekt-/systembenämningar från IFC Name, ObjectType, Tag och grupper. */
export function collectDesignationsForIds(
  store: IfcDataStore,
  ids: number[]
): { benamningar: string[]; systemNames: string[] } {
  const nameCounts = new Map<string, number>();
  const systemCounts = new Map<string, number>();

  if (ids.length === 0) {
    return { benamningar: [], systemNames: [] };
  }

  const step =
    ids.length <= MAX_SAMPLE ? 1 : Math.ceil(ids.length / MAX_SAMPLE);

  for (let i = 0; i < ids.length; i += step) {
    const id = ids[i];
    const attrs = extractEntityAttributesOnDemand(store, id);
    const label =
      clean(attrs.name) ??
      clean(attrs.objectType) ??
      clean(attrs.tag) ??
      clean(attrs.description);
    if (label) {
      nameCounts.set(label, (nameCounts.get(label) ?? 0) + 1);
    }
    for (const sys of groupNamesForEntity(store, id)) {
      systemCounts.set(sys, (systemCounts.get(sys) ?? 0) + 1);
    }
  }

  return {
    benamningar: topByCount(nameCounts, MAX_BENAMNINGAR),
    systemNames: topByCount(systemCounts, MAX_SYSTEMS),
  };
}

/** IFC-typ som schema-namn, t.ex. IFCWALLSTANDARDCASE → IfcWallStandardCase */
export function toIfcSchemaName(type: string): string {
  if (!type.startsWith("IFC")) return type;
  const rest = type.slice(3).toLowerCase();
  return `Ifc${rest.charAt(0).toUpperCase()}${rest.slice(1)}`;
}
