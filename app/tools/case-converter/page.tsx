"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState } from "react";

// ── Converters ──────────────────────────────────────────────
function tokenize(input: string): string[] {
  return input
    .replace(/([a-z])([A-Z])/g, "$1 $2")        // camelCase split
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")  // ABCDef → ABC Def
    .replace(/[-_./\\]+/g, " ")                   // separators → space
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

const converters: Record<string, (words: string[]) => string> = {
  "camelCase":       (w) => w.map((t, i) => i === 0 ? t.toLowerCase() : t[0].toUpperCase() + t.slice(1).toLowerCase()).join(""),
  "PascalCase":      (w) => w.map((t) => t[0].toUpperCase() + t.slice(1).toLowerCase()).join(""),
  "snake_case":      (w) => w.map((t) => t.toLowerCase()).join("_"),
  "SCREAMING_SNAKE": (w) => w.map((t) => t.toUpperCase()).join("_"),
  "kebab-case":      (w) => w.map((t) => t.toLowerCase()).join("-"),
  "COBOL-CASE":      (w) => w.map((t) => t.toUpperCase()).join("-"),
  "dot.case":        (w) => w.map((t) => t.toLowerCase()).join("."),
  "path/case":       (w) => w.map((t) => t.toLowerCase()).join("/"),
  "Title Case":      (w) => w.map((t) => t[0].toUpperCase() + t.slice(1).toLowerCase()).join(" "),
  "Sentence case":   (w) => { const s = w.map((t) => t.toLowerCase()).join(" "); return s[0].toUpperCase() + s.slice(1); },
  "lowercase":       (w) => w.map((t) => t.toLowerCase()).join(" "),
  "UPPERCASE":       (w) => w.map((t) => t.toUpperCase()).join(" "),
  "aLtErNaTiNg":     (w) => { const s = w.join(" "); return s.split("").map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join(""); },
  "Reverse":         (w) => w.join(" ").split("").reverse().join(""),
};

const CATEGORIES = [
  {
    label: "Code",
    color: "emerald",
    cases: ["camelCase", "PascalCase", "snake_case", "SCREAMING_SNAKE", "kebab-case", "COBOL-CASE", "dot.case", "path/case"],
  },
  {
    label: "Text",
    color: "violet",
    cases: ["Title Case", "Sentence case", "lowercase", "UPPERCASE", "aLtErNaTiNg", "Reverse"],
  },
];

const COLOR_MAP: Record<string, { tag: string; copy: string; border: string }> = {
  emerald: { tag: "bg-emerald-500/10 text-emerald-400", copy: "hover:border-emerald-500/40 hover:text-emerald-300", border: "border-emerald-500/20" },
  violet:  { tag: "bg-violet-500/10 text-violet-400",   copy: "hover:border-violet-500/40 hover:text-violet-300",  border: "border-violet-500/20" },
};

const EXAMPLES = [
  "hello world example",
  "myVariableName",
  "some-kebab-string",
  "THE_CONSTANT_VALUE",
  "UserProfileController",
];

export default function CaseConverter() {
  const [input, setInput] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const words = tokenize(input);
  const hasInput = input.trim().length > 0 && words.length > 0;

  const copy = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const loadExample = (ex: string) => setInput(ex);

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.025) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -left-48 w-[500px] h-[500px] rounded-full bg-violet-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -right-48 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

      {/* NAV */}
      {/* <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#09090f]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <a href="/" className="font-mono text-sm font-bold text-emerald-400 tracking-tight">use2<span className="text-slate-500">coding</span>tools</a>
          <span className="text-white/10">/</span>
          <span className="font-mono text-sm text-slate-400">Case Converter</span>
        </div>
      </nav> */}
      <ToolNavbar toolName="Case Converter" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-violet-500/10 flex items-center justify-center text-sm font-mono font-bold text-violet-400">Aa</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Case Converter</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded">14 formats</span>
          </div>
          <p className="text-slate-500 text-sm">Convert text between camelCase, snake_case, kebab-case, PascalCase and 10+ more formats instantly.</p>
        </div>

        {/* Input */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Your Text</span>
            {hasInput && (
              <span className="font-mono text-[10px] text-slate-700">{words.length} word{words.length !== 1 ? "s" : ""} detected</span>
            )}
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type or paste your text here — any format works..."
            spellCheck={false}
            rows={4}
            className="w-full font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-slate-300 placeholder-slate-700 outline-none focus:border-violet-500/40 resize-none transition-colors leading-relaxed"
          />
        </div>

        {/* Examples */}
        <div className="flex flex-wrap gap-2 mb-8">
          <span className="font-mono text-[10px] text-slate-700 self-center uppercase tracking-widest">Try:</span>
          {EXAMPLES.map((ex) => (
            <button key={ex} onClick={() => loadExample(ex)}
              className="font-mono text-[11px] px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded hover:text-violet-400 hover:border-violet-500/30 transition-all">
              {ex}
            </button>
          ))}
          {input && (
            <button onClick={() => setInput("")}
              className="font-mono text-[11px] px-3 py-1.5 border border-white/[0.08] text-slate-600 rounded hover:text-red-400 hover:border-red-500/30 transition-all ml-auto">
              Clear
            </button>
          )}
        </div>

        {/* Results */}
        <div className="space-y-8">
          {CATEGORIES.map((cat) => {
            const c = COLOR_MAP[cat.color];
            return (
              <div key={cat.label}>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`font-mono text-[11px] px-2.5 py-1 rounded ${c.tag}`}>{cat.label}</span>
                  <div className="flex-1 h-px bg-white/[0.05]" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cat.cases.map((caseName) => {
                    const result = hasInput ? converters[caseName](words) : "";
                    const key = caseName;
                    const isCopied = copiedKey === key;
                    return (
                      <div key={caseName} className={`bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 transition-all ${hasInput ? `hover:border-white/[0.14] group` : "opacity-50"}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-[11px] text-slate-600">{caseName}</span>
                          {hasInput && (
                            <button
                              onClick={() => copy(key, result)}
                              className={`font-mono text-[10px] px-2.5 py-1 rounded border transition-all opacity-0 group-hover:opacity-100 ${isCopied ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400 opacity-100" : `border-white/[0.08] text-slate-500 ${c.copy}`}`}
                            >
                              {isCopied ? "✓ Copied!" : "Copy"}
                            </button>
                          )}
                        </div>
                        <div className={`font-mono text-sm break-all min-h-[1.5rem] ${hasInput ? "text-slate-200" : "text-slate-700"}`}>
                          {hasInput ? result : <span className="text-slate-700 italic text-xs">waiting for input...</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* How it works */}
        <div className="mt-10 bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
          <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-4">How it works</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <div className="text-slate-500 mb-1">1. Auto-detect input</div>
              <div className="text-slate-700 leading-relaxed">Accepts camelCase, snake_case, kebab-case, spaces, or any mixed format</div>
            </div>
            <div>
              <div className="text-slate-500 mb-1">2. Tokenize words</div>
              <div className="text-slate-700 leading-relaxed">Splits on separators, capital letters, and boundaries to extract clean tokens</div>
            </div>
            <div>
              <div className="text-slate-500 mb-1">3. Rebuild in target</div>
              <div className="text-slate-700 leading-relaxed">All 14 formats are generated simultaneously — click any to copy</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}