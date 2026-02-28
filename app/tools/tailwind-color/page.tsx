"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useMemo } from "react";

// ── Full Tailwind v3 color palette ────────────────────────────
const COLORS = {
  slate:   { 50:"#f8fafc",100:"#f1f5f9",200:"#e2e8f0",300:"#cbd5e1",400:"#94a3b8",500:"#64748b",600:"#475569",700:"#334155",800:"#1e293b",900:"#0f172a",950:"#020617" },
  gray:    { 50:"#f9fafb",100:"#f3f4f6",200:"#e5e7eb",300:"#d1d5db",400:"#9ca3af",500:"#6b7280",600:"#4b5563",700:"#374151",800:"#1f2937",900:"#111827",950:"#030712" },
  zinc:    { 50:"#fafafa",100:"#f4f4f5",200:"#e4e4e7",300:"#d4d4d8",400:"#a1a1aa",500:"#71717a",600:"#52525b",700:"#3f3f46",800:"#27272a",900:"#18181b",950:"#09090b" },
  neutral: { 50:"#fafafa",100:"#f5f5f5",200:"#e5e5e5",300:"#d4d4d4",400:"#a3a3a3",500:"#737373",600:"#525252",700:"#404040",800:"#262626",900:"#171717",950:"#0a0a0a" },
  stone:   { 50:"#fafaf9",100:"#f5f5f4",200:"#e7e5e4",300:"#d6d3d1",400:"#a8a29e",500:"#78716c",600:"#57534e",700:"#44403c",800:"#292524",900:"#1c1917",950:"#0c0a09" },
  red:     { 50:"#fef2f2",100:"#fee2e2",200:"#fecaca",300:"#fca5a5",400:"#f87171",500:"#ef4444",600:"#dc2626",700:"#b91c1c",800:"#991b1b",900:"#7f1d1d",950:"#450a0a" },
  orange:  { 50:"#fff7ed",100:"#ffedd5",200:"#fed7aa",300:"#fdba74",400:"#fb923c",500:"#f97316",600:"#ea580c",700:"#c2410c",800:"#9a3412",900:"#7c2d12",950:"#431407" },
  amber:   { 50:"#fffbeb",100:"#fef3c7",200:"#fde68a",300:"#fcd34d",400:"#fbbf24",500:"#f59e0b",600:"#d97706",700:"#b45309",800:"#92400e",900:"#78350f",950:"#451a03" },
  yellow:  { 50:"#fefce8",100:"#fef9c3",200:"#fef08a",300:"#fde047",400:"#facc15",500:"#eab308",600:"#ca8a04",700:"#a16207",800:"#854d0e",900:"#713f12",950:"#422006" },
  lime:    { 50:"#f7fee7",100:"#ecfccb",200:"#d9f99d",300:"#bef264",400:"#a3e635",500:"#84cc16",600:"#65a30d",700:"#4d7c0f",800:"#3f6212",900:"#365314",950:"#1a2e05" },
  green:   { 50:"#f0fdf4",100:"#dcfce7",200:"#bbf7d0",300:"#86efac",400:"#4ade80",500:"#22c55e",600:"#16a34a",700:"#15803d",800:"#166534",900:"#14532d",950:"#052e16" },
  emerald: { 50:"#ecfdf5",100:"#d1fae5",200:"#a7f3d0",300:"#6ee7b7",400:"#34d399",500:"#10b981",600:"#059669",700:"#047857",800:"#065f46",900:"#064e3b",950:"#022c22" },
  teal:    { 50:"#f0fdfa",100:"#ccfbf1",200:"#99f6e4",300:"#5eead4",400:"#2dd4bf",500:"#14b8a6",600:"#0d9488",700:"#0f766e",800:"#115e59",900:"#134e4a",950:"#042f2e" },
  cyan:    { 50:"#ecfeff",100:"#cffafe",200:"#a5f3fc",300:"#67e8f9",400:"#22d3ee",500:"#06b6d4",600:"#0891b2",700:"#0e7490",800:"#155e75",900:"#164e63",950:"#083344" },
  sky:     { 50:"#f0f9ff",100:"#e0f2fe",200:"#bae6fd",300:"#7dd3fc",400:"#38bdf8",500:"#0ea5e9",600:"#0284c7",700:"#0369a1",800:"#075985",900:"#0c4a6e",950:"#082f49" },
  blue:    { 50:"#eff6ff",100:"#dbeafe",200:"#bfdbfe",300:"#93c5fd",400:"#60a5fa",500:"#3b82f6",600:"#2563eb",700:"#1d4ed8",800:"#1e40af",900:"#1e3a8a",950:"#172554" },
  indigo:  { 50:"#eef2ff",100:"#e0e7ff",200:"#c7d2fe",300:"#a5b4fc",400:"#818cf8",500:"#6366f1",600:"#4f46e5",700:"#4338ca",800:"#3730a3",900:"#312e81",950:"#1e1b4b" },
  violet:  { 50:"#f5f3ff",100:"#ede9fe",200:"#ddd6fe",300:"#c4b5fd",400:"#a78bfa",500:"#8b5cf6",600:"#7c3aed",700:"#6d28d9",800:"#5b21b6",900:"#4c1d95",950:"#2e1065" },
  purple:  { 50:"#faf5ff",100:"#f3e8ff",200:"#e9d5ff",300:"#d8b4fe",400:"#c084fc",500:"#a855f7",600:"#9333ea",700:"#7e22ce",800:"#6b21a8",900:"#581c87",950:"#3b0764" },
  fuchsia: { 50:"#fdf4ff",100:"#fae8ff",200:"#f5d0fe",300:"#f0abfc",400:"#e879f9",500:"#d946ef",600:"#c026d3",700:"#a21caf",800:"#86198f",900:"#701a75",950:"#4a044e" },
  pink:    { 50:"#fdf2f8",100:"#fce7f3",200:"#fbcfe8",300:"#f9a8d4",400:"#f472b6",500:"#ec4899",600:"#db2777",700:"#be185d",800:"#9d174d",900:"#831843",950:"#500724" },
  rose:    { 50:"#fff1f2",100:"#ffe4e6",200:"#fecdd3",300:"#fda4af",400:"#fb7185",500:"#f43f5e",600:"#e11d48",700:"#be123c",800:"#9f1239",900:"#881337",950:"#4c0519" },
} as const;

type ColorName = keyof typeof COLORS;
type Shade = keyof typeof COLORS[ColorName];

const SHADE_KEYS = [50,100,200,300,400,500,600,700,800,900,950] as const;

// ── Helpers ───────────────────────────────────────────────────
function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return { r, g, b };
}

function hexToHsl(hex: string) {
  let { r, g, b } = hexToRgb(hex);
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h = 0, s = 0;
  const l = (max+min)/2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch(max) {
      case r: h = ((g-b)/d + (g<b?6:0))/6; break;
      case g: h = ((b-r)/d + 2)/6; break;
      case b: h = ((r-g)/d + 4)/6; break;
    }
  }
  return { h: Math.round(h*360), s: Math.round(s*100), l: Math.round(l*100) };
}

function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const srgb = [r,g,b].map(v => { v/=255; return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4); });
  return 0.2126*srgb[0] + 0.7152*srgb[1] + 0.0722*srgb[2];
}

function contrast(hex1: string, hex2: string) {
  const l1 = luminance(hex1), l2 = luminance(hex2);
  const bright = Math.max(l1,l2), dark = Math.min(l1,l2);
  return ((bright+0.05)/(dark+0.05)).toFixed(1);
}

function isDark(hex: string) { return luminance(hex) < 0.4; }

// Find closest Tailwind color to a hex value
function findClosest(hex: string): { name: ColorName; shade: string; color: string; distance: number } | null {
  const { r: tr, g: tg, b: tb } = hexToRgb(hex);
  let best: { name: ColorName; shade: string; color: string; distance: number } | null = null;
  let bestDist = Infinity;
  for (const [name, shades] of Object.entries(COLORS)) {
    for (const [shade, color] of Object.entries(shades)) {
      const { r, g, b } = hexToRgb(color as string);
      const dist = Math.sqrt((r-tr)**2 + (g-tg)**2 + (b-tb)**2);
      if (dist < bestDist) { bestDist = dist; best = { name: name as ColorName, shade, color: color as string, distance: dist }; }
    }
  }
  return best;
}

const COLOR_NAMES = Object.keys(COLORS) as ColorName[];

const CATEGORIES = [
  { label: "All",     filter: () => true },
  { label: "Grays",   filter: (n: string) => ["slate","gray","zinc","neutral","stone"].includes(n) },
  { label: "Reds",    filter: (n: string) => ["red","orange","amber"].includes(n) },
  { label: "Greens",  filter: (n: string) => ["lime","green","emerald","teal"].includes(n) },
  { label: "Blues",   filter: (n: string) => ["cyan","sky","blue","indigo"].includes(n) },
  { label: "Purples", filter: (n: string) => ["violet","purple","fuchsia","pink","rose"].includes(n) },
];

const COPY_FORMATS = [
  { key: "class",   label: "Class",   format: (name: string, shade: string | number) => `${name}-${shade}` },
  { key: "bg",      label: "BG",      format: (name: string, shade: string | number) => `bg-${name}-${shade}` },
  { key: "text",    label: "Text",    format: (name: string, shade: string | number) => `text-${name}-${shade}` },
  { key: "border",  label: "Border",  format: (name: string, shade: string | number) => `border-${name}-${shade}` },
  { key: "hex",     label: "Hex",     format: (_: string, __: string | number, hex: string) => hex },
  { key: "rgb",     label: "RGB",     format: (_: string, __: string | number, hex: string) => { const {r,g,b} = hexToRgb(hex); return `rgb(${r},${g},${b})`; } },
];

export default function TailwindColor() {
  const [search, setSearch]           = useState("");
  const [category, setCategory]       = useState("All");
  const [selectedColor, setSelectedColor] = useState<{ name: ColorName; shade: number } | null>({ name: "indigo", shade: 500 });
  const [copyFormat, setCopyFormat]   = useState("bg");
  const [copied, setCopied]           = useState<string | null>(null);
  const [pickerHex, setPickerHex]     = useState("#6366f1");
  const [closestResult, setClosestResult] = useState<ReturnType<typeof findClosest>>(null);

  const filteredColors = useMemo(() => {
    const cat = CATEGORIES.find(c => c.label === category)!;
    return COLOR_NAMES.filter(name => {
      const matchCat = cat.filter(name);
      const matchSearch = !search || name.includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [search, category]);

  const selectedHex = selectedColor
    ? (COLORS[selectedColor.name] as Record<number, string>)[selectedColor.shade]
    : null;

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const findClosestColor = () => {
    const result = findClosest(pickerHex);
    setClosestResult(result);
    if (result) setSelectedColor({ name: result.name as ColorName, shade: parseInt(result.shade) });
  };

  const getFormatted = (name: string, shade: number | string, hex: string, fmtKey: string) => {
    const fmt = COPY_FORMATS.find(f => f.key === fmtKey);
    return fmt ? fmt.format(name, shade, hex) : hex;
  };

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-indigo-500/[0.06] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-cyan-500/[0.04] blur-3xl pointer-events-none" />

      {/* NAV */}

      <ToolNavbar toolName="Tailwind Colors"/>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-indigo-500/10 flex items-center justify-center text-lg">🎨</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Tailwind Color Finder</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded">{COLOR_NAMES.length} palettes · {COLOR_NAMES.length * 11} colors</span>
          </div>
          <p className="text-slate-500 text-sm">Browse all Tailwind CSS v3 colors. Click any swatch to copy class names, hex, or RGB. Find the closest Tailwind color to any hex.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

          {/* Color palette grid — main */}
          <div className="xl:col-span-3 flex flex-col gap-5">

            {/* Search + filter */}
            <div className="flex flex-wrap items-center gap-3">
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search colors (e.g. blue, rose…)"
                className="font-mono text-xs px-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-slate-300 placeholder-slate-700 outline-none focus:border-indigo-500/30 w-56 transition-colors" />
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map(cat => (
                  <button key={cat.label} onClick={() => setCategory(cat.label)}
                    className={`font-mono text-[11px] px-3 py-1.5 rounded border transition-all ${category === cat.label ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-400" : "border-white/[0.08] text-slate-600 hover:text-slate-300"}`}>
                    {cat.label}
                  </button>
                ))}
              </div>
              <span className="font-mono text-[10px] text-slate-700 ml-auto">{filteredColors.length} palettes</span>
            </div>

            {/* Shade header */}
            <div className="flex items-center gap-2">
              <div className="w-20 shrink-0" />
              <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${SHADE_KEYS.length}, 1fr)` }}>
                {SHADE_KEYS.map(s => (
                  <div key={s} className="font-mono text-[9px] text-slate-700 text-center">{s}</div>
                ))}
              </div>
            </div>

            {/* Color rows */}
            <div className="flex flex-col gap-1">
              {filteredColors.map(name => (
                <div key={name} className="flex items-center gap-2 group">
                  {/* Name */}
                  <div className="w-20 shrink-0">
                    <span className="font-mono text-xs text-slate-600 group-hover:text-slate-400 transition-colors capitalize">{name}</span>
                  </div>

                  {/* Swatches */}
                  <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${SHADE_KEYS.length}, 1fr)` }}>
                    {SHADE_KEYS.map(shade => {
                      const hex = (COLORS[name] as Record<number,string>)[shade];
                      const isSelected = selectedColor?.name === name && selectedColor?.shade === shade;
                      return (
                        <button key={shade} onClick={() => setSelectedColor({ name, shade })} title={`${name}-${shade}`}
                          className={`aspect-square rounded-md transition-all hover:scale-110 hover:z-10 relative ${isSelected ? "ring-2 ring-white ring-offset-1 ring-offset-[#09090f] scale-110 z-10" : ""}`}
                          style={{ backgroundColor: hex }}>
                          {isSelected && (
                            <div className={`absolute inset-0 flex items-center justify-center rounded-md ${isDark(hex) ? "text-white" : "text-black"}`}>
                              <span className="text-[8px]">✓</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {filteredColors.length === 0 && (
                <div className="text-center py-8 font-mono text-sm text-slate-700">No colors found for "{search}"</div>
              )}
            </div>
          </div>

          {/* Sidebar — right */}
          <div className="xl:col-span-1 flex flex-col gap-4">

            {/* Selected color detail */}
            {selectedColor && selectedHex && (
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
                {/* Big swatch */}
                <div className="h-28 relative" style={{ backgroundColor: selectedHex }}>
                  <div className={`absolute bottom-2 left-3 ${isDark(selectedHex) ? "text-white/70" : "text-black/50"} font-mono text-[10px]`}>
                    {selectedColor.name}-{selectedColor.shade}
                  </div>
                </div>

                <div className="p-4 flex flex-col gap-3">
                  {/* Name + shade */}
                  <div>
                    <div className="font-mono text-base font-bold text-white capitalize">{selectedColor.name}</div>
                    <div className="font-mono text-sm text-slate-500">{selectedColor.shade}</div>
                  </div>

                  {/* Color values */}
                  {[
                    { label: "Hex", val: selectedHex },
                    { label: "RGB", val: (() => { const {r,g,b} = hexToRgb(selectedHex); return `rgb(${r}, ${g}, ${b})`; })() },
                    { label: "HSL", val: (() => { const {h,s,l} = hexToHsl(selectedHex); return `hsl(${h}, ${s}%, ${l}%)`; })() },
                  ].map(item => (
                    <button key={item.label} onClick={() => copy(item.val, item.label)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all group text-left ${copied === item.label ? "bg-emerald-500/10 border-emerald-500/20" : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.14]"}`}>
                      <div>
                        <div className="font-mono text-[9px] text-slate-700">{item.label}</div>
                        <div className={`font-mono text-xs ${copied === item.label ? "text-emerald-400" : "text-slate-300"}`}>{item.val}</div>
                      </div>
                      <span className={`font-mono text-[10px] transition-all ${copied === item.label ? "text-emerald-400" : "text-slate-700 group-hover:text-slate-400"}`}>
                        {copied === item.label ? "✓" : "copy"}
                      </span>
                    </button>
                  ))}

                  {/* Copy format */}
                  <div>
                    <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-2">Copy as class</div>
                    <div className="grid grid-cols-3 gap-1 mb-2">
                      {COPY_FORMATS.map(fmt => (
                        <button key={fmt.key} onClick={() => setCopyFormat(fmt.key)}
                          className={`font-mono text-[10px] py-1.5 rounded border transition-all ${copyFormat === fmt.key ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-400" : "border-white/[0.08] text-slate-600 hover:text-slate-300"}`}>
                          {fmt.label}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => {
                      const val = getFormatted(selectedColor.name, selectedColor.shade, selectedHex, copyFormat);
                      copy(val, "class");
                    }}
                      className={`w-full font-mono text-xs py-2.5 rounded-lg border transition-all ${copied === "class" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-indigo-500/15 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/25"}`}>
                      {copied === "class"
                        ? "✓ Copied!"
                        : getFormatted(selectedColor.name, selectedColor.shade, selectedHex, copyFormat)
                      }
                    </button>
                  </div>

                  {/* Contrast */}
                  <div>
                    <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-2">Contrast Ratio</div>
                    <div className="flex gap-2">
                      {[
                        { label: "vs White", bg: "#ffffff", text: selectedHex },
                        { label: "vs Black", bg: "#000000", text: selectedHex },
                      ].map(({ label, bg, text }) => {
                        const ratio = parseFloat(contrast(bg, text));
                        const pass = ratio >= 4.5 ? "AA ✓" : ratio >= 3 ? "AA Large" : "Fail";
                        const passColor = ratio >= 4.5 ? "text-emerald-400" : ratio >= 3 ? "text-yellow-400" : "text-red-400";
                        return (
                          <div key={label} className="flex-1 bg-white/[0.02] border border-white/[0.06] rounded-lg px-2 py-2 text-center">
                            <div className="font-mono text-[9px] text-slate-700 mb-1">{label}</div>
                            <div className="font-mono text-sm font-bold text-white">{ratio}</div>
                            <div className={`font-mono text-[9px] ${passColor}`}>{pass}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Full shade strip */}
                  <div>
                    <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-2">All Shades</div>
                    <div className="flex rounded-lg overflow-hidden h-6">
                      {SHADE_KEYS.map(s => (
                        <button key={s} onClick={() => setSelectedColor({ name: selectedColor.name, shade: s })}
                          title={`${selectedColor.name}-${s}`}
                          className={`flex-1 transition-all hover:scale-y-125 ${selectedColor.shade === s ? "ring-1 ring-white" : ""}`}
                          style={{ backgroundColor: (COLORS[selectedColor.name] as Record<number,string>)[s] }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Hex finder */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">Find Closest Tailwind Color</div>
              <div className="flex items-center gap-2 mb-3">
                <input type="color" value={pickerHex} onChange={e => setPickerHex(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0 shrink-0" />
                <input value={pickerHex} onChange={e => setPickerHex(e.target.value)}
                  className="flex-1 font-mono text-xs px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded text-slate-300 outline-none focus:border-indigo-500/30" />
              </div>
              <button onClick={findClosestColor}
                className="w-full font-mono text-xs py-2 bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 rounded-lg hover:bg-indigo-500/25 transition-all">
                🔍 Find Closest
              </button>

              {closestResult && (
                <div className="mt-3 bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-md border border-white/10" style={{ backgroundColor: closestResult.color }} />
                    <div>
                      <div className="font-mono text-xs font-bold text-white capitalize">{closestResult.name}-{closestResult.shade}</div>
                      <div className="font-mono text-[10px] text-slate-600">{closestResult.color} · Δ {Math.round(closestResult.distance)}</div>
                    </div>
                  </div>
                  <button onClick={() => copy(`bg-${closestResult.name}-${closestResult.shade}`, "closest")}
                    className={`w-full font-mono text-[11px] py-1.5 rounded border transition-all ${copied === "closest" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                    {copied === "closest" ? "✓ Copied!" : `bg-${closestResult.name}-${closestResult.shade}`}
                  </button>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex flex-col gap-2">
              {[
                { icon: "🎨", label: `${COLOR_NAMES.length * 11} total colors` },
                { icon: "📋", label: "6 copy formats" },
                { icon: "🔍", label: "Closest color finder" },
                { icon: "⚡", label: "Contrast ratio checker" },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="text-sm">{item.icon}</span>
                  <span className="font-mono text-xs text-slate-600">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}