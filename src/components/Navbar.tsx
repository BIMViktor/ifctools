"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-1 shrink-0">
          <span className="text-base font-bold tracking-tight text-gray-900">
            ifc<span className="text-teal-600">tools</span>
            <span className="text-gray-400 font-normal">.io</span>
          </span>
        </Link>

        <nav className="hidden sm:flex items-center gap-1">
          <Link
            href="/tools"
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              pathname.startsWith("/tools")
                ? "text-teal-700 bg-teal-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            Tools
          </Link>
          <Link
            href="/viewer"
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              pathname.startsWith("/viewer")
                ? "text-teal-700 bg-teal-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            Viewer
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/viewer"
            className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors"
          >
            Open viewer
          </Link>
        </div>
      </div>
    </header>
  );
}
