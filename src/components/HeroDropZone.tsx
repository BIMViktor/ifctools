"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileCode,
  Lock,
  Eye,
  FileSpreadsheet,
  Minimize2,
  ShieldCheck,
  X,
} from "lucide-react";
import { stashPendingIfc } from "@/lib/pendingIfc";

const ACTIONS = [
  {
    label: "View 3D Model",
    href: "/viewer",
    icon: Eye,
    hint: "Tree, properties and WebGPU",
  },
  {
    label: "Extract Properties",
    href: "/tools/extractor",
    icon: FileSpreadsheet,
    hint: "IFC → CSV",
  },
  {
    label: "Reduce File Size",
    href: "/tools/reduce",
    icon: Minimize2,
    hint: "IFC → smaller IFC",
  },
  {
    label: "Validate IDS",
    href: "/tools/ids-validator",
    icon: ShieldCheck,
    hint: "Needs an IDS file next",
  },
] as const;

function isIfc(file: File) {
  return file.name.toLowerCase().endsWith(".ifc");
}

export default function HeroDropZone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [opening, setOpening] = useState<string | null>(null);

  function acceptFile(incoming: File | undefined) {
    if (!incoming) return;
    if (!isIfc(incoming)) {
      setError("Drop an .ifc file — IFC2x3, IFC4 or IFC4.3.");
      setFile(null);
      return;
    }
    setError("");
    setFile(incoming);
  }

  async function openWith(href: string) {
    if (!file || opening) return;
    setOpening(href);
    try {
      await stashPendingIfc(file);
      router.push(href);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open the file");
      setOpening(null);
    }
  }

  return (
    <section
      className={`border-b border-gray-100 transition-colors ${
        dragging ? "bg-teal-50/70" : "bg-white"
      }`}
      onDragEnter={(e) => {
        e.preventDefault();
        dragDepth.current += 1;
        setDragging(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        dragDepth.current = 0;
        setDragging(false);
        acceptFile(Array.from(e.dataTransfer.files).find(isIfc) ?? e.dataTransfer.files[0]);
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-14 sm:py-16 text-center">
        <h1 className="text-4xl sm:text-[2.75rem] font-bold tracking-tight text-gray-900 leading-[1.15]">
          Every IFC tool you need —{" "}
          <span className="text-teal-600">free in your browser.</span>
        </h1>
        <p className="mt-4 text-lg text-gray-500 max-w-lg mx-auto leading-relaxed">
          Clean, validate, edit and organize IFC files instantly. No installs, 100% private.
        </p>

        <div className="mt-8 mx-auto max-w-2xl text-left">
      <div className="flex justify-center mb-3">
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-800">
            <Lock className="w-3.5 h-3.5 text-teal-600" />
            100% Client-Side WASM · Zero Server Upload
            <button
              type="button"
              onClick={() => setVerifyOpen((open) => !open)}
              className="ml-1 underline underline-offset-2 text-teal-700 hover:text-teal-900"
              aria-expanded={verifyOpen}
            >
              Verify
            </button>
          </div>
          {verifyOpen && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 rounded-xl border border-gray-200 bg-white p-3 shadow-lg text-xs text-gray-600 z-20">
              <p className="font-semibold text-gray-900 mb-2">Proof of trust</p>
              <ol className="space-y-1.5 list-decimal pl-4 leading-relaxed">
                <li>Disconnect your Wi-Fi — the tool runs 100% offline.</li>
                <li>Check Chrome DevTools Network tab — zero bytes are uploaded.</li>
              </ol>
            </div>
          )}
        </div>
      </div>

      {!file ? (
        <div
          className={`rounded-3xl border-2 border-dashed px-6 py-12 sm:py-14 text-center transition-colors ${
            dragging
              ? "border-teal-500 bg-teal-50"
              : "border-gray-300 bg-white hover:border-teal-300 hover:bg-teal-50/40"
          }`}
        >
          <div
            className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
              dragging ? "bg-teal-100 text-teal-700" : "bg-teal-50 text-teal-600"
            }`}
          >
            {dragging ? <FileCode className="w-7 h-7" /> : <Upload className="w-7 h-7" />}
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">
            {dragging ? "Release to open" : "Drop your IFC file here"}
          </p>
          <p className="mt-2 text-sm text-gray-500">or browse files</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors"
          >
            <Upload className="w-4 h-4" />
            Choose File
          </button>
          <p className="mt-4 text-xs text-gray-400">Supports IFC2x3, IFC4, IFC4.3</p>
          <input
            ref={inputRef}
            type="file"
            accept=".ifc,application/octet-stream"
            className="sr-only"
            onChange={(e) => {
              acceptFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
      ) : (
        <div className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                File ready
              </p>
              <p className="text-sm font-semibold text-gray-900 truncate mt-1">{file.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {Math.max(1, Math.round(file.size / 1024)).toLocaleString()} KB · stays in this browser
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setOpening(null);
              }}
              className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center shrink-0"
              aria-label="Choose a different file"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-3">What do you want to do?</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {ACTIONS.map((action) => {
              const Icon = action.icon;
              const busy = opening === action.href;
              return (
                <button
                  key={action.href}
                  type="button"
                  disabled={opening !== null}
                  onClick={() => openWith(action.href)}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-3 text-left hover:border-teal-300 hover:bg-teal-50/50 disabled:opacity-60 transition-colors"
                >
                  <span className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-gray-900">
                      {busy ? "Opening…" : action.label}
                    </span>
                    <span className="block text-xs text-gray-500">{action.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}

      <p className="mt-4 text-center text-sm text-gray-500">
        No file at hand?{" "}
        <Link href="/viewer?sample=1" className="font-semibold text-teal-700 hover:text-teal-800">
          Open sample building
        </Link>
      </p>
        </div>
      </div>
    </section>
  );
}
