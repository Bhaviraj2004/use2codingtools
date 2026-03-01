"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useMemo } from "react";

// ── Helpers ───────────────────────────────────────────────────
function fmt(n: number, digits = 4): string {
  if (!isFinite(n) || isNaN(n)) return "—";
  if (n === 0) return "0";
  const abs = Math.abs(n);
  if (abs >= 1e12) return n.toExponential(3);
  if (abs < 0.00001 && abs > 0) return n.toPrecision(4);
  return parseFloat(n.toPrecision(digits)).toLocaleString("en-US", { maximumFractionDigits: 8 });
}

function pct(n: number): string {
  return fmt(n) + "%";
}

function useNum(v: string) {
  return parseFloat(v.replace(/,/g, ""));
}

// ── Modes ─────────────────────────────────────────────────────
type ModeKey =
  | "basic"
  | "whatpct"
  | "increase"
  | "decrease"
  | "change"
  | "reverse"
  | "ratio"
  | "distribute"
  | "tip"
  | "discount";

const MODES = [
  { key: "basic",      icon: "🔢", label: "% of Number",    desc: "What is X% of Y?" },
  { key: "whatpct",    icon: "❓", label: "What Percent",   desc: "X is what % of Y?" },
  { key: "change",     icon: "📈", label: "% Change",       desc: "Change from X to Y" },
  { key: "increase",   icon: "⬆️", label: "% Increase",     desc: "Increase Y by X%" },
  { key: "decrease",   icon: "⬇️", label: "% Decrease",     desc: "Decrease Y by X%" },
  { key: "reverse",    icon: "🔄", label: "Reverse %",      desc: "Find original value" },
  { key: "ratio",      icon: "⚖️", label: "Ratio → %",      desc: "X out of Y as %" },
  { key: "tip",        icon: "🍽️", label: "Tip Calculator", desc: "Bill + tip + split" },
  { key: "discount",   icon: "🏷️", label: "Discount",       desc: "Price after discount" },
  { key: "distribute", icon: "📊", label: "Distribute",     desc: "Split total by %s" },
] as const;

// ── ✅ FIX: Explicit result type with optional sub ─────────────
type ResultItem = {
  key: string;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
};

// ── Input component ───────────────────────────────────────────
function NumInput({
  label, value, onChange, suffix = "", prefix = "", placeholder = "0",
}: {
  label: string; value: string; onChange: (v: string) => void;
  suffix?: string; prefix?: string; placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-mono text-[10px] uppercase tracking-[2px] text-slate-600">{label}</label>
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-3 font-mono text-slate-500 text-sm pointer-events-none">{prefix}</span>}
        <input
          type="number" value={value} step="any"
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full font-mono text-xl font-bold bg-black/40 border border-white/[0.08] rounded-xl py-3.5 text-emerald-400 outline-none focus:border-emerald-500/40 transition-colors ${prefix ? "pl-8 pr-12" : "px-4 pr-12"}`}
        />
        {suffix && <span className="absolute right-3.5 font-mono text-slate-600 text-sm pointer-events-none">{suffix}</span>}
      </div>
    </div>
  );
}

// ── Result display ────────────────────────────────────────────
function Result({
  label, value, sub, accent = false, copied, onCopy,
}: {
  label: string; value: string; sub?: string; accent?: boolean;
  copied: boolean; onCopy: () => void;
}) {
  return (
    <div className={`group relative flex flex-col gap-1 px-5 py-4 rounded-xl border transition-all ${accent ? "bg-emerald-500/[0.08] border-emerald-500/25" : "bg-white/[0.03] border-white/[0.08]"}`}>
      <div className="font-mono text-[10px] uppercase tracking-[2px] text-slate-600">{label}</div>
      <div className={`font-mono text-2xl font-extrabold ${accent ? "text-emerald-400" : "text-white"}`}>{value}</div>
      {sub && <div className="font-mono text-xs text-slate-600">{sub}</div>}
      <button onClick={onCopy}
        className={`absolute right-3 top-3 font-mono text-[9px] px-2 py-0.5 rounded border opacity-0 group-hover:opacity-100 transition-all ${copied ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-700 hover:text-slate-300"}`}>
        {copied ? "✓" : "copy"}
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function PercentageCalculator() {
  const [mode, setMode]     = useState<ModeKey>("basic");
  const [copied, setCopied] = useState<string | null>(null);

  const [a, setA] = useState("25");
  const [b, setB] = useState("200");
  const [c, setC] = useState("300");

  const [bill, setBill]     = useState("100");
  const [tipPct, setTipPct] = useState("15");
  const [people, setPeople] = useState("2");

  const [total, setTotal]   = useState("1000");
  const [distRows, setDistRows] = useState([
    { label: "Part A", pct: "30" },
    { label: "Part B", pct: "45" },
    { label: "Part C", pct: "25" },
  ]);

  const copy = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(null), 1400);
  };

  const na = useNum(a), nb = useNum(b), nc = useNum(c);

  // ── ✅ FIX: Explicitly typed as ResultItem[] ──────────────────
  const results = useMemo((): ResultItem[] => {
    switch (mode) {
      case "basic": {
        const r = (na / 100) * nb;
        return [
          { key: "r1", label: `${fmt(na)}% of ${fmt(nb)}`, value: fmt(r), sub: `${fmt(na)}/100 × ${fmt(nb)}`, accent: true },
          { key: "r2", label: "Remaining (100% − result)", value: fmt(nb - r) },
          { key: "r3", label: "Result as fraction",        value: `${fmt(na)} / 100` },
        ];
      }
      case "whatpct": {
        const r = (na / nb) * 100;
        return [
          { key: "r1", label: `${fmt(na)} is what % of ${fmt(nb)}`, value: pct(r), accent: true },
          { key: "r2", label: "As a decimal",                        value: fmt(na / nb) },
          { key: "r3", label: "Inverse (Y is what % of X)",          value: pct((nb / na) * 100) },
        ];
      }
      case "change": {
        const r = ((nb - na) / na) * 100;
        const isInc = nb >= na;
        return [
          { key: "r1", label: `% ${isInc ? "Increase" : "Decrease"} from ${fmt(na)} to ${fmt(nb)}`, value: pct(Math.abs(r)), sub: isInc ? "↑ increase" : "↓ decrease", accent: true },
          { key: "r2", label: "Absolute change", value: fmt(nb - na) },
          { key: "r3", label: "Multiplier",       value: fmt(nb / na) + "×" },
        ];
      }
      case "increase": {
        const r = nb * (1 + na / 100);
        return [
          { key: "r1", label: `${fmt(nb)} increased by ${fmt(na)}%`, value: fmt(r), accent: true },
          { key: "r2", label: "Amount added",    value: fmt(r - nb) },
          { key: "r3", label: "Multiplier used", value: fmt(1 + na / 100) + "×" },
        ];
      }
      case "decrease": {
        const r = nb * (1 - na / 100);
        return [
          { key: "r1", label: `${fmt(nb)} decreased by ${fmt(na)}%`, value: fmt(r), accent: true },
          { key: "r2", label: "Amount removed",  value: fmt(nb - r) },
          { key: "r3", label: "Multiplier used", value: fmt(1 - na / 100) + "×" },
        ];
      }
      case "reverse": {
        const inc = nb / (1 + na / 100);
        const dec = nb / (1 - na / 100);
        return [
          { key: "r1", label: `Original if ${fmt(nb)} is ${fmt(na)}% MORE`, value: fmt(inc), accent: true },
          { key: "r2", label: `Original if ${fmt(nb)} is ${fmt(na)}% LESS`, value: fmt(dec) },
          { key: "r3", label: "Check: inc × multiplier",                     value: fmt(inc * (1 + na / 100)) },
        ];
      }
      case "ratio": {
        const r = (na / nb) * 100;
        return [
          { key: "r1", label: `${fmt(na)} out of ${fmt(nb)}`, value: pct(r), accent: true },
          { key: "r2", label: "As decimal",    value: fmt(na / nb) },
          { key: "r3", label: "Remaining %",   value: pct(100 - r) },
        ];
      }
      default:
        return [];
    }
  }, [mode, na, nb]);

  // Tip results
  const tipResults = useMemo(() => {
    const b  = useNum(bill);
    const t  = useNum(tipPct);
    const p  = Math.max(1, useNum(people));
    const tipAmt = b * (t / 100);
    const total  = b + tipAmt;
    return {
      tip:          fmt(tipAmt, 6),
      total:        fmt(total, 6),
      perPerson:    fmt(total / p, 6),
      tipPerPerson: fmt(tipAmt / p, 6),
    };
  }, [bill, tipPct, people]);

  // Distribute results
  const distResults = useMemo(() => {
    const tot = useNum(total);
    return distRows.map(r => {
      const pctN = useNum(r.pct);
      return { ...r, amount: fmt((pctN / 100) * tot, 6), pctNum: pctN };
    });
  }, [total, distRows]);

  const distTotal = distRows.reduce((s, r) => s + useNum(r.pct), 0);

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage:"linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize:"44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-cyan-500/[0.04] blur-3xl pointer-events-none" />

      <ToolNavbar toolName="Percentage Calculator" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center text-lg">%</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Percentage Calculator</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">10 modes</span>
          </div>
          <p className="text-slate-500 text-sm">10 percentage calculation modes — basic %, change, increase, decrease, reverse, ratio, tip calculator, discount, and more.</p>
        </div>

        {/* Mode selector */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-8">
          {MODES.map(m => (
            <button key={m.key} onClick={() => setMode(m.key as ModeKey)}
              className={`flex flex-col gap-1 px-3 py-2.5 rounded-xl border transition-all text-left ${mode === m.key ? "bg-emerald-500/10 border-emerald-500/30" : "border-white/[0.07] hover:border-white/[0.16] bg-white/[0.01]"}`}>
              <div className="text-base leading-none">{m.icon}</div>
              <div className={`font-mono text-[11px] font-semibold ${mode === m.key ? "text-emerald-400" : "text-slate-400"}`}>{m.label}</div>
              <div className="font-mono text-[9px] text-slate-700 leading-tight">{m.desc}</div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

          {/* ── Left: inputs + results ── */}
          <div className="flex flex-col gap-5">

            {mode === "basic" && (
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
                <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-4">What is X% of Y?</div>
                <div className="grid grid-cols-2 gap-4">
                  <NumInput label="Percentage (X)" value={a} onChange={setA} suffix="%" />
                  <NumInput label="Number (Y)"      value={b} onChange={setB} />
                </div>
              </div>
            )}

            {mode === "whatpct" && (
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
                <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-4">X is what % of Y?</div>
                <div className="grid grid-cols-2 gap-4">
                  <NumInput label="X (part)"  value={a} onChange={setA} />
                  <NumInput label="Y (whole)" value={b} onChange={setB} />
                </div>
              </div>
            )}

            {mode === "change" && (
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
                <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-4">Percentage change from X to Y</div>
                <div className="grid grid-cols-2 gap-4">
                  <NumInput label="From (X)" value={a} onChange={setA} />
                  <NumInput label="To (Y)"   value={b} onChange={setB} />
                </div>
              </div>
            )}

            {mode === "increase" && (
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
                <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-4">Increase Y by X%</div>
                <div className="grid grid-cols-2 gap-4">
                  <NumInput label="Increase by (X%)"  value={a} onChange={setA} suffix="%" />
                  <NumInput label="Original value (Y)" value={b} onChange={setB} />
                </div>
              </div>
            )}

            {mode === "decrease" && (
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
                <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-4">Decrease Y by X%</div>
                <div className="grid grid-cols-2 gap-4">
                  <NumInput label="Decrease by (X%)"  value={a} onChange={setA} suffix="%" />
                  <NumInput label="Original value (Y)" value={b} onChange={setB} />
                </div>
              </div>
            )}

            {mode === "reverse" && (
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
                <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-4">Find original value before % change</div>
                <div className="grid grid-cols-2 gap-4">
                  <NumInput label="% change (X%)"      value={a} onChange={setA} suffix="%" />
                  <NumInput label="Current value (Y)"  value={b} onChange={setB} />
                </div>
              </div>
            )}

            {mode === "ratio" && (
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
                <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-4">X out of Y as a percentage</div>
                <div className="grid grid-cols-2 gap-4">
                  <NumInput label="X (part)"  value={a} onChange={setA} />
                  <NumInput label="Y (total)" value={b} onChange={setB} />
                </div>
              </div>
            )}

            {/* TIP CALCULATOR */}
            {mode === "tip" && (
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
                <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-4">Tip Calculator</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                  <NumInput label="Bill Amount"     value={bill}    onChange={setBill}    prefix="₹" />
                  <NumInput label="Tip %"           value={tipPct}  onChange={setTipPct}  suffix="%" />
                  <NumInput label="Split (people)"  value={people}  onChange={setPeople} />
                </div>
                <div className="flex flex-wrap gap-2 mb-5">
                  <span className="font-mono text-[10px] text-slate-700 self-center">Quick %:</span>
                  {[5,10,12,15,18,20,25].map(t => (
                    <button key={t} onClick={() => setTipPct(String(t))}
                      className={`font-mono text-[11px] px-3 py-1 rounded-lg border transition-all ${tipPct === String(t) ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-600 hover:text-slate-300"}`}>
                      {t}%
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Tip Amount",     value: tipResults.tip,          key: "tip",  accent: false },
                    { label: "Total Bill",      value: tipResults.total,        key: "tot",  accent: true  },
                    { label: "Per Person",      value: tipResults.perPerson,    key: "pp",   accent: true  },
                    { label: "Tip per Person",  value: tipResults.tipPerPerson, key: "tpp",  accent: false },
                  ].map(r => (
                    <Result key={r.key} label={r.label} value={r.value} accent={r.accent}
                      copied={copied === `tip-${r.key}`} onCopy={() => copy(r.value, `tip-${r.key}`)} />
                  ))}
                </div>
              </div>
            )}

            {/* DISCOUNT */}
            {mode === "discount" && (
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
                <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-4">Discount Calculator</div>
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <NumInput label="Original Price" value={a} onChange={setA} prefix="₹" />
                  <NumInput label="Discount %"     value={b} onChange={setB} suffix="%" />
                </div>
                {(() => {
                  const orig   = na, disc = nb;
                  const saved  = orig * (disc / 100);
                  const final  = orig - saved;
                  const taxAmt = final * (nc / 100);
                  return (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                        {[
                          { label: "Discount Amount", value: fmt(saved, 6),      key:"da", accent: false },
                          { label: "Final Price",      value: fmt(final, 6),      key:"fp", accent: true  },
                          { label: "You Save",         value: pct(disc) + " off", key:"ys", accent: false },
                        ].map(r => (
                          <Result key={r.key} label={r.label} value={r.value} accent={r.accent}
                            copied={copied === `disc-${r.key}`} onCopy={() => copy(r.value, `disc-${r.key}`)} />
                        ))}
                      </div>
                      <div className="border-t border-white/[0.06] pt-4">
                        <div className="font-mono text-[10px] text-slate-700 mb-3 uppercase tracking-widest">Add Tax on discounted price (optional)</div>
                        <div className="flex gap-3 items-center">
                          <div className="w-40">
                            <NumInput label="Tax %" value={c} onChange={setC} suffix="%" />
                          </div>
                          {nc > 0 && (
                            <div className="flex gap-3 flex-1">
                              <Result label="Tax Amount"  value={fmt(taxAmt, 6)}          accent={false}
                                copied={copied === "disc-tax"}   onCopy={() => copy(fmt(taxAmt, 6), "disc-tax")} />
                              <Result label="Final + Tax" value={fmt(final + taxAmt, 6)}   accent
                                copied={copied === "disc-total"} onCopy={() => copy(fmt(final + taxAmt, 6), "disc-total")} />
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* DISTRIBUTE */}
            {mode === "distribute" && (
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
                <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-4">Distribute Total by Percentages</div>
                <div className="w-48 mb-4">
                  <NumInput label="Total Amount" value={total} onChange={setTotal} prefix="₹" />
                </div>
                <div className="flex flex-col gap-2 mb-3">
                  {distRows.map((row, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <input value={row.label}
                        onChange={e => setDistRows(prev => prev.map((r, ri) => ri === i ? {...r, label: e.target.value} : r))}
                        className="font-mono text-xs px-3 py-2 bg-white/[0.03] border border-white/[0.07] rounded-lg text-slate-400 outline-none w-28 shrink-0" />
                      <div className="relative flex-1 max-w-[140px]">
                        <input type="number" value={row.pct} step="any"
                          onChange={e => setDistRows(prev => prev.map((r, ri) => ri === i ? {...r, pct: e.target.value} : r))}
                          className="w-full font-mono text-lg font-bold px-3 py-2 bg-black/40 border border-white/[0.08] rounded-lg text-emerald-400 outline-none focus:border-emerald-500/30 pr-8" />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-slate-600 text-xs pointer-events-none">%</span>
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex-1 h-2 bg-white/[0.05] rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500/50 rounded-full transition-all" style={{ width: `${Math.min(100, useNum(row.pct))}%` }} />
                        </div>
                        <span className="font-mono text-sm font-bold text-emerald-400 w-20 text-right shrink-0">
                          ₹{distResults[i]?.amount}
                        </span>
                        {distRows.length > 1 && (
                          <button onClick={() => setDistRows(prev => prev.filter((_, ri) => ri !== i))}
                            className="font-mono text-slate-700 hover:text-red-400 transition-colors text-lg leading-none shrink-0">×</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <button onClick={() => setDistRows(prev => [...prev, { label: `Part ${prev.length + 1}`, pct: "0" }])}
                    className="font-mono text-[11px] px-3 py-1.5 border border-dashed border-white/[0.12] text-slate-600 rounded-lg hover:text-emerald-400 hover:border-emerald-500/30 transition-all">
                    + Add row
                  </button>
                  <div className={`font-mono text-xs px-3 py-1 rounded border ${Math.abs(distTotal - 100) < 0.001 ? "text-emerald-400 border-emerald-500/25 bg-emerald-500/10" : "text-orange-400 border-orange-500/25 bg-orange-500/10"}`}>
                    Total: {fmt(distTotal, 6)}% {Math.abs(distTotal - 100) < 0.001 ? "✓" : `(${fmt(100 - distTotal, 4)}% remaining)`}
                  </div>
                </div>
              </div>
            )}

            {/* ✅ FIX APPLIED HERE — r is now typed as ResultItem, so r.sub is string | undefined */}
            {!["tip", "discount", "distribute"].includes(mode) && results.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {results.map(r => (
                  <Result key={r.key} label={r.label} value={r.value} sub={r.sub} accent={r.accent}
                    copied={copied === r.key} onCopy={() => copy(r.value, r.key)} />
                ))}
              </div>
            )}
          </div>

          {/* ── Right sidebar ── */}
          <div className="flex flex-col gap-4">

            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-4">Formulas</div>
              <div className="flex flex-col gap-3">
                {[
                  { label: "X% of Y",        formula: "(X / 100) × Y" },
                  { label: "X is ?% of Y",   formula: "(X / Y) × 100" },
                  { label: "% Change",       formula: "((New − Old) / Old) × 100" },
                  { label: "Increase by %",  formula: "Y × (1 + X/100)" },
                  { label: "Decrease by %",  formula: "Y × (1 − X/100)" },
                  { label: "Reverse ↑",      formula: "Y / (1 + X/100)" },
                  { label: "Reverse ↓",      formula: "Y / (1 − X/100)" },
                  { label: "Ratio → %",      formula: "(X / Y) × 100" },
                ].map(f => (
                  <div key={f.label} className="flex flex-col gap-0.5 py-2 border-b border-white/[0.04] last:border-0">
                    <span className="font-mono text-[10px] text-slate-600 uppercase tracking-wider">{f.label}</span>
                    <span className="font-mono text-xs text-emerald-400">{f.formula}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">% Cheatsheet</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {[
                  { pct: "1%",    frac: "1/100" },
                  { pct: "5%",    frac: "1/20"  },
                  { pct: "10%",   frac: "1/10"  },
                  { pct: "12.5%", frac: "1/8"   },
                  { pct: "20%",   frac: "1/5"   },
                  { pct: "25%",   frac: "1/4"   },
                  { pct: "33.3%", frac: "1/3"   },
                  { pct: "50%",   frac: "1/2"   },
                  { pct: "66.7%", frac: "2/3"   },
                  { pct: "75%",   frac: "3/4"   },
                ].map(f => (
                  <div key={f.pct} className="flex justify-between py-1 border-b border-white/[0.04]">
                    <span className="font-mono text-[10px] text-emerald-400">{f.pct}</span>
                    <span className="font-mono text-[10px] text-slate-600">{f.frac}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">GST / Tax Quick Calc</div>
              {(() => {
                const base = mode === "discount" ? na - (na * nb / 100) : na;
                return (
                  <div className="flex flex-col gap-1.5">
                    {[5, 12, 18, 28].map(gst => {
                      const tax = base * (gst / 100);
                      return (
                        <div key={gst} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0 group">
                          <span className="font-mono text-xs text-slate-600">GST {gst}%</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-emerald-400">+{fmt(tax, 6)}</span>
                            <span className="font-mono text-xs text-slate-500">= {fmt(base + tax, 6)}</span>
                            <button onClick={() => copy(fmt(base + tax, 6), `gst-${gst}`)}
                              className={`font-mono text-[9px] px-1 py-0.5 rounded border opacity-0 group-hover:opacity-100 transition-all ${copied === `gst-${gst}` ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-700 hover:text-slate-400"}`}>
                              {copied === `gst-${gst}` ? "✓" : "c"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {[
            { icon: "🔢", title: "10 Modes",      desc: "Basic %, change, increase, decrease, reverse, ratio, tip, discount, distribute" },
            { icon: "🍽️", title: "Tip Split",      desc: "Split bills among any number of people with custom tip %" },
            { icon: "🏷️", title: "Discount + Tax", desc: "Calculate discount price with optional GST / tax on top" },
            { icon: "📊", title: "Distribute",     desc: "Split any total into custom percentage allocations" },
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