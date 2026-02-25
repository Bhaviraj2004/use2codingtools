"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useCallback } from "react";

// ── Color math ─────────────────────────────────────────────────────────────
type RGBA = { r: number; g: number; b: number; a: number };
type HSLA = { h: number; s: number; l: number; a: number };

function clamp(n: number, min = 0, max = 255) { return Math.max(min, Math.min(max, n)); }

function hexToRgba(hex: string): RGBA | null {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3)  h = h.split("").map(c => c + c).join("") + "ff";
  if (h.length === 4)  h = h.split("").map(c => c + c).join("");
  if (h.length === 6)  h += "ff";
  if (h.length !== 8)  return null;
  if (!/^[0-9a-fA-F]{8}$/.test(h)) return null;
  const n = parseInt(h, 16);
  return { r: (n >>> 24) & 255, g: (n >>> 16) & 255, b: (n >>> 8) & 255, a: parseFloat(((n & 255) / 255).toFixed(2)) };
}

function rgbaToHex({ r, g, b, a }: RGBA): string {
  const toH = (n: number) => clamp(Math.round(n)).toString(16).padStart(2, "0");
  const ah = Math.round(a * 255);
  return `#${toH(r)}${toH(g)}${toH(b)}${ah < 255 ? toH(ah) : ""}`.toUpperCase();
}

function rgbaToHsla({ r, g, b, a }: RGBA): HSLA {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
    else if (max === gn) h = ((bn - rn) / d + 2) / 6;
    else h = ((rn - gn) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100), a };
}

function hslaToRgba({ h, s, l, a }: HSLA): RGBA {
  const hn = h / 360, sn = s / 100, ln = l / 100;
  if (sn === 0) { const v = Math.round(ln * 255); return { r: v, g: v, b: v, a }; }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;
  return {
    r: Math.round(hue2rgb(p, q, hn + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hn) * 255),
    b: Math.round(hue2rgb(p, q, hn - 1 / 3) * 255),
    a,
  };
}

function rgbaToString({ r, g, b, a }: RGBA, format: "rgb" | "rgba" | "hsl" | "hsla" | "hex" | "hex8" | "css-vars" | "tailwind") {
  const hsl = rgbaToHsla({ r, g, b, a });
  switch (format) {
    case "rgb":       return `rgb(${r}, ${g}, ${b})`;
    case "rgba":      return `rgba(${r}, ${g}, ${b}, ${a})`;
    case "hsl":       return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    case "hsla":      return `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${a})`;
    case "hex":       return rgbaToHex({ r, g, b, a: 1 });
    case "hex8":      return rgbaToHex({ r, g, b, a });
    case "css-vars":  return `--color-r: ${r};\n--color-g: ${g};\n--color-b: ${b};\n--color: rgba(${r}, ${g}, ${b}, ${a});`;
    case "tailwind":  return `[${rgbaToHex({ r, g, b, a: 1 })}]`;
  }
}

// Parse "rgb(r, g, b)" or "rgba(r, g, b, a)" string
function parseRgbString(s: string): RGBA | null {
  const m = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/i);
  if (!m) return null;
  return { r: clamp(+m[1]), g: clamp(+m[2]), b: clamp(+m[3]), a: m[4] !== undefined ? parseFloat(m[4]) : 1 };
}

function parseHslString(s: string): RGBA | null {
  const m = s.match(/hsla?\(\s*(\d+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*([\d.]+))?\s*\)/i);
  if (!m) return null;
  return hslaToRgba({ h: +m[1], s: +m[2], l: +m[3], a: m[4] !== undefined ? parseFloat(m[4]) : 1 });
}

function parseAnyColor(raw: string): RGBA | null {
  const s = raw.trim();
  if (s.startsWith("#") || /^[0-9a-fA-F]{3,8}$/.test(s)) return hexToRgba(s.startsWith("#") ? s : "#" + s);
  if (/^rgba?/i.test(s)) return parseRgbString(s);
  if (/^hsla?/i.test(s)) return parseHslString(s);
  return null;
}

function isDark({ r, g, b }: RGBA) { return (r * 299 + g * 587 + b * 114) / 1000 < 128; }

// ── Batch parse multiple lines ─────────────────────────────────────────────
function parseBatch(text: string): { raw: string; rgba: RGBA | null }[] {
  return text.split("\n").map(line => line.trim()).filter(Boolean).map(raw => ({ raw, rgba: parseAnyColor(raw) }));
}

// ── Output formats ─────────────────────────────────────────────────────────
const OUTPUT_FORMATS = [
  { key: "rgb",       label: "RGB"       },
  { key: "rgba",      label: "RGBA"      },
  { key: "hsl",       label: "HSL"       },
  { key: "hsla",      label: "HSLA"      },
  { key: "hex",       label: "HEX"       },
  { key: "hex8",      label: "HEX+A"     },
  { key: "css-vars",  label: "CSS Vars"  },
  { key: "tailwind",  label: "Tailwind"  },
] as const;

type OutFmt = typeof OUTPUT_FORMATS[number]["key"];

// ── Component ──────────────────────────────────────────────────────────────
export default function HexRgb() {
  const [input, setInput]         = useState("");
  const [outFmt, setOutFmt]       = useState<OutFmt>("rgb");
  const [copied, setCopied]       = useState<string | null>(null);
  const [batchMode, setBatchMode] = useState(false);

  // Single color state
  const singleRgba = !batchMode ? parseAnyColor(input) : null;

  // Batch
  const batchResults = batchMode ? parseBatch(input) : [];

  const copy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1600);
  }, []);

  const handleLoadExample = () => {
    if (batchMode) {
      setInput("#FF6B35\n#1A936F\nrgb(100, 149, 237)\nhsl(210, 50%, 60%)\n#004E89\nrgba(255, 193, 7, 0.8)");
    } else {
      setInput("#FF6B35");
    }
  };

  const handleClear = () => { setInput(""); };

  // Copy all batch results
  const handleCopyAll = () => {
    const text = batchResults
      .filter(r => r.rgba)
      .map(r => rgbaToString(r.rgba!, outFmt))
      .join("\n");
    copy(text, "all");
  };

  const validBatch  = batchResults.filter(r => r.rgba);
  const invalidCount = batchResults.filter(r => !r.rgba).length;

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      {/* BG */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-orange-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

      <ToolNavbar toolName="HEX ↔ RGB" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-orange-500/10 flex items-center justify-center font-mono font-bold text-orange-400 text-sm">#→</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">HEX ↔ RGB Converter</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded">client-side</span>
          </div>
          <p className="text-slate-500 text-sm">
            Convert between HEX, RGB, RGBA, HSL, HSLA — single or batch. Paste any color format, get all formats instantly.
          </p>
        </div>

        {/* Options bar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">

          {/* Output format */}
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-1.5 flex-wrap">
            <span className="font-mono text-[11px] text-slate-500 uppercase tracking-wide shrink-0">Convert to</span>
            {OUTPUT_FORMATS.map(f => (
              <button key={f.key} onClick={() => setOutFmt(f.key)}
                className={`font-mono text-xs px-2.5 py-0.5 rounded transition-all
                  ${outFmt === f.key ? "bg-orange-500/20 text-orange-400" : "text-slate-500 hover:text-slate-300"}`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Batch toggle */}
          <label onClick={() => { setBatchMode(p => !p); setInput(""); }}
            className="flex items-center gap-2 cursor-pointer group bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-1.5">
            <div className={`w-8 h-4 rounded-full transition-all relative ${batchMode ? "bg-orange-500" : "bg-white/10"}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${batchMode ? "left-4" : "left-0.5"}`} />
            </div>
            <span className="font-mono text-xs text-slate-500 group-hover:text-slate-300 transition-colors">Batch Mode</span>
          </label>

          <div className="ml-auto flex gap-2">
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

        {!batchMode ? (
          /* ── SINGLE MODE ── */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">

            {/* Input */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Input Color</span>
                <span className="font-mono text-[10px] text-slate-700">HEX · RGB · RGBA · HSL · HSLA</span>
              </div>
              <div className="relative">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={"Paste any color:\n\n#FF6B35\nrgb(255, 107, 53)\nrgba(255, 107, 53, 0.8)\nhsl(18, 100%, 60%)\nhsla(18, 100%, 60%, 0.5)"}
                  spellCheck={false}
                  rows={8}
                  className="w-full font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-slate-300 placeholder-slate-700 outline-none resize-none leading-relaxed transition-colors focus:border-orange-500/40"
                />
              </div>

              {/* Color preview swatch */}
              {singleRgba && (
                <div className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                  <div className="w-12 h-12 rounded-lg border border-white/10 shadow-lg shrink-0"
                    style={{ backgroundColor: `rgba(${singleRgba.r},${singleRgba.g},${singleRgba.b},${singleRgba.a})` }} />
                  <div>
                    <p className="font-mono text-xs text-slate-400">{rgbaToHex(singleRgba).toUpperCase()}</p>
                    <p className="font-mono text-[10px] text-slate-600 mt-0.5">
                      R:{singleRgba.r} G:{singleRgba.g} B:{singleRgba.b} A:{singleRgba.a}
                    </p>
                    <p className="font-mono text-[10px] text-slate-600">
                      {(() => { const h = rgbaToHsla(singleRgba); return `H:${h.h}° S:${h.s}% L:${h.l}%`; })()}
                    </p>
                  </div>
                  <div className="ml-auto font-mono text-[10px] px-2 py-1 rounded border"
                    style={{
                      backgroundColor: `rgba(${singleRgba.r},${singleRgba.g},${singleRgba.b},0.15)`,
                      borderColor: `rgba(${singleRgba.r},${singleRgba.g},${singleRgba.b},0.4)`,
                      color: isDark(singleRgba) ? "#94a3b8" : `rgb(${singleRgba.r},${singleRgba.g},${singleRgba.b})`,
                    }}>
                    Valid ✓
                  </div>
                </div>
              )}
              {input && !singleRgba && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <span className="text-red-400 text-xs">✕</span>
                  <span className="font-mono text-xs text-red-400">Could not parse color. Try #HEX, rgb(), rgba(), hsl(), or hsla().</span>
                </div>
              )}
            </div>

            {/* Output: all formats */}
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">All Formats</span>
              <div className="flex-1 space-y-2">
                {OUTPUT_FORMATS.map(fmt => {
                  const val = singleRgba ? rgbaToString(singleRgba, fmt.key) : "";
                  const isActive = outFmt === fmt.key;
                  return (
                    <div key={fmt.key}
                      className={`flex items-start gap-3 px-4 py-3 rounded-lg border transition-all
                        ${isActive ? "bg-orange-500/[0.06] border-orange-500/20" : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"}`}>
                      <div className="flex-1 min-w-0">
                        <span className={`font-mono text-[10px] uppercase tracking-widest block mb-1 ${isActive ? "text-orange-400" : "text-slate-600"}`}>
                          {fmt.label}
                        </span>
                        <code className="font-mono text-xs text-slate-300 break-all whitespace-pre-wrap">
                          {val || <span className="text-slate-700">—</span>}
                        </code>
                      </div>
                      <button
                        onClick={() => val && copy(val, fmt.key)}
                        disabled={!val}
                        className={`font-mono text-[11px] px-2.5 py-1 rounded border transition-all shrink-0 mt-0.5
                          ${copied === fmt.key
                            ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                            : "border-white/[0.08] text-slate-500 hover:text-slate-300 disabled:opacity-20 disabled:cursor-not-allowed"}`}>
                        {copied === fmt.key ? "✓" : "Copy"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ── BATCH MODE ── */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">

            {/* Batch input */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Batch Input</span>
                <span className="font-mono text-[10px] text-slate-700">One color per line</span>
              </div>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={"One color per line:\n\n#FF6B35\n#1A936F\nrgb(100, 149, 237)\nhsl(210, 50%, 60%)\nrgba(255, 100, 0, 0.5)"}
                spellCheck={false}
                className="w-full h-[420px] font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-slate-300 placeholder-slate-700 outline-none resize-none leading-relaxed transition-colors focus:border-orange-500/40"
              />
            </div>

            {/* Batch output */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">
                  Results — {OUTPUT_FORMATS.find(f => f.key === outFmt)?.label}
                </span>
                <div className="flex items-center gap-2">
                  {invalidCount > 0 && (
                    <span className="font-mono text-[10px] text-red-400">{invalidCount} invalid</span>
                  )}
                  <button
                    onClick={handleCopyAll}
                    disabled={validBatch.length === 0}
                    className={`font-mono text-[11px] px-3 py-1 rounded border transition-all
                      ${copied === "all" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"}`}>
                    {copied === "all" ? "✓ Copied!" : "Copy All"}
                  </button>
                </div>
              </div>

              <div className="h-[420px] overflow-y-auto space-y-1.5 pr-1">
                {batchResults.length === 0 && (
                  <div className="flex items-center justify-center h-full text-slate-700 font-mono text-sm">
                    Results will appear here…
                  </div>
                )}
                {batchResults.map((row, i) => {
                  const converted = row.rgba ? rgbaToString(row.rgba, outFmt) : null;
                  return (
                    <div key={i}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all
                        ${row.rgba ? "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]" : "bg-red-500/[0.04] border-red-500/[0.15]"}`}>

                      {/* Swatch */}
                      {row.rgba ? (
                        <div className="w-7 h-7 rounded shrink-0 border border-white/10"
                          style={{ backgroundColor: `rgba(${row.rgba.r},${row.rgba.g},${row.rgba.b},${row.rgba.a})` }} />
                      ) : (
                        <div className="w-7 h-7 rounded shrink-0 border border-red-500/20 flex items-center justify-center">
                          <span className="text-red-500 text-xs">✕</span>
                        </div>
                      )}

                      {/* Input → Output */}
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span className="font-mono text-[11px] text-slate-600 truncate shrink-0 max-w-[120px]">{row.raw}</span>
                        {converted && (
                          <>
                            <span className="text-slate-700 font-mono text-xs shrink-0">→</span>
                            <span className="font-mono text-xs text-slate-300 truncate">{converted}</span>
                          </>
                        )}
                        {!row.rgba && (
                          <span className="font-mono text-[11px] text-red-400/70">invalid</span>
                        )}
                      </div>

                      {/* Copy */}
                      {converted && (
                        <button
                          onClick={() => copy(converted, `batch-${i}`)}
                          className={`font-mono text-[10px] px-2 py-0.5 rounded border transition-all shrink-0
                            ${copied === `batch-${i}` ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-600 hover:text-slate-300"}`}>
                          {copied === `batch-${i}` ? "✓" : "Copy"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Stats bar */}
        {(singleRgba || validBatch.length > 0) && (
          <div className="flex flex-wrap gap-6 px-4 py-3 bg-orange-500/[0.05] border border-orange-500/20 rounded-lg mb-5">
            {singleRgba && !batchMode && (
              <>
                <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">HEX</span><span className="font-mono text-sm text-orange-400">{rgbaToHex(singleRgba)}</span></div>
                <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">RGB</span><span className="font-mono text-sm text-orange-400">{singleRgba.r}, {singleRgba.g}, {singleRgba.b}</span></div>
                <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">HSL</span><span className="font-mono text-sm text-orange-400">{(() => { const h = rgbaToHsla(singleRgba); return `${h.h}°, ${h.s}%, ${h.l}%`; })()}</span></div>
                <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Alpha</span><span className="font-mono text-sm text-orange-400">{Math.round(singleRgba.a * 100)}%</span></div>
              </>
            )}
            {batchMode && (
              <>
                <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Total</span><span className="font-mono text-sm text-orange-400">{batchResults.length}</span></div>
                <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Valid</span><span className="font-mono text-sm text-emerald-400">{validBatch.length}</span></div>
                <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Invalid</span><span className={`font-mono text-sm ${invalidCount > 0 ? "text-red-400" : "text-slate-500"}`}>{invalidCount}</span></div>
                <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Output</span><span className="font-mono text-sm text-orange-400">{OUTPUT_FORMATS.find(f => f.key === outFmt)?.label}</span></div>
              </>
            )}
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              <span className="font-mono text-[10px] text-orange-500/60">Live</span>
            </div>
          </div>
        )}

        {/* Visual palette strip — single mode */}
        {singleRgba && !batchMode && (
          <div className="mb-5">
            <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-2">Opacity Variants</p>
            <div className="flex gap-1.5 flex-wrap">
              {[100, 90, 80, 70, 60, 50, 40, 30, 20, 10].map(opacity => {
                const a = opacity / 100;
                const hex = rgbaToHex({ ...singleRgba, a });
                return (
                  <div key={opacity} className="flex flex-col items-center gap-1 group cursor-pointer"
                    onClick={() => copy(rgbaToString({ ...singleRgba, a }, outFmt), `opacity-${opacity}`)}>
                    <div className="w-10 h-10 rounded-lg border border-white/10 hover:scale-110 transition-transform"
                      style={{ backgroundColor: `rgba(${singleRgba.r},${singleRgba.g},${singleRgba.b},${a})` }}
                      title={hex} />
                    <span className="font-mono text-[9px] text-slate-700 group-hover:text-slate-500">{opacity}%</span>
                    {copied === `opacity-${opacity}` && (
                      <span className="font-mono text-[9px] text-emerald-400">✓</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Batch palette strip */}
        {batchMode && validBatch.length > 0 && (
          <div className="mb-5">
            <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-2">Color Palette Preview</p>
            <div className="flex gap-1.5 flex-wrap">
              {validBatch.map((row, i) => (
                <div key={i} className="flex flex-col items-center gap-1 group cursor-pointer"
                  onClick={() => copy(rgbaToString(row.rgba!, outFmt), `palette-${i}`)}>
                  <div className="w-10 h-10 rounded-lg border border-white/10 hover:scale-110 transition-transform"
                    style={{ backgroundColor: `rgba(${row.rgba!.r},${row.rgba!.g},${row.rgba!.b},${row.rgba!.a})` }}
                    title={rgbaToHex(row.rgba!)} />
                  <span className="font-mono text-[9px] text-slate-700 group-hover:text-slate-500 truncate max-w-[40px] text-center">
                    {rgbaToHex(row.rgba!).slice(0, 7)}
                  </span>
                  {copied === `palette-${i}` && <span className="font-mono text-[9px] text-emerald-400">✓</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "🔄", title: "Any Format In",     desc: "Paste HEX (#RGB, #RRGGBB, #RRGGBBAA), rgb(), rgba(), hsl(), or hsla() — auto-detected." },
            { icon: "📋", title: "8 Formats Out",     desc: "Instantly get RGB, RGBA, HSL, HSLA, HEX, HEX+Alpha, CSS variables, and Tailwind class." },
            { icon: "📦", title: "Batch Conversion",  desc: "Paste a list of colors — one per line — and convert them all at once with Copy All." },
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