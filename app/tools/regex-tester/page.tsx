"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useMemo } from "react";

const EXAMPLES = [
  { label: "Email", pattern: "[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}", flags: "g", text: "Contact us at hello@use2codingtools.com or support@example.org for help." },
  { label: "URL", pattern: "https?:\\/\\/[^\\s]+", flags: "g", text: "Visit https://use2codingtools.com or http://example.org for more info." },
  { label: "IPv4", pattern: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b", flags: "g", text: "Server IPs: 192.168.1.1 and 10.0.0.254 are both in private range." },
  { label: "Hex Color", pattern: "#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\\b", flags: "g", text: "Colors used: #ff6b35, #00ff88, #7b61ff, #fff and #000000." },
  { label: "Date", pattern: "\\d{4}-\\d{2}-\\d{2}", flags: "g", text: "Events on 2024-01-15, 2024-06-30 and 2025-12-31 are confirmed." },
  { label: "Phone", pattern: "\\+?[0-9]{1,3}[\\s\\-]?\\(?[0-9]{3}\\)?[\\s\\-]?[0-9]{3}[\\s\\-]?[0-9]{4}", flags: "g", text: "Call us: +1 (555) 123-4567 or +91 98765-43210 anytime." },
];

const FLAG_OPTS = [
  { flag: "g", desc: "Global" },
  { flag: "i", desc: "Ignore case" },
  { flag: "m", desc: "Multiline" },
  { flag: "s", desc: "Dot all" },
];

const MATCH_COLORS = [
  "bg-emerald-500/30 text-emerald-200",
  "bg-violet-500/30 text-violet-200",
  "bg-orange-500/30 text-orange-200",
  "bg-cyan-500/30 text-cyan-200",
  "bg-yellow-500/30 text-yellow-200",
];

interface MatchInfo {
  match: string;
  index: number;
  groups: (string | undefined)[];
}

export default function RegexTester() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [testText, setTestText] = useState("");
  const [copiedPattern, setCopiedPattern] = useState(false);

  const toggleFlag = (f: string) => {
    setFlags((prev) => prev.includes(f) ? prev.replace(f, "") : prev + f);
  };

  const { highlighted, matches, error } = useMemo(() => {
    if (!pattern) return { highlighted: null, matches: [], error: "" };
    try {
      const safeFlags = flags.includes("g") ? flags : flags + "g";
      const re = new RegExp(pattern, safeFlags);
      const allMatches: MatchInfo[] = [];
      let m: RegExpExecArray | null;
      re.lastIndex = 0;
      while ((m = re.exec(testText)) !== null) {
        allMatches.push({ match: m[0], index: m.index, groups: m.slice(1) });
        if (!safeFlags.includes("g")) break;
        if (m[0].length === 0) re.lastIndex++;
      }

      const parts: { text: string; matchIdx: number | null }[] = [];
      let cursor = 0;
      allMatches.forEach((mi, idx) => {
        if (mi.index > cursor) parts.push({ text: testText.slice(cursor, mi.index), matchIdx: null });
        parts.push({ text: mi.match, matchIdx: idx });
        cursor = mi.index + mi.match.length;
      });
      if (cursor < testText.length) parts.push({ text: testText.slice(cursor), matchIdx: null });

      return { highlighted: parts, matches: allMatches, error: "" };
    } catch (e: unknown) {
      return { highlighted: null, matches: [], error: (e as Error).message };
    }
  }, [pattern, flags, testText]);

  const loadExample = (ex: typeof EXAMPLES[0]) => {
    setPattern(ex.pattern);
    setFlags(ex.flags);
    setTestText(ex.text);
  };

  const copyPattern = () => {
    if (!pattern) return;
    navigator.clipboard.writeText(`/${pattern}/${flags}`);
    setCopiedPattern(true);
    setTimeout(() => setCopiedPattern(false), 1500);
  };

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.025) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-cyan-500/[0.04] blur-3xl pointer-events-none" />

      {/* <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#09090f]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <a href="/" className="font-mono text-sm font-bold text-emerald-400 tracking-tight">use2<span className="text-slate-500">coding</span>tools</a>
          <span className="text-white/10">/</span>
          <span className="font-mono text-sm text-slate-400">Regex Tester</span>
        </div>
      </nav> */}

      <ToolNavbar toolName="Regex Tester" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center font-mono font-bold text-emerald-400 text-sm">.*</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Regex Tester</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">live</span>
          </div>
          <p className="text-slate-500 text-sm">Test regular expressions with live match highlighting, group capture, and built-in examples.</p>
        </div>

        {/* Examples */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="font-mono text-[10px] text-slate-700 self-center uppercase tracking-widest">Examples:</span>
          {EXAMPLES.map((ex) => (
            <button key={ex.label} onClick={() => loadExample(ex)}
              className="font-mono text-[11px] px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded hover:text-emerald-400 hover:border-emerald-500/30 transition-all">
              {ex.label}
            </button>
          ))}
        </div>

        {/* Pattern */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Pattern</span>
            {matches.length > 0 && (
              <span className="font-mono text-[11px] px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded">
                {matches.length} match{matches.length !== 1 ? "es" : ""}
              </span>
            )}
            {pattern && matches.length === 0 && !error && testText && (
              <span className="font-mono text-[11px] px-2 py-0.5 bg-slate-800 text-slate-500 rounded">No matches</span>
            )}
            <button onClick={copyPattern} disabled={!pattern}
              className={`ml-auto font-mono text-[11px] px-3 py-1 rounded border transition-all ${copiedPattern ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300 disabled:opacity-30"}`}>
              {copiedPattern ? "✓ Copied!" : "Copy /regex/"}
            </button>
          </div>

          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 mb-4 focus-within:border-emerald-500/40 transition-colors">
            <span className="font-mono text-slate-600 select-none">/</span>
            <input type="text" value={pattern} onChange={(e) => setPattern(e.target.value)}
              placeholder="your-regex-here" spellCheck={false}
              className="flex-1 font-mono text-sm bg-transparent text-emerald-300 placeholder-slate-700 outline-none" />
            <span className="font-mono text-slate-600 select-none">/</span>
            <span className="font-mono text-orange-400 text-sm min-w-[24px]">{flags}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] text-slate-700 uppercase tracking-widest mr-1">Flags:</span>
            {FLAG_OPTS.map((f) => (
              <button key={f.flag} onClick={() => toggleFlag(f.flag)}
                className={`font-mono text-xs px-3 py-1 rounded border transition-all ${flags.includes(f.flag) ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-600 hover:text-slate-300"}`}>
                {f.flag} <span className="opacity-50 text-[10px]">{f.desc}</span>
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-3 font-mono text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">✕ {error}</div>
          )}
        </div>

        {/* Editors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Test String</span>
            <textarea value={testText} onChange={(e) => setTestText(e.target.value)}
              placeholder="Paste your test string here..." spellCheck={false}
              className="h-64 font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-slate-300 placeholder-slate-700 outline-none focus:border-emerald-500/40 resize-none transition-colors leading-relaxed" />
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Match Preview</span>
            <div className="h-64 font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 overflow-auto leading-relaxed">
              {!testText && <span className="text-slate-700">Matches will be highlighted here...</span>}
              {testText && !pattern && <span className="text-slate-400 whitespace-pre-wrap">{testText}</span>}
              {testText && pattern && highlighted && (
                <span className="whitespace-pre-wrap">
                  {highlighted.map((part, i) =>
                    part.matchIdx !== null ? (
                      <mark key={i} className={`rounded-sm px-0.5 ${MATCH_COLORS[part.matchIdx % MATCH_COLORS.length]}`}>
                        {part.text}
                      </mark>
                    ) : (
                      <span key={i} className="text-slate-400">{part.text}</span>
                    )
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Match details table */}
        {matches.length > 0 && (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden mb-6">
            <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Match Details</span>
              <span className="font-mono text-[11px] text-emerald-400">{matches.length} total</span>
            </div>
            <div className="divide-y divide-white/[0.04] max-h-56 overflow-auto">
              {matches.map((m, i) => (
                <div key={i} className="flex items-start gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  <span className={`font-mono text-[10px] px-2 py-0.5 rounded shrink-0 mt-0.5 ${MATCH_COLORS[i % MATCH_COLORS.length]}`}>#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm text-slate-200 break-all">{m.match}</div>
                    <div className="font-mono text-[10px] text-slate-700 mt-0.5">index: {m.index} • length: {m.match.length}</div>
                  </div>
                  {m.groups.filter(Boolean).length > 0 && (
                    <div className="shrink-0 space-y-0.5">
                      {m.groups.map((g, gi) => g && (
                        <div key={gi} className="font-mono text-[10px] text-slate-500">
                          <span className="text-slate-700">g{gi + 1}:</span> {g}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick reference */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
          <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-4">Quick Reference</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
            {[
              [".", "Any char"], ["\\d", "Digit [0-9]"], ["\\w", "Word char"], ["\\s", "Whitespace"],
              ["^", "Line start"], ["$", "Line end"], ["*", "0 or more"], ["+", "1 or more"],
              ["?", "0 or 1"], ["{n,m}", "Between n-m"], ["[abc]", "Char class"], ["(x|y)", "Or"],
              ["(?:x)", "Non-capture"], ["(?=x)", "Lookahead"], ["\\b", "Word boundary"], ["\\1", "Backreference"],
            ].map(([sym, desc]) => (
              <div key={sym} className="flex items-center gap-2">
                <span className="font-mono text-xs text-emerald-400 w-14 shrink-0">{sym}</span>
                <span className="font-mono text-[10px] text-slate-600">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}