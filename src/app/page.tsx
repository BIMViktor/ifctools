"use client";

import Link from "next/link";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import {
  Eye,
  GitCompareArrows,
  Palette,
  Layers,
  Combine,
  Scissors,
  RefreshCw,
  Move,
  Network,
  FileText,
  FileSpreadsheet,
  ArrowUpFromLine,
  Sliders,
  Calculator,
  Type,
  Trash2,
  Minimize2,
  Package,
  UserX,
  Eraser,
  FileOutput,
  FileCode,
  Box,
  DownloadCloud,
  ShieldCheck,
  FilePlus,
  Flame,
  Activity,
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
  // ── View ──────────────────────────────────────────────────────────────────
  {
    name: "IFC Viewer",
    description: "Explore models in 3D with tree structure and properties.",
    href: "/viewer",
    icon: Eye,
    live: true,
    popular: true,
    category: "View",
  },
  {
    name: "Compare IFC Files",
    description: "Visually highlight additions, deletions, and moves between two versions.",
    href: "/tools/compare",
    icon: GitCompareArrows,
    live: true,
    category: "View",
  },
  {
    name: "IFC Recolourer",
    description: "Color-code elements by discipline using standard color profiles.",
    href: "/tools/colorizer",
    icon: Palette,
    live: true,
    category: "View",
  },

  // ── Organize ──────────────────────────────────────────────────────────────
  {
    name: "Merge IFC",
    description: "Combine separate discipline models into one federated file.",
    href: "/tools/merge",
    icon: Combine,
    live: true,
    category: "Organize",
  },
  {
    name: "Split IFC",
    description: "Divide an IFC model by storey, building, type, or property.",
    href: "/tools/split",
    icon: Scissors,
    live: true,
    category: "Organize",
  },
  {
    name: "Schema Converter",
    description: "Upgrade or downgrade models between IFC2x3, IFC4, and IFC4.3.",
    icon: RefreshCw,
    category: "Organize",
  },
  {
    name: "Model Transformer",
    description: "Shift, rotate, scale, or fix georeferencing and coordinates.",
    icon: Move,
    category: "Organize",
  },
  {
    name: "Manage IFC Storeys",
    description: "Reassign elements that were exported on the wrong level.",
    icon: Network,
    category: "Organize",
  },

  // ── Properties ────────────────────────────────────────────────────────────
  {
    name: "Property Extractor",
    description: "Export all element properties and quantities to Excel or CSV in one click.",
    href: "/tools/property-extractor",
    icon: FileSpreadsheet,
    live: true,
    popular: true,
    category: "Properties",
  },
  {
    name: "Excel to IFC",
    description: "Update IFC properties by importing values from an edited spreadsheet.",
    href: "/tools/excel-to-ifc",
    icon: ArrowUpFromLine,
    live: true,
    category: "Properties",
  },
  {
    name: "Property Editor",
    description: "Add, remove, or bulk-edit property sets and parameters on the fly.",
    icon: Sliders,
    category: "Properties",
  },
  {
    name: "Quantity Takeoff",
    description: "Generate grouped element quantities without a desktop takeoff tool.",
    icon: Calculator,
    category: "Properties",
  },
  {
    name: "Bulk Rename by Pattern",
    description: "Standardize element names in bulk using dynamic token patterns.",
    icon: Type,
    category: "Properties",
  },

  // ── Clean ─────────────────────────────────────────────────────────────────
  {
    name: "Reduce IFC File Size",
    description: "One-click deep clean and mesh simplification to shrink files 30–70%.",
    href: "/tools/reduce",
    icon: Minimize2,
    live: true,
    popular: true,
    category: "Clean",
  },
  {
    name: "Keep Only Physical Elements",
    description: "Strip spaces, zones, 2D layers, and grids to leave only physical geometry.",
    icon: Package,
    category: "Clean",
  },
  {
    name: "Delete IFC Elements",
    description: "Remove entire categories (like rebar or proxy objects) from the model.",
    icon: Trash2,
    category: "Clean",
  },
  {
    name: "Anonymize IFC",
    description: "Scrub authors, organizations, and application headers before external sharing.",
    icon: UserX,
    category: "Clean",
  },
  {
    name: "Delete IFC Properties",
    description: "Strip sensitive metadata, costs, or internal notes before sharing.",
    icon: Eraser,
    category: "Clean",
  },

  // ── Convert ───────────────────────────────────────────────────────────────
  {
    name: "IFC to CAD (2D)",
    description: "Generate flat 2D floor plans and sections with clean per-class DXF/SVG layers.",
    icon: FileCode,
    category: "Convert",
  },
  {
    name: "IFC to DXF (3D)",
    description: "Convert IFC geometry to a lightweight 3D triangle mesh for AutoCAD.",
    icon: Box,
    category: "Convert",
  },
  {
    name: "Navisworks Exporter",
    description: "Link to our free open-source desktop plug-in for Navisworks coordinate files.",
    icon: DownloadCloud,
    category: "Convert",
  },

  // ── Validate ──────────────────────────────────────────────────────────────
  {
    name: "IFC Validator",
    description: "Check schema compliance and required properties against IDS rules.",
    href: "/tools/validator",
    icon: ShieldCheck,
    live: true,
    popular: true,
    category: "Validate",
  },
  {
    name: "IDS Maker",
    description: "Author and edit buildingSMART IDS specification files visually without XML.",
    icon: FilePlus,
    category: "Validate",
  },
  {
    name: "IFC Clash Detection",
    description: "Detect geometric conflicts and intersection issues between building systems.",
    icon: Flame,
    category: "Validate",
  },
  {
    name: "IFC Health Check",
    description: "Audit models for corrupt geometry, duplicate GUIDs, and extreme coordinates.",
    icon: Activity,
    category: "Validate",
  },
];

const CATEGORIES = ["All", "View", "Organize", "Properties", "Clean", "Convert", "Validate"] as const;
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
