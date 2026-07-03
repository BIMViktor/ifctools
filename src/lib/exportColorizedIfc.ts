import type { IfcDataStore } from "@ifc-lite/parser";
import { EntityExtractor, serializeValue, type StepValue } from "@ifc-lite/parser";

function hexToRgb01(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

function extractStepRefs(line: string): number[] {
  const refs: number[] = [];
  for (const m of line.matchAll(/#(\d+)/g)) {
    refs.push(parseInt(m[1], 10));
  }
  return refs;
}

function decodeEntityLine(source: Uint8Array, byteOffset: number, byteLength: number): string {
  return new TextDecoder().decode(source.subarray(byteOffset, byteOffset + byteLength));
}

/**
 * Patch IFCCOLOURRGB entities reachable from recolored products in the STEP source.
 */
export function patchIfcColours(
  dataStore: IfcDataStore,
  typeColors: Map<string, string>
): Uint8Array {
  const { source, entityIndex } = dataStore;
  const byId = entityIndex.byId;

  const productToHex = new Map<number, string>();
  for (const [type, hex] of typeColors) {
    for (const id of entityIndex.byType.get(type) ?? []) {
      productToHex.set(id, hex);
    }
  }

  if (productToHex.size === 0) {
    return new Uint8Array(source);
  }

  const colourUpdates = new Map<number, [number, number, number]>();
  const MAX_DEPTH = 48;
  const MAX_VISITED_PER_PRODUCT = 8000;

  for (const [productId, hex] of productToHex) {
    const [r, g, b] = hexToRgb01(hex);
    const visited = new Set<number>();
    const queue: Array<{ id: number; depth: number }> = [{ id: productId, depth: 0 }];

    while (queue.length > 0 && visited.size < MAX_VISITED_PER_PRODUCT) {
      const { id, depth } = queue.shift()!;
      if (visited.has(id) || depth > MAX_DEPTH) continue;
      visited.add(id);

      const ref = byId.get(id);
      if (!ref) continue;

      if (ref.type === "IFCCOLOURRGB") {
        colourUpdates.set(id, [r, g, b]);
        continue;
      }

      const line = decodeEntityLine(source, ref.byteOffset, ref.byteLength);
      for (const childId of extractStepRefs(line)) {
        if (!visited.has(childId)) {
          queue.push({ id: childId, depth: depth + 1 });
        }
      }
    }
  }

  if (colourUpdates.size === 0) {
    return new Uint8Array(source);
  }

  const extractor = new EntityExtractor(source);
  const decoder = new TextDecoder("utf-8");
  const encoder = new TextEncoder();
  const text = decoder.decode(source);
  const lines = text.split(/\r?\n/);

  for (const [expressId, rgb] of colourUpdates) {
    const ref = byId.get(expressId);
    if (!ref) continue;

    const entity = extractor.extractEntity(ref);
    if (!entity || entity.type !== "IFCCOLOURRGB") continue;

    const attrs = [...entity.attributes];
    if (attrs.length >= 4) {
      attrs[1] = rgb[0];
      attrs[2] = rgb[1];
      attrs[3] = rgb[2];
    } else if (attrs.length === 3) {
      attrs[0] = rgb[0];
      attrs[1] = rgb[1];
      attrs[2] = rgb[2];
    } else {
      continue;
    }

    const newLine = `#${expressId}=IFCCOLOURRGB(${attrs.map((a) => serializeValue(a as StepValue)).join(",")});`;
    const lineIdx = ref.lineNumber - 1;
    if (lineIdx >= 0 && lineIdx < lines.length) {
      lines[lineIdx] = newLine;
    }
  }

  return encoder.encode(lines.join("\n"));
}
