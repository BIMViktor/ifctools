import Link from "next/link";
import Navbar from "@/components/Navbar";

// ─── Tool definitions ────────────────────────────────────────────────────────

type Tool = {
  name: string;
  description: string;
  href?: string;
  icon: string;
  live?: boolean;
  popular?: boolean;
};

const tools: Record<string, Tool[]> = {
  "View & Explore": [
    {
      name: "IFC Viewer",
      description: "Open and explore any IFC model in 3D — structure tree, properties, section cuts.",
      href: "/viewer",
      icon: "🏗️",
      live: true,
      popular: true,
    },
    {
      name: "IFC Recolourer",
      description: "Colour-code elements by discipline using Praxi standard colours. Export the result.",
      href: "/tools/colorizer",
      icon: "🎨",
      live: true,
      popular: true,
    },
  ],
  "Clean & Optimize": [
    {
      name: "IFC Size Reducer",
      description: "Strip LOD geometry and unused data. Cut file size 30–70% without losing information.",
      icon: "📦",
    },
    {
      name: "IFC Merger",
      description: "Combine multiple IFC files into a single coordinated model.",
      icon: "🔗",
    },
    {
      name: "IFC Splitter",
      description: "Split a model by discipline, storey, or type into separate files.",
      icon: "✂️",
    },
    {
      name: "IFC Repair",
      description: "Fix corrupt GUIDs, dangling references, and invalid geometry.",
      icon: "🔧",
    },
  ],
  "Data & Convert": [
    {
      name: "Property Extractor",
      description: "Export all element properties to Excel or CSV in one click.",
      icon: "📊",
      popular: true,
    },
    {
      name: "IFC → Excel",
      description: "Full property table export with storey, type, and custom Pset columns.",
      icon: "📋",
    },
    {
      name: "IFC → glTF",
      description: "Convert IFC geometry to glTF / GLB for web and game engines.",
      icon: "🌐",
    },
    {
      name: "IFC → COBie",
      description: "Export facilities management data in COBie spreadsheet format.",
      icon: "🏢",
    },
  ],
  "Validate & Check": [
    {
      name: "IFC Validator",
      description: "Check schema compliance and required properties against IDS rules.",
      icon: "✅",
      popular: true,
    },
    {
      name: "IFC Diff",
      description: "Compare two versions of a model and highlight what changed.",
      icon: "🔍",
    },
    {
      name: "Clash Detector",
      description: "Find hard and soft clashes between disciplines. Export to BCF.",
      icon: "⚡",
    },
    {
      name: "BBR Validator",
      description: "Validate against Swedish BBR building regulations.",
      icon: "🇸🇪",
    },
  ],
};

const popularTools = Object.values(tools)
  .flat()
  .filter((t) => t.popular);

// ─── Components ──────────────────────────────────────────────────────────────

function ToolCard({ tool }: { tool: Tool }) {
  const card = (
    <div
      className={`group relative bg-white rounded-xl border p-4 flex flex-col gap-2 transition-all duration-150 ${
        tool.live
          ? "border-gray-200 hover:border-teal-300 hover:shadow-md cursor-pointer"
          : "border-gray-100 opacity-70"
      }`}
    >
      {!tool.live && (
        <span className="absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-wide text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
          Soon
        </span>
      )}
      <span className="text-2xl leading-none">{tool.icon}</span>
      <div>
        <p className="text-sm font-semibold text-gray-900 group-hover:text-teal-700 transition-colors">
          {tool.name}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
          {tool.description}
        </p>
      </div>
    </div>
  );

  if (tool.live && tool.href) {
    return <Link href={tool.href}>{card}</Link>;
  }
  return card;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="max-w-6xl mx-auto px-6 pt-16 pb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 leading-tight">
            Every IFC tool you need —{" "}
            <span className="text-teal-600">free in your browser.</span>
          </h1>
          <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">
            View, validate, clean, convert and split IFC files. No install.
            No licence fees to get started. Files never leave your device.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/viewer"
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-colors shadow-sm"
            >
              Open IFC Viewer
            </Link>
            <Link
              href="/tools"
              className="px-6 py-2.5 rounded-xl bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm border border-gray-200 transition-colors"
            >
              Browse all tools
            </Link>
          </div>

          {/* Trust strip */}
          <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-2 text-xs text-gray-400 font-medium">
            {[
              "No install",
              "Files stay on your device",
              "IFC2x3 · IFC4 · IFC4.3",
              "No account required",
            ].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-teal-400 inline-block" />
                {t}
              </span>
            ))}
          </div>
        </section>

        {/* ── Popular tools ── */}
        <section className="max-w-6xl mx-auto px-6 pb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            Popular tools
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {popularTools.map((tool) => (
              <ToolCard key={tool.name} tool={tool} />
            ))}
          </div>
        </section>

        {/* ── Full tool grid ── */}
        <section className="max-w-6xl mx-auto px-6 pb-20 space-y-10">
          {Object.entries(tools).map(([category, categoryTools]) => (
            <div key={category}>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
                {category}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {categoryTools.map((tool) => (
                  <ToolCard key={tool.name} tool={tool} />
                ))}
              </div>
            </div>
          ))}
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <span>
            © {new Date().getFullYear()} ifctools.io — Built for BIM
            coordinators
          </span>
          <div className="flex gap-6">
            <a
              href="https://github.com/BIMViktor/ifctools"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-700 transition-colors"
            >
              GitHub
            </a>
            <Link href="/tools" className="hover:text-gray-700 transition-colors">
              All tools
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
