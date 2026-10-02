"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const toolCategories = [
  { label: "Live tools", href: "/tools#live" },
  { label: "Coming soon", href: "/tools#soon" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [toolsOpen, setToolsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
        <Link href="/" className="shrink-0 flex items-baseline gap-0.5">
          <span className="text-[17px] font-bold tracking-tight text-gray-900">ifc</span>
          <span className="text-[17px] font-bold tracking-tight text-teal-600">2go</span>
          <span className="text-[11px] text-gray-400 font-normal ml-0.5">.com</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-1">
          <div className="relative" onMouseLeave={() => setToolsOpen(false)}>
            <button
              onMouseEnter={() => setToolsOpen(true)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname.startsWith("/tools")
                  ? "text-teal-700 bg-teal-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              Tools
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>

            {toolsOpen && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-50">
                <Link
                  href="/tools"
                  className="block px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
                  onClick={() => setToolsOpen(false)}
                >
                  All tools
                </Link>
                <div className="my-1 h-px bg-gray-100" />
                {toolCategories.map((cat) => (
                  <Link
                    key={cat.href}
                    href={cat.href}
                    className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    onClick={() => setToolsOpen(false)}
                  >
                    {cat.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/#pricing"
            className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            Pricing
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            title="Pro licensing & billing only — no files are ever stored"
            aria-label="Pro licensing & billing only — no files are ever stored"
            className="hidden sm:block px-3.5 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            Log in
          </button>
          <Link
            href="/viewer"
            className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors"
          >
            Open IFC File
          </Link>
        </div>
      </div>
    </header>
  );
}
