"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useMemo } from "react";

// ── Category definitions ──────────────────────────────────────
type CategoryKey = keyof typeof CATEGORIES;

const CATEGORIES = {
  length: {
    label: "Length",
    icon: "📏",
    color: "text-cyan-400",
    accent: "bg-cyan-500/10 border-cyan-500/25",
    base: "meter",
    units: [
      { key:"meter",       label:"Meter",        symbol:"m",   factor:1 },
      { key:"kilometer",   label:"Kilometer",    symbol:"km",  factor:1000 },
      { key:"centimeter",  label:"Centimeter",   symbol:"cm",  factor:0.01 },
      { key:"millimeter",  label:"Millimeter",   symbol:"mm",  factor:0.001 },
      { key:"micrometer",  label:"Micrometer",   symbol:"μm",  factor:1e-6 },
      { key:"nanometer",   label:"Nanometer",    symbol:"nm",  factor:1e-9 },
      { key:"mile",        label:"Mile",         symbol:"mi",  factor:1609.344 },
      { key:"yard",        label:"Yard",         symbol:"yd",  factor:0.9144 },
      { key:"foot",        label:"Foot",         symbol:"ft",  factor:0.3048 },
      { key:"inch",        label:"Inch",         symbol:"in",  factor:0.0254 },
      { key:"nautical",    label:"Nautical Mile",symbol:"nmi", factor:1852 },
      { key:"lightyear",   label:"Light Year",   symbol:"ly",  factor:9.461e15 },
    ],
  },
  weight: {
    label: "Weight / Mass",
    icon: "⚖️",
    color: "text-orange-400",
    accent: "bg-orange-500/10 border-orange-500/25",
    base: "kilogram",
    units: [
      { key:"kilogram",  label:"Kilogram",   symbol:"kg",  factor:1 },
      { key:"gram",      label:"Gram",       symbol:"g",   factor:0.001 },
      { key:"milligram", label:"Milligram",  symbol:"mg",  factor:1e-6 },
      { key:"tonne",     label:"Metric Ton", symbol:"t",   factor:1000 },
      { key:"pound",     label:"Pound",      symbol:"lb",  factor:0.453592 },
      { key:"ounce",     label:"Ounce",      symbol:"oz",  factor:0.0283495 },
      { key:"stone",     label:"Stone",      symbol:"st",  factor:6.35029 },
      { key:"uston",     label:"US Ton",     symbol:"ton", factor:907.185 },
      { key:"ukton",     label:"UK Ton",     symbol:"LT",  factor:1016.05 },
      { key:"carat",     label:"Carat",      symbol:"ct",  factor:0.0002 },
    ],
  },
  temperature: {
    label: "Temperature",
    icon: "🌡️",
    color: "text-red-400",
    accent: "bg-red-500/10 border-red-500/25",
    base: "celsius",
    units: [
      { key:"celsius",    label:"Celsius",    symbol:"°C" },
      { key:"fahrenheit", label:"Fahrenheit", symbol:"°F" },
      { key:"kelvin",     label:"Kelvin",     symbol:"K"  },
      { key:"rankine",    label:"Rankine",    symbol:"°R" },
    ],
  },
  area: {
    label: "Area",
    icon: "⬛",
    color: "text-emerald-400",
    accent: "bg-emerald-500/10 border-emerald-500/25",
    base: "sqmeter",
    units: [
      { key:"sqmeter",     label:"Sq. Meter",     symbol:"m²",   factor:1 },
      { key:"sqkilometer", label:"Sq. Kilometer",  symbol:"km²",  factor:1e6 },
      { key:"sqcentimeter",label:"Sq. Centimeter", symbol:"cm²",  factor:1e-4 },
      { key:"sqmillimeter",label:"Sq. Millimeter", symbol:"mm²",  factor:1e-6 },
      { key:"sqfoot",      label:"Sq. Foot",       symbol:"ft²",  factor:0.092903 },
      { key:"sqinch",      label:"Sq. Inch",       symbol:"in²",  factor:6.4516e-4 },
      { key:"sqyard",      label:"Sq. Yard",       symbol:"yd²",  factor:0.836127 },
      { key:"sqmile",      label:"Sq. Mile",       symbol:"mi²",  factor:2.59e6 },
      { key:"acre",        label:"Acre",           symbol:"ac",   factor:4046.86 },
      { key:"hectare",     label:"Hectare",        symbol:"ha",   factor:10000 },
    ],
  },
  volume: {
    label: "Volume",
    icon: "🧪",
    color: "text-violet-400",
    accent: "bg-violet-500/10 border-violet-500/25",
    base: "liter",
    units: [
      { key:"liter",     label:"Liter",        symbol:"L",   factor:1 },
      { key:"milliliter",label:"Milliliter",   symbol:"mL",  factor:0.001 },
      { key:"cubicmeter",label:"Cubic Meter",  symbol:"m³",  factor:1000 },
      { key:"cubicfoot", label:"Cubic Foot",   symbol:"ft³", factor:28.3168 },
      { key:"cubicinch", label:"Cubic Inch",   symbol:"in³", factor:0.0163871 },
      { key:"gallon",    label:"US Gallon",    symbol:"gal", factor:3.78541 },
      { key:"ukgallon",  label:"UK Gallon",    symbol:"UK gal",factor:4.54609 },
      { key:"quart",     label:"US Quart",     symbol:"qt",  factor:0.946353 },
      { key:"pint",      label:"US Pint",      symbol:"pt",  factor:0.473176 },
      { key:"cup",       label:"US Cup",       symbol:"cup", factor:0.236588 },
      { key:"floz",      label:"Fluid Ounce",  symbol:"fl oz",factor:0.0295735 },
      { key:"tablespoon",label:"Tablespoon",   symbol:"tbsp",factor:0.0147868 },
      { key:"teaspoon",  label:"Teaspoon",     symbol:"tsp", factor:0.00492892 },
    ],
  },
  speed: {
    label: "Speed",
    icon: "⚡",
    color: "text-yellow-400",
    accent: "bg-yellow-500/10 border-yellow-500/25",
    base: "mps",
    units: [
      { key:"mps",   label:"Meter/sec",  symbol:"m/s",  factor:1 },
      { key:"kph",   label:"Km/hour",    symbol:"km/h", factor:1/3.6 },
      { key:"mph",   label:"Miles/hour", symbol:"mph",  factor:0.44704 },
      { key:"fps",   label:"Feet/sec",   symbol:"ft/s", factor:0.3048 },
      { key:"knot",  label:"Knot",       symbol:"kn",   factor:0.514444 },
      { key:"mach",  label:"Mach",       symbol:"M",    factor:340.29 },
      { key:"light", label:"Speed of Light",symbol:"c", factor:299792458 },
    ],
  },
  time: {
    label: "Time",
    icon: "⏱️",
    color: "text-pink-400",
    accent: "bg-pink-500/10 border-pink-500/25",
    base: "second",
    units: [
      { key:"nanosecond",  label:"Nanosecond",  symbol:"ns",  factor:1e-9 },
      { key:"microsecond", label:"Microsecond", symbol:"μs",  factor:1e-6 },
      { key:"millisecond", label:"Millisecond", symbol:"ms",  factor:0.001 },
      { key:"second",      label:"Second",      symbol:"s",   factor:1 },
      { key:"minute",      label:"Minute",      symbol:"min", factor:60 },
      { key:"hour",        label:"Hour",        symbol:"hr",  factor:3600 },
      { key:"day",         label:"Day",         symbol:"d",   factor:86400 },
      { key:"week",        label:"Week",        symbol:"wk",  factor:604800 },
      { key:"month",       label:"Month (avg)", symbol:"mo",  factor:2628000 },
      { key:"year",        label:"Year",        symbol:"yr",  factor:31536000 },
      { key:"decade",      label:"Decade",      symbol:"dec", factor:315360000 },
      { key:"century",     label:"Century",     symbol:"c",   factor:3153600000 },
    ],
  },
  data: {
    label: "Data Storage",
    icon: "💾",
    color: "text-indigo-400",
    accent: "bg-indigo-500/10 border-indigo-500/25",
    base: "byte",
    units: [
      { key:"bit",       label:"Bit",       symbol:"b",   factor:0.125 },
      { key:"byte",      label:"Byte",      symbol:"B",   factor:1 },
      { key:"kilobyte",  label:"Kilobyte",  symbol:"KB",  factor:1024 },
      { key:"megabyte",  label:"Megabyte",  symbol:"MB",  factor:1048576 },
      { key:"gigabyte",  label:"Gigabyte",  symbol:"GB",  factor:1073741824 },
      { key:"terabyte",  label:"Terabyte",  symbol:"TB",  factor:1099511627776 },
      { key:"petabyte",  label:"Petabyte",  symbol:"PB",  factor:1.126e15 },
      { key:"kibibyte",  label:"Kibibyte",  symbol:"KiB", factor:1024 },
      { key:"mebibyte",  label:"Mebibyte",  symbol:"MiB", factor:1048576 },
      { key:"gibibyte",  label:"Gibibyte",  symbol:"GiB", factor:1073741824 },
    ],
  },
  pressure: {
    label: "Pressure",
    icon: "🌬️",
    color: "text-teal-400",
    accent: "bg-teal-500/10 border-teal-500/25",
    base: "pascal",
    units: [
      { key:"pascal",      label:"Pascal",      symbol:"Pa",   factor:1 },
      { key:"kilopascal",  label:"Kilopascal",  symbol:"kPa",  factor:1000 },
      { key:"megapascal",  label:"Megapascal",  symbol:"MPa",  factor:1e6 },
      { key:"bar",         label:"Bar",         symbol:"bar",  factor:100000 },
      { key:"millibar",    label:"Millibar",    symbol:"mbar", factor:100 },
      { key:"psi",         label:"PSI",         symbol:"psi",  factor:6894.76 },
      { key:"atm",         label:"Atmosphere",  symbol:"atm",  factor:101325 },
      { key:"torr",        label:"Torr / mmHg", symbol:"Torr", factor:133.322 },
      { key:"inhg",        label:"Inch Hg",     symbol:"inHg", factor:3386.39 },
    ],
  },
  energy: {
    label: "Energy",
    icon: "⚡",
    color: "text-amber-400",
    accent: "bg-amber-500/10 border-amber-500/25",
    base: "joule",
    units: [
      { key:"joule",      label:"Joule",       symbol:"J",    factor:1 },
      { key:"kilojoule",  label:"Kilojoule",   symbol:"kJ",   factor:1000 },
      { key:"megajoule",  label:"Megajoule",   symbol:"MJ",   factor:1e6 },
      { key:"calorie",    label:"Calorie",     symbol:"cal",  factor:4.184 },
      { key:"kilocalorie",label:"Kilocalorie", symbol:"kcal", factor:4184 },
      { key:"wh",         label:"Watt-hour",   symbol:"Wh",   factor:3600 },
      { key:"kwh",        label:"Kilowatt-hr", symbol:"kWh",  factor:3600000 },
      { key:"btu",        label:"BTU",         symbol:"BTU",  factor:1055.06 },
      { key:"therm",      label:"Therm",       symbol:"thm",  factor:105480400 },
      { key:"ev",         label:"Electron Volt",symbol:"eV",  factor:1.602e-19 },
      { key:"ftlb",       label:"Foot-pound",  symbol:"ft·lb",factor:1.35582 },
    ],
  },
} as const;

// ── Temperature conversions (special case) ────────────────────
function convertTemperature(val: number, from: string, to: string): number {
  let celsius: number;
  switch (from) {
    case "celsius":    celsius = val; break;
    case "fahrenheit": celsius = (val - 32) * 5/9; break;
    case "kelvin":     celsius = val - 273.15; break;
    case "rankine":    celsius = (val - 491.67) * 5/9; break;
    default: celsius = val;
  }
  switch (to) {
    case "celsius":    return celsius;
    case "fahrenheit": return celsius * 9/5 + 32;
    case "kelvin":     return celsius + 273.15;
    case "rankine":    return (celsius + 273.15) * 9/5;
    default: return celsius;
  }
}

// ── Factor-based conversion ───────────────────────────────────
function convertFactor(val: number, fromFactor: number, toFactor: number): number {
  return (val * fromFactor) / toFactor;
}

// ── Format number nicely ──────────────────────────────────────
function fmt(n: number): string {
  if (isNaN(n) || !isFinite(n)) return "—";
  if (n === 0) return "0";
  const abs = Math.abs(n);
  if (abs >= 1e12)  return n.toExponential(4);
  if (abs >= 1e9)   return (n / 1e9).toPrecision(7) + " × 10⁹";
  if (abs < 1e-9)   return n.toExponential(4);
  if (abs < 0.0001) return n.toPrecision(6);
  if (abs >= 100000) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return parseFloat(n.toPrecision(8)).toString();
}

type AnyUnit = { key: string; label: string; symbol: string; factor?: number };

export default function UnitConverter() {
  const [category, setCategory] = useState<CategoryKey>("length");
  const [fromKey, setFromKey]   = useState("meter");
  const [toKey, setToKey]       = useState("foot");
  const [inputVal, setInputVal] = useState("1");
  const [copied, setCopied]     = useState<string | null>(null);

  const cat = CATEGORIES[category];
  const units: AnyUnit[] = cat.units as unknown as AnyUnit[];

  // Switch category → reset units to first two
  const handleCategoryChange = (key: CategoryKey) => {
    setCategory(key);
    const us = CATEGORIES[key].units as unknown as AnyUnit[];
    setFromKey(us[0].key);
    setToKey(us[1].key);
    setInputVal("1");
  };

  const fromUnit = units.find(u => u.key === fromKey)!;
  const toUnit   = units.find(u => u.key === toKey)!;

  const result = useMemo(() => {
    const n = parseFloat(inputVal);
    if (isNaN(n)) return "";
    if (category === "temperature") {
      return fmt(convertTemperature(n, fromKey, toKey));
    }
    const fF = (fromUnit as { factor?: number }).factor ?? 1;
    const tF = (toUnit as { factor?: number }).factor ?? 1;
    return fmt(convertFactor(n, fF, tF));
  }, [inputVal, fromKey, toKey, category, fromUnit, toUnit]);

  // All conversions from input
  const allResults = useMemo(() => {
    const n = parseFloat(inputVal);
    if (isNaN(n)) return [];
    return units.map(u => {
      let val: string;
      if (category === "temperature") {
        val = fmt(convertTemperature(n, fromKey, u.key));
      } else {
        const fF = (fromUnit as { factor?: number }).factor ?? 1;
        const tF = (u as { factor?: number }).factor ?? 1;
        val = fmt(convertFactor(n, fF, tF));
      }
      return { ...u, result: val };
    });
  }, [inputVal, fromKey, category, units, fromUnit]);

  const copy = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(null), 1400);
  };

  const swap = () => {
    const newFrom = toKey;
    const newTo   = fromKey;
    setFromKey(newFrom);
    setToKey(newTo);
    if (result && result !== "—") setInputVal(result);
  };

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage:"linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize:"44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-cyan-500/[0.04] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-violet-500/[0.04] blur-3xl pointer-events-none" />

      {/* NAV */}
      <ToolNavbar toolName="Unit Converter" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-cyan-500/10 flex items-center justify-center text-lg">⚖️</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Unit Converter</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded">10 categories · 100+ units</span>
          </div>
          <p className="text-slate-500 text-sm">Convert length, weight, temperature, area, volume, speed, time, data, pressure and energy — all client-side.</p>
        </div>

        {/* Category selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(Object.keys(CATEGORIES) as CategoryKey[]).map(key => {
            const c = CATEGORIES[key];
            const isActive = category === key;
            return (
              <button key={key} onClick={() => handleCategoryChange(key)}
                className={`flex items-center gap-1.5 font-mono text-xs px-3 py-2 rounded-xl border transition-all ${isActive ? `${c.accent} ${c.color}` : "border-white/[0.08] text-slate-600 hover:text-slate-300 hover:border-white/[0.16]"}`}>
                <span>{c.icon}</span>
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Main converter ── */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_48px_1fr] gap-4 items-end">

            {/* FROM */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">From</label>
              <select value={fromKey} onChange={e => setFromKey(e.target.value)}
                className="font-mono text-xs px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-slate-300 outline-none focus:border-cyan-500/30 transition-colors cursor-pointer appearance-none">
                {units.map(u => (
                  <option key={u.key} value={u.key}>{u.label} ({u.symbol})</option>
                ))}
              </select>
              <div className="relative">
                <input
                  type="number"
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  className={`w-full font-mono text-3xl font-bold px-4 py-4 bg-black/40 border rounded-xl outline-none transition-colors ${cat.accent} ${cat.color}`}
                  placeholder="0"
                  step="any"
                />
                <span className={`absolute right-4 top-1/2 -translate-y-1/2 font-mono text-sm ${cat.color} opacity-60`}>{fromUnit?.symbol}</span>
              </div>
            </div>

            {/* Swap */}
            <div className="flex items-end pb-1">
              <button onClick={swap}
                className="w-12 h-12 rounded-xl border border-white/[0.08] text-slate-500 hover:text-white hover:border-white/[0.25] transition-all flex items-center justify-center text-xl hover:rotate-180 transition-transform duration-300">
                ⇌
              </button>
            </div>

            {/* TO */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">To</label>
              <select value={toKey} onChange={e => setToKey(e.target.value)}
                className="font-mono text-xs px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-slate-300 outline-none focus:border-cyan-500/30 transition-colors cursor-pointer appearance-none">
                {units.map(u => (
                  <option key={u.key} value={u.key}>{u.label} ({u.symbol})</option>
                ))}
              </select>
              <div className="relative group">
                <div className={`w-full font-mono text-3xl font-bold px-4 py-4 bg-black/40 border rounded-xl transition-colors ${cat.accent} ${cat.color} flex items-center min-h-[72px]`}>
                  {result || <span className="text-slate-700">—</span>}
                </div>
                <span className={`absolute right-4 top-1/2 -translate-y-1/2 font-mono text-sm ${cat.color} opacity-60`}>{toUnit?.symbol}</span>
                {result && result !== "—" && (
                  <button onClick={() => copy(result, "main-result")}
                    className={`absolute right-12 top-1/2 -translate-y-1/2 font-mono text-[10px] px-2 py-1 rounded border opacity-0 group-hover:opacity-100 transition-all ${copied === "main-result" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-600 hover:text-slate-300"}`}>
                    {copied === "main-result" ? "✓" : "copy"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Formula line */}
          {inputVal && result && result !== "—" && (
            <div className="mt-4 px-4 py-2.5 bg-white/[0.02] border border-white/[0.05] rounded-lg">
              <span className="font-mono text-sm text-slate-400">
                <span className={cat.color}>{inputVal}</span>
                <span className="text-slate-600"> {fromUnit?.symbol} = </span>
                <span className={cat.color}>{result}</span>
                <span className="text-slate-600"> {toUnit?.symbol}</span>
              </span>
            </div>
          )}
        </div>

        {/* ── All conversions grid ── */}
        {allResults.length > 0 && parseFloat(inputVal) > 0 && (
          <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden mb-6">
            <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">
                {cat.icon} All {cat.label} Conversions
              </span>
              <span className="font-mono text-[10px] text-slate-700">{inputVal} {fromUnit?.symbol}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x-0 divide-white/[0.04]">
              {allResults.map((u, i) => {
                const isFrom = u.key === fromKey;
                const isTo   = u.key === toKey;
                return (
                  <div key={u.key}
                    className={`flex items-center justify-between px-5 py-3 group border-b border-white/[0.04] last:border-0 ${i % 2 === 1 && "sm:border-l border-white/[0.04]"} transition-colors hover:bg-white/[0.02] ${isFrom || isTo ? "bg-white/[0.02]" : ""}`}>
                    <div className="flex items-center gap-3">
                      {(isFrom || isTo) && (
                        <span className={`w-1.5 h-1.5 rounded-full ${cat.color.replace("text-", "bg-")}`} />
                      )}
                      {!isFrom && !isTo && <span className="w-1.5 h-1.5" />}
                      <div>
                        <span className="font-mono text-xs text-slate-500">{u.label}</span>
                        <span className="font-mono text-[10px] text-slate-700 ml-2">{u.symbol}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-mono text-sm font-semibold ${isFrom || isTo ? cat.color : "text-slate-300"}`}>
                        {u.result}
                      </span>
                      <button onClick={() => copy(u.result, `all-${u.key}`)}
                        className={`font-mono text-[9px] px-1.5 py-0.5 rounded border opacity-0 group-hover:opacity-100 transition-all ${copied === `all-${u.key}` ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-700 hover:text-slate-400"}`}>
                        {copied === `all-${u.key}` ? "✓" : "copy"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: "🔢", title: "10 Categories", desc: "Length, weight, temperature, area, volume, speed, time, data, pressure, energy" },
            { icon: "📐", title: "100+ Units",     desc: "Comprehensive unit coverage including metric, imperial, and scientific" },
            { icon: "⌨️", title: "Instant",        desc: "All conversions update live as you type — no button press needed" },
            { icon: "⌀",  title: "Copy Any",       desc: "Hover any result row to copy the value with one click" },
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