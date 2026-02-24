"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useCallback, useRef } from "react";
import Papa from "papaparse";

const EXAMPLE_CSV = `id,name,email,age,city,state,active,skills
1,Rohan Sharma,rohan@example.com,28,Mumbai,Maharashtra,true,"JavaScript;React;Node.js"
2,Priya Singh,priya@example.com,24,Delhi,Delhi,false,"Python;Django"
3,Amit Kumar,amit@example.com,32,Bangalore,Karnataka,true,"Java;Spring;AWS"`;

export default function CsvToJson() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [delimiter, setDelimiter] = useState(",");
  const [hasHeader, setHasHeader] = useState(true);
  const [copied, setCopied] = useState(false);
  const [rowCount, setRowCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const convert = useCallback(
    (csvText: string, delim = delimiter, header = hasHeader) => {
      setError("");
      setOutput("");
      setRowCount(0);
      if (!csvText.trim()) return;

      Papa.parse(csvText, {
        delimiter: delim,
        header: header,
        skipEmptyLines: true,
        dynamicTyping: true, // auto-convert numbers, booleans
        transformHeader: (h) => h.trim(),
        complete: (results) => {
          if (results.errors.length > 0) {
            setError(results.errors.map(e => e.message).join("; "));
            return;
          }
          const json = JSON.stringify(results.data, null, 2);
          setOutput(json);
          setRowCount(results.data.length);
        },
        error: (err) => setError(err.message || "Parsing failed"),
      });
    },
    [delimiter, hasHeader]
  );

  const handleInput = (val: string) => {
    setInput(val);
    convert(val);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setInput(text);
      convert(text);
    };
    reader.readAsText(file);
  };

  const handleOpt = (delim: string, header: boolean) => {
    setDelimiter(delim);
    setHasHeader(header);
    convert(input, delim, header);
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
    a.download = "converted.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadExample = () => {
    setInput(EXAMPLE_CSV);
    convert(EXAMPLE_CSV);
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError("");
    setRowCount(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-orange-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

      <ToolNavbar toolName="CSV → JSON Converter" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-orange-500/10 flex items-center justify-center font-mono font-bold text-orange-400 text-sm">⇄</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">CSV → JSON Converter</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded">client-side</span>
          </div>
          <p className="text-slate-500 text-sm">Convert CSV (comma, semicolon, tab, etc.) to JSON array of objects. Supports headers, file upload, and auto-type detection.</p>
        </div>

        {/* Options bar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">

          {/* Delimiter */}
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-1.5">
            <span className="font-mono text-[11px] text-slate-500 uppercase tracking-wide">Delimiter</span>
            {[
              { key: ",", label: "Comma (,)" },
              { key: ";", label: "Semicolon (;)" },
              { key: "\t", label: "Tab (\\t)" },
              { key: "|", label: "Pipe (|)" },
            ].map((d) => (
              <button
                key={d.key}
                onClick={() => handleOpt(d.key, hasHeader)}
                className={`font-mono text-xs px-2.5 py-0.5 rounded transition-all ${delimiter === d.key ? "bg-orange-500/20 text-orange-400" : "text-slate-500 hover:text-slate-300"}`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Header toggle */}
          <label
            onClick={() => handleOpt(delimiter, !hasHeader)}
            className="flex items-center gap-2 cursor-pointer group bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-1.5"
          >
            <div className={`w-8 h-4 rounded-full transition-all relative ${hasHeader ? "bg-orange-500" : "bg-white/10"}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${hasHeader ? "left-4" : "left-0.5"}`} />
            </div>
            <span className="font-mono text-xs text-slate-500 group-hover:text-slate-300 transition-colors">Has Header Row</span>
          </label>

          <div className="ml-auto flex gap-2">
            <input
              type="file"
              accept=".csv,.tsv,.txt"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-slate-300 hover:border-white/20 transition-all"
            >
              Upload CSV
            </button>
            <button onClick={handleLoadExample} className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-slate-300 hover:border-white/20 transition-all">
              Load Example
            </button>
            <button onClick={handleClear} className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-red-400 hover:border-red-500/30 transition-all">
              Clear
            </button>
          </div>
        </div>

        {/* Editors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">

          {/* CSV Input */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">CSV Input</span>
              <span className="font-mono text-[10px] text-slate-700">{input.length} chars</span>
            </div>
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => handleInput(e.target.value)}
                placeholder={'id,name,age\n1,Alice,30\n2,Bob,25'}
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

          {/* JSON Output */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">JSON Output</span>
              <div className="flex gap-2">
                <button onClick={handleDownload} disabled={!output} className="font-mono text-[11px] px-3 rounded border border-white/[0.08] text-slate-500 hover:text-slate-300 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  ↓ .json
                </button>
                <button onClick={handleCopy} disabled={!output}
                  className={`font-mono text-[11px] px-3 rounded border transition-all ${copied ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"}`}>
                  {copied ? "✓ Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <div className="h-[420px] font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-slate-300 overflow-auto leading-relaxed">
              {!output && !error && <span className="text-slate-700">JSON output will appear here...</span>}
              <pre className="whitespace-pre-wrap text-xs">{output}</pre>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        {output && !error && (
          <div className="flex flex-wrap gap-6 px-4 py-3 bg-orange-500/[0.05] border border-orange-500/20 rounded-lg mb-5">
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Rows</span><span className="font-mono text-sm text-orange-400">{rowCount}</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Size</span><span className="font-mono text-sm text-orange-400">{(new Blob([output]).size / 1024).toFixed(2)} KB</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Delimiter</span><span className="font-mono text-sm text-orange-400">{delimiter === "\t" ? "Tab" : `"${delimiter}"`}</span></div>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              <span className="font-mono text-[10px] text-orange-500/60">Converted</span>
            </div>
          </div>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "📤", title: "File Upload", desc: "Drag-drop or click to upload .csv/.tsv files directly – auto detects and converts." },
            { icon: "🔍", title: "Smart Parsing", desc: "Handles quoted fields, escaped commas, numbers, booleans automatically via PapaParse." },
            { icon: "⚡", title: "Client-Side Only", desc: "No server upload – fast, private, works offline after load." },
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