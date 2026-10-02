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
};

type Category = {
  id: string;
  name: string;
  tools: Tool[];
};

/**
 * Same slimmed matrix as the homepage.
 * Section `id`s match Navbar hash links (#view, #clean, #data, #validate).
 */
const categories: Category[] = [
  {
    id: "view",
    name: "View & Explore",
    tools: [
      {
        slug: "viewer",
        href: "/viewer",
        name: "IFC Viewer",
        description:
          "Drop an IFC2x3, IFC4, or IFC4.3 file and explore it with project tree, properties, and WebGPU 3D navigation.",
        status: "live",
      },
      {
        slug: "compare",
        href: "/tools/compare",
        name: "Compare IFC Files",
        description:
          "Visually highlight additions, deletions, and moves between two model versions.",
        status: "live",
      },
      {
        slug: "colorizer",
        href: "/tools/colorizer",
        name: "IFC Recolourer",
        description:
          "Recolour IFC elements by type or discipline and export the modified IFC.",
        status: "live",
      },
    ],
  },
  {
    id: "clean",
    name: "Clean & Optimize",
    tools: [
      {
        slug: "reduce",
        href: "/tools/reduce",
        name: "Reduce IFC File Size",
        description:
          "One-click deep clean to shrink files — strip unused entities and reduce model weight.",
        status: "live",
      },
      {
        slug: "keep-physical",
        href: "/tools/keep-physical",
        name: "Keep Only Physical Elements",
        description:
          "Strip spaces, zones, 2D annotations and grids, leaving only physical geometry.",
        status: "live",
      },
      {
        slug: "sanitize",
        name: "Sanitize IFC",
        description:
          "Anonymize authors and strip sensitive properties before external sharing.",
        status: "soon",
      },
    ],
  },
  {
    id: "data",
    name: "Data & Convert",
    tools: [
      {
        slug: "property-extractor",
        href: "/tools/property-extractor",
        name: "Property Extractor",
        description:
          "Export property sets, quantities and attributes to CSV — opens directly in Excel.",
        status: "live",
      },
      {
        slug: "property-editor",
        name: "Property Editor",
        description:
          "Add, rename, delete and bulk-edit IFC property sets directly in the browser.",
        status: "soon",
      },
      {
        slug: "merge",
        href: "/tools/merge",
        name: "Merge IFC",
        description:
          "Combine multiple IFC files into one federated model. GlobalIds and hierarchy preserved.",
        status: "live",
      },
      {
        slug: "split",
        href: "/tools/split",
        name: "Split IFC",
        description:
          "Split a model by storey, building, or type. Every output is a valid standalone IFC.",
        status: "live",
      },
      {
        slug: "model-transformer",
        name: "Model Transformer",
        description:
          "Shift, rotate, scale, or fix georeferencing and coordinates.",
        status: "soon",
      },
      {
        slug: "ifc-to-cad",
        name: "IFC to CAD (2D)",
        description:
          "Generate flat 2D floor plans and sections with clean per-class DXF/SVG layers.",
        status: "soon",
      },
      {
        slug: "ifc-to-gltf",
        name: "IFC to glTF / GLB",
        description:
          "Convert IFC models to glTF or GLB for web viewers, game engines, and XR.",
        status: "soon",
      },
    ],
  },
  {
    id: "validate",
    name: "Validate & Check",
    tools: [
      {
        slug: "validator",
        href: "/tools/validator",
        name: "IDS Validator",
        description:
          "Validate models against buildingSMART IDS. Review failures in 3D and export as BCF 2.1.",
        status: "live",
      },
      {
        slug: "health-check",
        name: "IFC Health Check",
        description:
          "Audit models for corrupt geometry, duplicate GUIDs, and extreme coordinates.",
        status: "soon",
      },
      {
        slug: "ids-maker",
        name: "IDS Maker",
        description:
          "Author and edit buildingSMART IDS specification files visually without XML.",
        status: "soon",
      },
      {
        slug: "bsab",
        name: "BSAB / CoClass",
        description:
          "Classify and validate IFC elements against BSAB 96 and CoClass for Nordic workflows.",
        status: "soon",
      },
    ],
  },
];

export default function ToolsPage() {
  const liveCount = categories.reduce(
    (sum, cat) => sum + cat.tools.filter((t) => t.status === "live").length,
    0
  );
  const totalCount = categories.reduce((sum, cat) => sum + cat.tools.length, 0);

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
            {liveCount} live · {totalCount - liveCount} coming soon
          </p>
        </div>

        <div className="space-y-12">
          {categories.map((cat) => (
            <section key={cat.id} id={cat.id} className="scroll-mt-20">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4">
                {cat.name}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {cat.tools.map((tool) => {
                  const isLive = tool.status === "live" && Boolean(tool.href);
                  const card = (
                    <div
                      className={`group relative rounded-2xl border bg-white p-5 transition-all h-full ${
                        isLive
                          ? "border-gray-200 hover:border-teal-300 hover:shadow-md cursor-pointer"
                          : "border-gray-100 cursor-default"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3 gap-3">
                        <h3
                          className={`text-sm font-semibold ${
                            isLive
                              ? "text-gray-900 group-hover:text-teal-700"
                              : "text-gray-400"
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
                      <p
                        className={`text-xs leading-relaxed ${
                          isLive ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        {tool.description}
                      </p>
                      {isLive && (
                        <div className="mt-3 text-xs text-teal-600 font-medium group-hover:translate-x-0.5 transition-transform">
                          Open tool →
                        </div>
                      )}
                    </div>
                  );

                  return isLive && tool.href ? (
                    <Link key={tool.slug} href={tool.href} className="h-full">
                      {card}
                    </Link>
                  ) : (
                    <div key={tool.slug}>{card}</div>
                  );
                })}
              </div>
            </section>
          ))}
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
