"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useRef, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
type ResizeMode = "pixels" | "percentage" | "preset";
type OutputFormat = "image/jpeg" | "image/png" | "image/webp";
type FitMode = "stretch" | "contain" | "cover" | "pad";

type ImageInfo = {
  file: File;
  originalUrl: string;
  originalWidth: number;
  originalHeight: number;
  originalSize: number;
};

type ResizedResult = {
  url: string;
  width: number;
  height: number;
  size: number;
  blob: Blob;
};

const FORMAT_OPTIONS: { key: OutputFormat; label: string; note: string }[] = [
  { key: "image/webp", label: "WebP", note: "Best for web" },
  { key: "image/jpeg", label: "JPEG", note: "Photos" },
  { key: "image/png",  label: "PNG",  note: "Lossless" },
];

const PRESETS: { label: string; w: number; h: number; note: string }[] = [
  { label: "HD",           w: 1280,  h: 720,   note: "1280×720"   },
  { label: "Full HD",      w: 1920,  h: 1080,  note: "1920×1080"  },
  { label: "4K",           w: 3840,  h: 2160,  note: "3840×2160"  },
  { label: "Instagram",    w: 1080,  h: 1080,  note: "1080×1080"  },
  { label: "Twitter Post", w: 1600,  h: 900,   note: "1600×900"   },
  { label: "Facebook",     w: 1200,  h: 630,   note: "1200×630"   },
  { label: "Thumbnail",    w: 640,   h: 360,   note: "640×360"    },
  { label: "Icon",         w: 512,   h: 512,   note: "512×512"    },
  { label: "Favicon",      w: 32,    h: 32,    note: "32×32"      },
];

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

// ── Resize engine ──────────────────────────────────────────────────────────
async function resizeImage(
  file: File,
  targetW: number,
  targetH: number,
  format: OutputFormat,
  quality: number,
  fitMode: FitMode,
  padColor: string,
): Promise<ResizedResult> {
  return new Promise((resolve, reject) => {
    const src = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(src);
      const { naturalWidth: srcW, naturalHeight: srcH } = img;
      const canvas = document.createElement("canvas");
      canvas.width  = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      if (fitMode === "pad") {
        ctx.fillStyle = padColor;
        ctx.fillRect(0, 0, targetW, targetH);
      }

      if (fitMode === "stretch") {
        ctx.drawImage(img, 0, 0, targetW, targetH);
      } else if (fitMode === "contain" || fitMode === "pad") {
        const scale = Math.min(targetW / srcW, targetH / srcH);
        const dw = Math.round(srcW * scale);
        const dh = Math.round(srcH * scale);
        const dx = Math.round((targetW - dw) / 2);
        const dy = Math.round((targetH - dh) / 2);
        if (fitMode === "contain") {
          ctx.fillStyle = padColor;
          ctx.fillRect(0, 0, targetW, targetH);
        }
        ctx.drawImage(img, dx, dy, dw, dh);
      } else if (fitMode === "cover") {
        const scale = Math.max(targetW / srcW, targetH / srcH);
        const dw = Math.round(srcW * scale);
        const dh = Math.round(srcH * scale);
        const dx = Math.round((targetW - dw) / 2);
        const dy = Math.round((targetH - dh) / 2);
        ctx.drawImage(img, dx, dy, dw, dh);
      }

      canvas.toBlob(
        blob => {
          if (!blob) return reject(new Error("Canvas toBlob failed"));
          resolve({ url: URL.createObjectURL(blob), width: targetW, height: targetH, size: blob.size, blob });
        },
        format,
        quality / 100,
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

// ── Component ──────────────────────────────────────────────────────────────
export default function ImageResizer() {
  const [image, setImage]           = useState<ImageInfo | null>(null);
  const [result, setResult]         = useState<ResizedResult | null>(null);
  const [dragging, setDragging]     = useState(false);
  const [processing, setProcessing] = useState(false);

  // Settings
  const [resizeMode, setResizeMode] = useState<ResizeMode>("pixels");
  const [targetW, setTargetW]       = useState(1280);
  const [targetH, setTargetH]       = useState(720);
  const [pct, setPct]               = useState(50);
  const [lockAspect, setLockAspect] = useState(true);
  const [format, setFormat]         = useState<OutputFormat>("image/webp");
  const [quality, setQuality]       = useState(85);
  const [fitMode, setFitMode]       = useState<FitMode>("contain");
  const [padColor, setPadColor]     = useState("#000000");
  const [activePreset, setActivePreset] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Aspect ratio helpers
  const getAspectRatio = useCallback(() => {
    if (!image) return 1;
    return image.originalWidth / image.originalHeight;
  }, [image]);

  const handleWidthChange = (w: number) => {
    setTargetW(w);
    setActivePreset(null);
    if (lockAspect && image) setTargetH(Math.round(w / getAspectRatio()));
  };

  const handleHeightChange = (h: number) => {
    setTargetH(h);
    setActivePreset(null);
    if (lockAspect && image) setTargetW(Math.round(h * getAspectRatio()));
  };

  const handlePctChange = (p: number) => {
    setPct(p);
    setActivePreset(null);
    if (image) {
      setTargetW(Math.round(image.originalWidth  * p / 100));
      setTargetH(Math.round(image.originalHeight * p / 100));
    }
  };

  const handlePreset = (idx: number) => {
    const p = PRESETS[idx];
    setActivePreset(idx);
    setTargetW(p.w);
    setTargetH(p.h);
    setResizeMode("preset");
  };

  // Load file
  const loadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    const dims = await new Promise<{ w: number; h: number }>(res => {
      const img = new window.Image();
      img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
      img.src = url;
    });
    const info: ImageInfo = {
      file, originalUrl: url,
      originalWidth: dims.w, originalHeight: dims.h,
      originalSize: file.size,
    };
    setImage(info);
    setResult(null);
    // Default: 50%
    setTargetW(Math.round(dims.w * 0.5));
    setTargetH(Math.round(dims.h * 0.5));
    setPct(50);
    setResizeMode("percentage");
    setActivePreset(null);
  }, []);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) loadFile(e.target.files[0]);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
  };

  const handleResize = async () => {
    if (!image) return;
    setProcessing(true);
    if (result) URL.revokeObjectURL(result.url);
    try {
      const r = await resizeImage(image.file, targetW, targetH, format, quality, fitMode, padColor);
      setResult(r);
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const ext = format.split("/")[1];
    const a = document.createElement("a");
    a.href = result.url;
    a.download = image!.file.name.replace(/\.[^.]+$/, "") + `_${result.width}x${result.height}.${ext}`;
    a.click();
  };

  const handleClear = () => {
    if (image) URL.revokeObjectURL(image.originalUrl);
    if (result) URL.revokeObjectURL(result.url);
    setImage(null); setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const saved    = result ? savingsPct(image!.originalSize, result.size) : 0;
  const showPad  = fitMode === "contain" || fitMode === "pad";

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      {/* BG */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-orange-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

      <ToolNavbar toolName="Image Resizer" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-orange-500/10 flex items-center justify-center text-orange-400 text-lg">⇲</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Image Resizer</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded">client-side</span>
          </div>
          <p className="text-slate-500 text-sm">
            Resize images by pixels, percentage, or preset. Supports aspect lock, fit modes, format conversion — all in browser.
          </p>
        </div>

        {/* Drop zone */}
        {!image && (
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative mb-5 flex flex-col items-center justify-center gap-3 h-52 rounded-xl border-2 border-dashed cursor-pointer transition-all
              ${dragging ? "border-orange-500/60 bg-orange-500/[0.06]" : "border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"}`}
          >
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFiles} className="hidden" />
            <span className="text-4xl">{dragging ? "📂" : "🖼"}</span>
            <div className="text-center">
              <p className="text-slate-400 text-sm font-medium">Drop an image here or <span className="text-orange-400">click to browse</span></p>
              <p className="text-slate-600 text-xs mt-1">JPEG, PNG, WebP, GIF, AVIF supported</p>
            </div>
          </div>
        )}

        {image && (
          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">

            {/* ── LEFT: Settings ── */}
            <div className="flex flex-col gap-4">

              {/* Image info card */}
              <div className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/[0.08] rounded-xl">
                <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-white/[0.08]"
                  style={{ background: "#111" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.originalUrl} alt="source" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-slate-300 truncate">{image.file.name}</p>
                  <p className="font-mono text-[10px] text-slate-600 mt-0.5">{image.originalWidth} × {image.originalHeight} px</p>
                  <p className="font-mono text-[10px] text-slate-600">{formatBytes(image.originalSize)} · {image.file.type}</p>
                </div>
                <button onClick={handleClear}
                  className="font-mono text-slate-600 hover:text-red-400 text-sm transition-colors shrink-0">✕</button>
              </div>

              {/* Resize mode tabs */}
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4 space-y-4">
                <div className="flex gap-1">
                  {(["pixels","percentage","preset"] as ResizeMode[]).map(m => (
                    <button key={m} onClick={() => setResizeMode(m)}
                      className={`flex-1 font-mono text-xs py-1.5 rounded border transition-all capitalize
                        ${resizeMode === m ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                      {m === "pixels" ? "px" : m === "percentage" ? "%" : "Preset"}
                    </button>
                  ))}
                </div>

                {/* Pixels mode */}
                {resizeMode === "pixels" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="font-mono text-[10px] text-slate-600 uppercase tracking-widest block mb-1">Width</label>
                        <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2">
                          <input type="number" min={1} max={9999} value={targetW}
                            onChange={e => handleWidthChange(+e.target.value)}
                            className="w-full bg-transparent font-mono text-sm text-slate-200 outline-none" />
                          <span className="font-mono text-[11px] text-slate-600 shrink-0">px</span>
                        </div>
                      </div>

                      {/* Lock toggle */}
                      <button onClick={() => setLockAspect(p => !p)}
                        className={`mt-5 w-8 h-8 rounded-lg border flex items-center justify-center transition-all text-sm
                          ${lockAspect ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "border-white/[0.08] text-slate-600 hover:text-slate-300"}`}
                        title={lockAspect ? "Aspect ratio locked" : "Aspect ratio unlocked"}>
                        {lockAspect ? "🔒" : "🔓"}
                      </button>

                      <div className="flex-1">
                        <label className="font-mono text-[10px] text-slate-600 uppercase tracking-widest block mb-1">Height</label>
                        <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2">
                          <input type="number" min={1} max={9999} value={targetH}
                            onChange={e => handleHeightChange(+e.target.value)}
                            className="w-full bg-transparent font-mono text-sm text-slate-200 outline-none" />
                          <span className="font-mono text-[11px] text-slate-600 shrink-0">px</span>
                        </div>
                      </div>
                    </div>

                    {/* Scale indicator */}
                    {image && (
                      <p className="font-mono text-[10px] text-slate-700 text-center">
                        {image.originalWidth}×{image.originalHeight} → {targetW}×{targetH}
                        <span className="ml-2 text-orange-500/60">
                          ({((targetW / image.originalWidth) * 100).toFixed(0)}% of original)
                        </span>
                      </p>
                    )}
                  </div>
                )}

                {/* Percentage mode */}
                {resizeMode === "percentage" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input type="range" min={1} max={200} step={1} value={pct}
                        onChange={e => handlePctChange(+e.target.value)}
                        className="flex-1 accent-orange-500" />
                      <div className="flex items-baseline gap-0.5 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-1.5 min-w-[64px] justify-center">
                        <span className="font-mono text-xl font-bold text-orange-400">{pct}</span>
                        <span className="font-mono text-xs text-orange-400/60">%</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {[25, 50, 75, 100, 150, 200].map(p => (
                        <button key={p} onClick={() => handlePctChange(p)}
                          className={`font-mono text-[11px] px-2.5 py-1 rounded border transition-all
                            ${pct === p ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                          {p}%
                        </button>
                      ))}
                    </div>
                    {image && (
                      <p className="font-mono text-[10px] text-slate-700 text-center">
                        {targetW} × {targetH} px
                      </p>
                    )}
                  </div>
                )}

                {/* Preset mode */}
                {resizeMode === "preset" && (
                  <div className="grid grid-cols-2 gap-1.5">
                    {PRESETS.map((p, i) => (
                      <button key={p.label} onClick={() => handlePreset(i)}
                        className={`flex flex-col items-start px-3 py-2 rounded-lg border transition-all text-left
                          ${activePreset === i ? "bg-orange-500/15 border-orange-500/30 text-orange-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300 hover:border-white/20"}`}>
                        <span className="font-mono text-xs font-semibold">{p.label}</span>
                        <span className="font-mono text-[10px] opacity-60">{p.note}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fit mode */}
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4 space-y-3">
                <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600">Fit Mode</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {([
                    { key: "stretch", label: "Stretch",  desc: "Fill exactly, may distort" },
                    { key: "contain", label: "Contain",  desc: "Fit inside, pad edges"     },
                    { key: "cover",   label: "Cover",    desc: "Fill & crop center"         },
                    { key: "pad",     label: "Pad",      desc: "Fit inside with bg color"  },
                  ] as { key: FitMode; label: string; desc: string }[]).map(f => (
                    <button key={f.key} onClick={() => setFitMode(f.key)}
                      className={`flex flex-col items-start px-3 py-2 rounded-lg border transition-all text-left
                        ${fitMode === f.key ? "bg-orange-500/15 border-orange-500/30" : "border-white/[0.08] hover:border-white/20"}`}>
                      <span className={`font-mono text-xs font-semibold ${fitMode === f.key ? "text-orange-400" : "text-slate-400"}`}>{f.label}</span>
                      <span className="font-mono text-[10px] text-slate-600">{f.desc}</span>
                    </button>
                  ))}
                </div>

                {/* Pad color */}
                {showPad && (
                  <div className="flex items-center gap-3 mt-1">
                    <span className="font-mono text-[11px] text-slate-600">Pad Color</span>
                    <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5">
                      <input type="color" value={padColor} onChange={e => setPadColor(e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent" />
                      <input type="text" value={padColor} onChange={e => setPadColor(e.target.value)}
                        className="w-20 bg-transparent font-mono text-xs text-slate-300 outline-none uppercase" />
                    </div>
                    {["#000000","#ffffff","transparent"].map(c => (
                      <button key={c} onClick={() => setPadColor(c)}
                        className={`w-6 h-6 rounded border transition-all ${padColor === c ? "border-orange-500/60 scale-110" : "border-white/10 hover:border-white/30"}`}
                        style={{ backgroundColor: c === "transparent" ? "transparent" : c, backgroundImage: c === "transparent" ? "url(\"data:image/svg+xml,%3Csvg width='6' height='6' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='3' height='3' fill='%23888'/%3E%3Crect x='3' y='3' width='3' height='3' fill='%23888'/%3E%3Crect x='3' y='0' width='3' height='3' fill='%23555'/%3E%3Crect x='0' y='3' width='3' height='3' fill='%23555'/%3E%3C/svg%3E\")" : undefined }}
                        title={c} />
                    ))}
                  </div>
                )}
              </div>

              {/* Output format & quality */}
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4 space-y-3">
                <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600">Output Format</p>
                <div className="flex gap-2">
                  {FORMAT_OPTIONS.map(f => (
                    <button key={f.key} onClick={() => setFormat(f.key)}
                      className={`flex-1 flex flex-col items-center px-2 py-2 rounded-lg border transition-all
                        ${format === f.key ? "bg-orange-500/15 border-orange-500/30 text-orange-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                      <span className="font-mono text-xs font-bold">{f.label}</span>
                      <span className="font-mono text-[9px] opacity-60 mt-0.5">{f.note}</span>
                    </button>
                  ))}
                </div>

                {format !== "image/png" && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-slate-600">Quality</span>
                      <span className="font-mono text-sm text-orange-400 font-bold">{quality}%</span>
                    </div>
                    <input type="range" min={1} max={100} value={quality}
                      onChange={e => setQuality(+e.target.value)}
                      className="w-full accent-orange-500" />
                    <div className="flex justify-between font-mono text-[10px] text-slate-700">
                      {[20, 40, 60, 80, 100].map(q => (
                        <button key={q} onClick={() => setQuality(q)}
                          className={`hover:text-slate-400 transition-colors ${quality === q ? "text-orange-400" : ""}`}>
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Resize button */}
              <button onClick={handleResize} disabled={processing}
                className="w-full font-mono text-sm py-3 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-xl hover:bg-orange-500/20 hover:border-orange-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold flex items-center justify-center gap-2">
                {processing ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-orange-500/30 border-t-orange-400 animate-spin" />
                    Resizing…
                  </>
                ) : "⇲ Resize Image"}
              </button>
            </div>

            {/* ── RIGHT: Preview ── */}
            <div className="flex flex-col gap-4">

              {/* Before / After preview */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Original",   url: image.originalUrl,  w: image.originalWidth,  h: image.originalHeight,  size: image.originalSize, accent: "slate" },
                  { label: "Resized",    url: result?.url ?? "",   w: result?.width ?? targetW, h: result?.height ?? targetH, size: result?.size ?? 0, accent: "emerald" },
                ].map(({ label, url, w, h, size, accent }) => (
                  <div key={label} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">{label}</span>
                      {size > 0 && <span className="font-mono text-[10px] text-slate-700">{formatBytes(size)}</span>}
                    </div>
                    <div className="relative h-64 rounded-xl border border-white/[0.08] flex items-center justify-center overflow-hidden"
                      style={{ background: "#0d0d18", backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='10' height='10' fill='%23ffffff06'/%3E%3Crect x='10' y='10' width='10' height='10' fill='%23ffffff06'/%3E%3C/svg%3E\")" }}>
                      {url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={url} alt={label} className="max-w-full max-h-full object-contain p-2" />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-700">
                          <span className="text-3xl">⇲</span>
                          <span className="font-mono text-xs">Click "Resize Image"</span>
                        </div>
                      )}
                    </div>
                    <p className="font-mono text-[10px] text-center text-slate-700">{w} × {h} px</p>
                  </div>
                ))}
              </div>

              {/* Stats bar */}
              {result && (
                <div className="flex flex-wrap gap-6 px-4 py-3 bg-orange-500/[0.05] border border-orange-500/20 rounded-lg">
                  <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Original</span><span className="font-mono text-sm text-slate-400">{image.originalWidth}×{image.originalHeight} · {formatBytes(image.originalSize)}</span></div>
                  <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Resized</span><span className="font-mono text-sm text-emerald-400">{result.width}×{result.height} · {formatBytes(result.size)}</span></div>
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Size Change</span>
                    <span className={`font-mono text-sm ${saved > 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {saved > 0 ? `↓${saved.toFixed(1)}%` : `↑${Math.abs(saved).toFixed(1)}%`}
                    </span>
                  </div>
                  <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Format</span><span className="font-mono text-sm text-orange-400">{FORMAT_OPTIONS.find(f => f.key === format)?.label}</span></div>
                  <div className="ml-auto flex items-center gap-3">
                    <button onClick={handleDownload}
                      className="font-mono text-xs px-4 py-1.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-lg hover:bg-orange-500/20 hover:border-orange-500/50 transition-all">
                      ↓ Download
                    </button>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                      <span className="font-mono text-[10px] text-orange-500/60">Done</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Resize again with new file */}
              <div className="flex gap-2">
                <button onClick={() => fileInputRef.current?.click()}
                  className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-lg hover:text-slate-300 hover:border-white/20 transition-all">
                  + Upload different image
                </button>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFiles} className="hidden" />
                {result && (
                  <button onClick={handleResize}
                    className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-lg hover:text-slate-300 hover:border-white/20 transition-all">
                    ↺ Re-apply settings
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info cards */}
        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${image ? "mt-6" : "mt-2"}`}>
          {[
            { icon: "⇲", title: "3 Resize Modes",    desc: "Resize by exact pixels, percentage scale, or pick from 9 social media & screen presets." },
            { icon: "✂️", title: "4 Fit Modes",       desc: "Stretch, Contain (letterbox), Cover (crop), or Pad with a custom background color." },
            { icon: "🔒", title: "Aspect Lock",       desc: "Lock aspect ratio to resize proportionally, or unlock to set width and height independently." },
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