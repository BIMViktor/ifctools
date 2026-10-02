"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import HeroDropZone from "@/components/HeroDropZone";
import {
  Eye,
  GitCompareArrows,
  Palette,
  Combine,
  Scissors,
  Move,
  FileSpreadsheet,
  Sliders,
  Minimize2,
  Package,
  Eraser,
  FileCode,
  ShieldCheck,
  FilePlus,
  Activity,
  Clock,
  Zap,
  Cpu,
  LucideIcon,
} from "lucide-react";

type Tool = {
  name: string;
  description: string;
  href?: string;
  icon: LucideIcon;
  live: boolean;
  chips?: string[];
};

const LIVE_TOOLS: Tool[] = [
  {
    name: "View IFC",
    description: "Explore models in 3D with tree structure and properties.",
    href: "/viewer",
    icon: Eye,
    live: true,
    chips: ["Local WASM", "IFC → 3D"],
  },
  {
    name: "Compare IFC",
    description: "Highlight additions, deletions, and changes between two versions.",
    href: "/tools/compare",
    icon: GitCompareArrows,
    live: true,
    chips: ["IFC → Diff", "Local WASM"],
  },
  {
    name: "Recolour IFC",
    description: "Color-code elements by discipline using standard color profiles.",
    href: "/tools/colorizer",
    icon: Palette,
    live: true,
    chips: ["IFC → IFC"],
  },
  {
    name: "Merge IFC",
    description: "Combine separate discipline models into one federated file.",
    href: "/tools/merge",
    icon: Combine,
    live: true,
    chips: ["IFC → IFC"],
  },
  {
    name: "Split IFC",
    description: "Divide a model by storey, building, type, or property.",
    href: "/tools/split",
    icon: Scissors,
    live: true,
    chips: ["IFC → IFC"],
  },
  {
    name: "Extract Properties",
    description: "Export element properties and quantities to CSV for Excel.",
    href: "/tools/property-extractor",
    icon: FileSpreadsheet,
    live: true,
    chips: ["IFC → CSV"],
  },
  {
    name: "Reduce IFC Size",
    description: "One-click deep clean to shrink files 30–70%.",
    href: "/tools/reduce",
    icon: Minimize2,
    live: true,
    chips: ["IFC → IFC"],
  },
  {
    name: "Keep Only Physical",
    description: "Strip spaces, zones, 2D layers, and grids — keep physical geometry.",
    href: "/tools/keep-physical",
    icon: Package,
    live: true,
    chips: ["IFC → IFC"],
  },
  {
    name: "Validate IDS",
    description: "Check models against buildingSMART IDS and export failures as BCF.",
    href: "/tools/validator",
    icon: ShieldCheck,
    live: true,
    chips: ["IFC + IDS → BCF"],
  },
];

const SOON_TOOLS: Tool[] = [
  {
    name: "Transform Model",
    description: "Shift, rotate, scale, or fix georeferencing and coordinates.",
    icon: Move,
    live: false,
  },
  {
    name: "Edit Properties",
    description: "Add, remove, or bulk-edit property sets and parameters on the fly.",
    icon: Sliders,
    live: false,
  },
  {
    name: "Sanitize IFC",
    description: "Anonymize authors and strip sensitive properties before sharing.",
    icon: Eraser,
    live: false,
  },
  {
    name: "Export CAD (2D)",
    description: "Generate flat 2D floor plans and sections as DXF/SVG layers.",
    icon: FileCode,
    live: false,
  },
  {
    name: "Check IFC Health",
    description: "Audit models for corrupt geometry, duplicate GUIDs, and extreme coordinates.",
    icon: Activity,
    live: false,
  },
  {
    name: "Make IDS",
    description: "Author buildingSMART IDS specification files visually without XML.",
    icon: FilePlus,
    live: false,
  },
];

function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon;

  const inner = (
    <div
      className={`group relative flex flex-col gap-3 rounded-2xl border bg-white p-4 transition-all duration-150 h-full ${
        tool.live
          ? "border-gray-200 hover:border-teal-300 hover:shadow-md cursor-pointer"
          : "border-gray-100 cursor-default"
      }`}
    >
      {!tool.live && (
        <span className="absolute top-3.5 right-3.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
          <Clock className="w-2.5 h-2.5" />
          Soon
        </span>
      )}

      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
          tool.live
            ? "bg-teal-50 text-teal-600 group-hover:bg-teal-100"
            : "bg-gray-100 text-gray-400"
        }`}
      >
        <Icon className="w-4.5 h-4.5" strokeWidth={1.75} />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-semibold leading-snug transition-colors ${
            tool.live ? "text-gray-900 group-hover:text-teal-700" : "text-gray-400"
          }`}
        >
          {tool.name}
        </p>
        <p className={`text-xs mt-1 leading-relaxed ${tool.live ? "text-gray-500" : "text-gray-400"}`}>
          {tool.description}
        </p>
      </div>

      {tool.live && tool.chips && tool.chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
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
    </div>
  );

  if (tool.live && tool.href) {
    return (
      <Link href={tool.href} className="h-full">
        {inner}
      </Link>
    );
  }
  return inner;
}

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main className="flex-1 bg-[#F9FAFB]">
        <HeroDropZone />

        <div className="max-w-6xl mx-auto px-6">
          <section id="tools" className="pt-10 pb-12 scroll-mt-20">
            <div id="live" className="scroll-mt-20">
              <div className="flex items-end justify-between gap-4 mb-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                    Live tools
                  </p>
                  <h2 className="text-xl font-bold text-gray-900">Ready to use now</h2>
                </div>
                <p className="text-xs text-gray-400 shrink-0">
                  {LIVE_TOOLS.length} live · {SOON_TOOLS.length} coming soon
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {LIVE_TOOLS.map((tool) => (
                  <ToolCard key={tool.name} tool={tool} />
                ))}
              </div>
            </div>

            <div id="soon" className="mt-14 scroll-mt-20">
              <div className="mb-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                  Coming soon
                </p>
                <h2 className="text-xl font-bold text-gray-900">On the roadmap</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {SOON_TOOLS.map((tool) => (
                  <ToolCard key={tool.name} tool={tool} />
                ))}
              </div>
            </div>
          </section>

          <section id="pricing" className="pb-16 scroll-mt-20">
            <div className="pt-4 border-t border-gray-200 rounded-2xl">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                Pricing
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-3">
                Free for core tools. Pro when you need it.
              </h2>
              <p className="text-sm text-gray-500 max-w-xl leading-relaxed mb-6">
                All live tools are free to use in your browser — no upload, no account required.
                Log in is only for Pro licensing and billing. Files are never stored.
              </p>
              <div className="grid sm:grid-cols-2 gap-3 max-w-2xl">
                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <p className="text-sm font-semibold text-gray-900">Free</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Viewer, compare, merge, split, extract, reduce, validate — all client-side.
                  </p>
                </div>
                <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-5">
                  <p className="text-sm font-semibold text-gray-900">Pro</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Coming soon — team seats, priority features, and billing via Log in.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section id="about" className="pb-20 scroll-mt-20">
            <div className="pt-4 border-t border-gray-200">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                Why ifc2go?
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-3">
                Built for privacy-first BIM workflows
              </h2>
              <p className="text-sm text-gray-500 max-w-xl mb-8 leading-relaxed">
                Every tool runs locally in your browser. No uploads, no accounts,
                no waiting for a server to process your model.
              </p>

              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  {
                    icon: ShieldCheck,
                    title: "100% client-side",
                    body: "Files never leave your machine. Zero upload — NDA and GDPR friendly by design.",
                  },
                  {
                    icon: Zap,
                    title: "Instant WASM + WebGPU",
                    body: "Parse, render and export large IFC models with near-native speed in the browser.",
                  },
                  {
                    icon: Cpu,
                    title: "No registration",
                    body: "Core tools work immediately. Open a file and go — no signup, no licence friction.",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6"
                    >
                      <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
                        <Icon className="w-4.5 h-4.5" strokeWidth={1.75} />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1.5">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {item.body}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap justify-center sm:justify-start gap-x-8 gap-y-2 text-xs text-gray-500 font-medium">
            {[
              "No install required",
              "Files stay in your browser",
              "IFC2x3 · IFC4 · IFC4.3",
              "Free to use",
            ].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                {item}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} ifc2go.com</p>
        </div>
      </footer>
    </>
  );
}
