"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
type DiffLine =
  | { type: "added";   content: string; newLine: number; oldLine: null }
  | { type: "removed"; content: string; newLine: null;   oldLine: number }
  | { type: "equal";   content: string; newLine: number; oldLine: number };

type ViewMode = "split" | "unified";

// ── Example snippets ───────────────────────────────────────────────────────
const EXAMPLE_OLD = `function greet(name) {
  console.log("Hello, " + name);
  return "Hello, " + name;
}

function add(a, b) {
  return a + b;
}

const PI = 3.14;`;

const EXAMPLE_NEW = `function greet(name, greeting = "Hello") {
  const message = \`\${greeting}, \${name}!\`;
  console.log(message);
  return message;
}

function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

const PI = 3.14159;`;

// ── LCS-based diff engine ──────────────────────────────────────────────────
function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const m = oldLines.length;
  const n = newLines.length;

  // LCS DP table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] =
        oldLines[i] === newLines[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);

  const result: DiffLine[] = [];
  let i = 0, j = 0, oldLine = 1, newLine = 1;

  while (i < m || j < n) {
    if (i < m && j < n && oldLines[i] === newLines[j]) {
      result.push({ type: "equal", content: oldLines[i], oldLine: oldLine++, newLine: newLine++ });
      i++; j++;
    } else if (j < n && (i >= m || dp[i][j + 1] >= dp[i + 1][j])) {
      result.push({ type: "added", content: newLines[j], oldLine: null, newLine: newLine++ });
      j++;
    } else {
      result.push({ type: "removed", content: oldLines[i], oldLine: oldLine++, newLine: null });
      i++;
    }
  }
  return result;
}

// ── Stats helper ───────────────────────────────────────────────────────────
function getStats(diff: DiffLine[]) {
  const added   = diff.filter(d => d.type === "added").length;
  const removed = diff.filter(d => d.type === "removed").length;
  const equal   = diff.filter(d => d.type === "equal").length;
  return { added, removed, equal, changed: added + removed };
}

// ── Syntax-highlight (basic token colouring) ──────────────────────────────
const KEYWORDS = /\b(function|return|const|let|var|if|else|for|while|class|import|export|default|new|this|async|await|typeof|instanceof|null|undefined|true|false)\b/g;
const STRINGS  = /(["'`])(?:(?!\1)[^\\]|\\.)*?\1/g;
const COMMENTS = /(\/\/.*|\/\*[\s\S]*?\*\/)/g;
const NUMBERS  = /\b(\d+\.?\d*)\b/g;

function highlight(raw: string): string {
  // escape HTML first
  let s = raw.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // order matters — protect strings & comments first
  const slots: string[] = [];
  const slot = (val: string) => { const id = `\x00${slots.length}\x00`; slots.push(val); return id; };

  s = s.replace(COMMENTS, (m) => slot(`<span class="text-slate-500 italic">${m}</span>`));
  s = s.replace(STRINGS,  (m) => slot(`<span class="text-emerald-400">${m}</span>`));
  s = s.replace(KEYWORDS, (m) => slot(`<span class="text-orange-400 font-semibold">${m}</span>`));
  s = s.replace(NUMBERS,  (m) => slot(`<span class="text-sky-400">${m}</span>`));

  // restore slots
  return s.replace(/\x00(\d+)\x00/g, (_, i) => slots[+i]);
}

// ── Component ──────────────────────────────────────────────────────────────
export default function CodeDiff() {
  const [oldCode, setOldCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [diff, setDiff]       = useState<DiffLine[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [copied, setCopied]   = useState(false);
  const [computed, setComputed] = useState(false);

  const runDiff = useCallback((old = oldCode, newer = newCode) => {
    if (!old && !newer) { setDiff([]); setComputed(false); return; }
    setDiff(computeDiff(old, newer));
    setComputed(true);
  }, [oldCode, newCode]);

  const handleOld = (v: string) => { setOldCode(v); if (computed) runDiff(v, newCode); };
  const handleNew = (v: string) => { setNewCode(v); if (computed) runDiff(oldCode, v); };

  const handleLoadExample = () => {
    setOldCode(EXAMPLE_OLD);
    setNewCode(EXAMPLE_NEW);
    setDiff(computeDiff(EXAMPLE_OLD, EXAMPLE_NEW));
    setComputed(true);
  };

  const handleClear = () => {
    setOldCode(""); setNewCode(""); setDiff([]); setComputed(false);
  };

  const handleCopy = () => {
    const text = diff.map(d =>
      d.type === "added"   ? `+ ${d.content}` :
      d.type === "removed" ? `- ${d.content}` :
                             `  ${d.content}`
    ).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const stats = diff.length ? getStats(diff) : null;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-orange-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

      <ToolNavbar toolName="Code Diff" />

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-orange-500/10 flex items-center justify-center font-mono font-bold text-orange-400 text-sm">±</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Code Diff</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded">client-side</span>
          </div>
          <p className="text-slate-500 text-sm">Paste two versions of code and instantly see what changed — additions, deletions, and unchanged lines.</p>
        </div>

        {/* Options bar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">

          {/* View mode */}
          <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-md px-1.5 py-1.5">
            {(["split", "unified"] as ViewMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`font-mono text-xs px-3 py-0.5 rounded transition-all capitalize ${viewMode === m ? "bg-orange-500/20 text-orange-400" : "text-slate-500 hover:text-slate-300"}`}
              >
                {m === "split" ? "⊞ Split" : "☰ Unified"}
              </button>
            ))}
          </div>

          <div className="ml-auto flex gap-2">
            <button
              onClick={handleLoadExample}
              className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-slate-300 hover:border-white/20 transition-all"
            >
              Load Example
            </button>
            <button
              onClick={handleClear}
              className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-red-400 hover:border-red-500/30 transition-all"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Input panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
          {[
            { label: "Original Code", val: oldCode, set: handleOld, accent: "red",  placeholder: "Paste original / old code here…" },
            { label: "Modified Code", val: newCode, set: handleNew, accent: "emerald", placeholder: "Paste modified / new code here…" },
          ].map(({ label, val, set, accent, placeholder }) => (
            <div key={label} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">{label}</span>
                <span className="font-mono text-[10px] text-slate-700">{val.split("\n").length} lines</span>
              </div>
              <textarea
                value={val}
                onChange={(e) => set(e.target.value)}
                placeholder={placeholder}
                spellCheck={false}
                className={`w-full h-52 font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-slate-300 placeholder-slate-700 outline-none resize-none leading-relaxed transition-colors focus:border-${accent}-500/40`}
              />
            </div>
          ))}
        </div>

        {/* Compare button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={() => runDiff()}
            className="font-mono text-sm px-8 py-2.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-lg hover:bg-orange-500/20 hover:border-orange-500/50 transition-all font-semibold tracking-wide"
          >
            ⇄ Compare
          </button>
        </div>

        {/* Stats bar */}
        {stats && (
          <div className="flex flex-wrap gap-6 px-4 py-3 bg-orange-500/[0.05] border border-orange-500/20 rounded-lg mb-5">
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Added</span><span className="font-mono text-sm text-emerald-400">+{stats.added}</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Removed</span><span className="font-mono text-sm text-red-400">-{stats.removed}</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Unchanged</span><span className="font-mono text-sm text-slate-400">{stats.equal}</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Changed Lines</span><span className="font-mono text-sm text-orange-400">{stats.changed}</span></div>
            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={handleCopy}
                className={`font-mono text-[11px] px-3 py-1 rounded border transition-all ${copied ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}
              >
                {copied ? "✓ Copied!" : "Copy Diff"}
              </button>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                <span className="font-mono text-[10px] text-orange-500/60">Compared</span>
              </div>
            </div>
          </div>
        )}

        {/* Diff Output */}
        {diff.length > 0 && (
          <div className="mb-5 rounded-lg overflow-hidden border border-white/[0.08]">
            <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/[0.06]">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Diff Output</span>
              <span className="font-mono text-[10px] text-slate-700">{diff.length} lines total</span>
            </div>

            {viewMode === "split" ? (
              // ── Split view ─────────────────────────────────────────────
              <div className="grid grid-cols-2 divide-x divide-white/[0.06] overflow-x-auto">
                {/* OLD side */}
                <div className="min-w-0">
                  <div className="px-4 py-1.5 bg-red-500/[0.05] border-b border-white/[0.04]">
                    <span className="font-mono text-[10px] text-red-400/60 uppercase tracking-widest">Original</span>
                  </div>
                  <div className="font-mono text-xs leading-6">
                    {diff.map((line, i) => {
                      if (line.type === "added") {
                        return (
                          <div key={i} className="flex">
                            <span className="select-none w-10 shrink-0 text-right pr-3 text-slate-700 border-r border-white/[0.04] bg-white/[0.01]" />
                            <span className="flex-1 px-3 text-transparent select-none">{line.content || " "}</span>
                          </div>
                        );
                      }
                      const bg = line.type === "removed" ? "bg-red-500/10" : "";
                      const text = line.type === "removed" ? "text-red-300" : "text-slate-400";
                      const num = line.type === "removed" ? "text-red-500/50" : "text-slate-700";
                      return (
                        <div key={i} className={`flex ${bg}`}>
                          <span className={`select-none w-10 shrink-0 text-right pr-3 ${num} border-r border-white/[0.04] bg-white/[0.01]`}>{line.oldLine}</span>
                          <span className={`flex-1 px-3 ${text} whitespace-pre`}
                            dangerouslySetInnerHTML={{ __html: (line.type === "removed" ? "- " : "  ") + highlight(line.content) }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* NEW side */}
                <div className="min-w-0">
                  <div className="px-4 py-1.5 bg-emerald-500/[0.05] border-b border-white/[0.04]">
                    <span className="font-mono text-[10px] text-emerald-400/60 uppercase tracking-widest">Modified</span>
                  </div>
                  <div className="font-mono text-xs leading-6">
                    {diff.map((line, i) => {
                      if (line.type === "removed") {
                        return (
                          <div key={i} className="flex">
                            <span className="select-none w-10 shrink-0 text-right pr-3 text-slate-700 border-r border-white/[0.04] bg-white/[0.01]" />
                            <span className="flex-1 px-3 text-transparent select-none">{line.content || " "}</span>
                          </div>
                        );
                      }
                      const bg = line.type === "added" ? "bg-emerald-500/10" : "";
                      const text = line.type === "added" ? "text-emerald-300" : "text-slate-400";
                      const num = line.type === "added" ? "text-emerald-500/50" : "text-slate-700";
                      return (
                        <div key={i} className={`flex ${bg}`}>
                          <span className={`select-none w-10 shrink-0 text-right pr-3 ${num} border-r border-white/[0.04] bg-white/[0.01]`}>{line.newLine}</span>
                          <span className={`flex-1 px-3 ${text} whitespace-pre`}
                            dangerouslySetInnerHTML={{ __html: (line.type === "added" ? "+ " : "  ") + highlight(line.content) }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              // ── Unified view ───────────────────────────────────────────
              <div className="font-mono text-xs leading-6 overflow-x-auto">
                {diff.map((line, i) => {
                  const bg =
                    line.type === "added"   ? "bg-emerald-500/10" :
                    line.type === "removed" ? "bg-red-500/10"     : "";
                  const text =
                    line.type === "added"   ? "text-emerald-300" :
                    line.type === "removed" ? "text-red-300"     : "text-slate-400";
                  const prefix =
                    line.type === "added"   ? "+" :
                    line.type === "removed" ? "-" : " ";
                  const oldN = line.oldLine ?? "";
                  const newN = line.newLine ?? "";
                  return (
                    <div key={i} className={`flex ${bg}`}>
                      <span className="select-none w-10 shrink-0 text-right pr-2 text-slate-700 border-r border-white/[0.04] bg-white/[0.01]">{oldN}</span>
                      <span className="select-none w-10 shrink-0 text-right pr-2 text-slate-700 border-r border-white/[0.04] bg-white/[0.01]">{newN}</span>
                      <span className={`select-none w-5 shrink-0 text-center ${text}`}>{prefix}</span>
                      <span className={`flex-1 px-3 ${text} whitespace-pre`}
                        dangerouslySetInnerHTML={{ __html: highlight(line.content) }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {computed && diff.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 mb-5 border border-white/[0.06] rounded-lg bg-white/[0.02]">
            <span className="text-3xl mb-3">✓</span>
            <p className="font-mono text-sm text-slate-500">No differences found — both files are identical.</p>
          </div>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "🔍", title: "LCS Algorithm", desc: "Uses Longest Common Subsequence to produce minimal, accurate diffs — same approach as git diff." },
            { icon: "⊞", title: "Split & Unified", desc: "Switch between side-by-side split view and compact unified patch view." },
            { icon: "⚡", title: "Client-Side Only", desc: "No server upload — your code never leaves the browser. Fast, private, works offline." },
          ].map((c) => (
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