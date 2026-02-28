"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useMemo } from "react";

type SortMode =
  | "alpha-asc" | "alpha-desc"
  | "length-asc" | "length-desc"
  | "random" | "reverse"
  | "numeric-asc" | "numeric-desc"
  | "word-count-asc" | "word-count-desc";

interface SortOption {
  value: SortMode;
  label: string;
  icon: string;
  desc: string;
  color: string;
}

const SORT_OPTIONS: SortOption[] = [
  { value: "alpha-asc",       label: "A → Z",          icon: "🔤", desc: "Alphabetical ascending",   color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { value: "alpha-desc",      label: "Z → A",          icon: "🔤", desc: "Alphabetical descending",  color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { value: "length-asc",      label: "Short → Long",   icon: "📏", desc: "By character length ↑",    color: "text-blue-400    bg-blue-500/10    border-blue-500/20"    },
  { value: "length-desc",     label: "Long → Short",   icon: "📏", desc: "By character length ↓",    color: "text-blue-400    bg-blue-500/10    border-blue-500/20"    },
  { value: "word-count-asc",  label: "Fewest Words",   icon: "💬", desc: "By word count ↑",          color: "text-cyan-400    bg-cyan-500/10    border-cyan-500/20"    },
  { value: "word-count-desc", label: "Most Words",     icon: "💬", desc: "By word count ↓",          color: "text-cyan-400    bg-cyan-500/10    border-cyan-500/20"    },
  { value: "numeric-asc",     label: "0 → 9",          icon: "🔢", desc: "Numeric sort ascending",   color: "text-orange-400  bg-orange-500/10  border-orange-500/20"  },
  { value: "numeric-desc",    label: "9 → 0",          icon: "🔢", desc: "Numeric sort descending",  color: "text-orange-400  bg-orange-500/10  border-orange-500/20"  },
  { value: "reverse",         label: "Reverse",        icon: "🔃", desc: "Reverse current order",    color: "text-violet-400  bg-violet-500/10  border-violet-500/20"  },
  { value: "random",          label: "Shuffle",        icon: "🎲", desc: "Random shuffle",           color: "text-pink-400    bg-pink-500/10    border-pink-500/20"    },
];

const EXAMPLES = [
  { label: "Countries",  text: "India\nUnited States\nGermany\nJapan\nBrazil\nAustralia\nCanada\nFrance\nChina\nMexico" },
  { label: "Numbers",    text: "42\n7\n100\n3\n256\n15\n88\n1\n999\n24" },
  { label: "Sentences",  text: "The quick brown fox jumps over the lazy dog\nA stitch in time saves nine\nTo be or not to be\nAll that glitters is not gold\nThe early bird catches the worm" },
  { label: "Tech Stack", text: "React\nNext.js\nTailwind CSS\nTypeScript\nNode.js\nPostgreSQL\nRedis\nDocker\nVercel\nPrisma" },
];

function sortLines(lines: string[], mode: SortMode, caseSensitive: boolean): string[] {
  const arr = [...lines];
  const normalize = (s: string) => caseSensitive ? s : s.toLowerCase();

  switch (mode) {
    case "alpha-asc":
      return arr.sort((a, b) => normalize(a).localeCompare(normalize(b)));
    case "alpha-desc":
      return arr.sort((a, b) => normalize(b).localeCompare(normalize(a)));
    case "length-asc":
      return arr.sort((a, b) => a.length - b.length || normalize(a).localeCompare(normalize(b)));
    case "length-desc":
      return arr.sort((a, b) => b.length - a.length || normalize(a).localeCompare(normalize(b)));
    case "word-count-asc":
      return arr.sort((a, b) => a.split(/\s+/).filter(Boolean).length - b.split(/\s+/).filter(Boolean).length);
    case "word-count-desc":
      return arr.sort((a, b) => b.split(/\s+/).filter(Boolean).length - a.split(/\s+/).filter(Boolean).length);
    case "numeric-asc":
      return arr.sort((a, b) => {
        const na = parseFloat(a), nb = parseFloat(b);
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
        return normalize(a).localeCompare(normalize(b));
      });
    case "numeric-desc":
      return arr.sort((a, b) => {
        const na = parseFloat(a), nb = parseFloat(b);
        if (!isNaN(na) && !isNaN(nb)) return nb - na;
        return normalize(b).localeCompare(normalize(a));
      });
    case "reverse":
      return arr.reverse();
    case "random":
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    default:
      return arr;
  }
}

export default function TextSorter() {
  const [input, setInput]           = useState("India\nUnited States\nGermany\nJapan\nBrazil\nAustralia\nCanada\nFrance\nChina\nMexico");
  const [mode, setMode]             = useState<SortMode>("alpha-asc");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [trimLines, setTrimLines]   = useState(true);
  const [removeEmpty, setRemoveEmpty] = useState(true);
  const [removeDupes, setRemoveDupes] = useState(false);
  const [copied, setCopied]         = useState(false);
  const [activeExample, setActiveExample] = useState("Countries");

  const lines = useMemo(() => {
    let ls = input.split("\n");
    if (trimLines)   ls = ls.map((l) => l.trim());
    if (removeEmpty) ls = ls.filter((l) => l.length > 0);
    return ls;
  }, [input, trimLines, removeEmpty]);

  const sorted = useMemo(() => {
    let result = sortLines(lines, mode, caseSensitive);
    if (removeDupes) {
      const seen = new Set<string>();
      result = result.filter((l) => {
        const key = caseSensitive ? l : l.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    return result;
  }, [lines, mode, caseSensitive, removeDupes]);

  const output = sorted.join("\n");

  const dupeCount = useMemo(() => {
    const seen = new Set<string>();
    let count = 0;
    for (const l of lines) {
      const key = caseSensitive ? l : l.toLowerCase();
      if (seen.has(key)) count++;
      else seen.add(key);
    }
    return count;
  }, [lines, caseSensitive]);

  const copy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const loadExample = (ex: typeof EXAMPLES[0]) => {
    setInput(ex.text);
    setActiveExample(ex.label);
  };

  const currentOpt = SORT_OPTIONS.find((o) => o.value === mode)!;

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-violet-500/[0.04] blur-3xl pointer-events-none" />

      {/* NAV */}
            <ToolNavbar toolName="Text Sorter" />
      

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center text-lg">🔃</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Text Sorter</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">10 modes</span>
          </div>
          <p className="text-slate-500 text-sm">Sort lines alphabetically, by length, numerically, by word count, randomly, or reverse — with deduplication and trim options.</p>
        </div>

        {/* Examples */}
        <div className="flex flex-wrap gap-2 mb-5">
          <span className="font-mono text-[11px] text-slate-600 self-center uppercase tracking-wider">Examples:</span>
          {EXAMPLES.map((ex) => (
            <button key={ex.label} onClick={() => loadExample(ex)}
              className={`font-mono text-xs px-3 py-1.5 border rounded transition-all ${
                activeExample === ex.label
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                  : "border-white/[0.08] text-slate-500 hover:text-emerald-400 hover:border-emerald-500/30"
              }`}>
              {ex.label}
            </button>
          ))}
        </div>

        {/* Sort mode grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-5">
          {SORT_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => setMode(opt.value)}
              className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border transition-all ${
                mode === opt.value
                  ? `${opt.color} font-bold`
                  : "border-white/[0.06] text-slate-600 hover:border-white/[0.14] hover:text-slate-300"
              }`}>
              <span className="text-lg">{opt.icon}</span>
              <span className="font-mono text-[11px] text-center leading-tight">{opt.label}</span>
            </button>
          ))}
        </div>

        {/* Options bar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {[
            { label: "Trim whitespace", val: trimLines,    set: setTrimLines    },
            { label: "Remove empty",    val: removeEmpty,  set: setRemoveEmpty  },
            { label: "Remove dupes",    val: removeDupes,  set: setRemoveDupes  },
            { label: "Case sensitive",  val: caseSensitive,set: setCaseSensitive },
          ].map(({ label, val, set }) => (
            <label key={label} onClick={() => set(!val)} className="flex items-center gap-2 cursor-pointer bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-1.5">
              <div className={`w-8 h-4 rounded-full relative transition-all ${val ? "bg-emerald-500" : "bg-white/10"}`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${val ? "left-4" : "left-0.5"}`} />
              </div>
              <span className="font-mono text-xs text-slate-500">{label}</span>
            </label>
          ))}

          <div className="ml-auto flex gap-2">
            <button onClick={() => { setInput(""); setActiveExample(""); }}
              className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-red-400 hover:border-red-500/30 transition-all">
              Clear
            </button>
          </div>
        </div>

        {/* Editors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">

          {/* Input */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Input</span>
              <div className="flex items-center gap-3">
                {dupeCount > 0 && (
                  <span className="font-mono text-[10px] px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded">
                    {dupeCount} dupe{dupeCount > 1 ? "s" : ""}
                  </span>
                )}
                <span className="font-mono text-[10px] text-slate-700">{lines.length} lines</span>
              </div>
            </div>
            <textarea value={input} onChange={(e) => { setInput(e.target.value); setActiveExample(""); }}
              placeholder={"Paste lines here...\nOne item per line\nLike this"}
              spellCheck={false} rows={18}
              className="w-full font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 text-slate-300 placeholder-slate-700 outline-none focus:border-emerald-500/40 resize-none transition-colors leading-relaxed" />
          </div>

          {/* Output */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Sorted</span>
                <span className={`font-mono text-[10px] px-2 py-0.5 rounded border ${currentOpt.color}`}>
                  {currentOpt.icon} {currentOpt.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-slate-700">{sorted.length} lines</span>
                <button onClick={copy} disabled={!output}
                  className={`font-mono text-[11px] px-3 py-1 rounded border transition-all ${copied ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300 disabled:opacity-30"}`}>
                  {copied ? "✓ Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <div className="h-[456px] font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
              <div className="h-full overflow-y-auto p-4">
                {sorted.length === 0 && <span className="text-slate-700">Sorted output will appear here...</span>}
                {sorted.map((line, i) => (
                  <div key={i} className="flex items-baseline gap-3 py-0.5 group hover:bg-white/[0.02] px-1 rounded transition-colors">
                    <span className="font-mono text-[10px] text-slate-700 shrink-0 w-6 text-right group-hover:text-slate-600">{i + 1}</span>
                    <span className="text-slate-300 truncate">{line}</span>
                    <span className="font-mono text-[9px] text-slate-800 shrink-0 ml-auto group-hover:text-slate-700">
                      {line.length}c
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        {lines.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            {[
              { label: "Input lines",  val: lines.length,  color: "text-slate-400" },
              { label: "Output lines", val: sorted.length, color: "text-emerald-400" },
              { label: "Duplicates",   val: dupeCount,     color: dupeCount > 0 ? "text-yellow-400" : "text-slate-600" },
              { label: "Avg length",   val: lines.length > 0 ? Math.round(lines.reduce((s, l) => s + l.length, 0) / lines.length) : 0, color: "text-cyan-400" },
              { label: "Unique",       val: new Set(lines.map((l) => caseSensitive ? l : l.toLowerCase())).size, color: "text-violet-400" },
            ].map((s) => (
              <div key={s.label} className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-4 py-3 text-center">
                <div className={`font-mono text-xl font-bold ${s.color}`}>{s.val}</div>
                <div className="font-mono text-[10px] text-slate-700 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[
            { icon: "🔤", title: "10 Sort Modes",    desc: "Alpha, numeric, length, word count, reverse, and random shuffle." },
            { icon: "🧹", title: "Clean Options",    desc: "Trim whitespace, remove empty lines, and deduplicate in one click." },
            { icon: "🔢", title: "Smart Numeric",    desc: "Numbers sort by value (10 > 9), not alphabetically (9 > 10)." },
            { icon: "👁️", title: "Line Preview",     desc: "See each line numbered with character count on hover." },
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