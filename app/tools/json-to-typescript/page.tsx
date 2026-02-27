"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useCallback } from "react";

const EXAMPLE = `{
  "id": 1,
  "name": "Rohan Sharma",
  "email": "rohan@example.com",
  "age": 28,
  "active": true,
  "score": 9.5,
  "tags": ["developer", "designer"],
  "address": {
    "street": "123 MG Road",
    "city": "Mumbai",
    "pincode": "400001",
    "country": null
  },
  "posts": [
    { "id": 1, "title": "Hello World", "published": true }
  ]
}`;

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function jsonToTs(val: unknown, name: string, interfaces: Map<string, string>, useOptional: boolean, useReadonly: boolean): string {
  const type = inferTsType(val, name, interfaces, useOptional, useReadonly);
  return type;
}

function inferTsType(val: unknown, name: string, interfaces: Map<string, string>, useOptional: boolean, useReadonly: boolean): string {
  if (val === null) return "null";
  if (Array.isArray(val)) {
    if (val.length === 0) return "unknown[]";
    const itemType = inferTsType(val[0], name + "Item", interfaces, useOptional, useReadonly);
    return `${itemType}[]`;
  }
  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    const interfaceName = capitalize(name);
    const lines: string[] = [];
    for (const [key, v] of Object.entries(obj)) {
      const childType = inferTsType(v, key, interfaces, useOptional, useReadonly);
      const optional = useOptional && v === null ? "?" : "";
      const readonly = useReadonly ? "readonly " : "";
      lines.push(`  ${readonly}${key}${optional}: ${childType};`);
    }
    const body = `interface ${interfaceName} {\n${lines.join("\n")}\n}`;
    interfaces.set(interfaceName, body);
    return interfaceName;
  }
  if (typeof val === "string") return "string";
  if (typeof val === "number") return Number.isInteger(val) ? "number" : "number";
  if (typeof val === "boolean") return "boolean";
  return "unknown";
}

export default function JsonToTypescript() {
  const [input, setInput]         = useState("");
  const [output, setOutput]       = useState("");
  const [error, setError]         = useState("");
  const [rootName, setRootName]   = useState("Root");
  const [useOptional, setUseOptional] = useState(true);
  const [useReadonly, setUseReadonly] = useState(false);
  const [exportKw, setExportKw]   = useState(true);
  const [copied, setCopied]       = useState(false);

  const generate = useCallback((val: string, name: string, opt: boolean, ro: boolean, exp: boolean) => {
    setError(""); setOutput("");
    if (!val.trim()) return;
    try {
      const parsed = JSON.parse(val);
      const interfaces = new Map<string, string>();
      jsonToTs(parsed, name || "Root", interfaces, opt, ro);

      const result = Array.from(interfaces.values())
        .reverse()
        .map((i) => exp ? `export ${i}` : i)
        .join("\n\n");
      setOutput(result);
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  }, []);

  const handleInput    = (v: string)  => { setInput(v);   generate(v, rootName, useOptional, useReadonly, exportKw); };
  const handleName     = (v: string)  => { setRootName(v); generate(input, v, useOptional, useReadonly, exportKw); };
  const handleOptional = (v: boolean) => { setUseOptional(v); generate(input, rootName, v, useReadonly, exportKw); };
  const handleReadonly = (v: boolean) => { setUseReadonly(v); generate(input, rootName, useOptional, v, exportKw); };
  const handleExport   = (v: boolean) => { setExportKw(v);   generate(input, rootName, useOptional, useReadonly, v); };

  const copy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const interfaceCount = (output.match(/interface /g) || []).length;

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-blue-500/[0.04] blur-3xl pointer-events-none" />

      <ToolNavbar toolName="JSON to TypeScript" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-blue-500/10 flex items-center justify-center font-mono font-bold text-blue-400 text-sm">TS</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">JSON → TypeScript</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded">interfaces</span>
          </div>
          <p className="text-slate-500 text-sm">Paste JSON and instantly generate TypeScript interfaces. Handles nested objects, arrays, and null values.</p>
        </div>

        {/* Options */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-1.5">
            <span className="font-mono text-[11px] text-slate-500">Root name</span>
            <input value={rootName} onChange={(e) => handleName(e.target.value)}
              className="font-mono text-xs bg-transparent text-slate-300 outline-none w-24" />
          </div>
          {[
            { label: "Optional nulls", val: useOptional, set: handleOptional },
            { label: "Readonly",       val: useReadonly, set: handleReadonly },
            { label: "Export",         val: exportKw,    set: handleExport   },
          ].map(({ label, val, set }) => (
            <label key={label} onClick={() => set(!val)} className="flex items-center gap-2 cursor-pointer bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-1.5">
              <div className={`w-8 h-4 rounded-full transition-all relative ${val ? "bg-blue-500" : "bg-white/10"}`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${val ? "left-4" : "left-0.5"}`} />
              </div>
              <span className="font-mono text-xs text-slate-500">{label}</span>
            </label>
          ))}
          <div className="ml-auto flex gap-2">
            <button onClick={() => handleInput(EXAMPLE)} className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-slate-300 transition-all">Load Example</button>
            <button onClick={() => { setInput(""); setOutput(""); setError(""); }} className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-red-400 transition-all">Clear</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">JSON Input</span>
            <div className="relative">
              <textarea value={input} onChange={(e) => handleInput(e.target.value)}
                placeholder={'{\n  "paste": "your JSON here"\n}'}
                spellCheck={false} rows={22}
                className="w-full font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-slate-300 placeholder-slate-700 outline-none focus:border-blue-500/40 resize-none transition-colors leading-relaxed" />
              {error && (
                <div className="absolute bottom-3 left-3 right-3 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2 flex gap-2">
                  <span className="text-red-400 text-xs">✕</span>
                  <span className="font-mono text-xs text-red-400">{error}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">TypeScript Output</span>
              <div className="flex items-center gap-2">
                {output && <span className="font-mono text-[10px] text-slate-600">{interfaceCount} interface{interfaceCount !== 1 ? "s" : ""}</span>}
                <button onClick={copy} disabled={!output}
                  className={`font-mono text-[11px] px-3 rounded border transition-all ${copied ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300 disabled:opacity-30"}`}>
                  {copied ? "✓ Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <div className="h-[533px] font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 overflow-auto leading-relaxed">
              {!output && <span className="text-slate-700">TypeScript interfaces will appear here...</span>}
              {output && (
                <pre className="text-xs whitespace-pre-wrap">
                  {output.split("\n").map((line, i) => {
                    let cls = "text-slate-300";
                    if (line.startsWith("export interface") || line.startsWith("interface")) cls = "text-blue-400 font-bold";
                    else if (line.includes(": string")) cls = "text-green-400";
                    else if (line.includes(": number")) cls = "text-yellow-400";
                    else if (line.includes(": boolean")) cls = "text-orange-400";
                    else if (line.includes(": null")) cls = "text-slate-500";
                    else if (line.includes("[]")) cls = "text-cyan-400";
                    return <div key={i} className={cls}>{line}</div>;
                  })}
                </pre>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "🔄", title: "Nested Objects", desc: "Creates separate interfaces for each nested object automatically." },
            { icon: "📋", title: "Array Support",  desc: "Infers item types from arrays and generates typed array syntax." },
            { icon: "✨", title: "Options",        desc: "Toggle optional fields, readonly, and export keyword." },
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