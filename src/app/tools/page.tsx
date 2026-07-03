import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Tools — ifctools.io",
  description:
    "Every IFC tool you actually need — free, online, in your browser. No installs, no licences.",
};

const categories = [
  {
    name: "View & visualise",
    tools: [
      {
        slug: "viewer",
        href: "/viewer",
        name: "IFC Viewer",
        description:
          "Drop an IFC2x3, IFC4, or IFC4X3 file and explore it with project tree, properties, and WebGPU 3D navigation.",
        status: "live" as const,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
            <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      },
      {
        slug: "colorizer",
        href: "/tools/colorizer",
        name: "IFC Recolourer",
        description:
          "Recolour IFC elements by type with discipline-standard colours — structural, MEP, architecture — and export the modified IFC.",
        status: "live" as const,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
            <path d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
          </svg>
        ),
      },
    ],
  },
  {
    name: "Extract data",
    tools: [
      {
        slug: "extract-data",
        href: "/tools/extract-data",
        name: "Extract Data",
        description:
          "Export property sets, quantities and element attributes to Excel or CSV. Edit and push changes back into the IFC.",
        status: "soon" as const,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        ),
      },
      {
        slug: "properties",
        href: "/tools/properties",
        name: "Property Editor",
        description:
          "Add, rename, delete and bulk-edit IFC property sets directly. No scripting required.",
        status: "soon" as const,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
            <path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        ),
      },
      {
        slug: "convert",
        href: "/tools/convert",
        name: "IFC → glTF / GLB",
        description:
          "Convert IFC models to glTF or GLB for web viewers, game engines, and XR applications.",
        status: "soon" as const,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
            <path d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
          </svg>
        ),
      },
    ],
  },
  {
    name: "Organise IFC",
    tools: [
      {
        slug: "merge",
        href: "/tools/merge",
        name: "Merge IFC",
        description:
          "Combine multiple IFC files into a single federated model. GlobalIds, spatial hierarchy and all properties preserved.",
        status: "soon" as const,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
            <path d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
        ),
      },
      {
        slug: "split",
        href: "/tools/split",
        name: "Split IFC",
        description:
          "Split a federated model by storey, building, or discipline. Every output file is a valid standalone IFC.",
        status: "soon" as const,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
            <path d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
        ),
      },
      {
        slug: "cleaner",
        href: "/tools/cleaner",
        name: "IFC Cleaner",
        description:
          "Remove redundant geometry, empty property sets, orphaned entities and other cruft. Smaller file, same information.",
        status: "soon" as const,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
            <path d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
        ),
      },
    ],
  },
  {
    name: "Validate IFC",
    tools: [
      {
        slug: "ids-validator",
        href: "/tools/ids-validator",
        name: "IDS Validator",
        description:
          "Validate models against buildingSMART IDS specs. Generates a per-specification pass/fail report, exportable as BCF 2.1.",
        status: "soon" as const,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
            <path d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
          </svg>
        ),
      },
    ],
  },
  {
    name: "Nordic standards",
    tools: [
      {
        slug: "bsab",
        href: "/tools/bsab",
        name: "BSAB / CoClass",
        description:
          "Classify and validate IFC elements against BSAB 96 and CoClass. Export to Excel for cost planning and ÄTA.",
        status: "soon" as const,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
            <path d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
        ),
      },
    ],
  },
];

export default function ToolsPage() {
  return (
    <div className="flex flex-col min-h-dvh">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">
            Every IFC tool you actually need
          </h1>
          <p className="text-zinc-400">
            Free, online, in your browser. Every tool runs on any machine — no installs, no licences, no upload required.
          </p>
        </div>

        <div className="space-y-10">
          {categories.map((cat) => (
            <div key={cat.name}>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">
                {cat.name}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cat.tools.map((tool) => {
                  const isLive = tool.status === "live";
                  const card = (
                    <div
                      className={`group relative rounded-xl border p-5 transition-all ${
                        isLive
                          ? "border-zinc-700 hover:border-indigo-500/60 hover:bg-zinc-900/60 cursor-pointer"
                          : "border-zinc-800/60 opacity-50 cursor-default"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className={`p-2 rounded-lg ${isLive ? "bg-indigo-500/10 text-indigo-400" : "bg-zinc-800/50 text-zinc-600"}`}>
                          {tool.icon}
                        </span>
                        {isLive ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Live
                          </span>
                        ) : (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-500 border border-zinc-700/50">
                            Coming soon
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-white mb-1">{tool.name}</h3>
                      <p className="text-xs text-zinc-500 leading-relaxed">{tool.description}</p>
                      {isLive && (
                        <div className="mt-3 text-xs text-indigo-400 font-medium group-hover:translate-x-0.5 transition-transform">
                          Open tool →
                        </div>
                      )}
                    </div>
                  );
                  return isLive ? (
                    <Link key={tool.slug} href={tool.href}>{card}</Link>
                  ) : (
                    <div key={tool.slug}>{card}</div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-zinc-800 px-6 py-6 text-center">
        <p className="text-xs text-zinc-600">
          Powered by{" "}
          <a href="https://ifclite.dev" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-300 transition-colors">
            ifc-lite
          </a>
          {" "}· Next.js · Vercel
        </p>
      </footer>
    </div>
  );
}
