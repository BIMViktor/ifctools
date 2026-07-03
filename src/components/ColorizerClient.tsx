"use client";

import {
  useState,
  useCallback,
  type DragEvent,
  type ChangeEvent,
  type MouseEvent,
} from "react";
import Link from "next/link";
import { patchIfcColours } from "@/lib/exportColorizedIfc";
import {
  buildTypeListFromDataStore,
  type IfcTypeRow,
} from "@/lib/ifcTypes";
import {
  PRAXI_DISCIPLINES,
  guessDisciplineFromFileName,
  isPraxiColoringEnabled,
  type PraxiDisciplineCode,
} from "@/lib/praxiColors";

type Status = "idle" | "loading" | "ready" | "exporting" | "error";

interface LoadedIfcFile {
  id: string;
  fileName: string;
  /** Gissad från filnamn vid uppladdning */
  disciplineFromFileName: PraxiDisciplineCode;
  discipline: PraxiDisciplineCode;
  dataStore: import("@ifc-lite/parser").IfcDataStore;
  typeRows: IfcTypeRow[];
  typeColors: Map<string, string>;
}

function newId() {
  return crypto.randomUUID();
}

export default function ColorizerClient() {
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<LoadedIfcFile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeFile = files.find((f) => f.id === activeId) ?? files[0] ?? null;

  const addFiles = useCallback(async (incoming: File[]) => {
    const ifcFiles = incoming.filter((f) =>
      f.name.toLowerCase().endsWith(".ifc")
    );
    if (ifcFiles.length === 0) return;

    setStatus("loading");
    setErrorMsg("");
    setProgress(0);

    try {
      const { IfcParser } = await import("@ifc-lite/parser");
      const parser = new IfcParser();
      const loaded: LoadedIfcFile[] = [];

      for (let i = 0; i < ifcFiles.length; i++) {
        const file = ifcFiles[i];
        setProgressLabel(
                  `Reading ${file.name} (${i + 1}/${ifcFiles.length})…`
        );
        setProgress(Math.round(((i + 0.5) / ifcFiles.length) * 100));

        const buffer = await file.arrayBuffer();
        const dataStore = await parser.parseColumnar(buffer);
        const disciplineFromFileName = guessDisciplineFromFileName(file.name);
        const { rows, colors } = buildTypeListFromDataStore(
          dataStore,
          disciplineFromFileName
        );

        if (rows.length === 0) continue;

        loaded.push({
          id: newId(),
          fileName: file.name,
          disciplineFromFileName,
          discipline: disciplineFromFileName,
          dataStore,
          typeRows: rows,
          typeColors: colors,
        });
      }

      if (loaded.length === 0) {
        throw new Error("No recolourable elements found in this file.");
      }

      setFiles((prev) => [...prev, ...loaded]);
      setActiveId((prev) => prev ?? loaded[0]?.id ?? null);
      setStatus("ready");
      setProgress(100);
      setProgressLabel("Klar");
    } catch (err) {
      console.error(err);
        setErrorMsg(
          err instanceof Error ? err.message : "Something went wrong while loading"
        );
      setStatus(files.length > 0 ? "ready" : "error");
    }
  }, []);

  const setDiscipline = useCallback(
    (id: string, discipline: PraxiDisciplineCode) => {
      setFiles((prev) =>
        prev.map((f) => {
          if (f.id !== id) return f;
          const { rows, colors } = buildTypeListFromDataStore(
            f.dataStore,
            discipline
          );
          return { ...f, discipline, typeRows: rows, typeColors: colors };
        })
      );
    },
    []
  );

  const handleColorChange = useCallback(
    (fileId: string, type: string, hex: string) => {
      setFiles((prev) =>
        prev.map((f) => {
          if (f.id !== fileId || !isPraxiColoringEnabled(f.discipline)) return f;
          const nextColors = new Map(f.typeColors);
          nextColors.set(type, hex);
          const nextRows = f.typeRows.map((r) =>
            r.type === type ? { ...r, color: hex } : r
          );
          return { ...f, typeColors: nextColors, typeRows: nextRows };
        })
      );
    },
    []
  );

  const resetPraxiForActive = useCallback(() => {
    if (!activeFile) return;
    setDiscipline(activeFile.id, activeFile.discipline);
  }, [activeFile, setDiscipline]);

  const resetDisciplineFromFileName = useCallback(
    (id: string) => {
      setFiles((prev) => {
        const file = prev.find((f) => f.id === id);
        if (!file) return prev;
        const { rows, colors } = buildTypeListFromDataStore(
          file.dataStore,
          file.disciplineFromFileName
        );
        return prev.map((f) =>
          f.id === id
            ? {
                ...f,
                discipline: file.disciplineFromFileName,
                typeRows: rows,
                typeColors: colors,
              }
            : f
        );
      });
    },
    []
  );

  const removeFile = useCallback(
    (id: string) => {
      setFiles((prev) => {
        const next = prev.filter((f) => f.id !== id);
        if (activeId === id) {
          setActiveId(next[0]?.id ?? null);
        }
        if (next.length === 0) setStatus("idle");
        return next;
      });
    },
    [activeId]
  );

  const exportOne = async (file: LoadedIfcFile) => {
    const base = file.fileName.replace(/\.ifc$/i, "");
    let blob: Blob;
    let suffix: string;

    if (!isPraxiColoringEnabled(file.discipline)) {
      blob = new Blob([new Uint8Array(file.dataStore.source)], {
        type: "application/octet-stream",
      });
      suffix = "_original.ifc";
    } else {
      const { StepExporter } = await import("@ifc-lite/export");
      const patchedSource = patchIfcColours(file.dataStore, file.typeColors);
      const exporter = new StepExporter({
        ...file.dataStore,
        source: patchedSource,
      });
      const result = await exporter.exportAsync({
        schema: file.dataStore.schemaVersion ?? "IFC4",
        application: "ifctools.io",
        description: `Praxi ${file.discipline} – ifctools.io`,
      });
      blob = new Blob([new Uint8Array(result.content)], {
        type: "application/octet-stream",
      });
      suffix = `_${file.discipline}_colorized.ifc`;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = base + suffix;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAll = useCallback(async () => {
    if (files.length === 0) return;
    setStatus("exporting");
    try {
      for (let i = 0; i < files.length; i++) {
        setProgressLabel(
          `Exporting ${files[i].fileName} (${i + 1}/${files.length})…`
        );
        setProgress(Math.round(((i + 1) / files.length) * 100));
        await exportOne(files[i]);
      }
      setStatus("ready");
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Export failed");
      setStatus("error");
    }
  }, [files]);

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(Array.from(e.dataTransfer.files));
    },
    [addFiles]
  );

  const onFileInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) addFiles(Array.from(e.target.files));
      e.target.value = "";
    },
    [addFiles]
  );

  const isBusy = status === "loading" || status === "exporting";

  return (
    <div className="flex flex-col h-dvh min-h-0">
      <header className="border-b border-zinc-800 px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="text-zinc-400 hover:text-white transition-colors text-sm shrink-0"
          >
            ← ifctools<span className="text-indigo-400">.io</span>
          </Link>
          <span className="text-zinc-700">|</span>
          <span className="text-sm font-medium text-white truncate">
            IFC Recolourer
          </span>
        </div>
        {status === "ready" && files.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            {activeFile && isPraxiColoringEnabled(activeFile.discipline) ? (
              <button
                type="button"
                onClick={resetPraxiForActive}
                className="px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:bg-zinc-800"
              >
                Reset colours
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleExportAll}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium"
            >
              Download all ({files.length})
            </button>
          </div>
        )}
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Fillista */}
        <aside className="w-80 shrink-0 border-r border-zinc-800 flex flex-col">
          <p className="px-3 py-2 text-xs text-zinc-500 border-b border-zinc-800 leading-relaxed">
            File name prefix (A-40, E-60, V-57, VS-50…) suggests discipline. Select a different discipline from the list to override.
          </p>

          {(status === "idle" || status === "error") && (
            <div className="p-3">
              <label
                className={`flex flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center cursor-pointer text-sm transition-colors ${
                  isDragging
                    ? "border-indigo-500 bg-indigo-500/5"
                    : "border-zinc-700 hover:border-zinc-500"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
              >
                <span className="text-zinc-300">Add IFC files</span>
                <span className="text-xs text-zinc-500">Multiple files supported</span>
                <input
                  type="file"
                  accept=".ifc"
                  multiple
                  className="sr-only"
                  onChange={onFileInput}
                />
              </label>
              {status === "error" && (
                <p className="mt-2 text-xs text-red-400">{errorMsg}</p>
              )}
            </div>
          )}

          {isBusy && (
            <div className="p-4 text-xs text-zinc-400">
              <p>{progressLabel}</p>
              <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <ul className="flex-1 overflow-y-auto p-2 space-y-1">
            {files.map((f) => (
              <li
                key={f.id}
                className={`rounded-lg border p-2 ${
                  f.id === activeFile?.id
                    ? "border-indigo-500/50 bg-indigo-500/5"
                    : "border-zinc-800 hover:bg-zinc-900/50"
                }`}
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setActiveId(f.id)}
                >
                  <p className="text-sm text-zinc-200 truncate">{f.fileName}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {f.typeRows.reduce((s, r) => s + r.count, 0).toLocaleString("en")}{" "}
                    elements
                  </p>
                </button>
                <div className="mt-2 flex gap-1">
                  <DisciplineSelect
                    value={f.discipline}
                    onChange={(code) => setDiscipline(f.id, code)}
                    className="flex-1"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    type="button"
                    title="Remove"
                    onClick={() => removeFile(f.id)}
                    className="px-2 text-zinc-500 hover:text-red-400 text-xs"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {status === "ready" && (
            <div className="p-2 border-t border-zinc-800">
              <label className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 py-2 text-xs text-zinc-500 cursor-pointer hover:border-zinc-500 transition-colors">
                + Add more files
                <input
                  type="file"
                  accept=".ifc"
                  multiple
                  className="sr-only"
                  onChange={onFileInput}
                />
              </label>
            </div>
          )}
        </aside>

        {/* Byggdelar för aktiv fil */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {activeFile ? (
            <>
              <div className="px-4 py-2 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-zinc-200">{activeFile.fileName}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-zinc-500 shrink-0">
                    Discipline
                  </span>
                    <DisciplineSelect
                      value={activeFile.discipline}
                      onChange={(code) =>
                        setDiscipline(activeFile.id, code)
                      }
                    />
                    {activeFile.discipline !==
                      activeFile.disciplineFromFileName && (
                      <button
                        type="button"
                        onClick={() =>
                          resetDisciplineFromFileName(activeFile.id)
                        }
                        className="text-xs text-zinc-500 hover:text-zinc-300"
                      >
                        Reset to {activeFile.disciplineFromFileName} (from filename)
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    {isPraxiColoringEnabled(activeFile.discipline)
                      ? "Colours follow Praxi building element / system standard"
                      : "No recolouring — select a discipline above to apply Praxi colours"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => exportOne(activeFile)}
                  className="text-sm text-indigo-400 hover:text-indigo-300 shrink-0"
                >
                  {isPraxiColoringEnabled(activeFile.discipline)
                    ? "Download recoloured"
                    : "Download original"}
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-2">
                <div className="space-y-0.5">
                  {activeFile.typeRows.map((t) => (
                    <TypeRow
                      key={t.type}
                      row={t}
                      color={
                        activeFile.typeColors.get(t.type) ?? t.color
                      }
                      coloringEnabled={isPraxiColoringEnabled(
                        activeFile.discipline
                      )}
                      onChange={(hex) =>
                        handleColorChange(activeFile.id, t.type, hex)
                      }
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-zinc-500">
              Add one or more IFC files to get started
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function DisciplineSelect({
  value,
  onChange,
  className = "",
  onClick,
}: {
  value: PraxiDisciplineCode;
  onChange: (code: PraxiDisciplineCode) => void;
  className?: string;
  onClick?: (e: MouseEvent) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as PraxiDisciplineCode)}
      onClick={onClick}
      className={`text-xs bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-zinc-300 min-w-[10rem] ${className}`}
    >
      {PRAXI_DISCIPLINES.map((d) => (
        <option key={d.code} value={d.code}>
          {d.label}
        </option>
      ))}
    </select>
  );
}

function TypeRow({
  row,
  color,
  coloringEnabled,
  onChange,
}: {
  row: IfcTypeRow;
  color: string | null;
  coloringEnabled: boolean;
  onChange: (hex: string) => void;
}) {
  const meta: string[] = [];
  if (row.byggdel) meta.push(row.byggdel);
  if (row.systemNames.length > 0) {
    meta.push(`System: ${row.systemNames.join(", ")}`);
  }
  meta.push(`${row.count.toLocaleString("en")} elements`);

  return (
    <div className="flex items-start gap-2.5 px-2 py-2 rounded-lg hover:bg-zinc-800/50">
      {coloringEnabled ? (
        <input
          type="color"
          value={color ?? "#b0b0b0"}
          onInput={(e) => onChange(e.currentTarget.value)}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 shrink-0 rounded-md border border-zinc-600 cursor-pointer p-0.5 bg-zinc-900 mt-0.5"
          title="Change colour"
        />
      ) : (
        <span
          className="w-7 h-7 shrink-0 rounded-md border border-dashed border-zinc-600 mt-0.5"
          title="No recolouring"
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-200">{row.label}</p>
        <p className="text-xs text-zinc-600 font-mono">{row.ifcSchemaName}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{meta.join(" · ")}</p>
        {row.benamningar.length > 0 ? (
          <p className="text-xs text-zinc-500 mt-0.5 truncate" title={row.benamningar.join(", ")}>
            Name: {row.benamningar.join(" · ")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
