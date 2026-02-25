"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useRef, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
type OutputFormat = "image/webp" | "image/jpeg" | "image/png";

type ImageResult = {
  id: string;
  name: string;
  originalFile: File;
  originalSize: number;
  originalUrl: string;
  originalWidth: number;
  originalHeight: number;
  compressedBlob: Blob | null;
  compressedUrl: string;
  compressedSize: number;
  compressedWidth: number;
  compressedHeight: number;
  status: "idle" | "processing" | "done" | "error";
  error?: string;
};

type Settings = {
  format: OutputFormat;
  quality: number;
  maxWidth: number;
  maxHeight: number;
  maintainAspect: boolean;
  upscale: boolean;
};

const DEFAULT_SETTINGS: Settings = {
  format: "image/webp",
  quality: 82,
  maxWidth: 3840,
  maxHeight: 2160,
  maintainAspect: true,
  upscale: false,
};

// ── Helpers ────────────────────────────────────────────────────────────────
function formatBytes(b: number) {
  if (b === 0) return "0 B";
  if (b < 1024) return `${b} B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 ** 2).toFixed(2)} MB`;
}

function savingsPct(orig: number, comp: number) {
  if (orig === 0) return 0;
  return ((1 - comp / orig) * 100);
}

function uid() {
  return Math.random().toString(36).slice(2);
}

// ── Core compression ───────────────────────────────────────────────────────
async function compress(
  file: File,
  settings: Settings
): Promise<{ blob: Blob; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const src = URL.createObjectURL(file);
    const img  = new window.Image();

    img.onload = () => {
      URL.revokeObjectURL(src);
      let { naturalWidth: w, naturalHeight: h } = img;
      let targetW = w;
      let targetH = h;

      if (settings.maintainAspect) {
        const needsDownscale = w > settings.maxWidth || h > settings.maxHeight;
        if (needsDownscale) {
          const ratio = Math.min(settings.maxWidth / w, settings.maxHeight / h);
          targetW = Math.round(w * ratio);
          targetH = Math.round(h * ratio);
        } else if (settings.upscale) {
          const ratio = Math.min(settings.maxWidth / w, settings.maxHeight / h);
          targetW = Math.round(w * ratio);
          targetH = Math.round(h * ratio);
        }
      } else {
        targetW = settings.upscale ? settings.maxWidth  : Math.min(w, settings.maxWidth);
        targetH = settings.upscale ? settings.maxHeight : Math.min(h, settings.maxHeight);
      }

      const canvas = document.createElement("canvas");
      canvas.width  = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, targetW, targetH);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Canvas toBlob failed"));
          resolve({ blob, width: targetW, height: targetH });
        },
        settings.format,
        settings.quality / 100
      );
    };

    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

// ── Main component ─────────────────────────────────────────────────────────
export default function ImageCompressor() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [items, setItems]       = useState<ImageResult[]>([]);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview]   = useState<ImageResult | null>(null);
  const [previewSide, setPreviewSide] = useState<"original" | "compressed">("compressed");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const patchItem = useCallback((id: string, patch: Partial<ImageResult>) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));
  }, []);

  const runCompress = useCallback(async (item: ImageResult, s: Settings) => {
    patchItem(item.id, { status: "processing" });
    try {
      const { blob, width, height } = await compress(item.originalFile, s);
      const url = URL.createObjectURL(blob);
      patchItem(item.id, {
        status: "done",
        compressedBlob:   blob,
        compressedUrl:    url,
        compressedSize:   blob.size,
        compressedWidth:  width,
        compressedHeight: height,
      });
    } catch (e: unknown) {
      patchItem(item.id, { status: "error", error: (e as Error).message });
    }
  }, [patchItem]);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const imgs = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!imgs.length) return;

    const newItems: ImageResult[] = await Promise.all(
      imgs.map(async (f) => {
        const url = URL.createObjectURL(f);
        const dims = await new Promise<{ w: number; h: number }>(res => {
          const img = new window.Image();
          img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
          img.onerror = () => res({ w: 0, h: 0 });
          img.src = url;
        });
        return {
          id: uid(), name: f.name, originalFile: f,
          originalSize: f.size, originalUrl: url,
          originalWidth: dims.w, originalHeight: dims.h,
          compressedBlob: null, compressedUrl: "",
          compressedSize: 0, compressedWidth: 0, compressedHeight: 0,
          status: "idle" as const,
        };
      })
    );

    setItems(prev => [...newItems, ...prev]);
    newItems.forEach(it => runCompress(it, settings));
  }, [settings, runCompress]);

  const recompressAll = useCallback((s: Settings) => {
    setItems(prev => {
      prev.forEach(it => runCompress(it, s));
      return prev.map(it => ({ ...it, status: "processing" as const }));
    });
  }, [runCompress]);

  const handleSettingChange = <K extends keyof Settings>(key: K, val: Settings[K]) => {
    const next = { ...settings, [key]: val };
    setSettings(next);
    if (items.length > 0) recompressAll(next);
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleDownload = (item: ImageResult) => {
    if (!item.compressedUrl) return;
    const ext = settings.format.split("/")[1];
    const a = document.createElement("a");
    a.href = item.compressedUrl;
    a.download = item.name.replace(/\.[^.]+$/, "") + `_compressed.${ext}`;
    a.click();
  };

  const handleDownloadAll = () => items.filter(i => i.status === "done").forEach(handleDownload);

  const handleRemove = (id: string) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item) { URL.revokeObjectURL(item.originalUrl); if (item.compressedUrl) URL.revokeObjectURL(item.compressedUrl); }
      return prev.filter(i => i.id !== id);
    });
    if (preview?.id === id) setPreview(null);
  };

  const handleClear = () => {
    items.forEach(i => { URL.revokeObjectURL(i.originalUrl); if (i.compressedUrl) URL.revokeObjectURL(i.compressedUrl); });
    setItems([]); setPreview(null);
  };

  const done       = items.filter(i => i.status === "done");
  const totalOrig  = done.reduce((s, i) => s + i.originalSize,   0);
  const totalComp  = done.reduce((s, i) => s + i.compressedSize, 0);
  const totalSaved = totalOrig - totalComp;
  const processing = items.some(i => i.status === "processing");

  const FORMAT_OPTIONS: { key: OutputFormat; label: string; note: string }[] = [
    { key: "image/webp", label: "WebP",  note: "Best compression" },
    { key: "image/jpeg", label: "JPEG",  note: "Universal support" },
    { key: "image/png",  label: "PNG",   note: "Lossless (large)" },
  ];

  const QUALITY_PRESETS = [
    { label: "Max Compression", q: 30 },
    { label: "Balanced",        q: 65 },
    { label: "High Quality",    q: 82 },
    { label: "Near Lossless",   q: 93 },
    { label: "Lossless",        q: 100 },
  ];

  const SIZE_PRESETS = [
    { label: "4K",  w: 3840, h: 2160 },
    { label: "FHD", w: 1920, h: 1080 },
    { label: "HD",  w: 1280, h: 720  },
    { label: "Web", w: 800,  h: 600  },
  ];

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-orange-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

      <ToolNavbar toolName="Image Compressor" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-orange-500/10 flex items-center justify-center text-orange-400 text-lg">🗜</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Image Compressor</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded">client-side</span>
          </div>
          <p className="text-slate-500 text-sm">Real compression using WebP/JPEG. Full quality & resize control. Images never leave your browser.</p>
        </div>

        {/* ── Settings panel ── */}
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-5 mb-5 space-y-5">

          {/* Format */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[11px] uppercase tracking-widest text-slate-500 w-28 shrink-0">Output Format</span>
            <div className="flex gap-2 flex-wrap">
              {FORMAT_OPTIONS.map(f => (
                <button key={f.key} onClick={() => handleSettingChange("format", f.key)}
                  className={`flex flex-col items-center px-4 py-2 rounded-lg border transition-all font-mono text-xs
                    ${settings.format === f.key ? "bg-orange-500/15 border-orange-500/40 text-orange-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300 hover:border-white/20"}`}>
                  <span className="font-bold">{f.label}</span>
                  <span className="text-[10px] opacity-60 mt-0.5">{f.note}</span>
                </button>
              ))}
            </div>
            {settings.format === "image/png" && (
              <span className="font-mono text-[11px] text-yellow-500/80 bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded">
                ⚠ PNG ignores quality slider — use WebP or JPEG for real size reduction
              </span>
            )}
          </div>

          {/* Quality slider */}
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-mono text-[11px] uppercase tracking-widest text-slate-500 w-28 shrink-0">Quality</span>
            <div className="flex-1 flex items-center gap-3 min-w-0">
              <span className="font-mono text-[10px] text-slate-700 shrink-0">Small</span>
              <input type="range" min={1} max={100} step={1} value={settings.quality}
                onChange={e => handleSettingChange("quality", +e.target.value)}
                className="flex-1 accent-orange-500 cursor-pointer" />
              <span className="font-mono text-[10px] text-slate-700 shrink-0">Sharp</span>
              <div className="flex items-baseline gap-0.5 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-1.5 min-w-[60px] justify-center shrink-0">
                <span className="font-mono text-xl font-bold text-orange-400">{settings.quality}</span>
                <span className="font-mono text-xs text-orange-400/60">%</span>
              </div>
            </div>
          </div>

          {/* Quality presets */}
          <div className="flex flex-wrap items-center gap-2 pl-[calc(7rem+1rem)]">
            {QUALITY_PRESETS.map(p => (
              <button key={p.q} onClick={() => handleSettingChange("quality", p.q)}
                className={`font-mono text-[11px] px-3 py-1 rounded border transition-all
                  ${settings.quality === p.q ? "bg-orange-500/15 border-orange-500/40 text-orange-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                {p.label} <span className="opacity-50">({p.q})</span>
              </button>
            ))}
          </div>

          {/* Max dimensions */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[11px] uppercase tracking-widest text-slate-500 w-28 shrink-0">Max Dimensions</span>
            <div className="flex items-center gap-2">
              <input type="number" min={1} max={9999} value={settings.maxWidth}
                onChange={e => handleSettingChange("maxWidth", +e.target.value)}
                className="w-20 bg-white/[0.04] border border-white/[0.08] font-mono text-sm text-slate-300 rounded-md px-2 py-1.5 outline-none focus:border-orange-500/40 text-center" />
              <span className="font-mono text-slate-700 text-sm">×</span>
              <input type="number" min={1} max={9999} value={settings.maxHeight}
                onChange={e => handleSettingChange("maxHeight", +e.target.value)}
                className="w-20 bg-white/[0.04] border border-white/[0.08] font-mono text-sm text-slate-300 rounded-md px-2 py-1.5 outline-none focus:border-orange-500/40 text-center" />
              <span className="font-mono text-[11px] text-slate-600">px</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {SIZE_PRESETS.map(p => (
                <button key={p.label}
                  onClick={() => { handleSettingChange("maxWidth", p.w); setTimeout(() => handleSettingChange("maxHeight", p.h), 0); }}
                  className="font-mono text-[11px] px-2.5 py-1 rounded border border-white/[0.08] text-slate-500 hover:text-slate-300 transition-all">
                  {p.label} <span className="opacity-40">{p.w}×{p.h}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap items-center gap-5 pl-[calc(7rem+1rem)]">
            {([
              { key: "maintainAspect" as keyof Settings, label: "Maintain Aspect Ratio" },
              { key: "upscale"        as keyof Settings, label: "Allow Upscaling"        },
            ] as { key: keyof Settings; label: string }[]).map(t => (
              <label key={t.key} onClick={() => handleSettingChange(t.key, !settings[t.key])}
                className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-8 h-4 rounded-full transition-all relative ${settings[t.key] ? "bg-orange-500" : "bg-white/10"}`}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${settings[t.key] ? "left-4" : "left-0.5"}`} />
                </div>
                <span className="font-mono text-xs text-slate-500 group-hover:text-slate-300 transition-colors">{t.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative mb-5 flex flex-col items-center justify-center gap-3 h-40 rounded-xl border-2 border-dashed cursor-pointer transition-all
            ${dragging ? "border-orange-500/60 bg-orange-500/[0.06]" : "border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"}`}
        >
          <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleFiles} className="hidden" />
          <span className="text-3xl">{dragging ? "📂" : "🖼"}</span>
          <div className="text-center">
            <p className="text-slate-400 text-sm font-medium">Drop images here or <span className="text-orange-400">click to browse</span></p>
            <p className="text-slate-600 text-xs mt-1">JPEG, PNG, WebP, GIF, AVIF — batch upload supported</p>
          </div>
        </div>

        {/* Top bar */}
        {items.length > 0 && (
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-xs text-slate-600">{items.length} image{items.length > 1 ? "s" : ""}</span>
            {processing && (
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full border border-orange-500/40 border-t-orange-400 animate-spin" />
                <span className="font-mono text-xs text-orange-400 animate-pulse">Compressing…</span>
              </div>
            )}
            <div className="ml-auto flex gap-2">
              {done.length > 1 && (
                <button onClick={handleDownloadAll} className="font-mono text-xs px-3 py-1.5 border border-orange-500/30 text-orange-400 rounded-md hover:bg-orange-500/10 transition-all">
                  ↓ Download All
                </button>
              )}
              <button onClick={handleClear} className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-red-400 hover:border-red-500/30 transition-all">
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Stats bar */}
        {done.length > 0 && (
          <div className="flex flex-wrap gap-6 px-4 py-3 bg-orange-500/[0.05] border border-orange-500/20 rounded-lg mb-5">
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Done</span><span className="font-mono text-sm text-orange-400">{done.length}/{items.length}</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Original</span><span className="font-mono text-sm text-slate-400">{formatBytes(totalOrig)}</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Compressed</span><span className="font-mono text-sm text-emerald-400">{formatBytes(totalComp)}</span></div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Saved</span>
              <span className={`font-mono text-sm ${totalSaved > 0 ? "text-emerald-400" : "text-red-400"}`}>
                {totalSaved >= 0 ? "↓ " : "↑ "}{formatBytes(Math.abs(totalSaved))} ({Math.abs(savingsPct(totalOrig, totalComp)).toFixed(1)}%)
              </span>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              <span className="font-mono text-[10px] text-orange-500/60">
                {FORMAT_OPTIONS.find(f => f.key === settings.format)?.label} · Q{settings.quality}
              </span>
            </div>
          </div>
        )}

        {/* Results grid */}
        {items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            {items.map(item => {
              const pct   = savingsPct(item.originalSize, item.compressedSize);
              const saved = pct > 0;
              return (
                <div key={item.id} className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden hover:border-white/20 transition-all group">

                  {/* Thumbnail */}
                  <div
                    className="relative h-44 cursor-pointer overflow-hidden"
                    style={{ background: "#0d0d18", backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='8' height='8' fill='%23ffffff08'/%3E%3Crect x='8' y='8' width='8' height='8' fill='%23ffffff08'/%3E%3C/svg%3E\")" }}
                    onClick={() => item.status === "done" && setPreview(item)}
                  >
                    {item.status === "done" && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.compressedUrl} alt={item.name} className="w-full h-full object-contain transition-transform group-hover:scale-105" />
                    )}
                    {(item.status === "processing" || item.status === "idle") && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.originalUrl} alt="" className="absolute inset-0 w-full h-full object-contain opacity-20" />
                        <div className="relative z-10 w-8 h-8 rounded-full border-2 border-orange-500/30 border-t-orange-400 animate-spin" />
                        <span className="relative z-10 font-mono text-xs text-slate-600">Compressing…</span>
                      </div>
                    )}
                    {item.status === "error" && (
                      <div className="absolute inset-0 flex items-center justify-center p-4">
                        <span className="font-mono text-xs text-red-400 text-center">{item.error}</span>
                      </div>
                    )}

                    {/* Savings badge */}
                    {item.status === "done" && (
                      <div className={`absolute top-2 right-2 font-mono text-[11px] px-2 py-0.5 rounded-full font-bold backdrop-blur-sm
                        ${saved ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
                        {saved ? `↓${pct.toFixed(1)}%` : `↑${Math.abs(pct).toFixed(1)}%`}
                      </div>
                    )}

                    {/* Remove */}
                    <button
                      onClick={e => { e.stopPropagation(); handleRemove(item.id); }}
                      className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/60 text-slate-400 hover:text-red-400 font-mono text-xs opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm"
                    >✕</button>

                    {item.status === "done" && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                        <span className="font-mono text-xs text-white">Click to compare</span>
                      </div>
                    )}
                  </div>

                  {/* Card info */}
                  <div className="px-4 py-3">
                    <p className="font-mono text-xs text-slate-400 truncate mb-3" title={item.name}>{item.name}</p>

                    {item.status === "done" && (
                      <>
                        <div className="mb-2">
                          <div className="flex justify-between font-mono text-[10px] mb-1">
                            <span className="text-slate-600">{formatBytes(item.originalSize)}</span>
                            <span className={saved ? "text-emerald-500" : "text-red-400"}>{formatBytes(item.compressedSize)}</span>
                          </div>
                          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${saved ? "bg-emerald-500" : "bg-red-500"}`}
                              style={{ width: `${Math.min(100, (item.compressedSize / item.originalSize) * 100)}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between font-mono text-[10px] text-slate-700 mb-3">
                          <span>{item.originalWidth}×{item.originalHeight}</span>
                          <span>→</span>
                          <span className="text-slate-500">{item.compressedWidth}×{item.compressedHeight}</span>
                        </div>
                      </>
                    )}

                    <button
                      onClick={() => handleDownload(item)}
                      disabled={item.status !== "done"}
                      className="w-full font-mono text-xs py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-md hover:bg-orange-500/20 hover:border-orange-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      ↓ Download
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Compare modal */}
        {preview && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreview(null)}>
            <div className="bg-[#0f0f1a] border border-white/[0.1] rounded-2xl overflow-hidden w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] shrink-0">
                <div className="flex gap-2">
                  {(["original", "compressed"] as const).map(s => (
                    <button key={s} onClick={() => setPreviewSide(s)}
                      className={`font-mono text-xs px-3 py-1 rounded border transition-all capitalize
                        ${previewSide === s ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                      {s === "original" ? `Original — ${formatBytes(preview.originalSize)}` : `Compressed — ${formatBytes(preview.compressedSize)}`}
                    </button>
                  ))}
                </div>
                <button onClick={() => setPreview(null)} className="text-slate-500 hover:text-white font-mono text-lg transition-colors">✕</button>
              </div>

              <div className="flex-1 overflow-auto flex items-center justify-center p-6"
                style={{ background: "#0a0a12", backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='10' height='10' fill='%23ffffff06'/%3E%3Crect x='10' y='10' width='10' height='10' fill='%23ffffff06'/%3E%3C/svg%3E\")" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewSide === "original" ? preview.originalUrl : preview.compressedUrl}
                  alt={previewSide}
                  className="max-w-full max-h-full object-contain rounded shadow-2xl"
                />
              </div>

              <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06] shrink-0">
                <div className="flex gap-6 font-mono text-[11px] flex-wrap">
                  <span className="text-slate-600">Original: <span className="text-slate-400">{formatBytes(preview.originalSize)} · {preview.originalWidth}×{preview.originalHeight}</span></span>
                  <span className="text-slate-600">Output: <span className="text-emerald-400">{formatBytes(preview.compressedSize)} · {preview.compressedWidth}×{preview.compressedHeight}</span></span>
                  <span className="text-slate-600">Saved: <span className={savingsPct(preview.originalSize, preview.compressedSize) > 0 ? "text-emerald-400" : "text-red-400"}>
                    {savingsPct(preview.originalSize, preview.compressedSize).toFixed(1)}%
                  </span></span>
                </div>
                <button onClick={() => handleDownload(preview)} className="font-mono text-xs px-4 py-1.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-md hover:bg-orange-500/20 transition-all">
                  ↓ Download
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
          {[
            { icon: "⚡", title: "Real Compression", desc: "WebP & JPEG actually compress — quality slider directly controls file size. PNG doesn't support lossy, so use WebP for best results." },
            { icon: "🎛", title: "Full Control", desc: "5 quality presets, custom quality %, max dimensions with presets, aspect ratio lock, and upscaling toggle." },
            { icon: "🔒", title: "100% Private", desc: "Canvas API processes everything locally. Your images never touch any server." },
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