"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useRef, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
type OutputFormat = "base64" | "dataurl" | "css" | "html" | "json";
type ImageItem = {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  width: number;
  height: number;
  dataUrl: string;   // full data URL
  base64: string;    // raw base64 only
};

// ── Helpers ────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2); }

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 ** 2).toFixed(2)} MB`;
}

function base64Size(b64: string) {
  // base64 string length in bytes ≈ (len * 3) / 4
  return Math.round((b64.length * 3) / 4);
}

function getOutput(item: ImageItem, format: OutputFormat): string {
  switch (format) {
    case "base64":  return item.base64;
    case "dataurl": return item.dataUrl;
    case "css":     return `background-image: url("${item.dataUrl}");`;
    case "html":    return `<img src="${item.dataUrl}" alt="${item.name}" width="${item.width}" height="${item.height}" />`;
    case "json":    return JSON.stringify({ name: item.name, mimeType: item.mimeType, width: item.width, height: item.height, base64: item.base64 }, null, 2);
  }
}

const FORMAT_OPTIONS: { key: OutputFormat; label: string; note: string }[] = [
  { key: "dataurl", label: "Data URL",   note: "data:image/…;base64,…" },
  { key: "base64",  label: "Base64",     note: "Raw base64 string" },
  { key: "html",    label: "HTML <img>", note: "Ready-to-use img tag" },
  { key: "css",     label: "CSS",        note: "background-image property" },
  { key: "json",    label: "JSON",       note: "With metadata" },
];

// ── Component ──────────────────────────────────────────────────────────────
export default function ImageToBase64() {
  const [items, setItems]     = useState<ImageItem[]>([]);
  const [format, setFormat]   = useState<OutputFormat>("dataurl");
  const [dragging, setDragging] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [copied, setCopied]   = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const active = items.find(i => i.id === activeId) ?? items[0] ?? null;

  // Read file → ImageItem
  const readFile = useCallback((file: File): Promise<ImageItem> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) return reject(new Error("Not an image"));
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const base64  = dataUrl.split(",")[1] ?? "";
        const img     = new window.Image();
        img.onload    = () => resolve({
          id: uid(), name: file.name, size: file.size,
          mimeType: file.type, width: img.naturalWidth, height: img.naturalHeight,
          dataUrl, base64,
        });
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = dataUrl;
      };
      reader.onerror = () => reject(new Error("FileReader failed"));
      reader.readAsDataURL(file);
    });
  }, []);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const imgs = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!imgs.length) return;
    const results = await Promise.all(imgs.map(readFile));
    setItems(prev => {
      const next = [...results, ...prev];
      if (!activeId) setActiveId(next[0].id);
      return next;
    });
    setActiveId(results[0].id);
  }, [readFile, activeId]);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleCopy = (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    navigator.clipboard.writeText(getOutput(item, format));
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  };

  const handleCopyAll = () => {
    if (!active) return;
    navigator.clipboard.writeText(getOutput(active, format));
    setCopied("all");
    setTimeout(() => setCopied(null), 1800);
  };

  const handleDownload = (item: ImageItem) => {
    const text = getOutput(item, format);
    const ext  = format === "json" ? "json" : format === "html" ? "html" : "txt";
    const blob = new Blob([text], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `${item.name}_base64.${ext}`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleRemove = (id: string) => {
    setItems(prev => {
      const next = prev.filter(i => i.id !== id);
      if (activeId === id) setActiveId(next[0]?.id ?? null);
      return next;
    });
  };

  const handleClear = () => { setItems([]); setActiveId(null); };

  const outputText = active ? getOutput(active, format) : "";
  const outputSize = active ? base64Size(active.base64) : 0;
  const overhead   = active ? (((outputSize - active.size) / active.size) * 100).toFixed(1) : "0";

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      {/* BG */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-orange-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

      <ToolNavbar toolName="Image → Base64" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-orange-500/10 flex items-center justify-center font-mono font-bold text-orange-400 text-sm">64</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Image → Base64</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded">client-side</span>
          </div>
          <p className="text-slate-500 text-sm">Convert images to Base64, Data URL, HTML, CSS, or JSON — instantly in the browser. Batch supported.</p>
        </div>

        {/* Format selector */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-1.5 flex-wrap">
            <span className="font-mono text-[11px] text-slate-500 uppercase tracking-wide">Output</span>
            {FORMAT_OPTIONS.map(f => (
              <button key={f.key} onClick={() => setFormat(f.key)}
                title={f.note}
                className={`font-mono text-xs px-2.5 py-0.5 rounded transition-all ${format === f.key ? "bg-orange-500/20 text-orange-400" : "text-slate-500 hover:text-slate-300"}`}>
                {f.label}
              </button>
            ))}
          </div>
          {items.length > 0 && (
            <div className="ml-auto flex gap-2">
              <button onClick={handleClear} className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-red-400 hover:border-red-500/30 transition-all">
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative mb-5 flex flex-col items-center justify-center gap-3 h-36 rounded-xl border-2 border-dashed cursor-pointer transition-all
            ${dragging ? "border-orange-500/60 bg-orange-500/[0.06]" : "border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"}`}
        >
          <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleFiles} className="hidden" />
          <span className="text-3xl">{dragging ? "📂" : "🖼"}</span>
          <div className="text-center">
            <p className="text-slate-400 text-sm font-medium">Drop images here or <span className="text-orange-400">click to browse</span></p>
            <p className="text-slate-600 text-xs mt-1">JPEG, PNG, WebP, GIF, SVG, AVIF — batch supported</p>
          </div>
        </div>

        {items.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">

            {/* ── Left: image list ── */}
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-1">{items.length} Image{items.length > 1 ? "s" : ""}</span>
              <div className="space-y-2">
                {items.map(item => (
                  <div
                    key={item.id}
                    onClick={() => setActiveId(item.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all group
                      ${activeId === item.id || (!activeId && item === items[0])
                        ? "bg-orange-500/10 border-orange-500/30"
                        : "bg-white/[0.02] border-white/[0.06] hover:border-white/20"}`}
                  >
                    {/* Thumb */}
                    <div className="w-12 h-12 rounded-md overflow-hidden shrink-0 bg-white/[0.04] border border-white/[0.06]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.dataUrl} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-slate-300 truncate">{item.name}</p>
                      <p className="font-mono text-[10px] text-slate-600 mt-0.5">{item.width}×{item.height} · {formatBytes(item.size)}</p>
                      <p className="font-mono text-[10px] text-slate-700">{item.mimeType}</p>
                    </div>
                    {/* Remove */}
                    <button
                      onClick={e => { e.stopPropagation(); handleRemove(item.id); }}
                      className="font-mono text-slate-600 hover:text-red-400 text-sm opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    >✕</button>
                  </div>
                ))}
              </div>

              {/* Add more */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="font-mono text-xs px-3 py-2 border border-dashed border-white/[0.08] text-slate-600 rounded-lg hover:text-slate-400 hover:border-white/20 transition-all mt-1"
              >
                + Add more images
              </button>
            </div>

            {/* ── Right: output ── */}
            {active && (
              <div className="flex flex-col gap-3 min-w-0">

                {/* Preview + meta */}
                <div className="flex gap-4 p-4 bg-white/[0.02] border border-white/[0.08] rounded-xl">
                  <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 border border-white/[0.08]"
                    style={{ background: "url(\"data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='8' height='8' fill='%23ffffff08'/%3E%3Crect x='8' y='8' width='8' height='8' fill='%23ffffff08'/%3E%3C/svg%3E\")" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={active.dataUrl} alt={active.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 content-center">
                    {[
                      { label: "File name",   val: active.name },
                      { label: "MIME type",   val: active.mimeType },
                      { label: "Dimensions",  val: `${active.width} × ${active.height} px` },
                      { label: "Original",    val: formatBytes(active.size) },
                      { label: "Base64 size", val: formatBytes(outputSize) },
                      { label: "Overhead",    val: `+${overhead}%`, color: "text-yellow-400" },
                    ].map(m => (
                      <div key={m.label}>
                        <p className="font-mono text-[10px] text-slate-600 uppercase tracking-widest">{m.label}</p>
                        <p className={`font-mono text-xs mt-0.5 truncate ${m.color ?? "text-slate-300"}`}>{m.val}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Output label + actions */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">
                      {FORMAT_OPTIONS.find(f => f.key === format)?.label} Output
                    </span>
                    <span className="ml-2 font-mono text-[10px] text-slate-700">
                      {outputText.length.toLocaleString()} chars
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(active)}
                      className="font-mono text-[11px] px-3 py-1 rounded border border-white/[0.08] text-slate-500 hover:text-slate-300 hover:border-white/20 transition-all"
                    >↓ Save</button>
                    <button
                      onClick={handleCopyAll}
                      className={`font-mono text-[11px] px-3 py-1 rounded border transition-all
                        ${copied === "all" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300 hover:border-white/20"}`}
                    >
                      {copied === "all" ? "✓ Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                {/* Output textarea */}
                <div className="relative">
                  <textarea
                    readOnly
                    value={outputText}
                    spellCheck={false}
                    className="w-full h-64 font-mono text-xs bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-slate-400 outline-none resize-none leading-relaxed focus:border-orange-500/30 transition-colors"
                  />
                  {/* char count overlay */}
                  <div className="absolute bottom-3 right-3 font-mono text-[10px] text-slate-700 pointer-events-none">
                    {formatBytes(outputSize)}
                  </div>
                </div>

                {/* Stats bar */}
                <div className="flex flex-wrap gap-6 px-4 py-3 bg-orange-500/[0.05] border border-orange-500/20 rounded-lg">
                  <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Format</span><span className="font-mono text-sm text-orange-400">{FORMAT_OPTIONS.find(f => f.key === format)?.label}</span></div>
                  <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Original</span><span className="font-mono text-sm text-slate-400">{formatBytes(active.size)}</span></div>
                  <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Encoded</span><span className="font-mono text-sm text-orange-400">{formatBytes(outputSize)}</span></div>
                  <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Overhead</span><span className="font-mono text-sm text-yellow-400">+{overhead}%</span></div>
                  <div className="ml-auto flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                    <span className="font-mono text-[10px] text-orange-500/60">Ready</span>
                  </div>
                </div>

                {/* Batch: if multiple images, show all copy buttons */}
                {items.length > 1 && (
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                    <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-3">All Images — Quick Copy</p>
                    <div className="space-y-2">
                      {items.map(item => (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded overflow-hidden shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.dataUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                          <span className="font-mono text-xs text-slate-500 flex-1 truncate">{item.name}</span>
                          <span className="font-mono text-[10px] text-slate-700">{formatBytes(base64Size(item.base64))}</span>
                          <button
                            onClick={() => handleCopy(item.id)}
                            className={`font-mono text-[11px] px-3 py-0.5 rounded border transition-all shrink-0
                              ${copied === item.id ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}
                          >
                            {copied === item.id ? "✓" : "Copy"}
                          </button>
                          <button
                            onClick={() => handleDownload(item)}
                            className="font-mono text-[11px] px-3 py-0.5 rounded border border-white/[0.08] text-slate-500 hover:text-slate-300 transition-all shrink-0"
                          >↓</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Info cards */}
        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${items.length > 0 ? "mt-5" : ""}`}>
          {[
            { icon: "🔄", title: "5 Output Formats", desc: "Raw Base64, Data URL, HTML <img> tag, CSS background-image, or JSON with full metadata." },
            { icon: "📦", title: "Batch Support",     desc: "Upload multiple images at once. Switch between them in the sidebar, copy each individually." },
            { icon: "🔒", title: "100% Client-Side",  desc: "FileReader API converts everything locally. No uploads, no servers, no tracking." },
          ].map(c => (
            <div key={c.title} className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-5 py-4">
              <div className="text-xl mb-2">{c.icon}</div>
              <div className="font-semibold text-slate-300 text-sm mb-1">{c.title}</div>
              <div className="text-slate-600 text-xs leading-relaxed">{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}