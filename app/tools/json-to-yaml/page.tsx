"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useCallback } from "react";

// ── JSON → YAML converter (no external lib) ──────────────────
function jsonToYaml(obj: unknown, indent = 0): string {
  const pad = "  ".repeat(indent);

  if (obj === null) return "null";
  if (obj === undefined) return "~";
  if (typeof obj === "boolean") return obj ? "true" : "false";
  if (typeof obj === "number") return String(obj);
  if (typeof obj === "string") {
    // Multiline string
    if (obj.includes("\n")) return "|\n" + obj.split("\n").map((l) => pad + "  " + l).join("\n");
    // Needs quoting
    if (/[:#\[\]{}&*!|>'"%@`,]/.test(obj) || obj === "" || /^[-?]/.test(obj) || /^\s|\s$/.test(obj))
      return `"${obj.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    // Looks like a number/bool/null → quote
    if (/^(true|false|null|yes|no|on|off)$/i.test(obj) || /^[0-9]/.test(obj)) return `"${obj}"`;
    return obj;
  }
  if (Array.isArray(obj)) {
    if (obj.length === 0) return "[]";
    return obj.map((item) => {
      const val = jsonToYaml(item, indent + 1);
      if (typeof item === "object" && item !== null && !Array.isArray(item)) {
        return `${pad}- ${val.trimStart()}`;
      }
      return `${pad}- ${val}`;
    }).join("\n");
  }
  if (typeof obj === "object") {
    const entries = Object.entries(obj as Record<string, unknown>);
    if (entries.length === 0) return "{}";
    return entries.map(([k, v]) => {
      const key = /[:#\[\]{}&*!|>'"%@`,\s]/.test(k) ? `"${k}"` : k;
      if (v !== null && typeof v === "object") {
        const nested = jsonToYaml(v, indent + 1);
        if ((Array.isArray(v) && (v as unknown[]).length === 0) || (!Array.isArray(v) && Object.keys(v as object).length === 0))
          return `${pad}${key}: ${nested}`;
        return `${pad}${key}:\n${nested}`;
      }
      return `${pad}${key}: ${jsonToYaml(v, indent)}`;
    }).join("\n");
  }
  return String(obj);
}

const EXAMPLE_JSON = `{
  "name": "use2codingtools",
  "version": "1.0.0",
  "active": true,
  "score": 9.5,
  "tags": ["developer", "tools", "free"],
  "author": {
    "name": "Dev Bhai",
    "email": "dev@use2codingtools.com",
    "social": {
      "github": "devbhai",
      "twitter": "@devbhai"
    }
  },
  "features": [
    { "id": 1, "name": "JSON Formatter", "done": true },
    { "id": 2, "name": "YAML Converter", "done": true }
  ],
  "config": null
}`;

export default function JsonToYaml() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [indentSize, setIndentSize] = useState(2);

  const convert = useCallback((val: string, ind: number = indentSize) => {
    setError("");
    setOutput("");
    if (!val.trim()) return;
    try {
      const parsed = JSON.parse(val);
      // Override global indent via simple replace after generation
      let yaml = jsonToYaml(parsed, 0);
      if (ind !== 2) {
        // re-indent: replace every 2-space indent with ind-space indent
        yaml = yaml.split("\n").map((line) => {
          const match = line.match(/^(\s+)/);
          if (!match) return line;
          const spaces = match[1].length;
          const level = spaces / 2;
          return " ".repeat(level * ind) + line.trimStart();
        }).join("\n");
      }
      setOutput(yaml);
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  }, [indentSize]);

  const handleInput = (val: string) => { setInput(val); convert(val); };
  const handleIndent = (i: number) => { setIndentSize(i); convert(input, i); };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "output.yaml"; a.click();
    URL.revokeObjectURL(url);
  };

  const stats = output ? {
    lines: output.split("\n").length,
    keys: (output.match(/^\s*[\w"]+:/gm) || []).length,
  } : null;

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -left-48 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -right-48 w-[400px] h-[400px] rounded-full bg-cyan-500/[0.04] blur-3xl pointer-events-none" />

      <ToolNavbar toolName="JSON → YAML" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center font-mono font-bold text-emerald-400 text-sm">≡</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">JSON → YAML Converter</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">client-side</span>
          </div>
          <p className="text-slate-500 text-sm">Convert JSON to clean, readable YAML. No libraries, no server — runs entirely in your browser.</p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-1.5">
            <span className="font-mono text-[11px] text-slate-500 uppercase tracking-wide">Indent</span>
            {[2, 4].map((i) => (
              <button key={i} onClick={() => handleIndent(i)}
                className={`font-mono text-xs px-2 py-0.5 rounded transition-all ${indentSize === i ? "bg-emerald-500/20 text-emerald-400" : "text-slate-500 hover:text-slate-300"}`}>
                {i}
              </button>
            ))}
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={() => handleInput(EXAMPLE_JSON)} className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-slate-300 hover:border-white/20 transition-all">Load Example</button>
            <button onClick={() => { setInput(""); setOutput(""); setError(""); }} className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-red-400 hover:border-red-500/30 transition-all">Clear</button>
          </div>
        </div>

        {/* Editors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Input */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">JSON Input</span>
              <span className="font-mono text-[10px] text-slate-700">{input.length} chars</span>
            </div>
            <div className="relative">
              <textarea value={input} onChange={(e) => handleInput(e.target.value)} placeholder={'{\n  "paste": "your JSON here"\n}'}
                spellCheck={false}
                className="w-full h-[520px] font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-slate-300 placeholder-slate-700 outline-none focus:border-emerald-500/40 resize-none transition-colors leading-relaxed" />
              {error && (
                <div className="absolute bottom-3 left-3 right-3 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2 flex gap-2">
                  <span className="text-red-400 text-xs mt-0.5 shrink-0">✕</span>
                  <span className="font-mono text-xs text-red-400 leading-relaxed">{error}</span>
                </div>
              )}
            </div>
          </div>

          {/* Output */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">YAML Output</span>
              <div className="flex gap-2">
                <button onClick={handleDownload} disabled={!output} className="font-mono text-[11px] px-3 rounded border border-white/[0.08] text-slate-500 hover:text-slate-300 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all">↓ .yaml</button>
                <button onClick={handleCopy} disabled={!output}
                  className={`font-mono text-[11px] px-3 rounded border transition-all ${copied ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"}`}>
                  {copied ? "✓ Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <div className="h-[520px] font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-slate-300 overflow-auto leading-relaxed">
              {!output && !error && <span className="text-slate-700">YAML output will appear here...</span>}
              <pre className="whitespace-pre-wrap break-all">{output}</pre>
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats && !error && (
          <div className="mt-4 flex flex-wrap gap-6 px-4 py-3 bg-emerald-500/[0.05] border border-emerald-500/20 rounded-lg">
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-emerald-500/60 mr-2">Lines</span><span className="font-mono text-sm text-emerald-400">{stats.lines}</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-emerald-500/60 mr-2">Keys</span><span className="font-mono text-sm text-emerald-400">{stats.keys}</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-emerald-500/60 mr-2">Size</span><span className="font-mono text-sm text-emerald-400">{(new Blob([output]).size / 1024).toFixed(2)} KB</span></div>
            <div className="ml-auto flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /><span className="font-mono text-[10px] text-emerald-500/60">Valid</span></div>
          </div>
        )}

        {/* Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8">
          {[
            { icon: "🔄", title: "Auto Convert", desc: "Converts instantly as you type JSON — no button needed." },
            { icon: "📐", title: "Clean Output", desc: "Properly indented, human-readable YAML with correct types." },
            { icon: "💾", title: "Download", desc: "Save the YAML output directly as a .yaml file." },
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