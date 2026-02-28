"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useCallback, useMemo } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
type UnitGroup = "absolute" | "relative" | "viewport" | "special";

type UnitDef = {
  unit: string;
  group: UnitGroup;
  label: string;
  desc: string;
  toPixels: (val: number, ctx: ConversionContext) => number;
  fromPixels: (px: number, ctx: ConversionContext) => number;
  useCases: string;
};

type ConversionContext = {
  baseFontSize: number;   // root font size (px) — default 16
  parentFontSize: number; // parent element font size (px)
  viewportW: number;      // viewport width (px)
  viewportH: number;      // viewport height (px)
  dpi: number;            // screen DPI
  containerW: number;     // container width for cqi
};

// ── Unit definitions ───────────────────────────────────────────────────────
const UNIT_DEFS: UnitDef[] = [
  // Absolute
  {
    unit: "px", group: "absolute", label: "Pixel", desc: "Device-independent pixel. The baseline CSS unit.",
    toPixels: (v) => v,
    fromPixels: (px) => px,
    useCases: "Borders, box-shadows, precise layouts",
  },
  {
    unit: "pt", group: "absolute", label: "Point", desc: "1pt = 1/72 inch = 1.333px. Used in print.",
    toPixels: (v) => v * (96 / 72),
    fromPixels: (px) => px * (72 / 96),
    useCases: "Print stylesheets, typography",
  },
  {
    unit: "pc", group: "absolute", label: "Pica", desc: "1pc = 12pt = 16px. Traditional print unit.",
    toPixels: (v) => v * 16,
    fromPixels: (px) => px / 16,
    useCases: "Print layouts",
  },
  {
    unit: "cm", group: "absolute", label: "Centimeter", desc: "1cm = 37.795px at 96dpi.",
    toPixels: (v) => v * 37.7953,
    fromPixels: (px) => px / 37.7953,
    useCases: "Print, physical sizing",
  },
  {
    unit: "mm", group: "absolute", label: "Millimeter", desc: "1mm = 3.7795px at 96dpi.",
    toPixels: (v) => v * 3.77953,
    fromPixels: (px) => px / 3.77953,
    useCases: "Print, precise physical sizing",
  },
  {
    unit: "in", group: "absolute", label: "Inch", desc: "1in = 96px at standard screen DPI.",
    toPixels: (v) => v * 96,
    fromPixels: (px) => px / 96,
    useCases: "Print stylesheets",
  },
  // Relative
  {
    unit: "rem", group: "relative", label: "Root em", desc: "Relative to root (<html>) font-size. Most consistent for spacing.",
    toPixels: (v, c) => v * c.baseFontSize,
    fromPixels: (px, c) => px / c.baseFontSize,
    useCases: "Spacing, font sizes, consistent scaling",
  },
  {
    unit: "em", group: "relative", label: "Em", desc: "Relative to the current element's font-size (or parent's).",
    toPixels: (v, c) => v * c.parentFontSize,
    fromPixels: (px, c) => px / c.parentFontSize,
    useCases: "Font-relative spacing, nested components",
  },
  {
    unit: "%", group: "relative", label: "Percent", desc: "Relative to the parent element's dimension.",
    toPixels: (v, c) => (v / 100) * c.containerW,
    fromPixels: (px, c) => (px / c.containerW) * 100,
    useCases: "Fluid layouts, width/height, positioning",
  },
  {
    unit: "ch", group: "relative", label: "Ch (0 width)", desc: "Width of the '0' character in current font.",
    toPixels: (v, c) => v * (c.parentFontSize * 0.5),
    fromPixels: (px, c) => px / (c.parentFontSize * 0.5),
    useCases: "Form inputs, code blocks, readable line width",
  },
  {
    unit: "ex", group: "relative", label: "Ex (x-height)", desc: "Height of the 'x' character in current font (~0.5em).",
    toPixels: (v, c) => v * (c.parentFontSize * 0.5),
    fromPixels: (px, c) => px / (c.parentFontSize * 0.5),
    useCases: "Fine typography adjustments",
  },
  {
    unit: "lh", group: "relative", label: "Line Height", desc: "Relative to the element's line-height (~1.5em).",
    toPixels: (v, c) => v * (c.parentFontSize * 1.5),
    fromPixels: (px, c) => px / (c.parentFontSize * 1.5),
    useCases: "Vertical rhythm, block spacing",
  },
  // Viewport
  {
    unit: "vw", group: "viewport", label: "Viewport Width", desc: "1vw = 1% of viewport width.",
    toPixels: (v, c) => (v / 100) * c.viewportW,
    fromPixels: (px, c) => (px / c.viewportW) * 100,
    useCases: "Fluid typography, full-width layouts",
  },
  {
    unit: "vh", group: "viewport", label: "Viewport Height", desc: "1vh = 1% of viewport height.",
    toPixels: (v, c) => (v / 100) * c.viewportH,
    fromPixels: (px, c) => (px / c.viewportH) * 100,
    useCases: "Full-screen sections, hero heights",
  },
  {
    unit: "vmin", group: "viewport", label: "Viewport Min", desc: "1vmin = 1% of the smaller viewport dimension.",
    toPixels: (v, c) => (v / 100) * Math.min(c.viewportW, c.viewportH),
    fromPixels: (px, c) => (px / Math.min(c.viewportW, c.viewportH)) * 100,
    useCases: "Responsive elements that fit both orientations",
  },
  {
    unit: "vmax", group: "viewport", label: "Viewport Max", desc: "1vmax = 1% of the larger viewport dimension.",
    toPixels: (v, c) => (v / 100) * Math.max(c.viewportW, c.viewportH),
    fromPixels: (px, c) => (px / Math.max(c.viewportW, c.viewportH)) * 100,
    useCases: "Decoration, full-bleed backgrounds",
  },
  {
    unit: "svh", group: "viewport", label: "Small Viewport H", desc: "Smallest possible viewport height (mobile, with UI bars visible).",
    toPixels: (v, c) => (v / 100) * (c.viewportH * 0.9),
    fromPixels: (px, c) => (px / (c.viewportH * 0.9)) * 100,
    useCases: "Mobile-safe full-screen height",
  },
  {
    unit: "dvh", group: "viewport", label: "Dynamic Viewport H", desc: "Updates dynamically as mobile browser UI shows/hides.",
    toPixels: (v, c) => (v / 100) * c.viewportH,
    fromPixels: (px, c) => (px / c.viewportH) * 100,
    useCases: "Modern mobile full-screen layouts",
  },
  {
    unit: "lvh", group: "viewport", label: "Large Viewport H", desc: "Largest possible viewport height (mobile, UI fully hidden).",
    toPixels: (v, c) => (v / 100) * (c.viewportH * 1.1),
    fromPixels: (px, c) => (px / (c.viewportH * 1.1)) * 100,
    useCases: "Initial load layout, maximized viewport",
  },
  // Special
  {
    unit: "fr", group: "special", label: "Fraction (Grid)", desc: "Fractional unit for CSS Grid track sizing.",
    toPixels: (v, c) => v * (c.containerW / 12),
    fromPixels: (px, c) => px / (c.containerW / 12),
    useCases: "CSS Grid layouts, column distribution",
  },
  {
    unit: "cqw", group: "special", label: "Container Query Width", desc: "1cqw = 1% of container width (container queries).",
    toPixels: (v, c) => (v / 100) * c.containerW,
    fromPixels: (px, c) => (px / c.containerW) * 100,
    useCases: "Container-responsive components",
  },
];

const GROUP_COLORS: Record<UnitGroup, string> = {
  absolute: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  relative: "bg-orange-500/15 text-orange-400 border-orange-500/25",
  viewport: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  special:  "bg-purple-500/15 text-purple-400 border-purple-500/25",
};

const GROUP_LABELS: Record<UnitGroup, string> = {
  absolute: "Absolute",
  relative: "Relative",
  viewport: "Viewport",
  special:  "Special",
};

function fmt(n: number): string {
  if (Math.abs(n) < 0.001) return "0";
  if (Math.abs(n) >= 1000) return n.toFixed(2);
  if (Math.abs(n) >= 100)  return n.toFixed(3);
  if (Math.abs(n) >= 10)   return n.toFixed(4);
  return n.toFixed(5).replace(/\.?0+$/, "");
}

// ── Common CSS snippets that use each unit ─────────────────────────────────
const SNIPPETS: Record<string, string[]> = {
  px:   ["border: 1px solid;", "box-shadow: 0 4px 12px rgba(0,0,0,0.1);", "border-radius: 8px;"],
  rem:  ["font-size: 1rem;", "padding: 1.5rem 2rem;", "gap: 0.75rem;"],
  em:   ["padding: 0.5em 1em;", "margin-bottom: 1.2em;", "line-height: 1.6em;"],
  "%":  ["width: 100%;", "height: 50%;", "left: 50%; transform: translateX(-50%);"],
  vw:   ["width: 100vw;", "font-size: clamp(1rem, 4vw, 2rem);", "padding: 0 5vw;"],
  vh:   ["height: 100vh;", "min-height: 50vh;", "padding-top: 20vh;"],
  vmin: ["font-size: 5vmin;", "width: 80vmin;"],
  vmax: ["background-size: 100vmax;"],
  ch:   ["max-width: 65ch;", "width: 20ch; /* input */"],
  fr:   ["grid-template-columns: 1fr 2fr 1fr;", "grid-template-columns: repeat(3, 1fr);"],
  cm:   ["width: 21cm; /* A4 */", "margin: 2.54cm;"],
  mm:   ["border: 1mm solid;"],
  pt:   ["font-size: 12pt; /* print */"],
  cqw:  ["font-size: 5cqw;", "@container { width: 50cqw; }"],
  dvh:  ["height: 100dvh; /* mobile-safe */"],
  svh:  ["min-height: 100svh;"],
  lvh:  ["max-height: 100lvh;"],
};

// ── Component ──────────────────────────────────────────────────────────────
export default function CssUnits() {
  const [value, setValue]   = useState(16);
  const [fromUnit, setFromUnit] = useState("px");
  const [copied, setCopied] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState<UnitGroup | "all">("all");
  const [activeDetail, setActiveDetail] = useState<string | null>(null);

  // Context settings
  const [baseFontSize,   setBaseFontSize]   = useState(16);
  const [parentFontSize, setParentFontSize] = useState(16);
  const [viewportW,      setViewportW]      = useState(1440);
  const [viewportH,      setViewportH]      = useState(900);
  const [containerW,     setContainerW]     = useState(1200);
  const [dpi,            setDpi]            = useState(96);

  const ctx: ConversionContext = { baseFontSize, parentFontSize, viewportW, viewportH, dpi, containerW };

  const sourceDef = UNIT_DEFS.find(u => u.unit === fromUnit)!;
  const valueInPx = sourceDef.toPixels(value, ctx);

  const conversions = useMemo(() => {
    return UNIT_DEFS.map(u => ({
      ...u,
      result: u.fromPixels(valueInPx, ctx),
    }));
  }, [valueInPx, ctx]);

  const filtered = useMemo(() => {
    return conversions.filter(u => {
      const matchSearch = !search || u.unit.includes(search.toLowerCase()) || u.label.toLowerCase().includes(search.toLowerCase());
      const matchGroup  = filterGroup === "all" || u.group === filterGroup;
      return matchSearch && matchGroup;
    });
  }, [conversions, search, filterGroup]);

  const copy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1600);
  }, []);

  const detailUnit = activeDetail ? UNIT_DEFS.find(u => u.unit === activeDetail) : null;
  const detailConv = activeDetail ? conversions.find(u => u.unit === activeDetail) : null;

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-orange-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

      <ToolNavbar toolName="CSS Units" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-orange-500/10 flex items-center justify-center font-mono font-bold text-orange-400 text-sm">px</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">CSS Units Converter</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded">real-time</span>
          </div>
          <p className="text-slate-500 text-sm">
            Convert between all CSS units — px, rem, em, vw, vh, ch, fr, cm, pt and more. Set your own context (font size, viewport, DPI).
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">

          {/* ── LEFT: Input + Context ── */}
          <div className="flex flex-col gap-4">

            {/* Main input */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-5">
              <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-4">Convert From</p>

              <div className="flex items-stretch gap-2 mb-4">
                <input
                  type="number"
                  value={value}
                  onChange={e => setValue(parseFloat(e.target.value) || 0)}
                  className="flex-1 font-mono text-2xl font-bold bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-orange-400 outline-none focus:border-orange-500/40 transition-colors text-right"
                />
                <div className="flex flex-col justify-center gap-1">
                  <button onClick={() => setValue(v => v + 1)} className="w-8 h-7 bg-white/[0.04] border border-white/[0.06] rounded text-slate-500 hover:text-slate-300 text-xs transition-all">▲</button>
                  <button onClick={() => setValue(v => Math.max(0, v - 1))} className="w-8 h-7 bg-white/[0.04] border border-white/[0.06] rounded text-slate-500 hover:text-slate-300 text-xs transition-all">▼</button>
                </div>
              </div>

              {/* Unit selector */}
              <div className="grid grid-cols-4 gap-1.5">
                {UNIT_DEFS.map(u => (
                  <button key={u.unit} onClick={() => setFromUnit(u.unit)}
                    className={`font-mono text-xs py-1.5 rounded border transition-all
                      ${fromUnit === u.unit ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                    {u.unit}
                  </button>
                ))}
              </div>

              {/* Equals in px */}
              <div className="mt-4 px-3 py-2 bg-orange-500/[0.06] border border-orange-500/20 rounded-lg flex items-center justify-between">
                <span className="font-mono text-[11px] text-orange-500/60">= in pixels</span>
                <span className="font-mono text-lg font-bold text-orange-400">{fmt(valueInPx)} px</span>
              </div>
            </div>

            {/* Context settings */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-5">
              <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-4">Context</p>
              <div className="space-y-3">
                {[
                  { label: "Root font-size",   val: baseFontSize,   set: setBaseFontSize,   unit: "px", min: 8, max: 32 },
                  { label: "Parent font-size",  val: parentFontSize, set: setParentFontSize, unit: "px", min: 8, max: 48 },
                  { label: "Viewport width",    val: viewportW,      set: setViewportW,      unit: "px", min: 320, max: 3840 },
                  { label: "Viewport height",   val: viewportH,      set: setViewportH,      unit: "px", min: 320, max: 2160 },
                  { label: "Container width",   val: containerW,     set: setContainerW,     unit: "px", min: 100, max: 3840 },
                  { label: "Screen DPI",        val: dpi,            set: setDpi,            unit: "dpi", min: 72, max: 300 },
                ].map(({ label, val, set, unit, min, max }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] text-slate-600 uppercase tracking-widest">{label}</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={val}
                          onChange={e => set(Number(e.target.value))}
                          min={min} max={max}
                          className="w-20 font-mono text-xs text-orange-400 bg-white/[0.04] border border-white/[0.06] rounded px-2 py-0.5 outline-none text-right"
                        />
                        <span className="font-mono text-[10px] text-slate-600">{unit}</span>
                      </div>
                    </div>
                    <input type="range" min={min} max={max} value={val}
                      onChange={e => set(Number(e.target.value))}
                      className="w-full accent-orange-500 h-1" />
                  </div>
                ))}
              </div>

              {/* Viewport presets */}
              <div className="mt-3 pt-3 border-t border-white/[0.06]">
                <p className="font-mono text-[10px] text-slate-700 mb-2">Viewport Presets</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "Mobile",  w: 375,  h: 812  },
                    { label: "Tablet",  w: 768,  h: 1024 },
                    { label: "Desktop", w: 1440, h: 900  },
                    { label: "4K",      w: 3840, h: 2160 },
                  ].map(p => (
                    <button key={p.label} onClick={() => { setViewportW(p.w); setViewportH(p.h); }}
                      className="font-mono text-[10px] px-2 py-1 rounded border border-white/[0.08] text-slate-600 hover:text-slate-300 hover:border-white/20 transition-all">
                      {p.label} {p.w}×{p.h}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Conversion results ── */}
          <div className="flex flex-col gap-4">

            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-2">
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search units…"
                className="font-mono text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-slate-300 placeholder-slate-600 outline-none focus:border-orange-500/30 transition-colors w-40" />

              <div className="flex gap-1">
                {(["all", "absolute", "relative", "viewport", "special"] as const).map(g => (
                  <button key={g} onClick={() => setFilterGroup(g)}
                    className={`font-mono text-[10px] px-2.5 py-1 rounded border transition-all capitalize
                      ${filterGroup === g ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Group sections */}
            {(["absolute", "relative", "viewport", "special"] as UnitGroup[]).map(group => {
              const groupUnits = filtered.filter(u => u.group === group);
              if (groupUnits.length === 0) return null;
              return (
                <div key={group}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded border ${GROUP_COLORS[group]}`}>
                      {GROUP_LABELS[group]}
                    </span>
                    <div className="flex-1 h-px bg-white/[0.06]" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                    {groupUnits.map(u => {
                      const isSource = u.unit === fromUnit;
                      const isDetail = activeDetail === u.unit;
                      return (
                        <div key={u.unit}
                          className={`rounded-xl border transition-all cursor-pointer ${isSource ? "bg-orange-500/[0.08] border-orange-500/30" : isDetail ? "bg-white/[0.05] border-white/20" : "bg-white/[0.02] border-white/[0.06] hover:border-white/20 hover:bg-white/[0.03]"}`}
                          onClick={() => setActiveDetail(activeDetail === u.unit ? null : u.unit)}
                        >
                          <div className="px-4 py-3">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2">
                                <span className={`font-mono text-base font-black ${isSource ? "text-orange-400" : "text-slate-200"}`}>
                                  {u.unit}
                                </span>
                                <span className="font-mono text-[10px] text-slate-600">{u.label}</span>
                              </div>
                              <button
                                onClick={e => { e.stopPropagation(); copy(`${fmt(u.result)}${u.unit}`, u.unit); }}
                                className={`font-mono text-[10px] px-2 py-0.5 rounded border transition-all shrink-0
                                  ${copied === u.unit ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-600 hover:text-slate-300"}`}>
                                {copied === u.unit ? "✓" : "copy"}
                              </button>
                            </div>

                            <div className="flex items-baseline gap-1">
                              <span className={`font-mono text-xl font-bold ${isSource ? "text-orange-300" : "text-slate-100"}`}>
                                {fmt(u.result)}
                              </span>
                              <span className={`font-mono text-sm ${isSource ? "text-orange-500/60" : "text-slate-500"}`}>
                                {u.unit}
                              </span>
                            </div>

                            {/* Visual bar */}
                            <div className="mt-2 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${isSource ? "bg-orange-500/60" : "bg-white/20"}`}
                                style={{ width: `${Math.min(100, Math.abs(u.result / (u.result || 1)) * 20)}%` }}
                              />
                            </div>
                          </div>

                          {/* Expanded detail */}
                          {isDetail && (
                            <div className="px-4 pb-3 border-t border-white/[0.06] pt-3 space-y-2" onClick={e => e.stopPropagation()}>
                              <p className="font-mono text-[10px] text-slate-500 leading-relaxed">{u.desc}</p>
                              <p className="font-mono text-[10px] text-slate-600">
                                <span className="text-slate-500">Use: </span>{u.useCases}
                              </p>
                              {SNIPPETS[u.unit] && (
                                <div className="space-y-1">
                                  <p className="font-mono text-[9px] uppercase tracking-widest text-slate-700">Examples</p>
                                  {SNIPPETS[u.unit].map((s, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                      <code className="flex-1 font-mono text-[10px] text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded">{s}</code>
                                      <button onClick={() => copy(s, `snip-${i}`)}
                                        className={`font-mono text-[9px] px-1.5 py-0.5 rounded border transition-all
                                          ${copied === `snip-${i}` ? "text-emerald-400 border-emerald-500/30" : "border-white/[0.08] text-slate-700 hover:text-slate-400"}`}>
                                        {copied === `snip-${i}` ? "✓" : "⊕"}
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <button
                                onClick={() => setFromUnit(u.unit)}
                                className="font-mono text-[10px] px-3 py-1 rounded border border-orange-500/20 text-orange-400/70 hover:text-orange-400 hover:border-orange-500/40 transition-all w-full text-center">
                                Set as source unit
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex flex-wrap gap-6 px-4 py-3 bg-orange-500/[0.05] border border-orange-500/20 rounded-lg mt-5 mb-5">
          <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Input</span><span className="font-mono text-sm text-orange-400">{value} {fromUnit}</span></div>
          <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">= Pixels</span><span className="font-mono text-sm text-orange-400">{fmt(valueInPx)} px</span></div>
          <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Root em</span><span className="font-mono text-sm text-orange-400">{baseFontSize}px</span></div>
          <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Viewport</span><span className="font-mono text-sm text-orange-400">{viewportW}×{viewportH}</span></div>
          <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Units</span><span className="font-mono text-sm text-orange-400">{UNIT_DEFS.length}</span></div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            <span className="font-mono text-[10px] text-orange-500/60">Live</span>
          </div>
        </div>

        {/* Reference table */}
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl overflow-hidden mb-5">
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600">Quick Reference — Common Conversions</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["px", "rem", "em", "pt", "vw (1440)", "vh (900)"].map(h => (
                    <th key={h} className="font-mono text-[10px] uppercase tracking-widest text-slate-600 px-4 py-2 text-right first:text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {[1, 2, 4, 8, 12, 16, 24, 32, 48, 64].map(px => {
                  const remV  = fmt(px / baseFontSize);
                  const emV   = fmt(px / parentFontSize);
                  const ptV   = fmt(px * (72 / 96));
                  const vwV   = fmt((px / viewportW) * 100);
                  const vhV   = fmt((px / viewportH) * 100);
                  const isMatch = Math.abs(valueInPx - px) < 0.5;
                  return (
                    <tr key={px}
                      className={`cursor-pointer transition-colors ${isMatch ? "bg-orange-500/10" : "hover:bg-white/[0.02]"}`}
                      onClick={() => { setValue(px); setFromUnit("px"); }}>
                      <td className="font-mono text-sm px-4 py-2 text-orange-400 font-bold">{px}</td>
                      <td className="font-mono text-xs px-4 py-2 text-slate-400 text-right">{remV}</td>
                      <td className="font-mono text-xs px-4 py-2 text-slate-400 text-right">{emV}</td>
                      <td className="font-mono text-xs px-4 py-2 text-slate-400 text-right">{ptV}</td>
                      <td className="font-mono text-xs px-4 py-2 text-slate-400 text-right">{vwV}</td>
                      <td className="font-mono text-xs px-4 py-2 text-slate-400 text-right">{vhV}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-white/[0.06] font-mono text-[10px] text-slate-700">
            Click any row to set as input. rem/em based on {baseFontSize}px root font. vw/vh based on {viewportW}×{viewportH} viewport.
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "🔢", title: "20 CSS Units",     desc: "px, rem, em, %, ch, vw, vh, vmin, vmax, svh, dvh, lvh, fr, cqw, pt, pc, cm, mm, in, ex — all supported." },
            { icon: "⚙️", title: "Custom Context",   desc: "Set your own root font size, parent font size, viewport dimensions, container width and DPI." },
            { icon: "📋", title: "Code Snippets",    desc: "Click any unit card to see common CSS usage examples with copy buttons." },
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