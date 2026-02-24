"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState } from "react";

const SEPARATORS = [
  { key: "-", label: "Hyphen (-)", sym: "-" },
  { key: "_", label: "Underscore (_)", sym: "_" },
  { key: ".", label: "Dot (.)", sym: "." },
];

const EXAMPLES = [
  "Hello World! This is a Test",
  "My Blog Post #1 — Top 10 Tips & Tricks",
  "What is Node.js? (A Complete Guide 2024)",
  "कैसे बनाएं एक Website",
  "React.js vs Vue.js vs Angular — Who Wins?",
];

function toSlug(input: string, sep: string, lower: boolean, removeNums: boolean, maxLen: number | null): string {
  let s = input;
  // Replace accented/special chars
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // Remove non-ASCII (like Hindi)
  s = s.replace(/[^\x00-\x7F]/g, "");
  // Lowercase
  if (lower) s = s.toLowerCase();
  // Remove numbers if needed
  if (removeNums) s = s.replace(/[0-9]/g, " ");
  // Replace special chars / punctuation with sep
  s = s.replace(/[^a-zA-Z0-9\s]/g, " ");
  // Collapse whitespace and replace with sep
  s = s.trim().replace(/\s+/g, sep);
  // Remove duplicate separators
  s = s.replace(new RegExp(`\\${sep}+`, "g"), sep);
  // Strip leading/trailing sep
  s = s.replace(new RegExp(`^\\${sep}|\\${sep}$`, "g"), "");
  // Max length
  if (maxLen && s.length > maxLen) {
    s = s.slice(0, maxLen);
    s = s.replace(new RegExp(`\\${sep}$`), "");
  }
  return s;
}

export default function SlugGenerator() {
  const [input, setInput] = useState("");
  const [sep, setSep] = useState("-");
  const [lower, setLower] = useState(true);
  const [removeNums, setRemoveNums] = useState(false);
  const [maxLen, setMaxLen] = useState<number | null>(null);
  const [maxLenEnabled, setMaxLenEnabled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const slug = input ? toSlug(input, sep, lower, removeNums, maxLenEnabled ? maxLen : null) : "";

  const handleGenerate = () => {
    if (!slug) return;
    setHistory((prev) => [slug, ...prev.filter((h) => h !== slug)].slice(0, 8));
    navigator.clipboard.writeText(slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const copySlug = (s: string) => {
    navigator.clipboard.writeText(s);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.025) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-yellow-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

      <ToolNavbar toolName="Slug Generator" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-yellow-500/10 flex items-center justify-center text-lg">/</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Slug Generator</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded">URL-safe</span>
          </div>
          <p className="text-slate-500 text-sm">Convert any title or text into a clean, URL-friendly slug. Perfect for blog posts, routes, and SEO.</p>
        </div>

        {/* Input */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 mb-4">
          <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">Input Text</div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter your title or text here..."
            rows={3}
            spellCheck={false}
            className="w-full font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-slate-300 placeholder-slate-700 outline-none focus:border-yellow-500/30 resize-none transition-colors leading-relaxed"
          />
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="font-mono text-[10px] text-slate-700 self-center">Try:</span>
            {EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => setInput(ex)}
                className="font-mono text-[10px] px-2.5 py-1 border border-white/[0.06] text-slate-600 rounded hover:text-yellow-400 hover:border-yellow-500/30 transition-all truncate max-w-[200px]">
                {ex.slice(0, 30)}{ex.length > 30 ? "…" : ""}
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 mb-5">
          <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-4">Options</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* Separator */}
            <div>
              <div className="font-mono text-[11px] text-slate-600 mb-2">Separator</div>
              <div className="flex gap-2">
                {SEPARATORS.map((s) => (
                  <button key={s.key} onClick={() => setSep(s.key)}
                    className={`font-mono text-xs px-3 py-1.5 rounded border transition-all flex-1 ${sep === s.key ? "bg-yellow-500/15 border-yellow-500/40 text-yellow-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Max length */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => setMaxLenEnabled(!maxLenEnabled)} className={`w-8 h-4 rounded-full transition-all relative ${maxLenEnabled ? "bg-yellow-500" : "bg-white/10"}`}>
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${maxLenEnabled ? "left-4" : "left-0.5"}`} />
                  </div>
                  <span className="font-mono text-[11px] text-slate-500">Max length</span>
                </label>
                {maxLenEnabled && (
                  <input type="number" value={maxLen ?? 60} onChange={(e) => setMaxLen(Number(e.target.value))} min={10} max={200}
                    className="font-mono text-xs w-16 px-2 py-1 bg-white/[0.06] border border-white/[0.1] rounded text-slate-300 outline-none focus:border-yellow-500/40" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { key: "lower", label: "Lowercase output", val: lower, set: setLower },
                  { key: "nums", label: "Remove numbers", val: removeNums, set: setRemoveNums },
                ].map((opt) => (
                  <label key={opt.key} className="flex items-center gap-2 cursor-pointer group">
                    <div onClick={() => opt.set(!opt.val)} className={`w-8 h-4 rounded-full transition-all relative ${opt.val ? "bg-yellow-500" : "bg-white/10"}`}>
                      <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${opt.val ? "left-4" : "left-0.5"}`} />
                    </div>
                    <span className="font-mono text-[11px] text-slate-500 group-hover:text-slate-300 transition-colors">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Output */}
        <div className="bg-white/[0.03] border border-yellow-500/20 rounded-xl p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Generated Slug</div>
            {slug && <span className="font-mono text-[10px] text-slate-700">{slug.length} chars</span>}
          </div>

          <div className={`font-mono text-base break-all min-h-[48px] bg-white/[0.03] border rounded-lg px-4 py-3 mb-4 leading-relaxed ${slug ? "text-yellow-400 border-yellow-500/20" : "text-slate-700 border-white/[0.06]"}`}>
            {slug || "your-slug-will-appear-here"}
          </div>

          <div className="flex gap-2">
            <button onClick={handleGenerate} disabled={!slug}
              className="font-mono text-sm font-bold px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-[#09090f] rounded-md transition-all hover:-translate-y-0.5 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0">
              {copied ? "✓ Copied!" : "Copy Slug"}
            </button>
            <button onClick={() => setInput("")} className="font-mono text-sm px-4 py-2.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-red-400 hover:border-red-500/20 transition-all">
              Clear
            </button>
          </div>
        </div>

        {/* Preview */}
        {slug && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 mb-5">
            <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">URL Preview</div>
            <div className="font-mono text-sm text-slate-500 break-all">
              https://yoursite.com/<span className="text-yellow-400">{slug}</span>
            </div>
            <div className="font-mono text-sm text-slate-500 break-all mt-1">
              /api/<span className="text-yellow-400">{slug}</span>
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/[0.06] font-mono text-[11px] uppercase tracking-[2px] text-slate-600">
              Recent Slugs
            </div>
            <div className="divide-y divide-white/[0.04]">
              {history.map((h, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] group transition-colors">
                  <span className="font-mono text-sm text-slate-400 flex-1 break-all">{h}</span>
                  <button onClick={() => copySlug(h)} className="font-mono text-xs px-2 py-1 border border-white/[0.08] text-slate-600 rounded opacity-0 group-hover:opacity-100 hover:text-slate-300 transition-all">
                    Copy
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}