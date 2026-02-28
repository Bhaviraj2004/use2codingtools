"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useMemo, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────
type GradientType = "linear" | "radial" | "conic";
type ColorStop = { id: string; color: string; position: number; opacity: number };

function uid() { return Math.random().toString(36).slice(2, 8); }

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return { r, g, b };
}

function stopToCSS(stop: ColorStop): string {
  const { r, g, b } = hexToRgb(stop.color);
  return `rgba(${r},${g},${b},${(stop.opacity/100).toFixed(2)}) ${stop.position}%`;
}

// ── Presets ───────────────────────────────────────────────────
const PRESETS = [
  { label: "Sunset",     type: "linear" as GradientType, angle: 135, stops: [{ color: "#f97316", position: 0, opacity: 100 }, { color: "#ec4899", position: 50, opacity: 100 }, { color: "#8b5cf6", position: 100, opacity: 100 }] },
  { label: "Ocean",      type: "linear" as GradientType, angle: 135, stops: [{ color: "#0ea5e9", position: 0, opacity: 100 }, { color: "#6366f1", position: 100, opacity: 100 }] },
  { label: "Forest",     type: "linear" as GradientType, angle: 135, stops: [{ color: "#22c55e", position: 0, opacity: 100 }, { color: "#06b6d4", position: 100, opacity: 100 }] },
  { label: "Lava",       type: "linear" as GradientType, angle: 135, stops: [{ color: "#ef4444", position: 0, opacity: 100 }, { color: "#f97316", position: 100, opacity: 100 }] },
  { label: "Midnight",   type: "linear" as GradientType, angle: 180, stops: [{ color: "#0f172a", position: 0, opacity: 100 }, { color: "#1e1b4b", position: 50, opacity: 100 }, { color: "#0f172a", position: 100, opacity: 100 }] },
  { label: "Aurora",     type: "linear" as GradientType, angle: 90,  stops: [{ color: "#34d399", position: 0, opacity: 100 }, { color: "#818cf8", position: 50, opacity: 100 }, { color: "#f472b6", position: 100, opacity: 100 }] },
  { label: "Gold",       type: "linear" as GradientType, angle: 135, stops: [{ color: "#f59e0b", position: 0, opacity: 100 }, { color: "#fbbf24", position: 50, opacity: 100 }, { color: "#d97706", position: 100, opacity: 100 }] },
  { label: "Neon",       type: "linear" as GradientType, angle: 90,  stops: [{ color: "#00ff88", position: 0, opacity: 100 }, { color: "#00cfff", position: 100, opacity: 100 }] },
  { label: "Rose",       type: "radial" as GradientType, angle: 90,  stops: [{ color: "#fda4af", position: 0, opacity: 100 }, { color: "#9f1239", position: 100, opacity: 100 }] },
  { label: "Radial Glow",type: "radial" as GradientType, angle: 90,  stops: [{ color: "#818cf8", position: 0, opacity: 80  }, { color: "#0f172a", position: 100, opacity: 100 }] },
  { label: "Conic",      type: "conic"  as GradientType, angle: 0,   stops: [{ color: "#f97316", position: 0, opacity: 100 }, { color: "#ec4899", position: 33, opacity: 100 }, { color: "#6366f1", position: 66, opacity: 100 }, { color: "#f97316", position: 100, opacity: 100 }] },
  { label: "Transparent",type: "linear" as GradientType, angle: 90,  stops: [{ color: "#000000", position: 0, opacity: 0   }, { color: "#000000", position: 100, opacity: 100 }] },
];

const DIRECTIONS = [
  { label: "→",   angle: 90  },
  { label: "↓",   angle: 180 },
  { label: "←",   angle: 270 },
  { label: "↑",   angle: 0   },
  { label: "↘",   angle: 135 },
  { label: "↗",   angle: 45  },
  { label: "↙",   angle: 225 },
  { label: "↖",   angle: 315 },
];

function makeStop(overrides: Partial<ColorStop> = {}): ColorStop {
  return { id: uid(), color: "#6366f1", position: 50, opacity: 100, ...overrides };
}

export default function GradientGenerator() {
  const [type, setType]   = useState<GradientType>("linear");
  const [angle, setAngle] = useState(135);
  const [stops, setStops] = useState<ColorStop[]>([
    makeStop({ color: "#f97316", position: 0   }),
    makeStop({ color: "#ec4899", position: 50  }),
    makeStop({ color: "#8b5cf6", position: 100 }),
  ]);
  const [selected, setSelected] = useState<string>(stops[0].id);
  const [copied, setCopied]     = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  // ── CSS generation ──
  const gradientCSS = useMemo(() => {
    const sorted = [...stops].sort((a, b) => a.position - b.position);
    const colorStops = sorted.map(stopToCSS).join(", ");
    if (type === "linear") return `linear-gradient(${angle}deg, ${colorStops})`;
    if (type === "radial")  return `radial-gradient(circle, ${colorStops})`;
    return `conic-gradient(from ${angle}deg, ${colorStops})`;
  }, [stops, type, angle]);

  const fullCSS     = `background: ${gradientCSS};`;
  const tailwindCSS = `style={{ background: "${gradientCSS}" }}`;

  // ── Stop mutations ──
  const addStop = () => {
    const sorted = [...stops].sort((a,b) => a.position - b.position);
    // Find biggest gap
    let bestPos = 50;
    let bestGap = 0;
    for (let i = 0; i < sorted.length - 1; i++) {
      const gap = sorted[i+1].position - sorted[i].position;
      if (gap > bestGap) { bestGap = gap; bestPos = (sorted[i].position + sorted[i+1].position) / 2; }
    }
    const s = makeStop({ position: Math.round(bestPos) });
    setStops(p => [...p, s]);
    setSelected(s.id);
  };

  const removeStop = (id: string) => {
    if (stops.length <= 2) return;
    setStops(p => {
      const next = p.filter(s => s.id !== id);
      if (selected === id) setSelected(next[0].id);
      return next;
    });
  };

  const updateStop = (id: string, patch: Partial<ColorStop>) =>
    setStops(p => p.map(s => s.id === id ? { ...s, ...patch } : s));

  const applyPreset = (preset: typeof PRESETS[0]) => {
    const newStops = preset.stops.map(s => makeStop(s));
    setStops(newStops);
    setType(preset.type);
    setAngle(preset.angle);
    setSelected(newStops[0].id);
  };

  // ── Slider drag on gradient bar ──
  const handleBarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos  = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const clamped = Math.max(0, Math.min(100, pos));
    const s = makeStop({ position: clamped });
    setStops(p => [...p, s]);
    setSelected(s.id);
  }, []);

  const handleStopDrag = useCallback((id: string, e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setDragging(id);
    setSelected(id);

    const bar = (e.currentTarget.parentElement as HTMLElement);
    const rect = bar.getBoundingClientRect();

    const onMove = (me: MouseEvent) => {
      const pos = Math.round(((me.clientX - rect.left) / rect.width) * 100);
      updateStop(id, { position: Math.max(0, Math.min(100, pos)) });
    };
    const onUp = () => {
      setDragging(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  const copy = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const sel = stops.find(s => s.id === selected);
  const sortedStops = [...stops].sort((a,b) => a.position - b.position);

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-violet-500/[0.06] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-pink-500/[0.04] blur-3xl pointer-events-none" />

      {/* NAV */}
            <ToolNavbar toolName="Gradient Generator" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-violet-500/10 flex items-center justify-center text-lg">🌈</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Gradient Generator</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded">linear · radial · conic</span>
          </div>
          <p className="text-slate-500 text-sm">Build beautiful CSS gradients visually. Add color stops, drag to reposition, adjust opacity — export CSS or Tailwind instantly.</p>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="font-mono text-[11px] text-slate-600 self-center uppercase tracking-wider">Presets:</span>
          {PRESETS.map((p) => (
            <button key={p.label} onClick={() => applyPreset(p)}
              className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded hover:border-violet-500/30 hover:text-violet-400 transition-all">
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Controls — left */}
          <div className="xl:col-span-1 flex flex-col gap-4">

            {/* Type */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">Type</div>
              <div className="flex gap-1 bg-white/[0.04] border border-white/[0.08] rounded-lg p-1">
                {(["linear","radial","conic"] as GradientType[]).map(t => (
                  <button key={t} onClick={() => setType(t)}
                    className={`flex-1 font-mono text-xs py-2 rounded-md capitalize transition-all ${type === t ? "bg-violet-500/20 text-violet-400 font-bold" : "text-slate-500 hover:text-slate-300"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Angle (linear/conic) */}
            {(type === "linear" || type === "conic") && (
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
                <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">
                  {type === "linear" ? "Direction / Angle" : "Start Angle"}
                </div>

                {type === "linear" && (
                  <div className="grid grid-cols-4 gap-1.5 mb-3">
                    {DIRECTIONS.map(d => (
                      <button key={d.angle} onClick={() => setAngle(d.angle)}
                        className={`py-2 font-mono text-sm rounded border transition-all ${angle === d.angle ? "bg-violet-500/20 border-violet-500/30 text-violet-400" : "border-white/[0.08] text-slate-600 hover:text-slate-300"}`}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                )}

                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="font-mono text-xs text-slate-500">Angle</span>
                    <span className="font-mono text-xs text-violet-400">{angle}°</span>
                  </div>
                  <input type="range" min={0} max={360} value={angle} onChange={e => setAngle(parseInt(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{ background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${(angle/360)*100}%, rgba(255,255,255,0.1) ${(angle/360)*100}%, rgba(255,255,255,0.1) 100%)` }}
                  />
                </div>
              </div>
            )}

            {/* Color stops */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Color Stops</span>
                <button onClick={addStop} className="font-mono text-xs px-3 py-1 bg-violet-500/15 border border-violet-500/30 text-violet-400 rounded hover:bg-violet-500/25 transition-all">+ Add</button>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {sortedStops.map((stop) => (
                  <div key={stop.id} onClick={() => setSelected(stop.id)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all ${selected === stop.id ? "bg-violet-500/[0.08]" : "hover:bg-white/[0.02]"}`}>
                    <div className="w-6 h-6 rounded border border-white/20 shrink-0 cursor-pointer"
                      style={{ backgroundColor: stop.color }}
                      onClick={e => { e.stopPropagation(); setSelected(stop.id); }} />
                    <div className="flex-1 min-w-0">
                      <div className={`font-mono text-xs ${selected === stop.id ? "text-violet-400" : "text-slate-400"}`}>{stop.color}</div>
                      <div className="font-mono text-[10px] text-slate-700">{stop.position}% · {stop.opacity}% opacity</div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); removeStop(stop.id); }}
                      className="text-slate-700 hover:text-red-400 transition-colors font-mono text-lg shrink-0">×</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected stop editor */}
            {sel && (
              <div className="bg-white/[0.03] border border-violet-500/20 rounded-xl p-4 flex flex-col gap-4">
                <div className="font-mono text-[11px] uppercase tracking-[2px] text-violet-500/60">Edit Stop</div>

                {/* Color picker */}
                <div>
                  <div className="font-mono text-xs text-slate-500 mb-2">Color</div>
                  <div className="flex items-center gap-3">
                    <input type="color" value={sel.color} onChange={e => updateStop(sel.id, { color: e.target.value })}
                      className="w-12 h-10 rounded cursor-pointer bg-transparent border-0 p-0" />
                    <input value={sel.color} onChange={e => updateStop(sel.id, { color: e.target.value })}
                      className="font-mono text-xs px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded text-slate-300 outline-none w-28 focus:border-violet-500/30" />
                  </div>
                </div>

                {/* Position */}
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="font-mono text-xs text-slate-500">Position</span>
                    <span className="font-mono text-xs text-violet-400">{sel.position}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={sel.position}
                    onChange={e => updateStop(sel.id, { position: parseInt(e.target.value) })}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{ background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${sel.position}%, rgba(255,255,255,0.1) ${sel.position}%, rgba(255,255,255,0.1) 100%)` }}
                  />
                </div>

                {/* Opacity */}
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="font-mono text-xs text-slate-500">Opacity</span>
                    <span className="font-mono text-xs text-violet-400">{sel.opacity}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={sel.opacity}
                    onChange={e => updateStop(sel.id, { opacity: parseInt(e.target.value) })}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{ background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${sel.opacity}%, rgba(255,255,255,0.1) ${sel.opacity}%, rgba(255,255,255,0.1) 100%)` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Preview + Output — right */}
          <div className="xl:col-span-2 flex flex-col gap-4">

            {/* Gradient bar with draggable stops */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">Gradient Bar <span className="text-slate-700 normal-case">(click to add stop)</span></div>

              {/* The bar */}
              <div className="relative h-10 rounded-xl cursor-crosshair select-none"
                style={{ background: gradientCSS }}
                onClick={handleBarClick}>
                {/* Stop handles */}
                {stops.map(stop => (
                  <div key={stop.id}
                    onMouseDown={e => handleStopDrag(stop.id, e)}
                    onClick={e => e.stopPropagation()}
                    style={{ left: `${stop.position}%`, position: "absolute", top: "50%", transform: "translate(-50%,-50%)" }}
                    className={`w-5 h-5 rounded-full border-2 cursor-grab active:cursor-grabbing transition-transform ${selected === stop.id ? "border-white scale-125 shadow-lg" : "border-white/60 hover:scale-110"} ${dragging === stop.id ? "cursor-grabbing" : ""}`}
                    >
                    <div className="w-full h-full rounded-full" style={{ backgroundColor: stop.color }} />
                  </div>
                ))}
              </div>

              {/* Position markers */}
              <div className="flex justify-between mt-1.5 px-0.5">
                {[0,25,50,75,100].map(n => (
                  <span key={n} className="font-mono text-[9px] text-slate-700">{n}%</span>
                ))}
              </div>
            </div>

            {/* Preview canvas */}
            <div className="rounded-2xl border border-white/[0.06] overflow-hidden" style={{ height: 280 }}>
              <div className="w-full h-full" style={{ background: gradientCSS }} />
            </div>

            {/* Preview shapes */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { shape: "rounded-xl",   label: "Card",   w: "w-full", h: "h-24"  },
                { shape: "rounded-full", label: "Circle", w: "w-24",   h: "h-24"  },
                { shape: "rounded-sm",   label: "Button", w: "w-full", h: "h-10"  },
              ].map(({ shape, label, w, h }) => (
                <div key={label} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 flex flex-col items-center gap-2">
                  <span className="font-mono text-[10px] text-slate-700">{label}</span>
                  <div className={`${w} ${h} ${shape} flex-shrink-0`} style={{ background: gradientCSS }} />
                </div>
              ))}
            </div>

            {/* CSS Output */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 flex flex-col gap-3">
              <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">CSS Output</div>

              {/* CSS */}
              <div className="flex items-start gap-3 bg-black/40 border border-white/[0.06] rounded-lg px-4 py-3 group">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[10px] text-slate-700 mb-1">CSS</div>
                  <code className="font-mono text-xs text-violet-400 break-all leading-relaxed">{fullCSS}</code>
                </div>
                <button onClick={() => copy("css", fullCSS)}
                  className={`font-mono text-[11px] px-3 py-1.5 rounded border shrink-0 transition-all mt-1 ${copied === "css" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-600 opacity-0 group-hover:opacity-100 hover:text-slate-300"}`}>
                  {copied === "css" ? "✓" : "Copy"}
                </button>
              </div>

              {/* Gradient value only */}
              <div className="flex items-start gap-3 bg-black/40 border border-white/[0.06] rounded-lg px-4 py-3 group">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[10px] text-slate-700 mb-1">Gradient value</div>
                  <code className="font-mono text-xs text-emerald-400 break-all leading-relaxed">{gradientCSS}</code>
                </div>
                <button onClick={() => copy("val", gradientCSS)}
                  className={`font-mono text-[11px] px-3 py-1.5 rounded border shrink-0 transition-all mt-1 ${copied === "val" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-600 opacity-0 group-hover:opacity-100 hover:text-slate-300"}`}>
                  {copied === "val" ? "✓" : "Copy"}
                </button>
              </div>

              {/* Tailwind */}
              <div className="flex items-start gap-3 bg-black/40 border border-white/[0.06] rounded-lg px-4 py-3 group">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[10px] text-slate-700 mb-1">React / Tailwind inline</div>
                  <code className="font-mono text-xs text-cyan-400 break-all leading-relaxed">{tailwindCSS}</code>
                </div>
                <button onClick={() => copy("tw", tailwindCSS)}
                  className={`font-mono text-[11px] px-3 py-1.5 rounded border shrink-0 transition-all mt-1 ${copied === "tw" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-600 opacity-0 group-hover:opacity-100 hover:text-slate-300"}`}>
                  {copied === "tw" ? "✓" : "Copy"}
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Type",   val: type   },
                { label: "Stops",  val: stops.length },
                { label: "Angle",  val: (type === "radial" ? "—" : `${angle}°`) },
                { label: "CSS len",val: fullCSS.length },
              ].map(s => (
                <div key={s.label} className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-3 text-center">
                  <div className="font-mono text-lg font-bold text-violet-400 capitalize">{s.val}</div>
                  <div className="font-mono text-[10px] text-slate-700 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-6">
          {[
            { icon: "🌈", title: "3 Types",         desc: "Linear, radial, and conic gradient types with full control." },
            { icon: "🎯", title: "Drag Stops",       desc: "Drag color stops on the gradient bar to reposition them." },
            { icon: "🎨", title: "Per-stop Opacity", desc: "Each color stop has its own opacity — build transparent gradients easily." },
            { icon: "📋", title: "3 Copy Formats",   desc: "CSS property, raw gradient value, or React inline style — hover to copy." },
          ].map(c => (
            <div key={c.title} className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-4 py-4">
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