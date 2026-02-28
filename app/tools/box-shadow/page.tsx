"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useMemo } from "react";

// ── Types ─────────────────────────────────────────────────────
interface ShadowLayer {
  id: string;
  inset: boolean;
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
  enabled: boolean;
}

function uid() { return Math.random().toString(36).slice(2, 8); }

function layerToCSS(l: ShadowLayer): string {
  const hex = l.color;
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  const alpha = (l.opacity / 100).toFixed(2);
  const color = `rgba(${r},${g},${b},${alpha})`;
  return `${l.inset ? "inset " : ""}${l.offsetX}px ${l.offsetY}px ${l.blur}px ${l.spread}px ${color}`;
}

function makeLayer(overrides: Partial<ShadowLayer> = {}): ShadowLayer {
  return {
    id: uid(),
    inset: false,
    offsetX: 4,
    offsetY: 8,
    blur: 24,
    spread: 0,
    color: "#000000",
    opacity: 25,
    enabled: true,
    ...overrides,
  };
}

// ── Presets ───────────────────────────────────────────────────
const PRESETS = [
  { label: "Soft",       layers: [{ offsetX:0, offsetY:4,  blur:16, spread:0,  color:"#000000", opacity:12, inset:false }] },
  { label: "Elevated",   layers: [{ offsetX:0, offsetY:8,  blur:24, spread:-4, color:"#000000", opacity:20, inset:false }, { offsetX:0, offsetY:2, blur:8, spread:0, color:"#000000", opacity:10, inset:false }] },
  { label: "Sharp",      layers: [{ offsetX:4, offsetY:4,  blur:0,  spread:0,  color:"#000000", opacity:40, inset:false }] },
  { label: "Dreamy",     layers: [{ offsetX:0, offsetY:16, blur:48, spread:8,  color:"#6366f1", opacity:30, inset:false }] },
  { label: "Layered",    layers: [{ offsetX:0, offsetY:1, blur:2, spread:0, color:"#000000", opacity:7, inset:false }, { offsetX:0, offsetY:4, blur:8, spread:0, color:"#000000", opacity:10, inset:false }, { offsetX:0, offsetY:16, blur:32, spread:0, color:"#000000", opacity:12, inset:false }] },
  { label: "Neon Blue",  layers: [{ offsetX:0, offsetY:0, blur:20, spread:4, color:"#3b82f6", opacity:70, inset:false }] },
  { label: "Neon Green", layers: [{ offsetX:0, offsetY:0, blur:20, spread:4, color:"#22c55e", opacity:70, inset:false }] },
  { label: "Inset",      layers: [{ offsetX:0, offsetY:4, blur:12, spread:0, color:"#000000", opacity:25, inset:true  }] },
  { label: "Retro",      layers: [{ offsetX:6, offsetY:6, blur:0, spread:0, color:"#000000", opacity:100, inset:false }] },
  { label: "None",       layers: [] },
];

const BG_OPTIONS = [
  { label: "White",    value: "#ffffff", class: "bg-white" },
  { label: "Light",    value: "#f1f5f9", class: "bg-slate-100" },
  { label: "Dark",     value: "#1e293b", class: "bg-slate-800" },
  { label: "Darker",   value: "#0f172a", class: "bg-slate-950" },
  { label: "Purple",   value: "#4c1d95", class: "bg-violet-900" },
  { label: "Gradient", value: "linear-gradient(135deg,#667eea,#764ba2)", class: "bg-gradient-to-br from-indigo-500 to-purple-600" },
];

const BOX_SHAPES = [
  { label: "Square",   radius: "0px"    },
  { label: "Rounded",  radius: "12px"   },
  { label: "Pill",     radius: "9999px" },
  { label: "Circle",   radius: "50%"    },
];

export default function BoxShadowGenerator() {
  const [layers, setLayers]   = useState<ShadowLayer[]>([makeLayer({ offsetX:0, offsetY:8, blur:24, spread:-4, color:"#000000", opacity:20 }), makeLayer({ offsetX:0, offsetY:2, blur:8, spread:0, color:"#000000", opacity:10 })]);
  const [selected, setSelected] = useState<string>(layers[0]?.id ?? "");
  const [boxBg, setBoxBg]     = useState("#ffffff");
  const [canvasBg, setCanvasBg] = useState("#f1f5f9");
  const [shape, setShape]     = useState("12px");
  const [boxColor, setBoxColor] = useState("#ffffff");
  const [copied, setCopied]   = useState(false);

  const css = useMemo(() => {
    const active = layers.filter((l) => l.enabled);
    if (active.length === 0) return "none";
    return active.map(layerToCSS).join(",\n     ");
  }, [layers]);

  const cssLine = useMemo(() => {
    const active = layers.filter((l) => l.enabled);
    if (active.length === 0) return "none";
    return active.map(layerToCSS).join(", ");
  }, [layers]);

  const fullCSS = `box-shadow: ${cssLine};`;

  const addLayer = () => {
    const l = makeLayer();
    setLayers((p) => [...p, l]);
    setSelected(l.id);
  };

  const removeLayer = (id: string) => {
    setLayers((p) => {
      const next = p.filter((l) => l.id !== id);
      if (selected === id) setSelected(next[0]?.id ?? "");
      return next;
    });
  };

  const toggleLayer = (id: string) => setLayers((p) => p.map((l) => l.id === id ? { ...l, enabled: !l.enabled } : l));

  const updateLayer = (id: string, patch: Partial<ShadowLayer>) =>
    setLayers((p) => p.map((l) => l.id === id ? { ...l, ...patch } : l));

  const applyPreset = (preset: typeof PRESETS[0]) => {
    if (preset.layers.length === 0) { setLayers([]); return; }
    const newLayers = preset.layers.map((pl) => makeLayer(pl));
    setLayers(newLayers);
    setSelected(newLayers[0]?.id ?? "");
  };

  const copy = () => { navigator.clipboard.writeText(fullCSS); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  const sel = layers.find((l) => l.id === selected);

  const Slider = ({ label, prop, min, max, unit = "px" }: { label: string; prop: keyof ShadowLayer; min: number; max: number; unit?: string }) => {
    if (!sel) return null;
    const val = sel[prop] as number;
    return (
      <div>
        <div className="flex justify-between mb-1.5">
          <span className="font-mono text-xs text-slate-500">{label}</span>
          <span className="font-mono text-xs text-slate-400">{val}{unit}</span>
        </div>
        <input type="range" min={min} max={max} value={val}
          onChange={(e) => updateLayer(sel.id, { [prop]: parseInt(e.target.value) })}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{ background: `linear-gradient(to right, #00ff88 0%, #00ff88 ${((val - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) ${((val - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) 100%)` }}
        />
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-violet-500/[0.06] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

      {/* NAV */}
            <ToolNavbar toolName="Box Shadow Generator" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-violet-500/10 flex items-center justify-center text-lg">🌫️</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Box Shadow Generator</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded">multi-layer</span>
          </div>
          <p className="text-slate-500 text-sm">Build beautiful box shadows with multiple layers. Adjust offset, blur, spread, color and opacity — copy the CSS instantly.</p>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="font-mono text-[11px] text-slate-600 self-center uppercase tracking-wider">Presets:</span>
          {PRESETS.map((p) => (
            <button key={p.label} onClick={() => applyPreset(p)}
              className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded hover:text-violet-400 hover:border-violet-500/30 transition-all">
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

          {/* Controls — left */}
          <div className="xl:col-span-4 flex flex-col gap-4">

            {/* Layers panel */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Shadow Layers</span>
                <button onClick={addLayer} className="font-mono text-xs px-3 py-1 bg-violet-500/15 border border-violet-500/30 text-violet-400 rounded hover:bg-violet-500/25 transition-all">+ Add</button>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {layers.length === 0 && <div className="px-4 py-6 text-center font-mono text-xs text-slate-700">No layers — add one above</div>}
                {layers.map((l, i) => (
                  <div key={l.id} onClick={() => setSelected(l.id)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all ${selected === l.id ? "bg-violet-500/[0.08]" : "hover:bg-white/[0.02]"}`}>
                    {/* Enabled toggle */}
                    <button onClick={(e) => { e.stopPropagation(); toggleLayer(l.id); }}
                      className={`w-4 h-4 rounded border transition-all shrink-0 ${l.enabled ? "bg-violet-500 border-violet-500" : "border-white/20"}`}>
                      {l.enabled && <span className="text-white text-[8px] flex items-center justify-center h-full">✓</span>}
                    </button>

                    {/* Color swatch */}
                    <div className="w-5 h-5 rounded border border-white/20 shrink-0" style={{ backgroundColor: l.color }} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className={`font-mono text-xs truncate ${selected === l.id ? "text-violet-400" : "text-slate-400"}`}>
                        Layer {i + 1}{l.inset ? " (inset)" : ""}
                      </div>
                      <div className="font-mono text-[10px] text-slate-700 truncate">
                        {l.offsetX}px {l.offsetY}px {l.blur}px {l.spread}px
                      </div>
                    </div>

                    {/* Remove */}
                    <button onClick={(e) => { e.stopPropagation(); removeLayer(l.id); }}
                      className="text-slate-700 hover:text-red-400 transition-colors font-mono text-sm">×</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Layer editor */}
            {sel && (
              <div className="bg-white/[0.03] border border-violet-500/20 rounded-xl p-4 flex flex-col gap-4">
                <div className="font-mono text-[11px] uppercase tracking-[2px] text-violet-500/60">Edit Layer</div>

                <div className="grid grid-cols-2 gap-3">
                  <Slider label="Offset X" prop="offsetX" min={-100} max={100} />
                  <Slider label="Offset Y" prop="offsetY" min={-100} max={100} />
                  <Slider label="Blur"     prop="blur"    min={0}    max={100} />
                  <Slider label="Spread"   prop="spread"  min={-50}  max={50}  />
                  <Slider label="Opacity"  prop="opacity" min={0}    max={100} unit="%" />
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-mono text-xs text-slate-500 mb-1.5">Color</div>
                    <div className="flex items-center gap-2">
                      <input type="color" value={sel.color}
                        onChange={(e) => updateLayer(sel.id, { color: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0" />
                      <input value={sel.color} onChange={(e) => updateLayer(sel.id, { color: e.target.value })}
                        className="font-mono text-xs px-2 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded text-slate-300 outline-none w-24 focus:border-violet-500/30" />
                    </div>
                  </div>

                  <label onClick={() => updateLayer(sel.id, { inset: !sel.inset })} className="flex items-center gap-2 cursor-pointer mt-4">
                    <div className={`w-8 h-4 rounded-full relative transition-all ${sel.inset ? "bg-violet-500" : "bg-white/10"}`}>
                      <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${sel.inset ? "left-4" : "left-0.5"}`} />
                    </div>
                    <span className="font-mono text-xs text-slate-500">Inset</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Preview — center */}
          <div className="xl:col-span-5 flex flex-col gap-4">

            {/* Canvas */}
            <div className="flex-1 min-h-[400px] flex items-center justify-center rounded-2xl border border-white/[0.06] relative overflow-hidden transition-all"
              style={{ background: canvasBg.startsWith("linear") ? canvasBg : canvasBg }}>

              {/* Checkered pattern for transparent */}
              <div className="absolute inset-0 pointer-events-none opacity-10"
                style={{ backgroundImage: "linear-gradient(45deg,#888 25%,transparent 25%),linear-gradient(-45deg,#888 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#888 75%),linear-gradient(-45deg,transparent 75%,#888 75%)", backgroundSize: "20px 20px", backgroundPosition: "0 0,0 10px,10px -10px,-10px 0px" }} />

              {/* Box */}
              <div style={{
                width: 160,
                height: shape === "50%" ? 160 : 120,
                borderRadius: shape,
                backgroundColor: boxColor,
                boxShadow: cssLine,
                transition: "box-shadow 0.2s ease",
              }} />
            </div>

            {/* Canvas BG */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">Canvas Background</div>
              <div className="flex flex-wrap gap-2">
                {BG_OPTIONS.map((bg) => (
                  <button key={bg.label} onClick={() => setCanvasBg(bg.value)}
                    title={bg.label}
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${bg.class} ${canvasBg === bg.value ? "border-white/60 scale-110" : "border-transparent hover:border-white/30"}`} />
                ))}
              </div>
            </div>

            {/* Box options */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">Box Shape</div>
                  <div className="flex flex-wrap gap-1.5">
                    {BOX_SHAPES.map((s) => (
                      <button key={s.label} onClick={() => setShape(s.radius)}
                        className={`font-mono text-[11px] px-2.5 py-1 rounded border transition-all ${shape === s.radius ? "bg-violet-500/20 border-violet-500/30 text-violet-400" : "border-white/[0.08] text-slate-600 hover:text-slate-300"}`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">Box Color</div>
                  <div className="flex items-center gap-2">
                    <input type="color" value={boxColor} onChange={(e) => setBoxColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0" />
                    <input value={boxColor} onChange={(e) => setBoxColor(e.target.value)}
                      className="font-mono text-xs px-2 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded text-slate-300 outline-none w-24 focus:border-violet-500/30" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CSS output — right */}
          <div className="xl:col-span-3 flex flex-col gap-4">
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 flex flex-col gap-3 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">CSS Output</span>
                <button onClick={copy}
                  className={`font-mono text-[11px] px-3 py-1 rounded border transition-all ${copied ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                  {copied ? "✓ Copied!" : "Copy"}
                </button>
              </div>

              {/* CSS box */}
              <div className="bg-black/40 border border-white/[0.06] rounded-lg p-4 font-mono text-xs leading-relaxed flex-1 min-h-[200px]">
                <span className="text-slate-500">{"/* CSS */"}</span>{"\n"}
                <span className="text-violet-400">box-shadow</span>
                <span className="text-slate-400">: </span>
                {layers.filter((l) => l.enabled).length === 0
                  ? <span className="text-slate-500">none</span>
                  : layers.filter((l) => l.enabled).map((l, i, arr) => (
                      <span key={l.id}>
                        {"\n  "}
                        {l.inset && <span className="text-pink-400">inset </span>}
                        <span className="text-orange-400">{l.offsetX}px {l.offsetY}px {l.blur}px {l.spread}px </span>
                        <span className="text-emerald-400">{layerToCSS(l).split(" ").at(-1)}</span>
                        {i < arr.length - 1 && <span className="text-slate-600">,</span>}
                      </span>
                    ))
                }
                <span className="text-slate-400">;</span>
              </div>

              {/* Tailwind equivalent */}
              {layers.filter((l) => l.enabled).length > 0 && (
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-2">Tailwind (custom)</div>
                  <div className="bg-black/40 border border-white/[0.06] rounded-lg p-3 font-mono text-[11px] text-slate-400 leading-relaxed break-all">
                    <span className="text-cyan-400">className</span><span className="text-slate-500">=</span>
                    <span className="text-emerald-400">"[box-shadow:{cssLine.replace(/\n\s*/g,"")}]"</span>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mt-auto">
                {[
                  { label: "Layers",   val: layers.length },
                  { label: "Active",   val: layers.filter((l) => l.enabled).length },
                  { label: "Inset",    val: layers.filter((l) => l.inset).length },
                  { label: "CSS chars",val: fullCSS.length },
                ].map((s) => (
                  <div key={s.label} className="bg-white/[0.02] border border-white/[0.04] rounded-lg px-3 py-2 text-center">
                    <div className="font-mono text-base font-bold text-violet-400">{s.val}</div>
                    <div className="font-mono text-[9px] text-slate-700">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-6">
          {[
            { icon: "🌫️", title: "Multi-layer",    desc: "Stack multiple shadow layers for complex, realistic depth effects." },
            { icon: "🎨", title: "Full Control",   desc: "Offset X/Y, blur, spread, color, opacity, and inset per layer." },
            { icon: "⚡", title: "10 Presets",     desc: "Soft, Elevated, Sharp, Dreamy, Neon, Retro and more to start fast." },
            { icon: "📋", title: "Copy CSS",       desc: "Get clean CSS and Tailwind JIT class instantly." },
          ].map((c) => (
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