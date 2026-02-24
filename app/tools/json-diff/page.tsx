"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useCallback } from "react";

// ── Deep diff engine ──────────────────────────────────────────
type DiffType = "added" | "removed" | "changed" | "unchanged";

interface DiffNode {
  key: string;
  path: string;
  type: DiffType;
  leftVal?: unknown;
  rightVal?: unknown;
  children?: DiffNode[];
}

function typeOf(val: unknown): string {
  if (val === null) return "null";
  if (Array.isArray(val)) return "array";
  return typeof val;
}

function isPrimitive(val: unknown): boolean {
  return val === null || typeof val !== "object";
}

function deepDiff(left: unknown, right: unknown, path = "", key = "root"): DiffNode {
  const lType = typeOf(left);
  const rType = typeOf(right);

  // Both primitives or different types
  if (isPrimitive(left) && isPrimitive(right)) {
    return {
      key, path,
      type: left === right ? "unchanged" : "changed",
      leftVal: left, rightVal: right,
    };
  }

  if (lType !== rType) {
    return { key, path, type: "changed", leftVal: left, rightVal: right };
  }

  // Both arrays
  if (lType === "array") {
    const lArr = left as unknown[];
    const rArr = right as unknown[];
    const len = Math.max(lArr.length, rArr.length);
    const children: DiffNode[] = [];
    let hasChange = false;
    for (let i = 0; i < len; i++) {
      const childPath = `${path}[${i}]`;
      if (i >= lArr.length) {
        children.push({ key: `[${i}]`, path: childPath, type: "added", rightVal: rArr[i] });
        hasChange = true;
      } else if (i >= rArr.length) {
        children.push({ key: `[${i}]`, path: childPath, type: "removed", leftVal: lArr[i] });
        hasChange = true;
      } else {
        const child = deepDiff(lArr[i], rArr[i], childPath, `[${i}]`);
        if (child.type !== "unchanged") hasChange = true;
        children.push(child);
      }
    }
    return { key, path, type: hasChange ? "changed" : "unchanged", children };
  }

  // Both objects
  const lObj = left as Record<string, unknown>;
  const rObj = right as Record<string, unknown>;
  const allKeys = Array.from(new Set([...Object.keys(lObj), ...Object.keys(rObj)]));
  const children: DiffNode[] = [];
  let hasChange = false;

  for (const k of allKeys) {
    const childPath = path ? `${path}.${k}` : k;
    if (!(k in lObj)) {
      children.push({ key: k, path: childPath, type: "added", rightVal: rObj[k] });
      hasChange = true;
    } else if (!(k in rObj)) {
      children.push({ key: k, path: childPath, type: "removed", leftVal: lObj[k] });
      hasChange = true;
    } else {
      const child = deepDiff(lObj[k], rObj[k], childPath, k);
      if (child.type !== "unchanged") hasChange = true;
      children.push(child);
    }
  }

  return { key, path, type: hasChange ? "changed" : "unchanged", children };
}

function countDiffs(node: DiffNode): { added: number; removed: number; changed: number } {
  const acc = { added: 0, removed: 0, changed: 0 };
  const walk = (n: DiffNode) => {
    if (!n.children) {
      if (n.type === "added") acc.added++;
      else if (n.type === "removed") acc.removed++;
      else if (n.type === "changed") acc.changed++;
    } else {
      n.children.forEach(walk);
    }
  };
  walk(node);
  return acc;
}

// ── Rendering helpers ─────────────────────────────────────────
function formatVal(val: unknown): string {
  if (val === null) return "null";
  if (typeof val === "string") return `"${val}"`;
  if (typeof val === "object") return Array.isArray(val) ? `[…${(val as unknown[]).length}]` : `{…${Object.keys(val as object).length}}`;
  return String(val);
}

const TYPE_STYLES: Record<DiffType, string> = {
  added: "bg-emerald-500/10 border-l-2 border-emerald-500",
  removed: "bg-red-500/10 border-l-2 border-red-500",
  changed: "bg-yellow-500/10 border-l-2 border-yellow-500",
  unchanged: "",
};

const TYPE_BADGE: Record<DiffType, string> = {
  added: "text-emerald-400 bg-emerald-500/10",
  removed: "text-red-400 bg-red-500/10",
  changed: "text-yellow-400 bg-yellow-500/10",
  unchanged: "text-slate-600 bg-white/[0.04]",
};

const TYPE_LABEL: Record<DiffType, string> = {
  added: "+ added",
  removed: "− removed",
  changed: "~ changed",
  unchanged: "= same",
};

interface DiffNodeProps {
  node: DiffNode;
  depth: number;
  hideUnchanged: boolean;
}

function DiffNodeView({ node, depth, hideUnchanged }: DiffNodeProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pad = depth * 16;
  const hasChildren = node.children && node.children.length > 0;

  if (hideUnchanged && node.type === "unchanged" && !hasChildren) return null;

  return (
    <div>
      <div
        className={`flex items-start gap-2 px-4 py-1.5 rounded-sm transition-colors ${TYPE_STYLES[node.type]} ${hasChildren ? "cursor-pointer hover:bg-white/[0.02]" : ""}`}
        style={{ paddingLeft: `${pad + 16}px` }}
        onClick={() => hasChildren && setCollapsed(!collapsed)}
      >
        {/* Expand/collapse */}
        {hasChildren && (
          <span className="font-mono text-[10px] text-slate-600 mt-0.5 w-3 shrink-0 select-none">
            {collapsed ? "▶" : "▼"}
          </span>
        )}
        {!hasChildren && <span className="w-3 shrink-0" />}

        {/* Key */}
        <span className="font-mono text-sm text-slate-400 shrink-0">{node.key}</span>

        {/* Value */}
        {!hasChildren && node.type === "changed" && (
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            <span className="font-mono text-xs bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded line-through">{formatVal(node.leftVal)}</span>
            <span className="text-slate-600 text-xs">→</span>
            <span className="font-mono text-xs bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">{formatVal(node.rightVal)}</span>
          </div>
        )}
        {!hasChildren && node.type === "added" && (
          <span className="font-mono text-xs text-emerald-400 ml-2">{formatVal(node.rightVal)}</span>
        )}
        {!hasChildren && node.type === "removed" && (
          <span className="font-mono text-xs text-red-400 ml-2 line-through">{formatVal(node.leftVal)}</span>
        )}
        {!hasChildren && node.type === "unchanged" && (
          <span className="font-mono text-xs text-slate-600 ml-2">{formatVal(node.leftVal)}</span>
        )}

        {/* Badge */}
        <span className={`ml-auto font-mono text-[10px] px-2 py-0.5 rounded shrink-0 ${TYPE_BADGE[node.type]}`}>
          {TYPE_LABEL[node.type]}
        </span>
      </div>

      {/* Children */}
      {hasChildren && !collapsed && (
        <div>
          {node.children!.map((child, i) => (
            <DiffNodeView key={i} node={child} depth={depth + 1} hideUnchanged={hideUnchanged} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Side by side line diff ────────────────────────────────────
function SideBySide({ left, right }: { left: string; right: string }) {
  const leftLines = left.split("\n");
  const rightLines = right.split("\n");
  const len = Math.max(leftLines.length, rightLines.length);

  return (
    <div className="grid grid-cols-2 divide-x divide-white/[0.06] font-mono text-xs overflow-x-auto">
      <div>
        {Array.from({ length: len }, (_, i) => {
          const line = leftLines[i] ?? "";
          const rLine = rightLines[i] ?? "";
          const diff = line !== rLine;
          return (
            <div key={i} className={`flex gap-3 px-3 py-0.5 ${diff ? (line ? "bg-red-500/10" : "") : ""}`}>
              <span className="text-slate-700 w-6 text-right shrink-0 select-none">{i + 1}</span>
              <span className={diff && line ? "text-red-300" : "text-slate-500"}>{line}</span>
            </div>
          );
        })}
      </div>
      <div>
        {Array.from({ length: len }, (_, i) => {
          const line = rightLines[i] ?? "";
          const lLine = leftLines[i] ?? "";
          const diff = line !== lLine;
          return (
            <div key={i} className={`flex gap-3 px-3 py-0.5 ${diff ? (line ? "bg-emerald-500/10" : "") : ""}`}>
              <span className="text-slate-700 w-6 text-right shrink-0 select-none">{i + 1}</span>
              <span className={diff && line ? "text-emerald-300" : "text-slate-500"}>{line}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Examples ──────────────────────────────────────────────────
const EXAMPLE_LEFT = `{
  "name": "use2codingtools",
  "version": "1.0.0",
  "active": true,
  "tags": ["developer", "tools"],
  "author": {
    "name": "Dev Bhai",
    "email": "dev@old.com"
  },
  "deprecated": true
}`;

const EXAMPLE_RIGHT = `{
  "name": "use2codingtools",
  "version": "2.0.0",
  "active": true,
  "tags": ["developer", "tools", "free"],
  "author": {
    "name": "Dev Bhai",
    "email": "dev@use2codingtools.com"
  },
  "homepage": "https://use2codingtools.com"
}`;

type ViewMode = "tree" | "sidebyside";

export default function JsonDiff() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [leftErr, setLeftErr] = useState("");
  const [rightErr, setRightErr] = useState("");
  const [diffResult, setDiffResult] = useState<DiffNode | null>(null);
  const [hideUnchanged, setHideUnchanged] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("tree");
  const [counts, setCounts] = useState({ added: 0, removed: 0, changed: 0 });

  const runDiff = useCallback((l: string, r: string) => {
    setDiffResult(null);
    let lParsed: unknown, rParsed: unknown;
    let ok = true;

    try { lParsed = JSON.parse(l); setLeftErr(""); }
    catch (e: unknown) { setLeftErr((e as Error).message); ok = false; }

    try { rParsed = JSON.parse(r); setRightErr(""); }
    catch (e: unknown) { setRightErr((e as Error).message); ok = false; }

    if (!ok || !l.trim() || !r.trim()) return;

    const result = deepDiff(lParsed, rParsed, "", "root");
    setDiffResult(result);
    setCounts(countDiffs(result));
  }, []);

  const handleLeft = (val: string) => { setLeft(val); runDiff(val, right); };
  const handleRight = (val: string) => { setRight(val); runDiff(left, val); };

  const handleSwap = () => {
    setLeft(right); setRight(left);
    runDiff(right, left);
  };

  const loadExample = () => {
    setLeft(EXAMPLE_LEFT); setRight(EXAMPLE_RIGHT);
    runDiff(EXAMPLE_LEFT, EXAMPLE_RIGHT);
  };

  const identical = diffResult?.type === "unchanged";

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -left-48 w-[500px] h-[500px] rounded-full bg-yellow-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -right-48 w-[400px] h-[400px] rounded-full bg-red-500/[0.04] blur-3xl pointer-events-none" />

      {/* NAV */}

        <ToolNavbar toolName="JSON Diff Checker" />
    
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-yellow-500/10 flex items-center justify-center font-mono font-bold text-yellow-400 text-sm">⇄</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">JSON Diff Checker</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded">client-side</span>
          </div>
          <p className="text-slate-500 text-sm">Compare two JSON objects side by side. See added, removed, and changed fields highlighted clearly.</p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {/* View toggle */}
          <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-md p-1 gap-1">
            {([["tree", "🌲 Tree"], ["sidebyside", "⇔ Side by Side"]] as [ViewMode, string][]).map(([v, label]) => (
              <button key={v} onClick={() => setViewMode(v)}
                className={`font-mono text-xs px-4 py-1.5 rounded transition-all ${viewMode === v ? "bg-yellow-500/20 text-yellow-400" : "text-slate-500 hover:text-slate-300"}`}>
                {label}
              </button>
            ))}
          </div>

          {viewMode === "tree" && (
            <label onClick={() => setHideUnchanged(!hideUnchanged)} className="flex items-center gap-2 cursor-pointer bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-1.5">
              <div className={`w-8 h-4 rounded-full transition-all relative ${hideUnchanged ? "bg-yellow-500" : "bg-white/10"}`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${hideUnchanged ? "left-4" : "left-0.5"}`} />
              </div>
              <span className="font-mono text-xs text-slate-500 hover:text-slate-300">Hide unchanged</span>
            </label>
          )}

          <div className="ml-auto flex gap-2">
            <button onClick={loadExample} className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-slate-300 hover:border-white/20 transition-all">Load Example</button>
            <button onClick={handleSwap} disabled={!left && !right} className="font-mono text-xs px-3 py-1.5 border border-yellow-500/30 text-yellow-500 rounded-md hover:bg-yellow-500/10 transition-all disabled:opacity-30">⇄ Swap</button>
            <button onClick={() => { setLeft(""); setRight(""); setDiffResult(null); setLeftErr(""); setRightErr(""); }} className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-red-400 hover:border-red-500/30 transition-all">Clear</button>
          </div>
        </div>

        {/* Input panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
          {[
            { label: "Left (Original)", val: left, err: leftErr, onChange: handleLeft, color: "red" },
            { label: "Right (Modified)", val: right, err: rightErr, onChange: handleRight, color: "emerald" },
          ].map(({ label, val, err, onChange, color }) => (
            <div key={label} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">{label}</span>
                <span className="font-mono text-[10px] text-slate-700">{val.length} chars</span>
              </div>
              <div className="relative">
                <textarea value={val} onChange={(e) => onChange(e.target.value)}
                  placeholder={'{\n  "paste": "your JSON here"\n}'}
                  spellCheck={false}
                  className={`w-full h-64 font-mono text-sm bg-white/[0.03] border rounded-lg p-4 text-slate-300 placeholder-slate-700 outline-none resize-none transition-colors leading-relaxed ${
                    err ? "border-red-500/40" : `border-white/[0.08] focus:border-${color}-500/40`
                  }`}
                />
                {err && (
                  <div className="absolute bottom-3 left-3 right-3 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2 flex gap-2">
                    <span className="text-red-400 text-xs mt-0.5 shrink-0">✕</span>
                    <span className="font-mono text-xs text-red-400 leading-relaxed truncate">{err}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary bar */}
        {diffResult && (
          <div className={`flex flex-wrap items-center gap-4 px-5 py-3 rounded-lg border mb-5 ${
            identical ? "bg-emerald-500/[0.05] border-emerald-500/20" : "bg-white/[0.03] border-white/[0.08]"
          }`}>
            {identical ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-mono text-sm text-emerald-400 font-bold">✓ Identical — no differences found</span>
              </div>
            ) : (
              <>
                <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mr-2">Diff Summary</span>
                {counts.added > 0 && <span className="font-mono text-sm px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-md">+{counts.added} added</span>}
                {counts.removed > 0 && <span className="font-mono text-sm px-3 py-1 bg-red-500/10 text-red-400 rounded-md">−{counts.removed} removed</span>}
                {counts.changed > 0 && <span className="font-mono text-sm px-3 py-1 bg-yellow-500/10 text-yellow-400 rounded-md">~{counts.changed} changed</span>}
              </>
            )}
          </div>
        )}

        {/* Diff result */}
        {diffResult && !identical && (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden mb-8">
            <div className="flex items-center gap-4 px-5 py-3 border-b border-white/[0.06]">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">
                {viewMode === "tree" ? "Tree View" : "Side by Side"}
              </span>
              <div className="flex items-center gap-3 ml-auto">
                {[
                  { color: "bg-emerald-500", label: "Added" },
                  { color: "bg-red-500", label: "Removed" },
                  { color: "bg-yellow-500", label: "Changed" },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${l.color}`} />
                    <span className="font-mono text-[10px] text-slate-600">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {viewMode === "tree" ? (
              <div className="py-2 overflow-auto max-h-[520px]">
                {diffResult.children?.map((child, i) => (
                  <DiffNodeView key={i} node={child} depth={0} hideUnchanged={hideUnchanged} />
                )) ?? <DiffNodeView node={diffResult} depth={0} hideUnchanged={hideUnchanged} />}
              </div>
            ) : (
              <div className="overflow-auto max-h-[520px]">
                <div className="grid grid-cols-2 border-b border-white/[0.06]">
                  <div className="px-4 py-2 font-mono text-[11px] text-red-400 uppercase tracking-widest border-r border-white/[0.06]">Left (Original)</div>
                  <div className="px-4 py-2 font-mono text-[11px] text-emerald-400 uppercase tracking-widest">Right (Modified)</div>
                </div>
                <SideBySide
                  left={JSON.stringify(JSON.parse(left), null, 2)}
                  right={JSON.stringify(JSON.parse(right), null, 2)}
                />
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!diffResult && !leftErr && !rightErr && (
          <div className="text-center py-16 border border-dashed border-white/[0.06] rounded-xl mb-8">
            <div className="text-4xl mb-4">⇄</div>
            <p className="font-mono text-sm text-slate-600">Paste JSON in both panels to compare</p>
            <button onClick={loadExample} className="mt-4 font-mono text-xs px-4 py-2 border border-yellow-500/30 text-yellow-500 rounded-md hover:bg-yellow-500/10 transition-all">Load Example →</button>
          </div>
        )}

        {/* Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "🌲", title: "Tree View", desc: "Navigate nested diffs in a collapsible tree. Expand/collapse any node." },
            { icon: "⇔", title: "Side by Side", desc: "Line-by-line comparison with red/green highlights for changes." },
            { icon: "🔍", title: "Hide Unchanged", desc: "Filter out identical fields and focus only on what actually changed." },
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