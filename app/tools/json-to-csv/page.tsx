"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useCallback } from "react";

// ── JSON → CSV converter ──────────────────────────────────────
function flattenObject(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
  return Object.entries(obj).reduce((acc, [key, val]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (val !== null && typeof val === "object" && !Array.isArray(val)) {
      Object.assign(acc, flattenObject(val as Record<string, unknown>, fullKey));
    } else if (Array.isArray(val)) {
      acc[fullKey] = val.join("; ");
    } else {
      acc[fullKey] = val === null || val === undefined ? "" : String(val);
    }
    return acc;
  }, {} as Record<string, string>);
}

function jsonToCsv(
  data: unknown[],
  delimiter: string,
  flatten: boolean,
  includeHeader: boolean
): string {
  if (!data.length) return "";

  const rows = data.map((item) => {
    if (typeof item !== "object" || item === null) return { value: String(item) };
    return flatten ? flattenObject(item as Record<string, unknown>) : (item as Record<string, unknown>);
  }) as Record<string, unknown>[];

  // Collect all keys
  const allKeys = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));

  const escape = (val: unknown): string => {
    const s = val === null || val === undefined ? "" : String(val);
    if (s.includes(delimiter) || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines: string[] = [];
  if (includeHeader) lines.push(allKeys.map(escape).join(delimiter));
  rows.forEach((row) => {
    lines.push(allKeys.map((k) => escape(row[k])).join(delimiter));
  });

  return lines.join("\n");
}

const DELIMITERS = [
  { key: ",", label: "Comma (,)" },
  { key: ";", label: "Semicolon (;)" },
  { key: "\t", label: "Tab (\\t)" },
  { key: "|", label: "Pipe (|)" },
];

const EXAMPLE_JSON = `[
  {
    "id": 1,
    "name": "Rohan Sharma",
    "email": "rohan@example.com",
    "age": 28,
    "active": true,
    "address": {
      "city": "Mumbai",
      "state": "Maharashtra"
    },
    "skills": ["JavaScript", "React", "Node.js"]
  },
  {
    "id": 2,
    "name": "Priya Singh",
    "email": "priya@example.com",
    "age": 24,
    "active": false,
    "address": {
      "city": "Delhi",
      "state": "Delhi"
    },
    "skills": ["Python", "Django"]
  },
  {
    "id": 3,
    "name": "Amit Kumar",
    "email": "amit@example.com",
    "age": 32,
    "active": true,
    "address": {
      "city": "Bangalore",
      "state": "Karnataka"
    },
    "skills": ["Java", "Spring", "AWS"]
  }
]`;

export default function JsonToCsv() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [delimiter, setDelimiter] = useState(",");
  const [flatten, setFlatten] = useState(true);
  const [includeHeader, setIncludeHeader] = useState(true);
  const [copied, setCopied] = useState(false);
  const [rowCount, setRowCount] = useState(0);
  const [colCount, setColCount] = useState(0);

  const convert = useCallback(
    (val: string, delim = delimiter, flat = flatten, header = includeHeader) => {
      setError("");
      setOutput("");
      setRowCount(0);
      setColCount(0);
      if (!val.trim()) return;
      try {
        const parsed = JSON.parse(val);
        // Allow single object — wrap in array
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        if (arr.length === 0) { setError("Array is empty."); return; }
        const csv = jsonToCsv(arr, delim, flat, header);
        setOutput(csv);
        const lines = csv.split("\n");
        setColCount(lines[0]?.split(delim === "\t" ? "\t" : delim).length ?? 0);
        setRowCount(header ? lines.length - 1 : lines.length);
      } catch (e: unknown) {
        setError((e as Error).message);
      }
    },
    [delimiter, flatten, includeHeader]
  );

  const handleInput = (val: string) => { setInput(val); convert(val); };

  const handleOpt = (
    delim: string,
    flat: boolean,
    header: boolean
  ) => {
    setDelimiter(delim);
    setFlatten(flat);
    setIncludeHeader(header);
    convert(input, delim, flat, header);
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownload = () => {
    if (!output) return;
    const ext = delimiter === "\t" ? "tsv" : "csv";
    const mime = delimiter === "\t" ? "text/tab-separated-values" : "text/csv";
    const blob = new Blob([output], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `output.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Table preview (first 6 rows)
  const tablePreview = (() => {
    if (!output) return null;
    const lines = output.split("\n").slice(0, 7);
    const splitLine = (line: string) => {
      const d = delimiter === "\t" ? "\t" : delimiter;
      const result: string[] = [];
      let cur = "";
      let inQuote = false;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') { inQuote = !inQuote; continue; }
        if (!inQuote && line[i] === d) { result.push(cur); cur = ""; continue; }
        cur += line[i];
      }
      result.push(cur);
      return result;
    };
    return lines.map(splitLine);
  })();

  const hasMore = output.split("\n").length > 7;

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-orange-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

      {/* NAV */}

      <ToolNavbar toolName="JSON → CSV" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-orange-500/10 flex items-center justify-center font-mono font-bold text-orange-400 text-sm">⇆</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">JSON → CSV Converter</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded">client-side</span>
          </div>
          <p className="text-slate-500 text-sm">Convert JSON arrays to CSV/TSV. Supports nested objects flattening, custom delimiters, and table preview.</p>
        </div>

        {/* Options bar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">

          {/* Delimiter */}
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-1.5">
            <span className="font-mono text-[11px] text-slate-500 uppercase tracking-wide">Delimiter</span>
            {DELIMITERS.map((d) => (
              <button key={d.key} onClick={() => handleOpt(d.key, flatten, includeHeader)}
                className={`font-mono text-xs px-2.5 py-0.5 rounded transition-all ${delimiter === d.key ? "bg-orange-500/20 text-orange-400" : "text-slate-500 hover:text-slate-300"}`}>
                {d.label}
              </button>
            ))}
          </div>

          {/* Toggles */}
          {[
            { label: "Flatten nested", val: flatten, toggle: () => handleOpt(delimiter, !flatten, includeHeader) },
            { label: "Include header", val: includeHeader, toggle: () => handleOpt(delimiter, flatten, !includeHeader) },
          ].map((opt) => (
            <label key={opt.label} onClick={opt.toggle} className="flex items-center gap-2 cursor-pointer group bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-1.5">
              <div className={`w-8 h-4 rounded-full transition-all relative ${opt.val ? "bg-orange-500" : "bg-white/10"}`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${opt.val ? "left-4" : "left-0.5"}`} />
              </div>
              <span className="font-mono text-xs text-slate-500 group-hover:text-slate-300 transition-colors">{opt.label}</span>
            </label>
          ))}

          <div className="ml-auto flex gap-2">
            <button onClick={() => handleInput(EXAMPLE_JSON)} className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-slate-300 hover:border-white/20 transition-all">Load Example</button>
            <button onClick={() => { setInput(""); setOutput(""); setError(""); setRowCount(0); setColCount(0); }} className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-red-400 hover:border-red-500/30 transition-all">Clear</button>
          </div>
        </div>

        {/* Editors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">

          {/* JSON Input */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">JSON Input</span>
              <span className="font-mono text-[10px] text-slate-700">{input.length} chars</span>
            </div>
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => handleInput(e.target.value)}
                placeholder={'[\n  { "name": "Alice", "age": 30 },\n  { "name": "Bob",   "age": 25 }\n]'}
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

          {/* CSV Output */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">CSV Output</span>
              <div className="flex gap-2">
                <button onClick={handleDownload} disabled={!output} className="font-mono text-[11px] px-3  rounded border border-white/[0.08] text-slate-500 hover:text-slate-300 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  ↓ {delimiter === "\t" ? ".tsv" : ".csv"}
                </button>
                <button onClick={handleCopy} disabled={!output}
                  className={`font-mono text-[11px] px-3 rounded border transition-all ${copied ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"}`}>
                  {copied ? "✓ Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <div className="h-[420px] font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-slate-300 overflow-auto leading-relaxed">
              {!output && !error && <span className="text-slate-700">CSV output will appear here...</span>}
              <pre className="whitespace-pre text-xs">{output}</pre>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        {output && !error && (
          <div className="flex flex-wrap gap-6 px-4 py-3 bg-orange-500/[0.05] border border-orange-500/20 rounded-lg mb-5">
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Rows</span><span className="font-mono text-sm text-orange-400">{rowCount}</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Columns</span><span className="font-mono text-sm text-orange-400">{colCount}</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Size</span><span className="font-mono text-sm text-orange-400">{(new Blob([output]).size / 1024).toFixed(2)} KB</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Delimiter</span><span className="font-mono text-sm text-orange-400">{delimiter === "\t" ? "Tab" : `"${delimiter}"`}</span></div>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              <span className="font-mono text-[10px] text-orange-500/60">Converted</span>
            </div>
          </div>
        )}

        {/* Table preview */}
        {tablePreview && tablePreview.length > 0 && (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden mb-6">
            <div className="px-5 py-3 border-b border-white/[0.06]">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Table Preview</span>
              <span className="font-mono text-[10px] text-slate-700 ml-3">first {Math.min(tablePreview.length, 6)} rows</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {(includeHeader ? tablePreview[0] : []).map((cell, i) => (
                      <th key={i} className="font-mono text-xs text-orange-400 px-4 py-2.5 bg-orange-500/[0.05] whitespace-nowrap">{cell}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {(includeHeader ? tablePreview.slice(1) : tablePreview).map((row, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      {row.map((cell, j) => (
                        <td key={j} className="font-mono text-xs text-slate-400 px-4 py-2.5 whitespace-nowrap max-w-[200px] truncate">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {hasMore && (
              <div className="px-5 py-2.5 border-t border-white/[0.06] font-mono text-[10px] text-slate-700">
                + {output.split("\n").length - 7} more rows — download to see all
              </div>
            )}
          </div>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "🔀", title: "Flatten Nested", desc: "Nested objects like address.city become flat columns automatically." },
            { icon: "📊", title: "Table Preview", desc: "Live preview of your CSV as a formatted table — before downloading." },
            { icon: "📁", title: "Multiple Formats", desc: "Export as .csv (comma), .tsv (tab), or pipe/semicolon separated files." },
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