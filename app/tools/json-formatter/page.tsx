"use client";

import { useState, useCallback } from "react";
import ToolNavbar from "./../../components/toolsNavBar";

type FormatMode = "format" | "minify" | "validate";

const EXAMPLE_JSON = `{
  "name": "use2codingtools",
  "version": "1.0.0",
  "description": "Developer toolkit for everyone",
  "author": {
    "name": "Dev Bhai",
    "email": "dev@use2codingtools.com"
  },
  "tools": ["JSON Formatter", "Base64", "UUID Generator"],
  "active": true,
  "downloads": 42069
}`;

export default function JsonFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<FormatMode>("format");
  const [indent, setIndent] = useState(2);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<{ keys: number; size: string } | null>(null);

  const process = useCallback(
    (val: string, m: FormatMode = mode, ind: number = indent) => {
      const src = val.trim();
      if (!src) {
        setOutput("");
        setError("");
        setStats(null);
        return;
      }
      try {
        const parsed = JSON.parse(src);
        setError("");

        const countKeys = (obj: unknown): number => {
          if (typeof obj !== "object" || obj === null) return 0;
          const keys = Object.keys(obj as object);
          return keys.length + keys.reduce((a, k) => a + countKeys((obj as Record<string, unknown>)[k]), 0);
        };

        if (m === "format") {
          const formatted = JSON.stringify(parsed, null, ind);
          setOutput(formatted);
          setStats({
            keys: countKeys(parsed),
            size: (new Blob([formatted]).size / 1024).toFixed(2) + " KB",
          });
        } else if (m === "minify") {
          const minified = JSON.stringify(parsed);
          setOutput(minified);
          setStats({
            keys: countKeys(parsed),
            size: (new Blob([minified]).size / 1024).toFixed(2) + " KB",
          });
        } else {
          setOutput("✅ Valid JSON — no errors found.");
          setStats({ keys: countKeys(parsed), size: (new Blob([src]).size / 1024).toFixed(2) + " KB" });
        }
      } catch (e: unknown) {
        setError((e as Error).message);
        setOutput("");
        setStats(null);
      }
    },
    [mode, indent]
  );

  const handleInput = (val: string) => {
    setInput(val);
    process(val, mode, indent);
  };

  const handleMode = (m: FormatMode) => {
    setMode(m);
    process(input, m, indent);
  };

  const handleIndent = (i: number) => {
    setIndent(i);
    process(input, mode, i);
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError("");
    setStats(null);
  };

  const handleExample = () => {
    setInput(EXAMPLE_JSON);
    process(EXAMPLE_JSON, mode, indent);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setInput(text);
      process(text, mode, indent);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const modes: { key: FormatMode; label: string }[] = [
    { key: "format", label: "Format" },
    { key: "minify", label: "Minify" },
    { key: "validate", label: "Validate" },
  ];

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,255,136,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.025) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="fixed -top-48 -left-48 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.05] blur-3xl pointer-events-none" />

      {/* NAV */}
     <ToolNavbar toolName="JSON Formatter" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center text-lg">📋</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">JSON Formatter</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">client-side</span>
          </div>
          <p className="text-slate-500 text-sm">Format, minify, or validate your JSON — instantly, in the browser.</p>
        </div>

        {/* Mode + Options toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {/* Mode tabs */}
          <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-md p-1 gap-1">
            {modes.map((m) => (
              <button
                key={m.key}
                onClick={() => handleMode(m.key)}
                className={`font-mono text-xs px-4 py-1.5 rounded transition-all ${
                  mode === m.key
                    ? "bg-emerald-500 text-[#09090f] font-bold"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Indent selector */}
          {mode === "format" && (
            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-1.5">
              <span className="font-mono text-[11px] text-slate-500 uppercase tracking-wide">Indent</span>
              {[2, 4].map((i) => (
                <button
                  key={i}
                  onClick={() => handleIndent(i)}
                  className={`font-mono text-xs px-2 py-0.5 rounded transition-all ${
                    indent === i ? "bg-emerald-500/20 text-emerald-400" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleExample}
              className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-slate-300 hover:border-white/20 transition-all"
            >
              Load Example
            </button>
            <label className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-slate-300 hover:border-white/20 transition-all cursor-pointer">
              Upload .json
              <input type="file" accept=".json,application/json" className="hidden" onChange={handleUpload} />
            </label>
            <button
              onClick={handleClear}
              className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-red-400 hover:border-red-500/30 transition-all"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Editor area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* INPUT */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Input</span>
              {/* <span className="font-mono text-[10px] text-slate-700">{input.length} chars</span> */}
            </div>
            <div className="relative flex-1">
              <textarea
                value={input}
                onChange={(e) => handleInput(e.target.value)}
                placeholder={'{\n  "paste": "your JSON here"\n}'}
                spellCheck={false}
                className="w-full h-[520px] font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-slate-300 placeholder-slate-700 outline-none focus:border-emerald-500/40 resize-none transition-colors leading-relaxed"
              />
              {/* Error overlay */}
              {error && (
                <div className="absolute bottom-3 left-3 right-3 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2 flex items-start gap-2">
                  <span className="text-red-400 text-xs mt-0.5">✕</span>
                  <span className="font-mono text-xs text-red-400 leading-relaxed">{error}</span>
                </div>
              )}
            </div>
          </div>

          {/* OUTPUT */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Output</span>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`font-mono text-[11px] px-3 rounded transition-all ${
                  copied
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "border border-white/[0.08] text-slate-500 hover:text-slate-300 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
                }`}
              >
                {copied ? "✓ Copied!" : "Copy"}
              </button>
            </div>
            <div className="relative h-[520px] font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-slate-300 overflow-auto transition-colors leading-relaxed">
              {!output && !error && (
                <span className="text-slate-700 select-none">Output will appear here...</span>
              )}
              {output && mode === "validate" ? (
                <span className="text-emerald-400 font-semibold">{output}</span>
              ) : (
                <pre className="whitespace-pre-wrap break-all">{output}</pre>
              )}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        {stats && !error && (
          <div className="mt-4 flex flex-wrap gap-6 px-4 py-3 bg-emerald-500/[0.05] border border-emerald-500/20 rounded-lg">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-500/60 mr-2">Keys</span>
              <span className="font-mono text-sm text-emerald-400">{stats.keys}</span>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-500/60 mr-2">Size</span>
              <span className="font-mono text-sm text-emerald-400">{stats.size}</span>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-500/60 mr-2">Mode</span>
              <span className="font-mono text-sm text-emerald-400 capitalize">{mode}</span>
            </div>
            {mode === "format" && (
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-500/60 mr-2">Indent</span>
                <span className="font-mono text-sm text-emerald-400">{indent} spaces</span>
              </div>
            )}
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[10px] text-emerald-500/60">Valid JSON</span>
            </div>
          </div>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8">
          {[
            { icon: "⚡", title: "Instant", desc: "Formats as you type — zero delay, no button needed." },
            { icon: "🔒", title: "100% Private", desc: "Everything runs in your browser. Nothing is sent to any server." },
            { icon: "📂", title: "File Upload", desc: "Drop a .json file directly and format it instantly." },
          ].map((card) => (
            <div key={card.title} className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-5 py-4">
              <div className="text-xl mb-2">{card.icon}</div>
              <div className="font-semibold text-slate-300 text-sm mb-1">{card.title}</div>
              <div className="text-slate-600 text-xs leading-relaxed">{card.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}