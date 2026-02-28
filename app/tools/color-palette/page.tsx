"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useCallback, useMemo, useRef } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
type ColorFormat = "hex" | "rgb" | "hsl" | "tailwind";
type HarmonyType = "analogous" | "complementary" | "triadic" | "tetradic" | "split" | "monochromatic" | "shades";
type ExportFormat = "css" | "json" | "scss" | "tailwind" | "figma";

// ── Color Math ─────────────────────────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360; s /= 100; l /= 100;
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  return [
    Math.round(hue2rgb(p, q, h + 1/3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1/3) * 255),
  ];
}

function hslToHex(h: number, s: number, l: number): string {
  return rgbToHex(...hslToRgb(h, s, l));
}

function luminance(r: number, g: number, b: number): number {
  const srgb = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function contrast(hex1: string, hex2: string): number {
  const l1 = luminance(...hexToRgb(hex1));
  const l2 = luminance(...hexToRgb(hex2));
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}

function textOnBg(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return luminance(r, g, b) > 0.35 ? "#000000" : "#ffffff";
}

// ── Harmony generators ─────────────────────────────────────────────────────
function generateHarmony(baseHex: string, type: HarmonyType): { hex: string; label: string }[] {
  const [r, g, b] = hexToRgb(baseHex);
  const [h, s, l] = rgbToHsl(r, g, b);

  const make = (dh: number, ds = 0, dl = 0, label = "") => ({
    hex: hslToHex((h + dh + 360) % 360, Math.max(0, Math.min(100, s + ds)), Math.max(5, Math.min(95, l + dl))),
    label,
  });

  switch (type) {
    case "analogous":
      return [
        make(-30, 0, 0, "-30°"), make(-15, 0, 0, "-15°"),
        { hex: baseHex, label: "Base" },
        make(15, 0, 0, "+15°"),  make(30, 0, 0, "+30°"),
      ];
    case "complementary":
      return [
        make(-20, 0, 10, "Accent 1"),
        { hex: baseHex, label: "Base" },
        make(20, 0, 10, "Accent 2"),
        make(180, 0, 0, "Complement"),
        make(180, 0, -15, "Dark Comp"),
      ];
    case "triadic":
      return [
        { hex: baseHex, label: "Base" },
        make(0, 0, 20, "Light"),
        make(120, 0, 0, "Triad 1"),
        make(120, 0, 20, "Triad 1 Lt"),
        make(240, 0, 0, "Triad 2"),
      ];
    case "tetradic":
      return [
        { hex: baseHex, label: "Base" },
        make(90, 0, 0, "90°"),
        make(180, 0, 0, "180°"),
        make(270, 0, 0, "270°"),
        make(45, 0, 15, "Accent"),
      ];
    case "split":
      return [
        make(-20, 0, 10, "Left Tint"),
        { hex: baseHex, label: "Base" },
        make(20, 0, 10, "Right Tint"),
        make(150, 0, 0, "Split 1"),
        make(210, 0, 0, "Split 2"),
      ];
    case "monochromatic":
      return [
        make(0, 0, 35, "100"),
        make(0, -15, 20, "300"),
        { hex: baseHex, label: "500" },
        make(0, 10, -15, "700"),
        make(0, 15, -30, "900"),
      ];
    case "shades":
      return [
        make(0, -20, 35, "50"),
        make(0, -10, 25, "200"),
        make(0, 0, 10, "400"),
        { hex: baseHex, label: "600" },
        make(0, 5, -25, "800"),
      ];
  }
}

// Generate a full 10-shade scale like Tailwind
function generateScale(baseHex: string): { shade: string; hex: string }[] {
  const [r, g, b] = hexToRgb(baseHex);
  const [h, s] = rgbToHsl(r, g, b);
  const shades = [
    { shade: "50",  l: 96 }, { shade: "100", l: 92 }, { shade: "200", l: 83 },
    { shade: "300", l: 72 }, { shade: "400", l: 60 }, { shade: "500", l: 50 },
    { shade: "600", l: 42 }, { shade: "700", l: 34 }, { shade: "800", l: 26 },
    { shade: "900", l: 18 }, { shade: "950", l: 12 },
  ];
  return shades.map(({ shade, l }) => ({
    shade,
    hex: hslToHex(h, Math.max(10, s * (l < 50 ? 1.1 : 0.9)), l),
  }));
}

// ── Format helpers ─────────────────────────────────────────────────────────
function fmtHex(hex: string) { return hex.toUpperCase(); }
function fmtRgb(hex: string) {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${r}, ${g}, ${b})`;
}
function fmtHsl(hex: string) {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  return `hsl(${h}, ${s}%, ${l}%)`;
}
function formatColor(hex: string, fmt: ColorFormat): string {
  if (fmt === "hex") return fmtHex(hex);
  if (fmt === "rgb") return fmtRgb(hex);
  if (fmt === "hsl") return fmtHsl(hex);
  return fmtHex(hex);
}

// ── Export generators ──────────────────────────────────────────────────────
function exportPalette(colors: { hex: string; label: string }[], name: string, fmt: ExportFormat): string {
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  if (fmt === "css") {
    const vars = colors.map((c, i) => `  --${slug}-${i + 1}: ${c.hex};  /* ${c.label} */`).join("\n");
    return `:root {\n${vars}\n}`;
  }
  if (fmt === "scss") {
    return colors.map((c, i) => `$${slug}-${i + 1}: ${c.hex}; // ${c.label}`).join("\n");
  }
  if (fmt === "json") {
    const obj = Object.fromEntries(colors.map((c, i) => [`${slug}-${i + 1}`, { hex: c.hex, label: c.label, rgb: fmtRgb(c.hex), hsl: fmtHsl(c.hex) }]));
    return JSON.stringify(obj, null, 2);
  }
  if (fmt === "tailwind") {
    const entries = colors.map((c, i) => `        "${i + 1}00": "${c.hex}", // ${c.label}`).join("\n");
    return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        "${slug}": {\n${entries}\n        },\n      },\n    },\n  },\n};`;
  }
  if (fmt === "figma") {
    return colors.map(c => {
      const [r, g, b] = hexToRgb(c.hex);
      return `${c.label}: { r: ${(r/255).toFixed(3)}, g: ${(g/255).toFixed(3)}, b: ${(b/255).toFixed(3)}, a: 1 }`;
    }).join("\n");
  }
  return "";
}

// ── Curated palette presets ────────────────────────────────────────────────
const PRESETS = [
  { name: "Sunset",   colors: ["#FF6B6B","#FF8E53","#FFC947","#FF6B9D","#C44569"] },
  { name: "Ocean",    colors: ["#0F2027","#203A43","#2C5364","#4CA1AF","#C4E0E5"] },
  { name: "Forest",   colors: ["#1A3A2A","#2D6A4F","#52B788","#95D5B2","#D8F3DC"] },
  { name: "Neon",     colors: ["#0FF0FC","#00FF87","#FFD700","#FF0080","#7B2FBE"] },
  { name: "Pastel",   colors: ["#FFB3BA","#FFDFBA","#FFFFBA","#BAFFC9","#BAE1FF"] },
  { name: "Monochrome",colors:["#F8F9FA","#DEE2E6","#868E96","#343A40","#212529"] },
  { name: "Earthy",   colors: ["#8B4513","#D2691E","#CD853F","#DEB887","#F5DEB3"] },
  { name: "Candy",    colors: ["#FF9A9E","#A18CD1","#FFECD2","#FCB69F","#84FAB0"] },
  { name: "Nordic",   colors: ["#2E3440","#3B4252","#434C5E","#4C566A","#ECEFF4"] },
  { name: "Lava",     colors: ["#200122","#6F0000","#CC0000","#FF4800","#FF8C00"] },
  { name: "Mint",     colors: ["#0CCA4A","#26D07C","#9BE8C8","#D7F5EB","#FFFFFF"] },
  { name: "Royal",    colors: ["#1A1A2E","#16213E","#0F3460","#533483","#E94560"] },
];

// ── Palette slot ──────────────────────────────────────────────────────────
type PaletteColor = { hex: string; label: string; locked: boolean };

// ── Component ──────────────────────────────────────────────────────────────
export default function ColorPalette() {
  const [baseHex,    setBaseHex]    = useState("#f97316");
  const [harmony,    setHarmony]    = useState<HarmonyType>("complementary");
  const [format,     setFormat]     = useState<ColorFormat>("hex");
  const [exportFmt,  setExportFmt]  = useState<ExportFormat>("css");
  const [paletteName,setPaletteName]= useState("my-palette");
  const [copied,     setCopied]     = useState<string | null>(null);
  const [activeTab,  setActiveTab]  = useState<"harmony"|"scale"|"custom"|"presets">("harmony");
  const [customColors, setCustomColors] = useState<PaletteColor[]>([
    { hex: "#f97316", label: "Primary",   locked: false },
    { hex: "#0ea5e9", label: "Secondary", locked: false },
    { hex: "#10b981", label: "Success",   locked: false },
    { hex: "#ef4444", label: "Error",     locked: false },
    { hex: "#f59e0b", label: "Warning",   locked: false },
  ]);
  const inputRef = useRef<HTMLInputElement>(null);

  const copy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  }, []);

  // Harmony colors
  const harmonyColors = useMemo(() => generateHarmony(baseHex, harmony), [baseHex, harmony]);

  // Shade scale
  const scaleColors = useMemo(() => generateScale(baseHex), [baseHex]);

  // Active palette for export
  const activePalette: { hex: string; label: string }[] = useMemo(() => {
    if (activeTab === "harmony")  return harmonyColors;
    if (activeTab === "scale")    return scaleColors.map(s => ({ hex: s.hex, label: s.shade }));
    if (activeTab === "custom")   return customColors;
    return [];
  }, [activeTab, harmonyColors, scaleColors, customColors]);

  const exportCode = useMemo(
    () => exportPalette(activePalette, paletteName, exportFmt),
    [activePalette, paletteName, exportFmt],
  );

  // Custom palette handlers
  const addColor = () => {
    setCustomColors(prev => [...prev, { hex: "#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0"), label: `Color ${prev.length + 1}`, locked: false }]);
  };
  const removeColor = (i: number) => setCustomColors(prev => prev.filter((_, j) => j !== i));
  const updateColor = (i: number, key: keyof PaletteColor, val: string | boolean) =>
    setCustomColors(prev => prev.map((c, j) => j === i ? { ...c, [key]: val } : c));

  const HARMONIES: { key: HarmonyType; label: string; emoji: string }[] = [
    { key: "analogous",       label: "Analogous",       emoji: "〰" },
    { key: "complementary",   label: "Complementary",   emoji: "◑" },
    { key: "triadic",         label: "Triadic",         emoji: "△" },
    { key: "tetradic",        label: "Tetradic",        emoji: "□" },
    { key: "split",           label: "Split-Comp",      emoji: "⊣" },
    { key: "monochromatic",   label: "Monochromatic",   emoji: "▤" },
    { key: "shades",          label: "Shades",          emoji: "░" },
  ];

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-orange-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

      <ToolNavbar toolName="Color Palette" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-orange-500/10 flex items-center justify-center text-lg">🎨</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Color Palette Generator</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded">client-side</span>
          </div>
          <p className="text-slate-500 text-sm">
            Generate color harmonies, full shade scales, and custom palettes — export as CSS variables, SCSS, JSON, or Tailwind config.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">

          {/* ── LEFT: Controls ── */}
          <div className="flex flex-col gap-4">

            {/* Base color picker */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-5">
              <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-4">Base Color</p>

              {/* Large color swatch */}
              <div className="relative mb-4 group cursor-pointer" onClick={() => inputRef.current?.click()}>
                <div className="w-full h-24 rounded-xl border border-white/10 transition-all group-hover:scale-[1.02] shadow-lg"
                  style={{ backgroundColor: baseHex }} />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="font-mono text-[11px] bg-black/40 text-white px-2 py-0.5 rounded">Click to pick</span>
                </div>
              </div>

              <div className="flex gap-2 mb-3">
                <input ref={inputRef} type="color" value={baseHex} onChange={e => setBaseHex(e.target.value)}
                  className="w-10 h-9 rounded-lg border border-white/10 bg-transparent cursor-pointer p-0.5" />
                <input type="text" value={baseHex} onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setBaseHex(e.target.value); }}
                  className="flex-1 font-mono text-sm bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-orange-500/40 uppercase tracking-widest" />
              </div>

              {/* Color info */}
              {(() => {
                const [r, g, b] = hexToRgb(baseHex);
                const [h, s, l] = rgbToHsl(r, g, b);
                const cr = contrast(baseHex, "#ffffff");
                const textCol = textOnBg(baseHex);
                return (
                  <div className="space-y-1.5">
                    {[
                      { label: "RGB", value: `${r}, ${g}, ${b}` },
                      { label: "HSL", value: `${h}°  ${s}%  ${l}%` },
                      { label: "Contrast (white)", value: `${cr}:1` },
                      { label: "Text on bg",  value: textCol === "#ffffff" ? "White" : "Black" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-slate-600">{label}</span>
                        <span className="font-mono text-[11px] text-slate-300">{value}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Format selector */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
              <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-3">Display Format</p>
              <div className="grid grid-cols-2 gap-1.5">
                {(["hex","rgb","hsl"] as ColorFormat[]).map(f => (
                  <button key={f} onClick={() => setFormat(f)}
                    className={`font-mono text-xs py-1.5 rounded border transition-all uppercase
                      ${format === f ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Harmony selector */}
            {(activeTab === "harmony") && (
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
                <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-3">Harmony Type</p>
                <div className="flex flex-col gap-1.5">
                  {HARMONIES.map(h => (
                    <button key={h.key} onClick={() => setHarmony(h.key)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all text-left
                        ${harmony === h.key ? "bg-orange-500/10 border-orange-500/30 text-orange-400" : "border-white/[0.06] text-slate-500 hover:border-white/20 hover:text-slate-300"}`}>
                      <span className="text-base shrink-0">{h.emoji}</span>
                      <span className="font-mono text-xs">{h.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Export */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
              <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-3">Export</p>
              <input value={paletteName} onChange={e => setPaletteName(e.target.value)}
                placeholder="palette-name"
                className="w-full font-mono text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-slate-300 outline-none focus:border-orange-500/30 mb-3 transition-colors" />
              <div className="flex flex-wrap gap-1 mb-3">
                {(["css","scss","json","tailwind","figma"] as ExportFormat[]).map(f => (
                  <button key={f} onClick={() => setExportFmt(f)}
                    className={`font-mono text-[10px] px-2.5 py-1 rounded border transition-all uppercase
                      ${exportFmt === f ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "border-white/[0.08] text-slate-600 hover:text-slate-300"}`}>
                    {f}
                  </button>
                ))}
              </div>
              <button onClick={() => copy(exportCode, "export")}
                className={`w-full font-mono text-xs py-2 rounded-lg border transition-all
                  ${copied === "export" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20"}`}>
                {copied === "export" ? "✓ Copied!" : "Copy Export Code"}
              </button>
            </div>
          </div>

          {/* ── RIGHT: Palette display ── */}
          <div className="flex flex-col gap-4">

            {/* Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {([
                { key: "harmony",  label: "✦ Harmony"   },
                { key: "scale",    label: "░ Shade Scale"},
                { key: "custom",   label: "✎ Custom"    },
                { key: "presets",  label: "⊞ Presets"   },
              ] as { key: typeof activeTab; label: string }[]).map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`font-mono text-xs px-4 py-1.5 rounded-lg border transition-all
                    ${activeTab === t.key ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── Harmony view ── */}
            {activeTab === "harmony" && (
              <>
                {/* Big swatches */}
                <div className="grid grid-cols-5 gap-2">
                  {harmonyColors.map((c, i) => {
                    const txt = textOnBg(c.hex);
                    const cr = contrast(c.hex, txt);
                    const isBase = c.label === "Base";
                    return (
                      <div key={i} className={`rounded-xl overflow-hidden border ${isBase ? "border-orange-500/40" : "border-white/[0.08]"} flex flex-col`}>
                        <button
                          className="w-full aspect-square flex flex-col items-center justify-center gap-1 transition-all hover:scale-105 hover:z-10 relative"
                          style={{ backgroundColor: c.hex }}
                          onClick={() => copy(formatColor(c.hex, format), `swatch-${i}`)}>
                          <span className="font-mono text-[10px] font-semibold px-1 rounded"
                            style={{ color: txt, backgroundColor: `${txt === "#000000" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"}` }}>
                            {c.label}
                          </span>
                          {copied === `swatch-${i}` && (
                            <span className="font-mono text-[9px] absolute bottom-1 left-1/2 -translate-x-1/2"
                              style={{ color: txt }}>✓</span>
                          )}
                        </button>
                        <div className="bg-white/[0.03] px-2 py-1.5">
                          <p className="font-mono text-[10px] text-slate-400 truncate">{formatColor(c.hex, format)}</p>
                          <p className="font-mono text-[9px] text-slate-700">{cr}:1</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Row preview */}
                <div className="rounded-xl overflow-hidden flex h-16 border border-white/[0.08]">
                  {harmonyColors.map((c, i) => (
                    <button key={i} className="flex-1 transition-all hover:scale-y-110"
                      style={{ backgroundColor: c.hex }}
                      onClick={() => copy(formatColor(c.hex, format), `row-${i}`)}
                      title={c.label} />
                  ))}
                </div>

                {/* Detail table */}
                <div className="rounded-xl overflow-hidden border border-white/[0.08]">
                  <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] px-4 py-2 bg-white/[0.04] border-b border-white/[0.06]">
                    {["","Label","HEX","HSL","Copy"].map((h, i) => (
                      <span key={i} className="font-mono text-[10px] uppercase tracking-widest text-slate-600">{h}</span>
                    ))}
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {harmonyColors.map((c, i) => {
                      const [r, g, b] = hexToRgb(c.hex);
                      const [h, s, l] = rgbToHsl(r, g, b);
                      return (
                        <div key={i} className="grid grid-cols-[auto_1fr_1fr_1fr_auto] px-4 py-2 items-center hover:bg-white/[0.02] gap-2">
                          <div className="w-6 h-6 rounded-md border border-white/10 shrink-0" style={{ backgroundColor: c.hex }} />
                          <span className="font-mono text-xs text-slate-400">{c.label}</span>
                          <span className="font-mono text-xs text-slate-300">{c.hex.toUpperCase()}</span>
                          <span className="font-mono text-[11px] text-slate-500">{h}° {s}% {l}%</span>
                          <button onClick={() => copy(formatColor(c.hex, format), `tbl-${i}`)}
                            className={`font-mono text-[10px] px-2 py-0.5 rounded border transition-all
                              ${copied === `tbl-${i}` ? "text-emerald-400 border-emerald-500/30" : "border-white/[0.08] text-slate-600 hover:text-slate-300"}`}>
                            {copied === `tbl-${i}` ? "✓" : "copy"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* ── Shade Scale view ── */}
            {activeTab === "scale" && (
              <>
                {/* Full-width shade bar */}
                <div className="rounded-xl overflow-hidden flex h-20 border border-white/[0.08]">
                  {scaleColors.map(({ shade, hex }) => (
                    <button key={shade} className="flex-1 flex items-end pb-1 justify-center transition-all hover:scale-y-110"
                      style={{ backgroundColor: hex }}
                      onClick={() => copy(formatColor(hex, format), `sc-${shade}`)}
                      title={shade}>
                      <span className="font-mono text-[8px]" style={{ color: textOnBg(hex) }}>{shade}</span>
                    </button>
                  ))}
                </div>

                {/* Grid of shade cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                  {scaleColors.map(({ shade, hex }) => {
                    const txt = textOnBg(hex);
                    const cr  = contrast(hex, txt);
                    return (
                      <div key={shade} className="rounded-xl overflow-hidden border border-white/[0.08] flex flex-col">
                        <button
                          className="w-full h-20 flex items-center justify-center transition-all hover:opacity-90 relative"
                          style={{ backgroundColor: hex }}
                          onClick={() => copy(formatColor(hex, format), `shade-${shade}`)}>
                          <span className="font-mono text-lg font-black" style={{ color: txt }}>{shade}</span>
                          {copied === `shade-${shade}` && (
                            <span className="absolute bottom-1 right-2 font-mono text-[10px]" style={{ color: txt }}>✓</span>
                          )}
                        </button>
                        <div className="px-3 py-2 bg-white/[0.02]">
                          <p className="font-mono text-[11px] text-slate-300 truncate">{hex.toUpperCase()}</p>
                          <p className="font-mono text-[9px] text-slate-700">{cr}:1 · {fmtHsl(hex)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ── Custom view ── */}
            {activeTab === "custom" && (
              <>
                <div className="flex flex-col gap-2">
                  {customColors.map((c, i) => {
                    const txt = textOnBg(c.hex);
                    return (
                      <div key={i} className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.08] rounded-xl p-3 hover:border-white/20 transition-colors">
                        {/* Swatch + picker */}
                        <label className="cursor-pointer shrink-0">
                          <div className="w-12 h-12 rounded-lg border border-white/10 flex items-center justify-center relative overflow-hidden"
                            style={{ backgroundColor: c.hex }}>
                            <span className="font-mono text-[9px] absolute bottom-0.5" style={{ color: txt }}>{c.hex.slice(1,5)}…</span>
                          </div>
                          <input type="color" value={c.hex} onChange={e => updateColor(i, "hex", e.target.value)} className="sr-only" />
                        </label>

                        {/* Label + hex */}
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          <input value={c.label} onChange={e => updateColor(i, "label", e.target.value)}
                            className="font-mono text-xs bg-white/[0.04] border border-white/[0.06] rounded px-2 py-0.5 text-slate-300 outline-none focus:border-orange-500/30 w-full" />
                          <input value={c.hex} onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) updateColor(i, "hex", e.target.value); }}
                            className="font-mono text-xs bg-white/[0.04] border border-white/[0.06] rounded px-2 py-0.5 text-orange-400 outline-none focus:border-orange-500/30 uppercase w-full" />
                        </div>

                        {/* Format value */}
                        <span className="font-mono text-[10px] text-slate-500 shrink-0 max-w-[90px] truncate hidden sm:block">
                          {formatColor(c.hex, format)}
                        </span>

                        {/* Contrast badge */}
                        <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded border shrink-0 ${contrast(c.hex, "#ffffff") >= 4.5 ? "text-emerald-400 border-emerald-500/25" : "text-yellow-400 border-yellow-500/25"}`}>
                          {contrast(c.hex, "#ffffff")}:1
                        </span>

                        {/* Copy + delete */}
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => copy(formatColor(c.hex, format), `cust-${i}`)}
                            className={`font-mono text-[10px] px-1.5 py-0.5 rounded border transition-all
                              ${copied === `cust-${i}` ? "text-emerald-400 border-emerald-500/30" : "border-white/[0.08] text-slate-600 hover:text-slate-300"}`}>
                            {copied === `cust-${i}` ? "✓" : "⊕"}
                          </button>
                          <button onClick={() => removeColor(i)}
                            className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-white/[0.08] text-slate-700 hover:text-red-400 hover:border-red-500/30 transition-all">
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <button onClick={addColor}
                    className="font-mono text-xs py-2.5 rounded-xl border-2 border-dashed border-white/[0.10] text-slate-600 hover:text-orange-400 hover:border-orange-500/30 transition-all">
                    + Add Color
                  </button>
                </div>

                {/* Row preview */}
                {customColors.length > 0 && (
                  <div className="rounded-xl overflow-hidden flex h-14 border border-white/[0.08]">
                    {customColors.map((c, i) => (
                      <button key={i} className="flex-1" style={{ backgroundColor: c.hex }}
                        onClick={() => copy(formatColor(c.hex, format), `cr-${i}`)} title={c.label} />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── Presets view ── */}
            {activeTab === "presets" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRESETS.map(preset => (
                  <div key={preset.name}
                    className="bg-white/[0.02] border border-white/[0.08] rounded-xl overflow-hidden hover:border-orange-500/30 transition-all cursor-pointer group"
                    onClick={() => {
                      setCustomColors(preset.colors.map((hex, i) => ({ hex, label: `${preset.name} ${i + 1}`, locked: false })));
                      setActiveTab("custom");
                    }}>
                    {/* Color strip */}
                    <div className="flex h-14">
                      {preset.colors.map((hex, i) => (
                        <div key={i} className="flex-1" style={{ backgroundColor: hex }} />
                      ))}
                    </div>
                    <div className="px-3 py-2 flex items-center justify-between">
                      <span className="font-mono text-xs text-slate-400 group-hover:text-slate-200 transition-colors">{preset.name}</span>
                      <span className="font-mono text-[10px] text-slate-700 group-hover:text-orange-400 transition-colors">Use →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Export code */}
            {activeTab !== "presets" && (
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Export — {exportFmt.toUpperCase()}</p>
                  <button onClick={() => copy(exportCode, "export2")}
                    className={`font-mono text-[11px] px-3 py-1 rounded border transition-all
                      ${copied === "export2" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                    {copied === "export2" ? "✓ Copied!" : "Copy"}
                  </button>
                </div>
                <pre className="font-mono text-[11px] text-slate-400 bg-[#0a0a14] rounded-lg p-4 overflow-auto max-h-48 leading-relaxed border border-white/[0.06] whitespace-pre-wrap">
                  {exportCode}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex flex-wrap gap-6 px-4 py-3 bg-orange-500/[0.05] border border-orange-500/20 rounded-lg mt-5 mb-5">
          <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Base</span><span className="font-mono text-sm text-orange-400">{baseHex.toUpperCase()}</span></div>
          <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Format</span><span className="font-mono text-sm text-orange-400 uppercase">{format}</span></div>
          {activeTab === "harmony" && <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Harmony</span><span className="font-mono text-sm text-orange-400 capitalize">{harmony}</span></div>}
          {activeTab === "scale"   && <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Shades</span><span className="font-mono text-sm text-orange-400">{scaleColors.length}</span></div>}
          {activeTab === "custom"  && <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Colors</span><span className="font-mono text-sm text-orange-400">{customColors.length}</span></div>}
          <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Export</span><span className="font-mono text-sm text-orange-400 uppercase">{exportFmt}</span></div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            <span className="font-mono text-[10px] text-orange-500/60">Live</span>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "✦", title: "7 Harmony Types",   desc: "Analogous, Complementary, Triadic, Tetradic, Split-Comp, Monochromatic, and Shades — all from one base color." },
            { icon: "░", title: "Full Shade Scale",   desc: "Generate a 11-stop shade scale (50–950) from any color — just like Tailwind's built-in palette." },
            { icon: "📤", title: "5 Export Formats",  desc: "CSS variables, SCSS variables, JSON, Tailwind config, or Figma-ready color tokens." },
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