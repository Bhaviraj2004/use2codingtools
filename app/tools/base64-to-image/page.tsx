"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useRef, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
type ParsedImage = {
  id: string;
  dataUrl: string;
  base64: string;
  mimeType: string;
  width: number;
  height: number;
  sizeBytes: number;
};

type Status = "idle" | "parsing" | "done" | "error";

// ── Helpers ────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2); }

function formatBytes(b: number) {
  if (b === 0) return "0 B";
  if (b < 1024) return `${b} B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 ** 2).toFixed(2)} MB`;
}

// Strips whitespace, markdown fences, and extracts base64 + mimeType
function parseInput(raw: string): { base64: string; mimeType: string; dataUrl: string } | null {
  let s = raw.trim();

  // Strip markdown code fences
  s = s.replace(/^```[a-z]*\n?/i, "").replace(/```$/i, "").trim();

  // Handle JSON: look for a "base64" key
  if (s.startsWith("{")) {
    try {
      const obj = JSON.parse(s);
      const b64 = obj.base64 ?? obj.data ?? obj.image ?? obj.src ?? "";
      const mime = obj.mimeType ?? obj.mime ?? obj.type ?? "image/png";
      if (b64) return parseInput(`data:${mime};base64,${b64}`);
    } catch { /* not json */ }
  }

  // Already a full data URL
  const dataUrlMatch = s.match(/^data:(image\/[a-zA-Z+.-]+);base64,([A-Za-z0-9+/=\s]+)$/);
  if (dataUrlMatch) {
    const mimeType = dataUrlMatch[1];
    const base64   = dataUrlMatch[2].replace(/\s/g, "");
    return { base64, mimeType, dataUrl: `data:${mimeType};base64,${base64}` };
  }

  // CSS background-image: url("data:…")
  const cssMatch = s.match(/url\(["']?(data:image\/[^"')]+)["']?\)/i);
  if (cssMatch) return parseInput(cssMatch[1]);

  // HTML src attribute
  const htmlMatch = s.match(/src=["'](data:image\/[^"']+)["']/i);
  if (htmlMatch) return parseInput(htmlMatch[1]);

  // Raw base64 — try to detect mime from magic bytes
  const cleanB64 = s.replace(/\s/g, "");
  if (/^[A-Za-z0-9+/]+=*$/.test(cleanB64) && cleanB64.length > 20) {
    // Decode first few bytes to sniff mime
    let mimeType = "image/png";
    try {
      const bytes = atob(cleanB64.slice(0, 16));
      const b = (i: number) => bytes.charCodeAt(i);
      if (b(0) === 0xff && b(1) === 0xd8) mimeType = "image/jpeg";
      else if (b(0) === 0x89 && bytes.slice(1, 4) === "PNG") mimeType = "image/png";
      else if (bytes.slice(0, 4) === "GIF8") mimeType = "image/gif";
      else if (b(0) === 0x52 && b(1) === 0x49 && b(2) === 0x46 && b(3) === 0x46) mimeType = "image/webp";
      else if (bytes.slice(0, 4) === "<svg" || bytes.slice(0, 5) === "<?xml") mimeType = "image/svg+xml";
    } catch { /* keep default */ }
    return { base64: cleanB64, mimeType, dataUrl: `data:${mimeType};base64,${cleanB64}` };
  }

  return null;
}

async function loadImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload  = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = dataUrl;
  });
}

const EXAMPLE_B64 =
  `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMTAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzBkMGQxOCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjZmY2YjM1Ij5CYXNlNjQgSW1hZ2U8L3RleHQ+PC9zdmc+`;

// ── Component ──────────────────────────────────────────────────────────────
export default function Base64ToImage() {
  const [input, setInput]       = useState("");
  const [parsed, setParsed]     = useState<ParsedImage | null>(null);
  const [status, setStatus]     = useState<Status>("idle");
  const [error, setError]       = useState("");
  const [copied, setCopied]     = useState(false);
  const [downloadFmt, setDownloadFmt] = useState<"png" | "jpeg" | "webp" | "original">("original");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const process = useCallback(async (raw: string) => {
    setError(""); setParsed(null);
    if (!raw.trim()) { setStatus("idle"); return; }
    setStatus("parsing");

    const result = parseInput(raw);
    if (!result) {
      setStatus("error");
      setError("Could not parse input. Paste a valid Base64 string, Data URL, HTML img tag, or CSS background-image.");
      return;
    }

    try {
      const { width, height } = await loadImageDimensions(result.dataUrl);
      const sizeBytes = Math.round((result.base64.length * 3) / 4);
      setParsed({ id: uid(), ...result, width, height, sizeBytes });
      setStatus("done");
    } catch {
      setStatus("error");
      setError("Image could not be rendered. The Base64 data may be corrupted.");
    }
  }, []);

  const handleInput = (val: string) => {
    setInput(val);
    if (!val.trim()) { setStatus("idle"); setParsed(null); setError(""); }
  };

  const handleConvert = () => process(input);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setInput(text);
      process(text);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleLoadExample = () => {
    setInput(EXAMPLE_B64);
    process(EXAMPLE_B64);
  };

  const handleClear = () => {
    setInput(""); setParsed(null); setStatus("idle"); setError("");
  };

  const handleCopyDataUrl = () => {
    if (!parsed) return;
    navigator.clipboard.writeText(parsed.dataUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownload = async () => {
    if (!parsed) return;

    if (downloadFmt === "original") {
      // Direct download of original format
      const ext = parsed.mimeType.split("/")[1]?.replace("svg+xml", "svg") ?? "png";
      const a = document.createElement("a");
      a.href = parsed.dataUrl;
      a.download = `decoded_image.${ext}`;
      a.click();
      return;
    }

    // Convert via canvas for format change
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width  = img.naturalWidth  || 400;
      canvas.height = img.naturalHeight || 300;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `decoded_image.${downloadFmt}`; a.click();
        URL.revokeObjectURL(url);
      }, `image/${downloadFmt}`, 0.95);
    };
    img.src = parsed.dataUrl;
  };

  const mimeExt = parsed?.mimeType.split("/")[1]?.replace("svg+xml", "svg") ?? "png";

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      {/* BG */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-orange-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

      <ToolNavbar toolName="Base64 → Image" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-orange-500/10 flex items-center justify-center font-mono font-bold text-orange-400 text-sm">64</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Base64 → Image</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded">client-side</span>
          </div>
          <p className="text-slate-500 text-sm">
            Paste a Base64 string, Data URL, HTML img tag, CSS background-image, or JSON — preview and download the image instantly.
          </p>
        </div>

        {/* Options bar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500/60" />
            Accepts: Base64 · Data URL · HTML · CSS · JSON
          </div>
          <div className="ml-auto flex gap-2">
            <input type="file" accept=".txt,.json,.html,.css" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()}
              className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-slate-300 hover:border-white/20 transition-all">
              Upload File
            </button>
            <button onClick={handleLoadExample}
              className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-slate-300 hover:border-white/20 transition-all">
              Load Example
            </button>
            <button onClick={handleClear}
              className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-red-400 hover:border-red-500/30 transition-all">
              Clear
            </button>
          </div>
        </div>

        {/* Main: split layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">

          {/* ── Left: Input ── */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Base64 Input</span>
              <span className="font-mono text-[10px] text-slate-700">{input.length.toLocaleString()} chars</span>
            </div>
            <div className="relative flex-1">
              <textarea
                value={input}
                onChange={e => handleInput(e.target.value)}
                placeholder={`Paste any of these:\n\ndata:image/png;base64,iVBORw0KGgo…\n\nRaw base64: iVBORw0KGgo…\n\nHTML: <img src="data:image/…" />\n\nCSS: background-image: url("data:…")\n\nJSON: { "base64": "…", "mimeType": "…" }`}
                spellCheck={false}
                className="w-full h-[420px] font-mono text-xs bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-slate-300 placeholder-slate-700 outline-none resize-none leading-relaxed transition-colors focus:border-orange-500/40"
              />
              {/* Error overlay */}
              {status === "error" && (
                <div className="absolute bottom-3 left-3 right-3 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2 flex gap-2">
                  <span className="text-red-400 text-xs shrink-0 mt-0.5">✕</span>
                  <span className="font-mono text-xs text-red-400">{error}</span>
                </div>
              )}
            </div>
            {/* Convert button */}
            <button
              onClick={handleConvert}
              disabled={!input.trim()}
              className="w-full font-mono text-sm py-2.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-lg hover:bg-orange-500/20 hover:border-orange-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-semibold"
            >
              {status === "parsing" ? "Parsing…" : "⇄ Decode & Preview"}
            </button>
          </div>

          {/* ── Right: Preview ── */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Image Preview</span>
              {parsed && (
                <span className="font-mono text-[10px] text-slate-700">
                  {parsed.width}×{parsed.height} · {parsed.mimeType}
                </span>
              )}
            </div>

            <div
              className="flex-1 h-[420px] rounded-lg border border-white/[0.08] flex items-center justify-center overflow-hidden relative"
              style={{ background: "#0d0d18", backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='10' height='10' fill='%23ffffff06'/%3E%3Crect x='10' y='10' width='10' height='10' fill='%23ffffff06'/%3E%3C/svg%3E\")" }}
            >
              {status === "idle" && (
                <div className="flex flex-col items-center gap-3 text-slate-700">
                  <span className="text-4xl">🖼</span>
                  <span className="font-mono text-sm">Image will appear here</span>
                </div>
              )}
              {status === "parsing" && (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-orange-500/30 border-t-orange-400 animate-spin" />
                  <span className="font-mono text-sm text-slate-500">Decoding…</span>
                </div>
              )}
              {status === "error" && (
                <div className="flex flex-col items-center gap-3 text-red-400/60 px-8 text-center">
                  <span className="text-4xl">⚠</span>
                  <span className="font-mono text-sm">{error}</span>
                </div>
              )}
              {status === "done" && parsed && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={parsed.dataUrl}
                  alt="Decoded"
                  className="max-w-full max-h-full object-contain p-3"
                />
              )}
            </div>

            {/* Download controls */}
            {parsed && status === "done" && (
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-slate-600 shrink-0">Save as</span>
                <div className="flex gap-1">
                  {(["original", "png", "jpeg", "webp"] as const).map(f => (
                    <button key={f}
                      onClick={() => setDownloadFmt(f)}
                      className={`font-mono text-[11px] px-2.5 py-1 rounded border transition-all uppercase
                        ${downloadFmt === f ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                      {f === "original" ? `.${mimeExt}` : `.${f}`}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleDownload}
                  className="ml-auto font-mono text-xs px-4 py-1.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-md hover:bg-orange-500/20 hover:border-orange-500/50 transition-all"
                >
                  ↓ Download
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats + meta bar */}
        {parsed && status === "done" && (
          <>
            <div className="flex flex-wrap gap-6 px-4 py-3 bg-orange-500/[0.05] border border-orange-500/20 rounded-lg mb-4">
              <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">MIME</span><span className="font-mono text-sm text-orange-400">{parsed.mimeType}</span></div>
              <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Dimensions</span><span className="font-mono text-sm text-orange-400">{parsed.width} × {parsed.height} px</span></div>
              <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Decoded Size</span><span className="font-mono text-sm text-orange-400">{formatBytes(parsed.sizeBytes)}</span></div>
              <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Input Length</span><span className="font-mono text-sm text-orange-400">{input.length.toLocaleString()} chars</span></div>
              <div className="ml-auto flex items-center gap-3">
                <button
                  onClick={handleCopyDataUrl}
                  className={`font-mono text-[11px] px-3 py-1 rounded border transition-all
                    ${copied ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}
                >
                  {copied ? "✓ Copied Data URL!" : "Copy Data URL"}
                </button>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                  <span className="font-mono text-[10px] text-orange-500/60">Decoded</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "🔍", title: "Smart Parser", desc: "Auto-detects Base64, Data URL, HTML <img>, CSS background-image, and JSON formats. Just paste and go." },
            { icon: "🎨", title: "Format Convert", desc: "Download decoded image as original format, or convert to PNG, JPEG, or WebP on the fly." },
            { icon: "🔒", title: "100% Private", desc: "All decoding happens in your browser using atob() and Canvas API. Nothing is uploaded anywhere." },
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