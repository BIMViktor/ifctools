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
  // Empty turbopack section tells Next.js 16 that the webpack config below is
  // intentional and the dev server should not warn about the mismatch.
  turbopack: {},
  webpack(config) {
    // laz-perf ships a Vite-style `laz-perf.wasm?url` import so bundlers
    // copy the binary as a static asset and return its URL. Webpack 5 does
    // not understand the `?url` query natively; without this rule it tries
    // to parse the WASM binary as a WebAssembly module, then fails because
    // it can't resolve the WASM host-import namespaces ('env',
    // 'wasi_snapshot_preview1') as JS modules.
    config.module.rules.push({
      test: /\.wasm$/,
      resourceQuery: /url/,
      type: "asset/resource",
    });

    // For any .wasm that is NOT imported with ?url (rare), enable the async
    // WebAssembly experiment so webpack handles host imports correctly.
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
};

export default nextConfig;
