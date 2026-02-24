"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useCallback } from "react";

const EXAMPLE_JSON = `{
  "name": "Rohan Sharma",
  "age": 28,
  "isActive": true,
  "skills": ["JavaScript", "React", "TypeScript"],
  "address": {
    "city": "Bhilwara",
    "state": "Rajasthan",
    "pincode": 311001
  },
  "hobbies": ["Coding", "Cricket", "Late night chai"]
}`;

export default function JsonMinifier() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"minify" | "beautify">("minify");
  const [indentSize, setIndentSize] = useState(2); // only for beautify
  const [copied, setCopied] = useState(false);

  const processJson = useCallback(
    (val: string, currentMode: "minify" | "beautify" = mode) => {
      setError("");
      setOutput("");
      if (!val.trim()) return;

      try {
        const parsed = JSON.parse(val);
        let result: string;

        if (currentMode === "minify") {
          result = JSON.stringify(parsed); // default minified
        } else {
          result = JSON.stringify(parsed, null, indentSize);
        }

        setOutput(result);
      } catch (e: unknown) {
        setError((e as Error).message || "Invalid JSON");
      }
    },
    [mode, indentSize]
  );

  const handleInput = (val: string) => {
    setInput(val);
    processJson(val);
  };

  const handleModeChange = (newMode: "minify" | "beautify") => {
    setMode(newMode);
    processJson(input, newMode);
  };

  const handleIndentChange = (size: number) => {
    setIndentSize(size);
    if (mode === "beautify") {
      processJson(input, "beautify");
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = mode === "minify" ? "minified.json" : "beautified.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-orange-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

      <ToolNavbar toolName="JSON Minifier & Beautifier" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-orange-500/10 flex items-center justify-center font-mono font-bold text-orange-400 text-sm">{"{}"}</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">JSON Minifier & Beautifier</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded">client-side</span>
          </div>
          <p className="text-slate-500 text-sm">Minify JSON to single line or beautify with indentation. Fast, no server needed.</p>
        </div>

        {/* Options bar */}
        <div className="flex flex-wrap items-center gap-4 mb-6 bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3">

          {/* Mode toggle */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-slate-500 uppercase tracking-wide">Mode</span>
            <button
              onClick={() => handleModeChange("minify")}
              className={`font-mono text-xs px-3 py-1.5 rounded transition-all ${mode === "minify" ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" : "text-slate-400 hover:text-slate-200 border border-white/[0.1]"}`}
            >
              Minify (compact)
            </button>
            <button
              onClick={() => handleModeChange("beautify")}
              className={`font-mono text-xs px-3 py-1.5 rounded transition-all ${mode === "beautify" ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" : "text-slate-400 hover:text-slate-200 border border-white/[0.1]"}`}
            >
              Beautify
            </button>
          </div>

          {/* Indent size (only show when beautify) */}
          {mode === "beautify" && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-slate-500 uppercase tracking-wide">Indent</span>
              {[2, 4].map((size) => (
                <button
                  key={size}
                  onClick={() => handleIndentChange(size)}
                  className={`font-mono text-xs px-2.5 py-1 rounded ${indentSize === size ? "bg-orange-500/20 text-orange-400" : "text-slate-500 hover:text-slate-300"}`}
                >
                  {size} spaces
                </button>
              ))}
            </div>
          )}

          <div className="ml-auto flex gap-2">
            <button
              onClick={() => handleInput(EXAMPLE_JSON)}
              className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-slate-300 hover:border-white/20 transition-all"
            >
              Load Example
            </button>
            <button
              onClick={() => { setInput(""); setOutput(""); setError(""); }}
              className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-red-400 hover:border-red-500/30 transition-all"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Editors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">

          {/* Input */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">JSON Input</span>
              <span className="font-mono text-[10px] text-slate-700">{input.length} chars</span>
            </div>
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => handleInput(e.target.value)}
                placeholder={'{\n  "name": "Bhavi",\n  "city": "Bhilwara"\n}'}
                spellCheck={false}
                className="w-full h-[420px] font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-slate-300 placeholder-slate-700 outline-none focus:border-orange-500/40 resize-none transition-colors leading-relaxed"
              />
              {error && (
                <div className="absolute bottom-3 left-3 right-3 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2 flex gap-2">
                  <span className="text-red-400 text-xs mt-0.5 shrink-0">✕</span>
                  <span className="font-mono text-xs text-red-400">{error}</span>
                </div>
              )}
            </div>
          </div>

          {/* Output */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Output</span>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!output}
                  className="font-mono text-[11px] px-3 rounded border border-white/[0.08] text-slate-500 hover:text-slate-300 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  ↓ .json
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  className={`font-mono text-[11px] px-3 rounded border transition-all ${copied ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"}`}
                >
                  {copied ? "✓ Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <div className="h-[420px] font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-slate-300 overflow-auto leading-relaxed">
              {!output && !error && <span className="text-slate-700">Output will appear here...</span>}
              <pre className="whitespace-pre-wrap break-all text-xs">{output}</pre>
            </div>
          </div>
        </div>

        {/* Stats */}
        {output && !error && (
          <div className="flex flex-wrap gap-6 px-4 py-3 bg-orange-500/[0.05] border border-orange-500/20 rounded-lg mb-8">
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Chars</span><span className="font-mono text-sm text-orange-400">{output.length.toLocaleString()}</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Size</span><span className="font-mono text-sm text-orange-400">{(new Blob([output]).size / 1024).toFixed(2)} KB</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Mode</span><span className="font-mono text-sm text-orange-400">{mode === "minify" ? "Minified" : `Beautified (${indentSize} spaces)`}</span></div>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              <span className="font-mono text-[10px] text-orange-500/60">Processed</span>
            </div>
          </div>
        )}

        {/* Info cards – same as previous tool */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { 
              icon: "📏", 
              title: "Minify JSON", 
              desc: "Compress large JSON to single line – reduces file size by up to 60-70% for APIs & storage." 
            },
            { 
              icon: "🖼️", 
              title: "Beautify with Indent", 
              desc: "Readable format with 2 or 4 spaces – perfect for debugging, code reviews & sharing." 
            },
            { 
              icon: "⚡", 
              title: "Instant & Private", 
              desc: "Everything runs in your browser – no data leaves your device, super fast even on big JSON." 
            },
          ].map((c) => (
            <div 
              key={c.title} 
              className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-5 py-4 transition-all hover:border-orange-500/30 hover:bg-white/[0.04]"
            >
              <div className="text-2xl mb-3">{c.icon}</div>
              <div className="font-semibold text-slate-300 text-sm mb-1">{c.title}</div>
              <div className="text-slate-600 text-xs leading-relaxed">{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}