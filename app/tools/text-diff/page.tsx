"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useCallback, useRef } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
type DiffUnit = "word" | "char" | "line";
type ViewMode = "split" | "unified" | "inline";

type DiffSegment = { type: "equal" | "added" | "removed"; text: string };
type DiffLine    = { type: "equal" | "added" | "removed" | "modified"; oldLine: number | null; newLine: number | null; segments?: DiffSegment[]; text: string; oldText?: string; newText?: string };

// ── LCS diff engine ────────────────────────────────────────────────────────
function lcs<T>(a: T[], b: T[], eq: (x: T, y: T) => boolean): number[][] {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = eq(a[i], b[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  return dp;
}

function diffArrays<T>(a: T[], b: T[], eq: (x: T, y: T) => boolean): { type: "equal" | "added" | "removed"; value: T }[] {
  const dp = lcs(a, b, eq);
  const result: { type: "equal" | "added" | "removed"; value: T }[] = [];
  let i = 0, j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && eq(a[i], b[j])) {
      result.push({ type: "equal",   value: a[i++] }); j++;
    } else if (j < b.length && (i >= a.length || dp[i][j + 1] >= dp[i + 1][j])) {
      result.push({ type: "added",   value: b[j++] });
    } else {
      result.push({ type: "removed", value: a[i++] });
    }
  }
  return result;
}

// Inline char-level diff within a changed line
function inlineDiff(oldStr: string, newStr: string): { old: DiffSegment[]; new: DiffSegment[] } {
  const a = oldStr.split("");
  const b = newStr.split("");
  const raw = diffArrays(a, b, (x, y) => x === y);

  const oldSegs: DiffSegment[] = [];
  const newSegs: DiffSegment[] = [];

  raw.forEach(({ type, value }) => {
    if (type === "equal")   { oldSegs.push({ type: "equal",   text: value }); newSegs.push({ type: "equal",   text: value }); }
    if (type === "removed") { oldSegs.push({ type: "removed", text: value }); }
    if (type === "added")   { newSegs.push({ type: "added",   text: value }); }
  });

  // Merge consecutive segments of same type
  const merge = (segs: DiffSegment[]) => segs.reduce<DiffSegment[]>((acc, s) => {
    if (acc.length && acc[acc.length - 1].type === s.type) acc[acc.length - 1].text += s.text;
    else acc.push({ ...s });
    return acc;
  }, []);

  return { old: merge(oldSegs), new: merge(newSegs) };
}

// Line diff → DiffLine[]
function diffLines(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const raw = diffArrays(oldLines, newLines, (a, b) => a === b);

  const result: DiffLine[] = [];
  let oldN = 1, newN = 1;

  // Pair removed+added for inline highlighting
  const pending = raw.map((r, idx) => ({ ...r, idx }));
  let i = 0;
  while (i < pending.length) {
    const cur = pending[i];
    if (cur.type === "equal") {
      result.push({ type: "equal", oldLine: oldN++, newLine: newN++, text: cur.value });
      i++;
    } else if (cur.type === "removed" && i + 1 < pending.length && pending[i + 1].type === "added") {
      // Modified line — show inline diff
      const next = pending[i + 1];
      const { old: oldSegs, new: newSegs } = inlineDiff(cur.value, next.value);
      result.push({ type: "modified", oldLine: oldN++, newLine: null,   text: cur.value,  segments: oldSegs, oldText: cur.value, newText: next.value });
      result.push({ type: "modified", oldLine: null,   newLine: newN++, text: next.value, segments: newSegs, oldText: cur.value, newText: next.value });
      i += 2;
    } else if (cur.type === "removed") {
      result.push({ type: "removed", oldLine: oldN++, newLine: null,   text: cur.value });
      i++;
    } else {
      result.push({ type: "added",   oldLine: null,   newLine: newN++, text: cur.value });
      i++;
    }
  }
  return result;
}

// Word diff for inline view
function wordDiff(oldText: string, newText: string): DiffSegment[] {
  const a = oldText.split(/(\s+)/);
  const b = newText.split(/(\s+)/);
  const raw = diffArrays(a, b, (x, y) => x === y);
  return raw.map(r => ({ type: r.type, text: r.value }));
}

// ── Stats ──────────────────────────────────────────────────────────────────
function getStats(lines: DiffLine[]) {
  const added    = lines.filter(l => l.type === "added").length;
  const removed  = lines.filter(l => l.type === "removed").length;
  const modified = lines.filter(l => l.type === "modified" && l.newLine !== null).length;
  const equal    = lines.filter(l => l.type === "equal").length;
  return { added, removed, modified, equal };
}

// ── Render helpers ─────────────────────────────────────────────────────────
function SegmentSpan({ seg }: { seg: DiffSegment }) {
  if (seg.type === "equal")   return <span>{seg.text}</span>;
  if (seg.type === "added")   return <span className="bg-emerald-500/30 text-emerald-200 rounded-sm px-0.5">{seg.text}</span>;
  if (seg.type === "removed") return <span className="bg-red-500/30 text-red-200 rounded-sm px-0.5 line-through">{seg.text}</span>;
  return null;
}

// ── Examples ───────────────────────────────────────────────────────────────
const EXAMPLE_OLD = `function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }
  console.log("Total:", total);
  return total;
}

const TAX_RATE = 0.08;

function applyTax(amount) {
  return amount + (amount * TAX_RATE);
}`;

const EXAMPLE_NEW = `function calculateTotal(items, discount = 0) {
  const total = items.reduce((sum, item) => sum + item.price, 0);
  return total * (1 - discount);
}

const TAX_RATE = 0.1;
const MAX_DISCOUNT = 0.5;

function applyTax(amount, region = "default") {
  const rate = region === "EU" ? 0.2 : TAX_RATE;
  return amount * (1 + rate);
}

function formatCurrency(amount, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}`;

// ── Component ──────────────────────────────────────────────────────────────
export default function TextDiff() {
  const [oldText, setOldText] = useState("");
  const [newText, setNewText] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [diffUnit, setDiffUnit] = useState<DiffUnit>("line");
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [copied, setCopied]   = useState<string | null>(null);
  const [computed, setComputed] = useState(false);
  const [diffLines_, setDiffLines_] = useState<DiffLine[]>([]);
  const oldFileRef = useRef<HTMLInputElement>(null);
  const newFileRef = useRef<HTMLInputElement>(null);

  const normalize = useCallback((t: string) => {
    let s = t;
    if (ignoreCase) s = s.toLowerCase();
    if (ignoreWhitespace) s = s.replace(/[ \t]+/g, " ").replace(/^ | $/gm, "");
    return s;
  }, [ignoreCase, ignoreWhitespace]);

  const runDiff = useCallback((old = oldText, newer = newText) => {
    if (!old && !newer) { setDiffLines_([]); setComputed(false); return; }
    setDiffLines_(diffLines(normalize(old), normalize(newer)));
    setComputed(true);
  }, [oldText, newText, normalize]);

  const handleOld = (v: string) => { setOldText(v); if (computed) runDiff(v, newText); };
  const handleNew = (v: string) => { setNewText(v); if (computed) runDiff(oldText, v); };

  const handleLoadExample = () => {
    setOldText(EXAMPLE_OLD); setNewText(EXAMPLE_NEW);
    setDiffLines_(diffLines(normalize(EXAMPLE_OLD), normalize(EXAMPLE_NEW)));
    setComputed(true);
  };

  const handleClear = () => { setOldText(""); setNewText(""); setDiffLines_([]); setComputed(false); };

  const handleFile = (side: "old" | "new") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      if (side === "old") { setOldText(text); if (computed) runDiff(text, newText); }
      else { setNewText(text); if (computed) runDiff(oldText, text); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1600);
  };

  const exportPatch = () => {
    const lines = diffLines_.map(l => {
      if (l.type === "equal")    return `  ${l.text}`;
      if (l.type === "removed" || (l.type === "modified" && l.oldLine !== null && l.newLine === null)) return `- ${l.text}`;
      if (l.type === "added"   || (l.type === "modified" && l.newLine !== null && l.oldLine === null)) return `+ ${l.text}`;
      return `  ${l.text}`;
    }).join("\n");
    copy(lines, "patch");
  };

  const stats = computed ? getStats(diffLines_) : null;

  // ── Split view rendering ──────────────────────────────────────────────────
  const renderSplitView = () => {
    const oldSide: DiffLine[] = [];
    const newSide: DiffLine[] = [];

    diffLines_.forEach(l => {
      if (l.type === "equal")    { oldSide.push(l);          newSide.push(l); }
      else if (l.type === "modified") {
        if (l.oldLine !== null)  { oldSide.push(l);          newSide.push({ ...l, text: "", oldLine: null }); }
        else                     { oldSide.push({ ...l, text: "", newLine: null }); newSide.push(l); }
      }
      else if (l.type === "removed") { oldSide.push(l);      newSide.push({ type: "equal", oldLine: null, newLine: null, text: "\u00A0" }); }
      else                           { oldSide.push({ type: "equal", oldLine: null, newLine: null, text: "\u00A0" }); newSide.push(l); }
    });

    // Pair them back up by index
    const paired = diffLines_.reduce<{ old: DiffLine | null; new: DiffLine | null }[]>((acc, l) => {
      if (l.type === "equal")   acc.push({ old: l, new: l });
      else if (l.type === "removed") acc.push({ old: l, new: null });
      else if (l.type === "added")   acc.push({ old: null, new: l });
      else if (l.type === "modified") {
        if (l.oldLine !== null) { if (acc.length && acc[acc.length - 1].new === null && acc[acc.length - 1].old?.type === "modified") acc[acc.length - 1].new = l; else acc.push({ old: l, new: null }); }
        else { if (acc.length && acc[acc.length - 1].new === null) acc[acc.length - 1].new = l; else acc.push({ old: null, new: l }); }
      }
      return acc;
    }, []);

    return (
      <div className="grid grid-cols-2 divide-x divide-white/[0.06] overflow-x-auto">
        {/* Old */}
        <div>
          <div className="px-4 py-1.5 bg-red-500/[0.06] border-b border-white/[0.04]">
            <span className="font-mono text-[10px] text-red-400/70 uppercase tracking-widest">Original</span>
          </div>
          <div className="font-mono text-xs leading-6">
            {diffLines_.filter(l => l.type !== "added" && !(l.type === "modified" && l.oldLine === null)).map((l, i) => {
              const isRm  = l.type === "removed";
              const isMod = l.type === "modified" && l.oldLine !== null;
              const bg    = isRm || isMod ? "bg-red-500/10" : "";
              const numCl = isRm || isMod ? "text-red-500/50" : "text-slate-700";
              return (
                <div key={i} className={`flex ${bg}`}>
                  <span className={`select-none w-10 shrink-0 text-right pr-3 ${numCl} border-r border-white/[0.04] bg-white/[0.01]`}>{l.oldLine ?? ""}</span>
                  <span className="flex-1 px-3 whitespace-pre text-slate-400">
                    {isMod && l.segments
                      ? l.segments.map((s, j) => <SegmentSpan key={j} seg={s} />)
                      : <span className={isRm ? "text-red-300" : ""}>{l.text}</span>
                    }
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        {/* New */}
        <div>
          <div className="px-4 py-1.5 bg-emerald-500/[0.06] border-b border-white/[0.04]">
            <span className="font-mono text-[10px] text-emerald-400/70 uppercase tracking-widest">Modified</span>
          </div>
          <div className="font-mono text-xs leading-6">
            {diffLines_.filter(l => l.type !== "removed" && !(l.type === "modified" && l.newLine === null)).map((l, i) => {
              const isAdd = l.type === "added";
              const isMod = l.type === "modified" && l.newLine !== null;
              const bg    = isAdd || isMod ? "bg-emerald-500/10" : "";
              const numCl = isAdd || isMod ? "text-emerald-500/50" : "text-slate-700";
              return (
                <div key={i} className={`flex ${bg}`}>
                  <span className={`select-none w-10 shrink-0 text-right pr-3 ${numCl} border-r border-white/[0.04] bg-white/[0.01]`}>{l.newLine ?? ""}</span>
                  <span className="flex-1 px-3 whitespace-pre text-slate-400">
                    {isMod && l.segments
                      ? l.segments.map((s, j) => <SegmentSpan key={j} seg={s} />)
                      : <span className={isAdd ? "text-emerald-300" : ""}>{l.text}</span>
                    }
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ── Unified view ──────────────────────────────────────────────────────────
  const renderUnifiedView = () => (
    <div className="font-mono text-xs leading-6 overflow-x-auto">
      {diffLines_.map((l, i) => {
        const isAdd  = l.type === "added";
        const isRm   = l.type === "removed";
        const isMod  = l.type === "modified";
        const isModOld = isMod && l.oldLine !== null && l.newLine === null;
        const isModNew = isMod && l.newLine !== null && l.oldLine === null;
        const bg = isAdd || isModNew ? "bg-emerald-500/10" : isRm || isModOld ? "bg-red-500/10" : "";
        const prefix = isAdd || isModNew ? "+" : isRm || isModOld ? "-" : " ";
        const textCl = isAdd || isModNew ? "text-emerald-300" : isRm || isModOld ? "text-red-300" : "text-slate-400";
        const oldN = l.oldLine ?? "";
        const newN = l.newLine ?? "";

        return (
          <div key={i} className={`flex ${bg}`}>
            <span className="select-none w-10 shrink-0 text-right pr-2 text-slate-700 border-r border-white/[0.04] bg-white/[0.01]">{oldN}</span>
            <span className="select-none w-10 shrink-0 text-right pr-2 text-slate-700 border-r border-white/[0.04] bg-white/[0.01]">{newN}</span>
            <span className={`select-none w-5 shrink-0 text-center ${textCl}`}>{prefix}</span>
            <span className={`flex-1 px-3 whitespace-pre ${textCl}`}>
              {(isMod && l.segments)
                ? l.segments.map((s, j) => <SegmentSpan key={j} seg={s} />)
                : l.text
              }
            </span>
          </div>
        );
      })}
    </div>
  );

  // ── Inline (word-level) view ───────────────────────────────────────────────
  const renderInlineView = () => {
    const segments = wordDiff(normalize(oldText), normalize(newText));
    return (
      <div className="p-4 font-mono text-sm leading-7 whitespace-pre-wrap text-slate-300">
        {segments.map((s, i) => {
          if (s.type === "equal")   return <span key={i}>{s.text}</span>;
          if (s.type === "removed") return <span key={i} className="bg-red-500/25 text-red-200 rounded px-0.5 line-through decoration-red-400">{s.text}</span>;
          if (s.type === "added")   return <span key={i} className="bg-emerald-500/25 text-emerald-200 rounded px-0.5">{s.text}</span>;
          return null;
        })}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      {/* BG */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-orange-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

      <ToolNavbar toolName="Text Diff" />

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-orange-500/10 flex items-center justify-center font-mono font-bold text-orange-400 text-sm">±</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Text Diff</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded">client-side</span>
          </div>
          <p className="text-slate-500 text-sm">
            Compare two texts side-by-side with line-level and inline char/word diff highlighting.
          </p>
        </div>

        {/* Options bar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">

          {/* View mode */}
          <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-md px-1.5 py-1.5">
            {([
              { key: "split",   label: "⊞ Split"   },
              { key: "unified", label: "☰ Unified" },
              { key: "inline",  label: "✍ Inline"  },
            ] as { key: ViewMode; label: string }[]).map(v => (
              <button key={v.key} onClick={() => setViewMode(v.key)}
                className={`font-mono text-xs px-3 py-0.5 rounded transition-all
                  ${viewMode === v.key ? "bg-orange-500/20 text-orange-400" : "text-slate-500 hover:text-slate-300"}`}>
                {v.label}
              </button>
            ))}
          </div>

          {/* Options toggles */}
          {[
            { label: "Ignore Case",       val: ignoreCase,       set: setIgnoreCase       },
            { label: "Ignore Whitespace", val: ignoreWhitespace, set: setIgnoreWhitespace },
          ].map(({ label, val, set }) => (
            <label key={label} onClick={() => { set(p => !p); if (computed) setTimeout(() => runDiff(), 0); }}
              className="flex items-center gap-2 cursor-pointer group bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-1.5">
              <div className={`w-8 h-4 rounded-full transition-all relative ${val ? "bg-orange-500" : "bg-white/10"}`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${val ? "left-4" : "left-0.5"}`} />
              </div>
              <span className="font-mono text-xs text-slate-500 group-hover:text-slate-300 transition-colors">{label}</span>
            </label>
          ))}

          <div className="ml-auto flex gap-2">
            {computed && (
              <button onClick={exportPatch}
                className={`font-mono text-xs px-3 py-1.5 border rounded-md transition-all
                  ${copied === "patch" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300 hover:border-white/20"}`}>
                {copied === "patch" ? "✓ Copied!" : "Copy Patch"}
              </button>
            )}
            <button onClick={handleLoadExample}
              className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-slate-300 hover:border-white/20 transition-all">
              Load Example
            </button>
            <button onClick={handleClear}
              className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-red-400 hover:border-red-500/30 transition-all">
              Clear
            </button>
          </div>
        </div>

        {/* Input panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
          {[
            { label: "Original Text", val: oldText, set: handleOld, ref: oldFileRef, fileHandler: handleFile("old"), accent: "red"     },
            { label: "Modified Text", val: newText, set: handleNew, ref: newFileRef, fileHandler: handleFile("new"), accent: "emerald" },
          ].map(({ label, val, set, ref, fileHandler, accent }) => (
            <div key={label} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">{label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-slate-700">{val.split("\n").length} lines</span>
                  <button onClick={() => ref.current?.click()}
                    className="font-mono text-[10px] px-2 py-0.5 rounded border border-white/[0.08] text-slate-600 hover:text-slate-400 transition-all">
                    Upload
                  </button>
                  <input type="file" accept=".txt,.md,.js,.ts,.json,.html,.css,.py,.go,.rs" ref={ref} onChange={fileHandler} className="hidden" />
                </div>
              </div>
              <textarea
                value={val}
                onChange={e => set(e.target.value)}
                placeholder={label === "Original Text" ? "Paste original text here…" : "Paste modified text here…"}
                spellCheck={false}
                className={`w-full h-52 font-mono text-xs bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-slate-300 placeholder-slate-700 outline-none resize-none leading-relaxed transition-colors focus:border-${accent}-500/30`}
              />
            </div>
          ))}
        </div>

        {/* Compare button */}
        <div className="flex justify-center mb-6">
          <button onClick={() => runDiff()}
            disabled={!oldText && !newText}
            className="font-mono text-sm px-10 py-2.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-lg hover:bg-orange-500/20 hover:border-orange-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold">
            ⇄ Compare
          </button>
        </div>

        {/* Stats bar */}
        {stats && (
          <div className="flex flex-wrap gap-6 px-4 py-3 bg-orange-500/[0.05] border border-orange-500/20 rounded-lg mb-5">
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Added</span><span className="font-mono text-sm text-emerald-400">+{stats.added}</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Removed</span><span className="font-mono text-sm text-red-400">-{stats.removed}</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Modified</span><span className="font-mono text-sm text-yellow-400">~{stats.modified}</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Unchanged</span><span className="font-mono text-sm text-slate-400">{stats.equal}</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Total Lines</span><span className="font-mono text-sm text-orange-400">{stats.added + stats.removed + stats.modified + stats.equal}</span></div>
            <div className="ml-auto flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                <span className="font-mono text-[10px] text-orange-500/60">
                  {viewMode === "split" ? "Split" : viewMode === "unified" ? "Unified" : "Inline"} · {ignoreCase ? "Case-insensitive" : "Case-sensitive"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Diff output */}
        {computed && diffLines_.length > 0 && (
          <div className="rounded-lg overflow-hidden border border-white/[0.08] mb-5">
            <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/[0.06]">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Diff Output</span>
              <div className="flex items-center gap-3">
                <div className="flex gap-3 font-mono text-[10px]">
                  <span className="text-emerald-400">■ Added</span>
                  <span className="text-red-400">■ Removed</span>
                  <span className="text-yellow-400">■ Modified</span>
                </div>
              </div>
            </div>
            {viewMode === "split"   && renderSplitView()}
            {viewMode === "unified" && renderUnifiedView()}
            {viewMode === "inline"  && renderInlineView()}
          </div>
        )}

        {/* Identical */}
        {computed && diffLines_.every(l => l.type === "equal") && (
          <div className="flex flex-col items-center justify-center py-14 mb-5 border border-white/[0.06] rounded-lg bg-white/[0.02]">
            <span className="text-4xl mb-3">✓</span>
            <p className="font-mono text-sm text-slate-500">Texts are identical — no differences found.</p>
          </div>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "⊞", title: "3 View Modes",      desc: "Split side-by-side, unified patch view, or inline word-level diff — switch anytime." },
            { icon: "🔍", title: "Inline Char Diff",  desc: "Modified lines show exact character-level changes highlighted within each line." },
            { icon: "⚙️", title: "Diff Options",      desc: "Ignore case and/or whitespace to focus on meaningful content changes only." },
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