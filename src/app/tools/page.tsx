import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Tools — ifc2go.com",
  description:
    "Every IFC tool you actually need — free, online, in your browser. No installs, no licences.",
};

type ToolStatus = "live" | "soon";

type Tool = {
  slug: string;
  href?: string;
  name: string;
  description: string;
  status: ToolStatus;
  chips?: string[];
};

const LIVE_TOOLS: Tool[] = [
  {
    slug: "viewer",
    href: "/viewer",
    name: "View IFC",
    description:
      "Drop an IFC2x3, IFC4, or IFC4.3 file and explore it with project tree, properties, and WebGPU 3D.",
    status: "live",
    chips: ["Local WASM", "IFC → 3D"],
  },
  {
    slug: "compare",
    href: "/tools/compare",
    name: "Compare IFC",
    description: "Highlight additions, deletions, and changes between two model versions.",
    status: "live",
    chips: ["IFC → Diff", "Local WASM"],
  },
  {
    slug: "colorizer",
    href: "/tools/colorizer",
    name: "Recolour IFC",
    description: "Recolour elements by type or discipline and export the modified IFC.",
    status: "live",
    chips: ["IFC → IFC"],
  },
  {
    slug: "merge",
    href: "/tools/merge",
    name: "Merge IFC",
    description:
      "Combine multiple IFC files into one federated model. GlobalIds and hierarchy preserved.",
    status: "live",
    chips: ["IFC → IFC"],
  },
  {
    slug: "split",
    href: "/tools/split",
    name: "Split IFC",
    description:
      "Split a model by storey, building, or type. Every output is a valid standalone IFC.",
    status: "live",
    chips: ["IFC → IFC"],
  },
  {
    slug: "property-extractor",
    href: "/tools/property-extractor",
    name: "Extract Properties",
    description: "Export property sets, quantities and attributes to CSV — opens in Excel.",
    status: "live",
    chips: ["IFC → CSV"],
  },
  {
    slug: "reduce",
    href: "/tools/reduce",
    name: "Reduce IFC Size",
    description: "One-click deep clean to shrink files — strip unused entities and model weight.",
    status: "live",
    chips: ["IFC → IFC"],
  },
  {
    slug: "keep-physical",
    href: "/tools/keep-physical",
    name: "Keep Only Physical",
    description: "Strip spaces, zones, 2D annotations and grids, leaving only physical geometry.",
    status: "live",
    chips: ["IFC → IFC"],
  },
  {
    slug: "validator",
    href: "/tools/validator",
    name: "Validate IDS",
    description:
      "Validate against buildingSMART IDS. Review failures in 3D and export as BCF 2.1.",
    status: "live",
    chips: ["IFC + IDS → BCF"],
  },
];

const SOON_TOOLS: Tool[] = [
  {
    slug: "model-transformer",
    name: "Transform Model",
    description: "Shift, rotate, scale, or fix georeferencing and coordinates.",
    status: "soon",
  },
  {
    slug: "property-editor",
    name: "Edit Properties",
    description: "Add, rename, delete and bulk-edit IFC property sets directly in the browser.",
    status: "soon",
  },
  {
    slug: "sanitize",
    name: "Sanitize IFC",
    description: "Anonymize authors and strip sensitive properties before external sharing.",
    status: "soon",
  },
  {
    slug: "ifc-to-cad",
    name: "Export CAD (2D)",
    description: "Generate flat 2D floor plans and sections with clean DXF/SVG layers.",
    status: "soon",
  },
  {
    slug: "health-check",
    name: "Check IFC Health",
    description: "Audit models for corrupt geometry, duplicate GUIDs, and extreme coordinates.",
    status: "soon",
  },
  {
    slug: "ids-maker",
    name: "Make IDS",
    description: "Author and edit buildingSMART IDS specification files visually without XML.",
    status: "soon",
  },
];

function ToolCard({ tool }: { tool: Tool }) {
  const isLive = tool.status === "live" && Boolean(tool.href);

  const card = (
    <div
      className={`group relative rounded-2xl border bg-white p-5 transition-all h-full flex flex-col ${
        isLive
          ? "border-gray-200 hover:border-teal-300 hover:shadow-md cursor-pointer"
          : "border-gray-100 cursor-default"
      }`}
    >
      <div className="flex items-start justify-between mb-3 gap-3">
        <h3
          className={`text-sm font-semibold ${
            isLive ? "text-gray-900 group-hover:text-teal-700" : "text-gray-400"
          }`}
        >
          {tool.name}
        </h3>
        {isLive ? (
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-teal-700 bg-teal-50 border border-teal-100 rounded-full px-2 py-0.5">
            Live
          </span>
        ) : (
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
            Soon
          </span>
        )}
      </div>
      <p className={`text-xs leading-relaxed flex-1 ${isLive ? "text-gray-500" : "text-gray-400"}`}>
        {tool.description}
      </p>
      {isLive && tool.chips && tool.chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {tool.chips.map((chip) => (
            <span
              key={chip}
              className="text-[10px] font-medium text-teal-700 bg-teal-50 border border-teal-100 rounded-md px-1.5 py-0.5"
            >
              {chip}
            </span>
          ))}
        </div>
      )}
      {isLive && (
        <div className="mt-3 text-xs text-teal-600 font-medium group-hover:translate-x-0.5 transition-transform">
          Open tool →
        </div>
      )}
    </div>
  );

  if (isLive && tool.href) {
    return (
      <Link href={tool.href} className="h-full">
        {card}
      </Link>
    );
  }
  return card;
}

export default function ToolsPage() {
  return (
    <div className="flex flex-col min-h-dvh bg-[#F9FAFB]">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Every IFC tool you actually need
          </h1>
          <p className="text-gray-500">
            Free, online, in your browser. No installs, no licences — files never leave your machine.
          </p>
          <p className="mt-3 text-xs text-gray-400">
            {LIVE_TOOLS.length} live · {SOON_TOOLS.length} coming soon
          </p>
        </div>

        <div className="space-y-14">
          <section id="live" className="scroll-mt-20">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4">
              Live tools
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {LIVE_TOOLS.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </section>

          <section id="soon" className="scroll-mt-20">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4">
              Coming soon
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SOON_TOOLS.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 px-6 py-6 text-center">
        <p className="text-xs text-gray-400">
          Powered by{" "}
          <a
            href="https://ifclite.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-teal-600 transition-colors"
          >
            ifc-lite
          </a>
          {" · "}Next.js · Vercel
        </p>
      </footer>
    </div>
  );
}
