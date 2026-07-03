import Link from "next/link";
import Navbar from "@/components/Navbar";

/* ─── data ────────────────────────────────────────────────────────────── */

const stats = [
  { value: "2.7s",  label: "Parse a 68 MB model" },
  { value: "5×",    label: "Faster than web-ifc" },
  { value: "260 KB",label: "Gzipped bundle" },
  { value: "0",     label: "Installs required" },
];

const liveTools = [
  {
    href: "/viewer",
    name: "IFC Viewer",
    tagline: "Project tree, properties, section cuts, GUID copy.",
    body: "Drop an IFC2x3, IFC4, or IFC4X3 file and explore it in 3D. Click any element to inspect its full property sets. Copy GlobalIds. Section the model.",
    badge: "Open the viewer →",
    preview: (
      <div className="rounded-lg border border-zinc-700 bg-zinc-900 overflow-hidden text-[11px] font-mono select-none">
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-zinc-800 bg-zinc-950">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          <span className="ml-2 text-zinc-600">ifctools.io/viewer</span>
        </div>
        <div className="flex h-36">
          <div className="w-36 border-r border-zinc-800 p-2 space-y-1">
            <p className="text-zinc-500 mb-1.5">Structure</p>
            {[
              { d: 0, label: "IfcProject", open: true },
              { d: 1, label: "Site", open: true },
              { d: 2, label: "Building", open: true },
              { d: 3, label: "Level 01", open: false },
              { d: 3, label: "Level 02", open: false },
            ].map((n) => (
              <div key={n.label} className="flex items-center gap-1" style={{ paddingLeft: `${n.d * 8}px` }}>
                <span className="text-zinc-600">{n.open ? "▾" : "▸"}</span>
                <span className="text-zinc-400 truncate">{n.label}</span>
              </div>
            ))}
          </div>
          <div className="flex-1 bg-zinc-950 flex items-center justify-center relative">
            <svg viewBox="0 0 80 60" className="w-24 opacity-30" fill="none">
              <rect x="10" y="10" width="60" height="40" rx="2" stroke="#6366f1" strokeWidth="1.5" />
              <line x1="10" y1="25" x2="70" y2="25" stroke="#6366f1" strokeWidth="1" />
              <rect x="20" y="28" width="15" height="12" rx="1" stroke="#818cf8" strokeWidth="1" />
              <rect x="45" y="28" width="15" height="12" rx="1" stroke="#818cf8" strokeWidth="1" />
              <rect x="30" y="14" width="20" height="8" rx="1" stroke="#a5b4fc" strokeWidth="1" />
            </svg>
            <div className="absolute bottom-2 right-2 text-zinc-600">IFC4 · 12,418 elements</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    href: "/tools/colorizer",
    name: "IFC Recolourer",
    tagline: "Discipline-standard colours. Export the modified IFC.",
    body: "Recolour every element type with Praxi discipline colours — structural (K), MEP (V, VS, E), architecture (A). Tweak individual colours. Download the modified IFC.",
    badge: "Open the recolourer →",
    preview: (
      <div className="rounded-lg border border-zinc-700 bg-zinc-900 overflow-hidden text-[11px] font-mono select-none">
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-zinc-800 bg-zinc-950">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          <span className="ml-2 text-zinc-600">ifctools.io/tools/colorizer</span>
        </div>
        <div className="p-3 space-y-1.5">
          {[
            { color: "#c0392b", label: "IfcWall", count: "218 elements", disc: "K" },
            { color: "#2980b9", label: "IfcBeam", count: "96 elements",  disc: "K" },
            { color: "#27ae60", label: "IfcPipeSegment", count: "412 elements", disc: "VS" },
            { color: "#f39c12", label: "IfcDuctSegment", count: "88 elements",  disc: "V" },
            { color: "#8e44ad", label: "IfcDoor", count: "44 elements",  disc: "A" },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-2">
              <span className="w-4 h-4 rounded shrink-0 border border-zinc-600" style={{ background: row.color }} />
              <span className="text-zinc-300 flex-1">{row.label}</span>
              <span className="text-zinc-600">{row.count}</span>
              <span className="px-1 rounded bg-zinc-800 text-zinc-500">{row.disc}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

const comingSoon = [
  { name: "Extract Data",    desc: "Property sets + quantities → Excel. Edit and push back." },
  { name: "Merge IFC",       desc: "Combine disciplines into one federated model." },
  { name: "Split IFC",       desc: "Divide by storey, building, or discipline." },
  { name: "IDS Validator",   desc: "buildingSMART IDS compliance. Export as BCF 2.1." },
  { name: "Health Check",    desc: "0–100 model-health score. Orphans, duplicates, missing data." },
  { name: "IFC Cleaner",     desc: "Smaller file, same information." },
  { name: "Property Editor", desc: "Add, rename, bulk-edit property sets." },
  { name: "IFC → glTF",      desc: "For web viewers, AR/VR and game engines." },
];

const steps = [
  { n: "01", title: "Drop in the IFC",           body: "IFC2x3, IFC4 or IFC4X3. The tree, properties and viewer are ready in seconds. Your file never leaves the browser tab." },
  { n: "02", title: "Run a tool — or chain a few", body: "Recolour, validate, extract data, convert, merge. Each tool runs on its own. Save the chain as a pipeline if you'll do it again." },
  { n: "03", title: "Hand it off",               body: "Drop a viewer link in a message. Export BCF for your coordination tool. Or just download the cleaned, recoloured, validated file." },
];

const trust = [
  { icon: "🇪🇺", title: "EU-hosted",        body: "Stockholm region. Your model stays on the continent." },
  { icon: "🗑",  title: "Auto-delete",      body: "Guest uploads vanish when the session ends. No silent retention." },
  { icon: "🔒", title: "No AI training",   body: "Never have. Never will. Your IFCs are not someone's training set." },
  { icon: "🌐", title: "Open-source core", body: "Built on ifc-lite — Rust + WASM, MPL-2.0. Read it, audit it, fork it." },
];

const faqs = [
  { q: "Is it actually free?",
    a: "Yes. Every tool runs free for files under 100 MB. No login, no credit card. Larger files (up to 500 MB) will need a small Pro plan to cover server costs." },
  { q: "Do my IFC files get uploaded to a server?",
    a: "For files under ~100 MB, everything runs entirely in your browser tab using WebAssembly. Your model never touches our servers. Larger files are processed on a server worker and auto-deleted immediately after." },
  { q: "What IFC versions are supported?",
    a: "IFC2x3, IFC4, IFC4X3 — 100% schema coverage. IFC5/IFCX support is in preview. Round-trip compatible with Revit, ArchiCAD, Tekla and every other standards-based authoring tool." },
  { q: "Why does it exist when BIMCamel does the same thing?",
    a: "BIMCamel is excellent. But it doesn't speak Swedish, doesn't know BSAB 96 or CoClass, and doesn't have Praxi discipline colours. This is built specifically for Nordic BIM coordinators who need those things baked in, not bolted on." },
  { q: "Who built this?",
    a: "One person. A working BIM coordinator based in Sweden. Support emails come back from me — the person who wrote the code. Usually within a day." },
];

/* ─── page ────────────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-dvh">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative px-6 pt-20 pb-12 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden
          style={{ background: "radial-gradient(ellipse 90% 60% at 50% -5%, rgba(99,102,241,0.16) 0%, transparent 65%)" }} />
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-zinc-400 text-sm mb-5">
            Hi — I&apos;m a BIM coordinator. I built this for the rest of us.
          </p>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-white mb-5 leading-[1.08]">
            BIM, finally<br />
            <span className="text-indigo-400">on the web.</span>
          </h1>
          <p className="text-lg text-zinc-400 leading-relaxed mb-8">
            Open IFC files, recolour them, validate, extract data and convert —
            all in your browser. No install. Free to use.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mb-3">
            <Link href="/viewer"
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-base transition-colors shadow-lg shadow-indigo-500/25">
              Open the viewer →
            </Link>
            <Link href="/tools"
              className="px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-base transition-colors border border-zinc-700">
              Explore tools
            </Link>
          </div>
          <p className="text-xs text-zinc-600">Free · No login required · IFC2x3, IFC4 &amp; IFC4X3</p>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-zinc-800/60 py-6 px-6">
        <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-white tabular-nums">{s.value}</div>
              <div className="text-xs text-zinc-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Live tools ── */}
      <section className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">Available now</p>
          <h2 className="text-2xl font-bold text-white mb-10">
            The toolkit
            <span className="ml-3 text-sm font-normal text-zinc-500">All the IFC tools I actually reach for. Free for everyone.</span>
          </h2>
          <div className="space-y-6">
            {liveTools.map((tool) => (
              <Link key={tool.href} href={tool.href} className="group block">
                <div className="rounded-2xl border border-zinc-700 hover:border-indigo-500/60 bg-zinc-900/30 hover:bg-zinc-900/60 transition-all p-6 sm:p-8">
                  <div className="grid sm:grid-cols-2 gap-6 items-center">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Live</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-1">{tool.name}</h3>
                      <p className="text-zinc-400 text-sm mb-3">{tool.tagline}</p>
                      <p className="text-zinc-500 text-sm leading-relaxed mb-5">{tool.body}</p>
                      <span className="text-sm text-indigo-400 font-medium group-hover:translate-x-0.5 transition-transform inline-block">
                        {tool.badge}
                      </span>
                    </div>
                    <div className="opacity-80 group-hover:opacity-100 transition-opacity">
                      {tool.preview}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Coming soon grid ── */}
      <section className="px-6 pb-16">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">Coming soon</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {comingSoon.map((t) => (
              <div key={t.name} className="rounded-xl border border-zinc-800/60 bg-zinc-900/20 px-4 py-3">
                <p className="text-sm font-semibold text-zinc-400 mb-0.5">{t.name}</p>
                <p className="text-xs text-zinc-600 leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center">
            <Link href="/tools" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
              Browse the full catalogue →
            </Link>
          </p>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-t border-zinc-800/60 px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-2">How it works</h2>
          <p className="text-zinc-400 mb-10">Three steps. Always the same three steps.</p>
          <div className="grid sm:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.n} className="flex gap-5">
                <span className="text-4xl font-bold text-zinc-800 tabular-nums shrink-0 leading-none mt-0.5">{s.n}</span>
                <div>
                  <h3 className="font-semibold text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who built this ── */}
      <section className="border-t border-zinc-800/60 px-6 py-16">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-5 gap-10 items-start">
          <div className="sm:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">Who built this</p>
            <h2 className="text-2xl font-bold text-white mb-4">Just me.</h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">
              Hi. I&apos;m a working BIM coordinator based in Sweden. I built ifctools.io because
              the toolkit I needed every week — viewer, IDS validator, discipline recolouring,
              data extraction — either cost €2k+ a year per seat or required someone else&apos;s
              visual-scripting graph to run. Neither worked.
            </p>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              So I started building browser tools. They grew. Now it&apos;s the thing I&apos;d hand
              my day-one self. Built specifically for Nordic BIM coordinators — BSAB, CoClass
              and Praxi colours included.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                "BIM coordinator · builder · only employee",
                "10+ yrs in AEC · Sweden-based",
                "visual-scripting refugee",
                "writes the support emails",
              ].map((line) => (
                <div key={line} className="flex items-start gap-2 text-sm text-zinc-400">
                  <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5">
                    <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {line}
                </div>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">The Nordic edge</p>
            <p className="text-sm text-zinc-300 leading-relaxed mb-4">
              Generic BIM platforms skip Nordic classification standards.
              ifctools.io is built for Swedish and Nordic teams — with BSAB 96,
              CoClass and Praxi discipline colours baked in from day one.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {["BSAB 96", "CoClass", "Praxi disciplines", "Swedish UI coming", "BBR validation"].map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── The math ── */}
      <section className="border-t border-zinc-800/60 px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-2">The math</h2>
          <p className="text-zinc-400 mb-10">The desktop BIM tax, gone.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6">
              <p className="text-sm font-medium text-zinc-500 mb-1">The old way</p>
              <p className="text-4xl font-bold text-white mb-5">€2,400 <span className="text-lg font-normal text-zinc-500">/ yr</span></p>
              <ul className="space-y-2.5">
                {[
                  "Per seat. Per machine. Per year.",
                  "Windows desktop install · 600 MB",
                  "IT ticket to provision; admin rights to upgrade",
                  "Mac, iPad, Linux teammates? Out of luck.",
                  "Pipelines? Hope someone wrote a scripting graph.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-zinc-500">
                    <span className="text-zinc-700 shrink-0 mt-px">✕</span>{item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-6">
              <p className="text-sm font-medium text-indigo-400 mb-1">The ifctools.io way</p>
              <p className="text-4xl font-bold text-white mb-5">Free</p>
              <ul className="space-y-2.5">
                {[
                  "Per coordinator. Every machine they own.",
                  "Browser. Any OS. Including iPad on site.",
                  "No install. Open the link. Working in seconds.",
                  "Files under 100 MB run entirely in your browser tab.",
                  "Nordic standards (BSAB, CoClass) built in.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-zinc-300">
                    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5">
                      <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-zinc-600 mt-4">Typical desktop BIM seat licence cost, 2026.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust ── */}
      <section className="border-t border-zinc-800/60 px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-2">Trust</h2>
          <p className="text-zinc-400 mb-10">What I promise. And what I don&apos;t.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {trust.map((t) => (
              <div key={t.title} className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 hover:border-zinc-700 transition-colors">
                <div className="text-2xl mb-3">{t.icon}</div>
                <h3 className="font-semibold text-white mb-1.5 text-sm">{t.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-t border-zinc-800/60 px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-10">FAQ</h2>
          <div className="divide-y divide-zinc-800/60">
            {faqs.map((faq) => (
              <details key={faq.q} className="group py-4">
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-sm font-medium text-zinc-200 hover:text-white transition-colors">
                  {faq.q}
                  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-zinc-500 shrink-0 transition-transform group-open:rotate-180">
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
                  </svg>
                </summary>
                <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-8 py-10 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">Open the viewer. See what it does.</h2>
            <p className="text-zinc-400 mb-6 text-sm">Free, no signup, no install. A minute from a fresh tab to a working IFC viewer.</p>
            <Link href="/viewer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors shadow-lg shadow-indigo-500/20">
              Open the viewer →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-800 px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Platform</p>
              <ul className="space-y-2 text-sm">
                <li><Link href="/viewer" className="text-zinc-400 hover:text-white transition-colors">IFC viewer</Link></li>
                <li><Link href="/tools" className="text-zinc-400 hover:text-white transition-colors">All tools</Link></li>
                <li><span className="text-zinc-700">Pricing</span></li>
                <li><span className="text-zinc-700">Changelog</span></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Popular tools</p>
              <ul className="space-y-2 text-sm">
                <li><Link href="/tools/colorizer" className="text-zinc-400 hover:text-white transition-colors">IFC Recolourer</Link></li>
                <li><span className="text-zinc-700">Merge IFC files</span></li>
                <li><span className="text-zinc-700">IDS validator</span></li>
                <li><span className="text-zinc-700">Extract data</span></li>
                <li><span className="text-zinc-700">IFC to glTF</span></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Nordic</p>
              <ul className="space-y-2 text-sm">
                <li><span className="text-zinc-700">BSAB 96</span></li>
                <li><span className="text-zinc-700">CoClass</span></li>
                <li><span className="text-zinc-700">Praxi disciplines</span></li>
                <li><span className="text-zinc-700">BBR validation</span></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Company</p>
              <ul className="space-y-2 text-sm">
                <li><span className="text-zinc-700">About</span></li>
                <li><span className="text-zinc-700">Privacy</span></li>
                <li><span className="text-zinc-700">Terms</span></li>
                <li>
                  <a href="https://github.com/ViktorLabs" target="_blank" rel="noopener noreferrer"
                    className="text-zinc-400 hover:text-white transition-colors">GitHub</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-zinc-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-sm font-semibold text-white">ifctools<span className="text-indigo-400">.io</span></span>
            <p className="text-xs text-zinc-600 text-center">
              © 2026 ifctools.io — IFC tools for BIM coordinators. &nbsp;
              IFC2x3 · IFC4 · IFC4X3 · BCF · IDS · BSAB · CoClass
            </p>
            <p className="text-xs text-zinc-700">
              Built on <a href="https://ifclite.dev" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400 transition-colors">ifc-lite</a> (Rust + WASM)
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
