"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useMemo } from "react";

export default function DuplicateRemover() {
  const [inputText, setInputText] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [preserveOrder, setPreserveOrder] = useState(true); // true = original order, false = sorted
  const [splitBy, setSplitBy] = useState<"lines" | "comma">("lines");
  const [copied, setCopied] = useState(false);

  const processText = useMemo(() => {
    if (!inputText.trim()) return { unique: "", countOriginal: 0, countUnique: 0, removed: 0 };

    let items: string[] = [];
    if (splitBy === "lines") {
      items = inputText.split(/\r?\n/).filter(line => line.trim() !== "");
    } else {
      items = inputText.split(",").map(item => item.trim()).filter(item => item !== "");
    }

    const seen = new Set<string>();
    const uniqueItems: string[] = [];

    items.forEach(item => {
      const key = caseSensitive ? item : item.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueItems.push(item);
      }
    });

    let output = "";
    if (preserveOrder) {
      output = uniqueItems.join(splitBy === "lines" ? "\n" : ", ");
    } else {
      output = [...new Set(items)].sort().join(splitBy === "lines" ? "\n" : ", ");
    }

    return {
      unique: output,
      countOriginal: items.length,
      countUnique: uniqueItems.length,
      removed: items.length - uniqueItems.length,
    };
  }, [inputText, caseSensitive, preserveOrder, splitBy]);

  const copyOutput = () => {
    if (processText.unique) {
      navigator.clipboard.writeText(processText.unique);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const downloadOutput = () => {
    if (processText.unique) {
      const blob = new Blob([processText.unique], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `unique-text.${splitBy === "lines" ? "txt" : "csv"}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-cyan-500/[0.04] blur-3xl pointer-events-none" />

      <ToolNavbar toolName="Duplicate Remover" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center font-mono font-bold text-emerald-400 text-lg">🧹</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Duplicate Remover</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">clean your lists fast</span>
          </div>
          <p className="text-slate-500 text-sm">Remove duplicate lines, words, or comma-separated items from text. Case-sensitive option + preserve order.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <div className="flex flex-col gap-4">
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
              <div className="p-4 border-b border-white/[0.08] bg-white/[0.02] flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-mono">Split by:</label>
                  <select
                    value={splitBy}
                    onChange={e => setSplitBy(e.target.value as "lines" | "comma")}
                    className="bg-[#0f0f1a] border border-white/[0.12] rounded px-3 py-1.5 text-xs font-mono text-emerald-300"
                  >
                    <option value="lines">Lines (↵)</option>
                    <option value="comma">Comma (,)</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 text-xs font-mono">
                  <input
                    type="checkbox"
                    checked={caseSensitive}
                    onChange={e => setCaseSensitive(e.target.checked)}
                    className="h-4 w-4 bg-transparent border-white/[0.3] rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  Case Sensitive
                </label>

                <label className="flex items-center gap-2 text-xs font-mono">
                  <input
                    type="checkbox"
                    checked={preserveOrder}
                    onChange={e => setPreserveOrder(e.target.checked)}
                    className="h-4 w-4 bg-transparent border-white/[0.3] rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  Preserve Original Order
                </label>
              </div>

              <textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Paste your text here...&#10;apple&#10;banana&#10;apple&#10;cherry"
                className="w-full h-96 p-6 bg-transparent font-mono text-sm text-slate-200 outline-none resize-none"
                spellCheck={false}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={copyOutput}
                disabled={!processText.unique}
                className={`flex-1 font-mono py-3 rounded-lg border transition ${
                  copied
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                    : "border-white/[0.1] text-slate-300 hover:text-emerald-300 hover:border-emerald-500/30 disabled:opacity-50"
                }`}
              >
                {copied ? "✓ Copied!" : "Copy Unique Text"}
              </button>

              <button
                onClick={downloadOutput}
                disabled={!processText.unique}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-mono py-3 rounded-lg transition disabled:opacity-50"
              >
                Download
              </button>
            </div>
          </div>

          {/* Output */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-emerald-400">Unique Output</span>
              <div className="text-xs text-slate-500">
                Original: <span className="text-slate-300">{processText.countOriginal}</span> | 
                Unique: <span className="text-emerald-400">{processText.countUnique}</span> | 
                Removed: <span className="text-orange-400">{processText.removed}</span>
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 font-mono text-sm min-h-[400px] overflow-auto whitespace-pre-wrap text-slate-200">
              {processText.unique || (
                <span className="text-slate-600 italic">Paste text to see unique results...</span>
              )}
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
          {[
            { icon: "🧼", title: "Duplicate Cleaner", desc: "Remove repeated lines or items instantly" },
            { icon: "⚙️", title: "Flexible Options", desc: "Case sensitive, order preserve, lines/comma mode" },
            { icon: "📊", title: "Stats Overview", desc: "See how many duplicates were removed" },
            { icon: "📋", title: "Copy & Download", desc: "One-click copy or save as file" },
          ].map((c) => (
            <div key={c.title} className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-5 py-5 text-center">
              <div className="text-3xl font-bold text-emerald-400 mb-3">{c.icon}</div>
              <div className="font-semibold text-slate-300 mb-1">{c.title}</div>
              <div className="text-slate-600 text-xs leading-relaxed">{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}