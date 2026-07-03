import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent server-side bundling of ifc-lite (uses WASM, WebGPU, ESM-only)
  serverExternalPackages: [
    "@ifc-lite/data",
    "@ifc-lite/parser",
    "@ifc-lite/geometry",
    "@ifc-lite/renderer",
    "@ifc-lite/export",
    "@ifc-lite/query",
    "@ifc-lite/wasm",
    "@ifc-lite/encoding",
    "@ifc-lite/ifcx",
    "@ifc-lite/mutations",
    "@ifc-lite/spatial",
    "@ifc-lite/ids",
    "@ifc-lite/bcf",
    "@ifc-lite/drawing-2d",
    "laz-perf",
  ],
};

export default nextConfig;
