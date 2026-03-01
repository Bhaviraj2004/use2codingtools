"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useMemo, useCallback } from "react";

// ── Roman numeral logic ────────────────────────────────────────────────────
const ROMAN_MAP: [number, string][] = [
  [1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],
  [100,"C"],[90,"XC"],[50,"L"],[40,"XL"],
  [10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"],
];

function toRoman(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > 3999) return "";
  let result = "";
  for (const [val, sym] of ROMAN_MAP) {
    while (n >= val) { result += sym; n -= val; }
  }
  return result;
}

function fromRoman(s: string): number | null {
  const input = s.trim().toUpperCase();
  if (!input) return null;
  const vals: Record<string, number> = { I:1,V:5,X:10,L:50,C:100,D:500,M:1000 };
  let total = 0;
  for (let i = 0; i < input.length; i++) {
    const cur  = vals[input[i]];
    const next = vals[input[i+1]];
    if (cur === undefined) return null;
    if (next && cur < next) total -= cur;
    else total += cur;
  }
  // Validate round-trip
  if (toRoman(total) !== input) return null;
  return total;
}

function isValidRoman(s: string): boolean {
  return /^[IVXLCDM]+$/i.test(s.trim()) && fromRoman(s) !== null;
}

// Breakdown steps
function breakdown(n: number): { symbol: string; value: number; times: number }[] {
  let rem = n;
  const steps: { symbol: string; value: number; times: number }[] = [];
  for (const [val, sym] of ROMAN_MAP) {
    const times = Math.floor(rem / val);
    if (times > 0) { steps.push({ symbol: sym, value: val, times }); rem -= times * val; }
  }
  return steps;
}

// Animated build (character by character)
function buildSteps(roman: string): string[] {
  return roman.split("").map((_, i) => roman.slice(0, i + 1));
}

// ── Table data ─────────────────────────────────────────────────────────────
const COMMON = [
  [1,"I"],[2,"II"],[3,"III"],[4,"IV"],[5,"V"],
  [6,"VI"],[7,"VII"],[8,"VIII"],[9,"IX"],[10,"X"],
  [11,"XI"],[12,"XII"],[14,"XIV"],[15,"XV"],[19,"XIX"],
  [20,"XX"],[30,"XXX"],[40,"XL"],[50,"L"],[60,"LX"],
  [90,"XC"],[100,"C"],[400,"CD"],[500,"D"],[900,"CM"],
  [1000,"M"],[1999,"MCMXCIX"],[2024,"MMXXIV"],[2025,"MMXXV"],[3999,"MMMCMXCIX"],
];

const SYMBOLS = [
  { sym:"I",  val:1,    note:"Unus"     },
  { sym:"V",  val:5,    note:"Quinque"  },
  { sym:"X",  val:10,   note:"Decem"    },
  { sym:"L",  val:50,   note:"Quinquaginta" },
  { sym:"C",  val:100,  note:"Centum"   },
  { sym:"D",  val:500,  note:"Quingenti"},
  { sym:"M",  val:1000, note:"Mille"    },
];

// ── Rules ──────────────────────────────────────────────────────────────────
const RULES = [
  { title: "Repeat up to 3×",      desc: "I, X, C, M can repeat max 3 times. III = 3, but IIII is invalid." },
  { title: "No V, L, D repeat",    desc: "V, L, D cannot be repeated — VV, LL, DD are all invalid." },
  { title: "Subtractive notation", desc: "IV=4, IX=9, XL=40, XC=90, CD=400, CM=900 — only these 6 combos." },
  { title: "Left-to-right",        desc: "Larger values come before smaller ones, except in subtractive pairs." },
  { title: "Range: 1–3999",        desc: "Standard Roman numerals only cover 1 to 3,999 (MMMCMXCIX)." },
  { title: "Only I before V, X",   desc: "I can only precede V or X for subtraction." },
  { title: "Only X before L, C",   desc: "X can only precede L or C for subtraction." },
  { title: "Only C before D, M",   desc: "C can only precede D or M for subtraction." },
];

// ── Component ──────────────────────────────────────────────────────────────
export default function RomanNumerals() {
  const [numInput,   setNumInput]   = useState("2025");
  const [romInput,   setRomInput]   = useState("MMXXV");
  const [activeMode, setActiveMode] = useState<"toRoman"|"fromRoman">("toRoman");
  const [copied,     setCopied]     = useState<string|null>(null);
  const [batchInput, setBatchInput] = useState("");
  const [batchMode,  setBatchMode]  = useState<"numToRom"|"romToNum">("numToRom");
  const [activeTab,  setActiveTab]  = useState<"convert"|"batch"|"table"|"rules">("convert");
  const [quiz,       setQuiz]       = useState<{n:number;roman:string;answer:string;correct:boolean|null}|null>(null);
  const [quizInput,  setQuizInput]  = useState("");

  // ── Single conversion ──
  const numVal = parseInt(numInput) || 0;
  const roman  = useMemo(() => toRoman(numVal), [numVal]);
  const steps  = useMemo(() => breakdown(numVal), [numVal]);

  const romVal = useMemo(() => fromRoman(romInput), [romInput]);
  const romValid = isValidRoman(romInput) && romInput.trim() !== "";

  const copy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1600);
  }, []);

  // ── Batch processing ──
  const batchResults = useMemo(() => {
    if (!batchInput.trim()) return [];
    return batchInput.split("\n").map(line => {
      const raw = line.trim();
      if (!raw) return { input: raw, output: "", error: false, empty: true };
      if (batchMode === "numToRom") {
        const n = parseInt(raw);
        if (isNaN(n)) return { input: raw, output: "Invalid number", error: true, empty: false };
        const r = toRoman(n);
        if (!r) return { input: raw, output: "Out of range (1–3999)", error: true, empty: false };
        return { input: raw, output: r, error: false, empty: false };
      } else {
        const n = fromRoman(raw);
        if (n === null) return { input: raw, output: "Invalid Roman numeral", error: true, empty: false };
        return { input: raw, output: String(n), error: false, empty: false };
      }
    });
  }, [batchInput, batchMode]);

  const batchOutput = useMemo(
    () => batchResults.filter(r => !r.empty && !r.error).map(r => r.output).join("\n"),
    [batchResults],
  );

  // ── Quiz ──
  function newQuiz() {
    const n = Math.floor(Math.random() * 99) + 1;
    setQuiz({ n, roman: toRoman(n), answer: "", correct: null });
    setQuizInput("");
  }

  function checkQuiz() {
    if (!quiz) return;
    const userRoman = quizInput.trim().toUpperCase();
    const correct = userRoman === quiz.roman;
    setQuiz({ ...quiz, answer: quizInput, correct });
  }

  // ── Year display ──
  const currentYear = new Date().getFullYear();
  const currentRoman = toRoman(currentYear);

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)",
        backgroundSize: "44px 44px"
      }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-orange-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

      <ToolNavbar toolName="Roman Numerals" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-orange-500/10 flex items-center justify-center font-mono font-bold text-orange-400 text-sm">Ⅷ</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Roman Numerals</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded">I–MMMCMXCIX</span>
          </div>
          <p className="text-slate-500 text-sm">
            Convert between Arabic and Roman numerals — with step-by-step breakdown, batch conversion, reference table, rules, and a quiz.
          </p>
        </div>

        {/* Current year callout */}
        <div className="flex items-center gap-4 px-5 py-3 bg-orange-500/[0.06] border border-orange-500/20 rounded-xl mb-6">
          <span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60">Current Year</span>
          <span className="font-mono text-2xl font-black text-orange-400">{currentYear}</span>
          <span className="font-mono text-[10px] text-orange-500/40 self-end mb-0.5">→</span>
          <span className="font-mono text-2xl font-black text-white tracking-widest">{currentRoman}</span>
          <button onClick={() => copy(currentRoman, "year")}
            className={`ml-auto font-mono text-[11px] px-3 py-1 rounded border transition-all
              ${copied==="year" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-orange-500/20 text-orange-400/60 hover:text-orange-400 hover:border-orange-500/40"}`}>
            {copied==="year" ? "✓" : "Copy"}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {([
            { key:"convert", label:"⇄ Convert"  },
            { key:"batch",   label:"⊞ Batch"    },
            { key:"table",   label:"📋 Table"    },
            { key:"rules",   label:"📜 Rules"    },
          ] as {key:typeof activeTab;label:string}[]).map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`font-mono text-xs px-4 py-1.5 rounded-lg border transition-all
                ${activeTab===t.key ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── CONVERT TAB ── */}
        {activeTab === "convert" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Left: inputs */}
            <div className="flex flex-col gap-4">

              {/* Mode selector */}
              <div className="flex gap-2">
                {([
                  { key:"toRoman",   label:"123 → Roman" },
                  { key:"fromRoman", label:"Roman → 123" },
                ] as {key:typeof activeMode;label:string}[]).map(m => (
                  <button key={m.key} onClick={() => setActiveMode(m.key)}
                    className={`flex-1 font-mono text-xs py-2 rounded-lg border transition-all
                      ${activeMode===m.key ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Number → Roman */}
              {activeMode === "toRoman" && (
                <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-5 flex flex-col gap-4">
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-widest text-slate-600 block mb-2">Arabic Number (1 – 3999)</label>
                    <div className="flex gap-2">
                      <input
                        type="number" min={1} max={3999}
                        value={numInput}
                        onChange={e => setNumInput(e.target.value)}
                        className="flex-1 font-mono text-3xl font-black bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-orange-400 outline-none focus:border-orange-500/40 transition-colors text-right"
                      />
                      <div className="flex flex-col gap-1">
                        <button onClick={() => setNumInput(v => String(Math.min(3999, (parseInt(v)||0)+1)))} className="w-9 h-9 bg-white/[0.04] border border-white/[0.06] rounded-lg text-slate-500 hover:text-slate-300 text-sm transition-all">▲</button>
                        <button onClick={() => setNumInput(v => String(Math.max(1, (parseInt(v)||0)-1)))}   className="w-9 h-9 bg-white/[0.04] border border-white/[0.06] rounded-lg text-slate-500 hover:text-slate-300 text-sm transition-all">▼</button>
                      </div>
                    </div>
                    {numVal < 1 || numVal > 3999 ? (
                      <p className="font-mono text-xs text-red-400 mt-2">⚠ Out of range — enter 1 to 3999</p>
                    ) : null}
                  </div>

                  {/* Result */}
                  {roman && (
                    <div className="bg-[#0a0a14] rounded-xl border border-white/[0.08] p-5 text-center">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-slate-600 mb-2">Roman Numeral</p>
                      <p className="font-mono text-4xl sm:text-5xl font-black text-white tracking-widest leading-none mb-3">{roman}</p>
                      <button onClick={() => copy(roman, "roman")}
                        className={`font-mono text-xs px-4 py-1.5 rounded-lg border transition-all
                          ${copied==="roman" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                        {copied==="roman" ? "✓ Copied!" : "Copy"}
                      </button>
                    </div>
                  )}

                  {/* Quick presets */}
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-slate-700 mb-2">Quick Pick</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[1,4,5,9,10,14,40,50,90,100,400,500,900,1000,1999,2024,2025,3999].map(n => (
                        <button key={n} onClick={() => setNumInput(String(n))}
                          className={`font-mono text-[10px] px-2 py-1 rounded border transition-all
                            ${numVal===n ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "border-white/[0.08] text-slate-600 hover:text-slate-300"}`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Roman → Number */}
              {activeMode === "fromRoman" && (
                <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-5 flex flex-col gap-4">
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-widest text-slate-600 block mb-2">Roman Numeral</label>
                    <input
                      type="text"
                      value={romInput}
                      onChange={e => setRomInput(e.target.value.toUpperCase().replace(/[^IVXLCDM]/g,""))}
                      placeholder="e.g. MMXXV"
                      className={`w-full font-mono text-3xl font-black bg-white/[0.04] border rounded-xl px-4 py-3 outline-none transition-colors tracking-widest uppercase
                        ${romInput && !romValid ? "border-red-500/40 text-red-400" : "border-white/[0.08] text-white focus:border-orange-500/40"}`}
                    />
                    {romInput && !romValid && (
                      <p className="font-mono text-xs text-red-400 mt-2">⚠ Invalid Roman numeral — check the symbols and order</p>
                    )}
                  </div>

                  {romValid && romVal !== null && (
                    <div className="bg-[#0a0a14] rounded-xl border border-white/[0.08] p-5 text-center">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-slate-600 mb-2">Arabic Number</p>
                      <p className="font-mono text-5xl font-black text-orange-400 leading-none mb-3">{romVal}</p>
                      <button onClick={() => copy(String(romVal), "arabic")}
                        className={`font-mono text-xs px-4 py-1.5 rounded-lg border transition-all
                          ${copied==="arabic" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                        {copied==="arabic" ? "✓ Copied!" : "Copy"}
                      </button>
                    </div>
                  )}

                  {/* Symbol pad */}
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-slate-700 mb-2">Symbol Pad</p>
                    <div className="flex gap-2 flex-wrap">
                      {SYMBOLS.map(s => (
                        <button key={s.sym}
                          onClick={() => setRomInput(prev => prev + s.sym)}
                          className="font-mono font-bold text-sm px-3 py-1.5 rounded-lg border border-white/[0.08] text-orange-300 hover:bg-orange-500/10 hover:border-orange-500/30 transition-all">
                          {s.sym}
                          <span className="font-normal text-[10px] text-slate-600 ml-1">{s.val}</span>
                        </button>
                      ))}
                      <button onClick={() => setRomInput("")}
                        className="font-mono text-xs px-3 py-1.5 rounded-lg border border-white/[0.08] text-slate-600 hover:text-red-400 hover:border-red-500/30 transition-all">
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: breakdown + quiz */}
            <div className="flex flex-col gap-4">

              {/* Step breakdown (toRoman mode) */}
              {activeMode === "toRoman" && roman && steps.length > 0 && (
                <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-5">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-4">Step-by-Step Breakdown</p>
                  <div className="space-y-2">
                    {steps.map(({ symbol, value, times }, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white/[0.02] rounded-lg px-3 py-2 border border-white/[0.06]">
                        <span className="font-mono text-lg font-black text-orange-400 w-16 shrink-0">{symbol.repeat(times)}</span>
                        <div className="flex-1">
                          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500/50 rounded-full" style={{ width: `${Math.min(100,(times * value / numVal)*100)}%` }} />
                          </div>
                        </div>
                        <span className="font-mono text-xs text-slate-400 shrink-0">{times} × {value} = <span className="text-orange-300 font-bold">{times*value}</span></span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                      <span className="font-mono text-xs text-slate-600">Total</span>
                      <span className="font-mono text-sm font-bold text-orange-400">{steps.reduce((s,r)=>s+r.times*r.value,0)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Symbol reference for fromRoman mode */}
              {activeMode === "fromRoman" && romValid && romVal !== null && (
                <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-5">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-4">Character Breakdown</p>
                  <div className="space-y-1.5">
                    {(() => {
                      const sym = romInput.trim().toUpperCase();
                      const valMap: Record<string,number> = {I:1,V:5,X:10,L:50,C:100,D:500,M:1000};
                      const breakdown: {chars:string;value:number;note:string}[] = [];
                      let i = 0;
                      while (i < sym.length) {
                        const cur = valMap[sym[i]];
                        const nxt = valMap[sym[i+1]];
                        if (nxt && cur < nxt) {
                          breakdown.push({chars:sym[i]+sym[i+1],value:nxt-cur,note:`Subtractive: ${nxt}-${cur}`});
                          i+=2;
                        } else {
                          breakdown.push({chars:sym[i],value:cur,note:``});
                          i++;
                        }
                      }
                      return breakdown.map((b,idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-white/[0.02] rounded-lg px-3 py-2 border border-white/[0.06]">
                          <span className="font-mono text-lg font-black text-orange-400 w-12 shrink-0">{b.chars}</span>
                          <span className="font-mono text-xs text-slate-500 flex-1">{b.note}</span>
                          <span className="font-mono text-sm font-bold text-orange-300 shrink-0">+{b.value}</span>
                        </div>
                      ));
                    })()}
                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                      <span className="font-mono text-xs text-slate-600">Total</span>
                      <span className="font-mono text-sm font-bold text-orange-400">{romVal}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quiz box */}
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600">Quick Quiz</p>
                  <button onClick={newQuiz}
                    className="font-mono text-xs px-3 py-1 rounded-lg border border-white/[0.08] text-slate-500 hover:text-slate-300 hover:border-white/20 transition-all">
                    New Question
                  </button>
                </div>
                {!quiz ? (
                  <div className="text-center py-6">
                    <p className="font-mono text-sm text-slate-600 mb-3">Test your Roman numeral knowledge!</p>
                    <button onClick={newQuiz}
                      className="font-mono text-sm px-6 py-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-lg hover:bg-orange-500/20 transition-all">
                      Start Quiz
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="font-mono text-sm text-slate-400 mb-1">Convert to Roman numeral:</p>
                    <p className="font-mono text-5xl font-black text-orange-400 mb-4">{quiz.n}</p>
                    <div className="flex gap-2">
                      <input
                        value={quizInput}
                        onChange={e => setQuizInput(e.target.value.toUpperCase().replace(/[^IVXLCDM]/g,""))}
                        onKeyDown={e => e.key === "Enter" && checkQuiz()}
                        placeholder="Type Roman numeral…"
                        disabled={quiz.correct !== null}
                        className={`flex-1 font-mono text-sm bg-white/[0.04] border rounded-lg px-3 py-2 outline-none tracking-widest uppercase transition-colors
                          ${quiz.correct === true ? "border-emerald-500/40 text-emerald-400" : quiz.correct === false ? "border-red-500/40 text-red-400" : "border-white/[0.08] text-white focus:border-orange-500/40"}`}
                      />
                      {quiz.correct === null && (
                        <button onClick={checkQuiz}
                          className="font-mono text-xs px-4 py-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-lg hover:bg-orange-500/20 transition-all">
                          Check
                        </button>
                      )}
                    </div>
                    {quiz.correct !== null && (
                      <div className={`mt-3 px-3 py-2 rounded-lg border font-mono text-sm ${quiz.correct ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
                        {quiz.correct ? "🎉 Correct!" : `✗ Incorrect — answer is ${quiz.roman}`}
                      </div>
                    )}
                    {quiz.correct !== null && (
                      <button onClick={newQuiz} className="font-mono text-xs mt-2 px-4 py-1.5 rounded-lg border border-white/[0.08] text-slate-500 hover:text-slate-300 transition-all w-full">
                        Next Question →
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── BATCH TAB ── */}
        {activeTab === "batch" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                {([
                  { key:"numToRom", label:"Numbers → Roman" },
                  { key:"romToNum", label:"Roman → Numbers" },
                ] as {key:typeof batchMode;label:string}[]).map(m => (
                  <button key={m.key} onClick={() => setBatchMode(m.key)}
                    className={`flex-1 font-mono text-xs py-1.5 rounded-lg border transition-all
                      ${batchMode===m.key ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                    {m.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">
                  Input — {batchMode==="numToRom" ? "One number per line (1–3999)" : "One Roman numeral per line"}
                </span>
                <textarea
                  value={batchInput}
                  onChange={e => setBatchInput(e.target.value)}
                  placeholder={batchMode==="numToRom" ? "1\n4\n5\n9\n10\n2025" : "I\nIV\nV\nIX\nX\nMMXXV"}
                  spellCheck={false}
                  className="w-full h-72 font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 text-slate-300 placeholder-slate-700 outline-none resize-none leading-relaxed focus:border-orange-500/30 transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Results</span>
                <button onClick={() => copy(batchOutput, "batch")} disabled={!batchOutput}
                  className={`font-mono text-[11px] px-3 py-1 rounded border transition-all
                    ${copied==="batch" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300 disabled:opacity-20"}`}>
                  {copied==="batch" ? "✓ Copied!" : "Copy Results"}
                </button>
              </div>
              <div className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 overflow-auto min-h-72">
                {batchResults.length === 0 ? (
                  <span className="font-mono text-sm text-slate-700">Results will appear here…</span>
                ) : (
                  <div className="space-y-1">
                    {batchResults.map((r, i) => {
                      if (r.empty) return <div key={i} className="h-4" />;
                      return (
                        <div key={i} className="flex items-center gap-3 group">
                          <span className="font-mono text-xs text-slate-600 w-5 shrink-0">{i+1}</span>
                          <span className="font-mono text-xs text-slate-500 w-24 shrink-0">{r.input}</span>
                          <span className="font-mono text-[10px] text-slate-700 shrink-0">→</span>
                          <span className={`font-mono text-sm font-semibold flex-1 ${r.error ? "text-red-400" : "text-orange-300"}`}>{r.output}</span>
                          {!r.error && (
                            <button onClick={() => copy(r.output, `b-${i}`)}
                              className={`font-mono text-[10px] px-1.5 py-0.5 rounded border transition-all opacity-0 group-hover:opacity-100
                                ${copied===`b-${i}` ? "text-emerald-400 border-emerald-500/30" : "border-white/[0.08] text-slate-600 hover:text-slate-300"}`}>
                              {copied===`b-${i}` ? "✓" : "⊕"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {batchResults.length > 0 && (
                <div className="flex gap-4 font-mono text-[11px]">
                  <span className="text-emerald-400">✓ {batchResults.filter(r=>!r.error&&!r.empty).length} converted</span>
                  {batchResults.filter(r=>r.error).length > 0 && (
                    <span className="text-red-400">✗ {batchResults.filter(r=>r.error).length} errors</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TABLE TAB ── */}
        {activeTab === "table" && (
          <div className="flex flex-col gap-5">
            {/* Symbol reference */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {SYMBOLS.map(s => (
                <div key={s.sym} className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-3 text-center cursor-pointer hover:border-orange-500/30 transition-all group"
                  onClick={() => copy(s.sym, `sym-${s.sym}`)}>
                  <span className="font-mono text-3xl font-black text-orange-400 block group-hover:scale-110 transition-transform">{s.sym}</span>
                  <span className="font-mono text-sm text-slate-300 font-bold">{s.val}</span>
                  <span className="font-mono text-[9px] text-slate-700 block">{s.note}</span>
                  {copied===`sym-${s.sym}` && <span className="font-mono text-[9px] text-emerald-400">✓</span>}
                </div>
              ))}
            </div>

            {/* Common values table */}
            <div className="rounded-xl overflow-hidden border border-white/[0.08]">
              <div className="grid grid-cols-4 px-4 py-2 bg-white/[0.04] border-b border-white/[0.06]">
                {["Arabic","Roman","Arabic","Roman"].map((h,i) => (
                  <span key={i} className="font-mono text-[10px] uppercase tracking-widest text-slate-600">{h}</span>
                ))}
              </div>
              <div className="grid grid-cols-2 divide-x divide-white/[0.04]">
                {/* Split into 2 columns of pairs */}
                {[0,1].map(col => (
                  <div key={col} className="divide-y divide-white/[0.04]">
                    {COMMON.filter((_,i) => i % 2 === col).map(([n,r],i) => (
                      <div key={i} className="grid grid-cols-2 px-4 py-2 hover:bg-white/[0.02] cursor-pointer group transition-colors"
                        onClick={() => { setNumInput(String(n)); setActiveMode("toRoman"); setActiveTab("convert"); }}>
                        <span className="font-mono text-sm text-orange-400 font-bold">{n}</span>
                        <span className="font-mono text-sm text-slate-200 tracking-widest group-hover:text-orange-300 transition-colors">{r as string}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Full 1–50 table */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
              <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-3">1 – 50 Quick Reference</p>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                {Array.from({length:50},(_,i)=>i+1).map(n => {
                  const r = toRoman(n);
                  return (
                    <div key={n}
                      className="flex flex-col items-center bg-white/[0.02] border border-white/[0.06] rounded-lg py-2 px-1 cursor-pointer hover:border-orange-500/30 hover:bg-orange-500/[0.04] transition-all group"
                      onClick={() => { setNumInput(String(n)); setActiveMode("toRoman"); setActiveTab("convert"); }}>
                      <span className="font-mono text-[10px] font-bold text-orange-400">{n}</span>
                      <span className="font-mono text-[8px] text-slate-500 group-hover:text-slate-300 tracking-widest leading-tight text-center">{r}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── RULES TAB ── */}
        {activeTab === "rules" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {RULES.map((rule,i) => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-5 hover:border-orange-500/20 transition-all">
                <div className="flex items-start gap-3">
                  <span className="font-mono text-lg font-black text-orange-500/40 shrink-0 w-6">{toRoman(i+1)}</span>
                  <div>
                    <p className="font-mono text-sm font-bold text-slate-200 mb-1">{rule.title}</p>
                    <p className="font-mono text-xs text-slate-500 leading-relaxed">{rule.desc}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Subtractive pairs */}
            <div className="sm:col-span-2 bg-white/[0.02] border border-white/[0.08] rounded-xl p-5">
              <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-4">The 6 Subtractive Pairs</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[["IV",4],["IX",9],["XL",40],["XC",90],["CD",400],["CM",900]].map(([r,n])=>(
                  <div key={r as string}
                    className="flex flex-col items-center bg-[#0a0a14] border border-white/[0.08] rounded-xl p-3 cursor-pointer hover:border-orange-500/30 transition-all"
                    onClick={() => copy(r as string, `pair-${r}`)}>
                    <span className="font-mono text-2xl font-black text-orange-400 tracking-widest">{r}</span>
                    <span className="font-mono text-base font-bold text-slate-300">{n}</span>
                    {copied===`pair-${r}` && <span className="font-mono text-[9px] text-emerald-400">✓</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Stats bar */}
        <div className="flex flex-wrap gap-6 px-4 py-3 bg-orange-500/[0.05] border border-orange-500/20 rounded-lg mt-6 mb-5">
          <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Range</span><span className="font-mono text-sm text-orange-400">1 – 3999</span></div>
          <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Symbols</span><span className="font-mono text-sm text-orange-400">7 (I V X L C D M)</span></div>
          <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Subtractives</span><span className="font-mono text-sm text-orange-400">6 pairs</span></div>
          {activeMode==="toRoman" && roman && <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Now</span><span className="font-mono text-sm text-orange-400">{numVal} = {roman}</span></div>}
          {activeMode==="fromRoman" && romValid && romVal && <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Now</span><span className="font-mono text-sm text-orange-400">{romInput} = {romVal}</span></div>}
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            <span className="font-mono text-[10px] text-orange-500/60">Live</span>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon:"⇄", title:"Two-way Conversion", desc:"Convert Arabic to Roman or Roman to Arabic with full step-by-step breakdown and validation." },
            { icon:"⊞", title:"Batch Mode",         desc:"Convert hundreds of numbers at once — one per line, with error reporting for invalid inputs." },
            { icon:"📜", title:"Learn & Quiz",       desc:"Symbol reference table, 1–50 grid, 8 rules explained, 6 subtractive pairs, and an instant quiz." },
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