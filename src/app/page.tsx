"use client";

import Link from "next/link";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import {
  Eye,
  Palette,
  Minimize2,
  Scissors,
  GitMerge,
  FileSpreadsheet,
  ShieldCheck,
  GitCompareArrows,
  Zap,
  Table,
  FileJson,
  FileCode2,
  ScanSearch,
  Building2,
  Flag,
  Layers,
  Clock,
  LucideIcon,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Tool = {
  name: string;
  description: string;
  href?: string;
  icon: LucideIcon;
  live?: boolean;
  popular?: boolean;
  category: string;
};

// ─── Tool registry ───────────────────────────────────────────────────────────

const ALL_TOOLS: Tool[] = [
  // View & Explore
  {
    name: "IFC Viewer",
    description: "Explore any IFC model in 3D — structure tree, properties, section cuts.",
    href: "/viewer",
    icon: Eye,
    live: true,
    popular: true,
    category: "View",
  },
  {
    name: "IFC Recolourer",
    description: "Colour-code elements by discipline using Praxi standard colours.",
    href: "/tools/colorizer",
    icon: Palette,
    live: true,
    popular: true,
    category: "View",
  },
  {
    name: "BCF Viewer",
    description: "Visualise BCF issues directly on the 3D model. Share issue links.",
    icon: Flag,
    category: "View",
  },
  {
    name: "Storey Plan",
    description: "Auto-generate 2D floor plans per storey from any IFC file.",
    icon: Layers,
    category: "View",
  },

  // Organize
  {
    name: "IFC Splitter",
    description: "Split a model by discipline, storey, or type into separate files.",
    icon: Scissors,
    popular: true,
    category: "Organize",
  },
  {
    name: "IFC Merger",
    description: "Combine multiple IFC files into one coordinated model.",
    icon: GitMerge,
    category: "Organize",
  },
  {
    name: "IFC Size Reducer",
    description: "Strip geometry LOD and unused data. Cut file size 30–70%.",
    icon: Minimize2,
    popular: true,
    category: "Organize",
  },
  {
    name: "IFC Repair",
    description: "Fix corrupt GUIDs, dangling references, and invalid geometry.",
    icon: Zap,
    category: "Organize",
  },

  // Properties
  {
    name: "Property Extractor",
    description: "Export all element properties to Excel or CSV in one click.",
    icon: Table,
    popular: true,
    category: "Properties",
  },
  {
    name: "IFC → Excel",
    description: "Full property table with storey, type, and custom Pset columns.",
    icon: FileSpreadsheet,
    category: "Properties",
  },
  {
    name: "Class Mapper",
    description: "Remap IFC types and Psets in bulk using a simple mapping table.",
    icon: GitCompareArrows,
    category: "Properties",
  },
  {
    name: "Property Editor",
    description: "Add, remove, or update Psets and properties across elements.",
    icon: ScanSearch,
    category: "Properties",
  },

  // Convert
  {
    name: "IFC → glTF",
    description: "Convert IFC geometry to glTF / GLB for web and game engines.",
    icon: FileCode2,
    category: "Convert",
  },
  {
    name: "IFC → COBie",
    description: "Export facilities management data in COBie spreadsheet format.",
    icon: Building2,
    category: "Convert",
  },
  {
    name: "IFC → JSON",
    description: "Serialize the full IFC model as a structured JSON document.",
    icon: FileJson,
    category: "Convert",
  },
  {
    name: "Schema Upgrader",
    description: "Migrate IFC2x3 models to IFC4 or IFC4.3 automatically.",
    icon: Layers,
    category: "Convert",
  },

  // Validate
  {
    name: "IFC Validator",
    description: "Check schema compliance and required properties against IDS rules.",
    icon: ShieldCheck,
    popular: true,
    category: "Validate",
  },
  {
    name: "IFC Diff",
    description: "Compare two model versions and highlight exactly what changed.",
    icon: GitCompareArrows,
    category: "Validate",
  },
  {
    name: "Clash Detector",
    description: "Find hard and soft clashes between disciplines. Export to BCF.",
    icon: Zap,
    category: "Validate",
  },
  {
    name: "BBR Validator",
    description: "Validate against Swedish BBR building regulations.",
    icon: Flag,
    category: "Validate",
  },
];

const CATEGORIES = ["All", "View", "Organize", "Properties", "Convert", "Validate"] as const;
type Category = (typeof CATEGORIES)[number];

// ─── Sub-components ───────────────────────────────────────────────────────────

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
      {/* Coming soon badge */}
      {!tool.live && (
        <span className="absolute top-3.5 right-3.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
          <Clock className="w-2.5 h-2.5" />
          Soon
        </span>
      )}

      {/* Icon */}
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
          tool.live
            ? "bg-teal-50 text-teal-600 group-hover:bg-teal-100"
            : "bg-gray-100 text-gray-400"
        }`}
      >
        <Icon className="w-4.5 h-4.5" strokeWidth={1.75} />
      </div>

      {/* Text */}
      <div>
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
    </div>
  );

  if (tool.live && tool.href) {
    return <Link href={tool.href} className="h-full">{inner}</Link>;
  }
  return inner;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Category>("All");

  const popularTools = ALL_TOOLS.filter((t) => t.popular);
  const filteredTools =
    activeTab === "All" ? ALL_TOOLS : ALL_TOOLS.filter((t) => t.category === activeTab);

  const liveCount = ALL_TOOLS.filter((t) => t.live).length;
  const totalCount = ALL_TOOLS.length;

  return (
    <>
      <Navbar />

      <main className="flex-1 bg-[#F9FAFB]">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-6 py-14 sm:py-16 text-center">
            <h1 className="text-4xl sm:text-[2.75rem] font-bold tracking-tight text-gray-900 leading-[1.15]">
              Every IFC tool you need —{" "}
              <span className="text-teal-600">free in your browser.</span>
            </h1>
            <p className="mt-4 text-lg text-gray-500 max-w-lg mx-auto leading-relaxed">
              Clean, validate, edit and organize IFC files instantly.
              No installs, 100% private.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/viewer"
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-colors shadow-sm"
              >
                Open sample building
              </Link>
              <a
                href="#tools"
                className="px-6 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm transition-colors"
              >
                Browse all tools
              </a>
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-6">

          {/* ── Popular tools ─────────────────────────────────────────── */}
          <section className="pt-10 pb-6">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4">
              Popular tools
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {popularTools.map((tool) => (
                <ToolCard key={tool.name} tool={tool} />
              ))}
            </div>
          </section>

          {/* ── Full tool grid ───────────────────────────────────────── */}
          <section id="tools" className="pb-20">
            {/* Tab bar */}
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6 pt-4 border-t border-gray-200">
              <div className="flex gap-1 flex-wrap">
                {CATEGORIES.map((cat) => {
                  const count =
                    cat === "All"
                      ? totalCount
                      : ALL_TOOLS.filter((t) => t.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveTab(cat)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === cat
                          ? "bg-teal-600 text-white shadow-sm"
                          : "bg-white text-gray-600 border border-gray-200 hover:border-teal-300 hover:text-teal-700"
                      }`}
                    >
                      {cat}
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          activeTab === cat ? "bg-teal-500 text-white" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400">
                {liveCount} live · {totalCount - liveCount} coming soon
              </p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredTools.map((tool) => (
                <ToolCard key={tool.name} tool={tool} />
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* ── Trust strip ─────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap justify-center sm:justify-start gap-x-8 gap-y-2 text-xs text-gray-500 font-medium">
            {[
              "No install required",
              "Files auto-deleted",
              "IFC2x3 · IFC4 · IFC4.3",
              "Free tier available",
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
