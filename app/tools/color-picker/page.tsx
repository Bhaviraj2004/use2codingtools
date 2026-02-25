"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useCallback, useRef, useEffect } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
type ColorFormat = "hex" | "rgb" | "hsl" | "hsv" | "cmyk" | "css";

type RGBA = { r: number; g: number; b: number; a: number };
type HSLA = { h: number; s: number; l: number; a: number };
type HSVA = { h: number; s: number; v: number; a: number };
type CMYK = { c: number; m: number; y: number; k: number };

// ── Color math ─────────────────────────────────────────────────────────────
function hexToRgba(hex: string): RGBA {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map(c => c + c).join("");
  if (h.length === 6) h += "ff";
  const n = parseInt(h, 16);
  return { r: (n >> 24) & 255, g: (n >> 16) & 255, b: (n >> 8) & 255, a: (n & 255) / 255 };
}

function rgbaToHex({ r, g, b, a }: RGBA): string {
  const toH = (n: number) => n.toString(16).padStart(2, "0");
  const ah = Math.round(a * 255);
  return `#${toH(r)}${toH(g)}${toH(b)}${ah < 255 ? toH(ah) : ""}`;
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
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;
  return {
    r: Math.round(hue2rgb(p, q, hn + 1/3) * 255),
    g: Math.round(hue2rgb(p, q, hn) * 255),
    b: Math.round(hue2rgb(p, q, hn - 1/3) * 255),
    a,
  };
}

function rgbaToHsva({ r, g, b, a }: RGBA): HSVA {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn), d = max - min;
  let h = 0, s = max === 0 ? 0 : d / max;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h = Math.round(h * 60); if (h < 0) h += 360;
  }
  return { h, s: Math.round(s * 100), v: Math.round(max * 100), a };
}

function rgbaToCmyk({ r, g, b }: RGBA): CMYK {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const k = 1 - Math.max(rn, gn, bn);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: Math.round(((1 - rn - k) / (1 - k)) * 100),
    m: Math.round(((1 - gn - k) / (1 - k)) * 100),
    y: Math.round(((1 - bn - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  };
}

function getLuminance({ r, g, b }: RGBA) {
  const f = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function getContrastRatio(a: RGBA, b: RGBA) {
  const la = getLuminance(a), lb = getLuminance(b);
  const light = Math.max(la, lb), dark = Math.min(la, lb);
  return ((light + 0.05) / (dark + 0.05));
}

function isDark({ r, g, b }: RGBA) { return (r * 299 + g * 587 + b * 114) / 1000 < 128; }

function generateShades(rgba: RGBA): { label: string; color: RGBA }[] {
  const hsl = rgbaToHsla(rgba);
  return [10, 20, 30, 40, 50, 60, 70, 80, 90].map(l => ({
    label: `${l * 10 > 500 ? 1000 - l * 10 : l * 10}`,
    color: hslaToRgba({ ...hsl, l }),
  }));
}

function generateAnalogous(rgba: RGBA): RGBA[] {
  const hsl = rgbaToHsla(rgba);
  return [-30, -15, 0, 15, 30].map(offset =>
    hslaToRgba({ ...hsl, h: (hsl.h + offset + 360) % 360 })
  );
}

function generateHarmonies(rgba: RGBA) {
  const hsl = rgbaToHsla(rgba);
  return {
    complementary: [rgba, hslaToRgba({ ...hsl, h: (hsl.h + 180) % 360 })],
    triadic: [rgba, hslaToRgba({ ...hsl, h: (hsl.h + 120) % 360 }), hslaToRgba({ ...hsl, h: (hsl.h + 240) % 360 })],
    tetradic: [rgba, hslaToRgba({ ...hsl, h: (hsl.h + 90) % 360 }), hslaToRgba({ ...hsl, h: (hsl.h + 180) % 360 }), hslaToRgba({ ...hsl, h: (hsl.h + 270) % 360 })],
    splitComplementary: [rgba, hslaToRgba({ ...hsl, h: (hsl.h + 150) % 360 }), hslaToRgba({ ...hsl, h: (hsl.h + 210) % 360 })],
  };
}

function formatColor(rgba: RGBA, fmt: ColorFormat): string {
  const hex  = rgbaToHex(rgba);
  const hsl  = rgbaToHsla(rgba);
  const hsv  = rgbaToHsva(rgba);
  const cmyk = rgbaToCmyk(rgba);
  const alpha = rgba.a < 1 ? `, ${rgba.a.toFixed(2)}` : "";
  switch (fmt) {
    case "hex":  return hex.toUpperCase();
    case "rgb":  return rgba.a < 1 ? `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a.toFixed(2)})` : `rgb(${rgba.r}, ${rgba.g}, ${rgba.b})`;
    case "hsl":  return rgba.a < 1 ? `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${rgba.a.toFixed(2)})` : `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    case "hsv":  return `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`;
    case "cmyk": return `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;
    case "css":  return `color: ${rgba.a < 1 ? `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a.toFixed(2)})` : `#${rgbaToHex(rgba).slice(1).toUpperCase()}`};`;
  }
}

const FORMATS: ColorFormat[] = ["hex", "rgb", "hsl", "hsv", "cmyk", "css"];

const PRESETS = [
  "#FF6B35", "#F7C59F", "#EFEFD0", "#004E89", "#1A936F",
  "#E63946", "#457B9D", "#2A9D8F", "#E9C46A", "#F4A261",
  "#6A0572", "#AB83A1", "#2D6A4F", "#74C69D", "#B7E4C7",
  "#0D1B2A", "#1B2838", "#FF9F1C", "#CBFF4D", "#3A86FF",
];

// ── Canvas picker ──────────────────────────────────────────────────────────
function SatValPicker({ hsva, onChange }: { hsva: HSVA; onChange: (s: number, v: number) => void }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragging  = useRef(false);

  const handlePointer = useCallback((e: React.PointerEvent | PointerEvent) => {
    const el = canvasRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const s = Math.max(0, Math.min(1, (e.clientX - rect.left)  / rect.width));
    const v = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
    onChange(Math.round(s * 100), Math.round(v * 100));
  }, [onChange]);

  useEffect(() => {
    const up = () => { dragging.current = false; };
    const move = (e: PointerEvent) => { if (dragging.current) handlePointer(e); };
    window.addEventListener("pointerup", up);
    window.addEventListener("pointermove", move);
    return () => { window.removeEventListener("pointerup", up); window.removeEventListener("pointermove", move); };
  }, [handlePointer]);

  const pureHue = hslaToRgba({ h: hsva.h, s: 100, l: 50, a: 1 });

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-48 rounded-xl cursor-crosshair select-none touch-none overflow-hidden border border-white/[0.08]"
      style={{ background: `hsl(${hsva.h}, 100%, 50%)` }}
      onPointerDown={e => { dragging.current = true; handlePointer(e); }}
    >
      {/* White → transparent gradient (saturation) */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to right, #fff, transparent)" }} />
      {/* Black → transparent gradient (value) */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #000, transparent)" }} />
      {/* Cursor */}
      <div
        className="absolute w-4 h-4 rounded-full border-2 border-white shadow-lg pointer-events-none"
        style={{
          left: `${hsva.s}%`,
          top:  `${100 - hsva.v}%`,
          transform: "translate(-50%, -50%)",
          background: `rgb(${hslaToRgba({ h: hsva.h, s: hsva.s, l: hsva.v / 2 * (1 - hsva.s / 200 + hsva.s / 200), a: 1 }).r}, 0, 0)`,
          backgroundColor: `rgb(${pureHue.r},${pureHue.g},${pureHue.b})`,
        }}
      />
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function ColorPicker() {
  const [rgba, setRgba]         = useState<RGBA>({ r: 255, g: 107, b: 53, a: 1 });
  const [hexInput, setHexInput] = useState("#FF6B35");
  const [activeFormat, setActiveFormat] = useState<ColorFormat>("hex");
  const [copied, setCopied]     = useState<string | null>(null);
  const [history, setHistory]   = useState<RGBA[]>([{ r: 255, g: 107, b: 53, a: 1 }]);
  const [activeHarmony, setActiveHarmony] = useState<"complementary" | "triadic" | "tetradic" | "splitComplementary">("complementary");

  const hsva = rgbaToHsva(rgba);
  const hsl  = rgbaToHsla(rgba);

  const updateColor = useCallback((newRgba: RGBA) => {
    setRgba(newRgba);
    setHexInput(rgbaToHex(newRgba).toUpperCase());
    setHistory(prev => {
      const next = [newRgba, ...prev.filter(c => rgbaToHex(c) !== rgbaToHex(newRgba))].slice(0, 20);
      return next;
    });
  }, []);

  const handleHexInput = (val: string) => {
    setHexInput(val);
    const clean = val.trim().replace(/^#/, "");
    if (clean.length === 3 || clean.length === 6 || clean.length === 8) {
      try { updateColor(hexToRgba("#" + clean)); } catch { /* invalid */ }
    }
  };

  const handleHueChange = (h: number) => {
    updateColor(hslaToRgba({ ...hsl, h }));
  };

  const handleAlphaChange = (a: number) => {
    updateColor({ ...rgba, a: Math.round(a * 100) / 100 });
  };

  const handleSatVal = (s: number, v: number) => {
    const l = Math.round(v / 2 * (2 - s / 100));
    const sl = v + s * Math.min(v, 100 - v) / 100;
    const ls = sl === 0 ? 0 : Math.round(2 * (sl - v) / sl * 100);
    updateColor(hslaToRgba({ h: hsva.h, s: sl === 0 ? 0 : ls, l, a: rgba.a }));
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const shades    = generateShades(rgba);
  const analogous = generateAnalogous(rgba);
  const harmonies = generateHarmonies(rgba);
  const contrastWhite = getContrastRatio(rgba, { r: 255, g: 255, b: 255, a: 1 });
  const contrastBlack = getContrastRatio(rgba, { r: 0,   g: 0,   b: 0,   a: 1 });
  const wcagAANormal  = contrastWhite >= 4.5 || contrastBlack >= 4.5;
  const wcagAALarge   = contrastWhite >= 3   || contrastBlack >= 3;
  const wcagAAA       = contrastWhite >= 7   || contrastBlack >= 7;
  const bestContrast  = contrastWhite > contrastBlack ? { r: 255, g: 255, b: 255, a: 1 } : { r: 0, g: 0, b: 0, a: 1 };

  const ColorSwatch = ({ color, label, onClick }: { color: RGBA; label?: string; onClick?: () => void }) => (
    <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={onClick ?? (() => updateColor(color))}>
      <div
        className="w-10 h-10 rounded-lg border border-white/10 shadow group-hover:scale-110 transition-transform"
        style={{ backgroundColor: `rgba(${color.r},${color.g},${color.b},${color.a})` }}
        title={rgbaToHex(color).toUpperCase()}
      />
      {label && <span className="font-mono text-[9px] text-slate-700 group-hover:text-slate-500 transition-colors">{label}</span>}
    </div>
  );

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-orange-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

      <ToolNavbar toolName="Color Picker" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-orange-500/10 flex items-center justify-center text-lg">🎨</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Color Picker</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded">client-side</span>
          </div>
          <p className="text-slate-500 text-sm">Pick, convert, and explore colors — HEX, RGB, HSL, HSV, CMYK, shades, harmonies, WCAG contrast.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">

          {/* ── LEFT: Picker ── */}
          <div className="flex flex-col gap-4">

            {/* Sat/Val canvas */}
            <SatValPicker hsva={hsva} onChange={handleSatVal} />

            {/* Hue slider */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg border border-white/10 shrink-0 shadow-lg"
                style={{ backgroundColor: `rgba(${rgba.r},${rgba.g},${rgba.b},${rgba.a})` }} />
              <div className="flex-1 flex flex-col gap-2">
                {/* Hue */}
                <div className="relative h-3 rounded-full cursor-pointer"
                  style={{ background: "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)" }}>
                  <input type="range" min={0} max={360} value={hsva.h}
                    onChange={e => handleHueChange(+e.target.value)}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" />
                  <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow pointer-events-none"
                    style={{ left: `${(hsva.h / 360) * 100}%`, transform: "translate(-50%, -50%)", backgroundColor: `hsl(${hsva.h},100%,50%)` }} />
                </div>
                {/* Alpha */}
                <div className="relative h-3 rounded-full cursor-pointer overflow-hidden">
                  <div className="absolute inset-0 rounded-full" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='8' height='8' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='4' height='4' fill='%23888'/%3E%3Crect x='4' y='4' width='4' height='4' fill='%23888'/%3E%3Crect x='4' y='0' width='4' height='4' fill='%23555'/%3E%3Crect x='0' y='4' width='4' height='4' fill='%23555'/%3E%3C/svg%3E\")" }} />
                  <div className="absolute inset-0 rounded-full"
                    style={{ background: `linear-gradient(to right, transparent, rgba(${rgba.r},${rgba.g},${rgba.b},1))` }} />
                  <input type="range" min={0} max={1} step={0.01} value={rgba.a}
                    onChange={e => handleAlphaChange(+e.target.value)}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" />
                  <div className="absolute top-1/2 w-4 h-4 rounded-full border-2 border-white shadow pointer-events-none"
                    style={{ left: `${rgba.a * 100}%`, transform: "translate(-50%, -50%)", backgroundColor: `rgba(${rgba.r},${rgba.g},${rgba.b},${rgba.a})` }} />
                </div>
              </div>
            </div>

            {/* HEX input */}
            <div className="flex gap-2">
              <input
                value={hexInput}
                onChange={e => handleHexInput(e.target.value)}
                spellCheck={false}
                className="flex-1 font-mono text-sm bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-orange-500/40 transition-colors uppercase"
                placeholder="#FF6B35"
              />
              <button onClick={() => copy(hexInput, "hex")}
                className={`font-mono text-xs px-3 rounded-lg border transition-all ${copied === "hex" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                {copied === "hex" ? "✓" : "Copy"}
              </button>
            </div>

            {/* RGB sliders */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4 space-y-3">
              {(["r","g","b"] as const).map((ch, idx) => {
                const colors = [
                  `rgb(0,${rgba.g},${rgba.b})`, `rgb(255,${rgba.g},${rgba.b})`,
                  `rgb(${rgba.r},0,${rgba.b})`, `rgb(${rgba.r},255,${rgba.b})`,
                  `rgb(${rgba.r},${rgba.g},0)`, `rgb(${rgba.r},${rgba.g},255)`,
                ];
                return (
                  <div key={ch} className="flex items-center gap-3">
                    <span className="font-mono text-xs text-slate-600 w-4 uppercase">{ch}</span>
                    <div className="relative flex-1 h-2 rounded-full"
                      style={{ background: `linear-gradient(to right,${colors[idx*2]},${colors[idx*2+1]})` }}>
                      <input type="range" min={0} max={255} value={rgba[ch]}
                        onChange={e => updateColor({ ...rgba, [ch]: +e.target.value })}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" />
                      <div className="absolute top-1/2 w-3 h-3 rounded-full border-2 border-white shadow pointer-events-none"
                        style={{ left: `${(rgba[ch] / 255) * 100}%`, transform: "translate(-50%,-50%)", backgroundColor: `rgb(${rgba.r},${rgba.g},${rgba.b})` }} />
                    </div>
                    <input type="number" min={0} max={255} value={rgba[ch]}
                      onChange={e => updateColor({ ...rgba, [ch]: Math.max(0, Math.min(255, +e.target.value)) })}
                      className="w-12 bg-white/[0.04] border border-white/[0.06] font-mono text-xs text-slate-300 rounded px-1.5 py-0.5 outline-none text-center" />
                  </div>
                );
              })}
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-slate-600 w-4">A</span>
                <div className="relative flex-1 h-2 rounded-full overflow-hidden">
                  <div className="absolute inset-0" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='6' height='6' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='3' height='3' fill='%23888'/%3E%3Crect x='3' y='3' width='3' height='3' fill='%23888'/%3E%3Crect x='3' y='0' width='3' height='3' fill='%23555'/%3E%3Crect x='0' y='3' width='3' height='3' fill='%23555'/%3E%3C/svg%3E\")" }} />
                  <div className="absolute inset-0" style={{ background: `linear-gradient(to right,transparent,rgb(${rgba.r},${rgba.g},${rgba.b}))` }} />
                  <input type="range" min={0} max={1} step={0.01} value={rgba.a}
                    onChange={e => updateColor({ ...rgba, a: +e.target.value })}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" />
                  <div className="absolute top-1/2 w-3 h-3 rounded-full border-2 border-white shadow pointer-events-none"
                    style={{ left: `${rgba.a * 100}%`, transform: "translate(-50%,-50%)", backgroundColor: `rgba(${rgba.r},${rgba.g},${rgba.b},${rgba.a})` }} />
                </div>
                <input type="number" min={0} max={1} step={0.01} value={rgba.a}
                  onChange={e => updateColor({ ...rgba, a: Math.max(0, Math.min(1, +e.target.value)) })}
                  className="w-12 bg-white/[0.04] border border-white/[0.06] font-mono text-xs text-slate-300 rounded px-1.5 py-0.5 outline-none text-center" />
              </div>
            </div>

            {/* Presets */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
              <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-3">Presets</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map(hex => {
                  const c = hexToRgba(hex);
                  return (
                    <div key={hex} onClick={() => updateColor(c)}
                      className="w-8 h-8 rounded-md border border-white/10 cursor-pointer hover:scale-110 transition-transform shadow"
                      style={{ backgroundColor: hex }} title={hex} />
                  );
                })}
              </div>
            </div>

            {/* History */}
            {history.length > 1 && (
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
                <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-3">History</p>
                <div className="flex flex-wrap gap-2">
                  {history.slice(0, 16).map((c, i) => (
                    <div key={i} onClick={() => updateColor(c)}
                      className="w-7 h-7 rounded border border-white/10 cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: `rgba(${c.r},${c.g},${c.b},${c.a})` }}
                      title={rgbaToHex(c).toUpperCase()} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Info panels ── */}
          <div className="flex flex-col gap-4">

            {/* Color preview large */}
            <div className="flex gap-4">
              <div className="flex-1 h-24 rounded-xl border border-white/[0.08] shadow-lg overflow-hidden relative"
                style={{ backgroundColor: `rgba(${rgba.r},${rgba.g},${rgba.b},${rgba.a})` }}>
                <span className="absolute bottom-2 right-3 font-mono text-xs font-bold"
                  style={{ color: isDark(rgba) ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)" }}>
                  {rgbaToHex(rgba).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 h-24 rounded-xl border border-white/[0.08] overflow-hidden flex">
                <div className="flex-1" style={{ backgroundColor: `rgba(${rgba.r},${rgba.g},${rgba.b},1)` }} />
                <div className="flex-1" style={{ backgroundColor: `rgba(${rgba.r},${rgba.g},${rgba.b},0.6)` }} />
                <div className="flex-1" style={{ backgroundColor: `rgba(${rgba.r},${rgba.g},${rgba.b},0.3)` }} />
                <div className="flex-1" style={{ backgroundColor: `rgba(${rgba.r},${rgba.g},${rgba.b},0.1)` }} />
              </div>
            </div>

            {/* Format tabs + values */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
              <div className="flex gap-1 mb-4 flex-wrap">
                {FORMATS.map(f => (
                  <button key={f} onClick={() => setActiveFormat(f)}
                    className={`font-mono text-[11px] px-3 py-1 rounded border transition-all uppercase
                      ${activeFormat === f ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                    {f}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-sm text-slate-300 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 break-all">
                  {formatColor(rgba, activeFormat)}
                </code>
                <button onClick={() => copy(formatColor(rgba, activeFormat), activeFormat)}
                  className={`font-mono text-xs px-3 py-2 rounded-lg border transition-all shrink-0
                    ${copied === activeFormat ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                  {copied === activeFormat ? "✓" : "Copy"}
                </button>
              </div>

              {/* All formats quick-copy grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                {FORMATS.map(f => (
                  <div key={f} onClick={() => copy(formatColor(rgba, f), `all-${f}`)}
                    className="flex items-center justify-between gap-2 px-3 py-2 bg-white/[0.02] border border-white/[0.04] rounded-lg cursor-pointer hover:border-white/20 group transition-all">
                    <div className="min-w-0">
                      <span className="font-mono text-[10px] text-slate-600 uppercase block">{f}</span>
                      <span className="font-mono text-xs text-slate-400 truncate block">{formatColor(rgba, f)}</span>
                    </div>
                    <span className={`font-mono text-[10px] shrink-0 transition-all ${copied === `all-${f}` ? "text-emerald-400" : "text-slate-700 group-hover:text-slate-400"}`}>
                      {copied === `all-${f}` ? "✓" : "copy"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shades */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
              <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-3">Shades & Tints</p>
              <div className="flex gap-1.5 flex-wrap">
                {shades.map((s, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => updateColor(s.color)}>
                    <div className="w-9 h-9 rounded-lg border border-white/10 hover:scale-110 transition-transform shadow"
                      style={{ backgroundColor: `rgb(${s.color.r},${s.color.g},${s.color.b})` }}
                      title={rgbaToHex(s.color).toUpperCase()} />
                    <span className="font-mono text-[9px] text-slate-700 group-hover:text-slate-500">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Analogous */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
              <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-3">Analogous Palette</p>
              <div className="flex gap-2">
                {analogous.map((c, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-pointer" onClick={() => updateColor(c)}>
                    <div className="w-full h-12 rounded-lg border border-white/10 hover:scale-105 transition-transform"
                      style={{ backgroundColor: `rgb(${c.r},${c.g},${c.b})` }} />
                    <span className="font-mono text-[9px] text-slate-700 group-hover:text-slate-500">
                      {i === 2 ? "base" : `${(i - 2) * 15}°`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Harmonies */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600">Harmonies</p>
                <div className="flex gap-1 ml-auto flex-wrap">
                  {(["complementary","triadic","tetradic","splitComplementary"] as const).map(h => (
                    <button key={h} onClick={() => setActiveHarmony(h)}
                      className={`font-mono text-[10px] px-2 py-0.5 rounded border transition-all capitalize
                        ${activeHarmony === h ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "border-white/[0.08] text-slate-600 hover:text-slate-400"}`}>
                      {h === "splitComplementary" ? "split" : h}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                {harmonies[activeHarmony].map((c, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-pointer" onClick={() => updateColor(c)}>
                    <div className="w-full h-12 rounded-lg border border-white/10 hover:scale-105 transition-transform"
                      style={{ backgroundColor: `rgb(${c.r},${c.g},${c.b})` }} />
                    <span className="font-mono text-[9px] text-slate-700 group-hover:text-slate-500 truncate w-full text-center">
                      {rgbaToHex(c).slice(0, 7).toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* WCAG contrast */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
              <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-3">WCAG Contrast</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {[
                  { bg: { r:255,g:255,b:255,a:1 }, label: "on White" },
                  { bg: { r:0,  g:0,  b:0,  a:1 }, label: "on Black" },
                ].map(({ bg, label }) => {
                  const ratio = getContrastRatio(rgba, bg);
                  return (
                    <div key={label} className="rounded-lg p-3 border border-white/[0.06] flex flex-col gap-2"
                      style={{ backgroundColor: `rgba(${bg.r},${bg.g},${bg.b},1)` }}>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold" style={{ color: `rgba(${rgba.r},${rgba.g},${rgba.b},1)` }}>
                          Sample Text
                        </span>
                        <span className="font-mono text-[11px] font-bold" style={{ color: `rgba(${rgba.r},${rgba.g},${rgba.b},1)` }}>
                          {ratio.toFixed(2)}:1
                        </span>
                      </div>
                      <span className="font-mono text-[9px]" style={{ color: bg.r === 255 ? "#555" : "#aaa" }}>{label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { label: "AA Normal", pass: wcagAANormal },
                  { label: "AA Large",  pass: wcagAALarge  },
                  { label: "AAA",       pass: wcagAAA      },
                ].map(({ label, pass }) => (
                  <div key={label} className={`flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded border
                    ${pass ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
                    <span>{pass ? "✓" : "✕"}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Stats bar */}
        <div className="flex flex-wrap gap-6 px-4 py-3 bg-orange-500/[0.05] border border-orange-500/20 rounded-lg mt-5 mb-5">
          <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">HEX</span><span className="font-mono text-sm text-orange-400">{rgbaToHex(rgba).toUpperCase()}</span></div>
          <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">HSL</span><span className="font-mono text-sm text-orange-400">{hsl.h}° {hsl.s}% {hsl.l}%</span></div>
          <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">RGB</span><span className="font-mono text-sm text-orange-400">{rgba.r} {rgba.g} {rgba.b}</span></div>
          <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Alpha</span><span className="font-mono text-sm text-orange-400">{Math.round(rgba.a * 100)}%</span></div>
          <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Best on</span>
            <span className="font-mono text-sm" style={{ color: bestContrast.r === 255 ? "#e2e8f0" : "#0f172a" }}>
              {bestContrast.r === 255 ? "White text" : "Black text"}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            <span className="font-mono text-[10px] text-orange-500/60">Live</span>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "🎨", title: "6 Color Formats", desc: "Convert between HEX, RGB, HSL, HSV, CMYK and CSS — copy any format with one click." },
            { icon: "🌈", title: "Harmonies & Shades", desc: "Explore complementary, triadic, tetradic, split-complementary, analogous, and 9 shades/tints." },
            { icon: "♿", title: "WCAG Contrast", desc: "Instant AA and AAA accessibility contrast ratio check against white and black backgrounds." },
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