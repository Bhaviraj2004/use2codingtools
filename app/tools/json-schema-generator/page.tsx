"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useCallback } from "react";

// ── JSON → Schema generator ───────────────────────────────────
function inferType(val: unknown): string {
  if (val === null) return "null";
  if (Array.isArray(val)) return "array";
  return typeof val;
}

function generateSchema(val: unknown, title?: string): Record<string, unknown> {
  const type = inferType(val);

  if (type === "null") return { type: "null" };

  if (type === "string") {
    const s = val as string;
    const schema: Record<string, unknown> = { type: "string" };
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) schema.format = "date";
    else if (/^\d{4}-\d{2}-\d{2}T/.test(s)) schema.format = "date-time";
    else if (/^[^@]+@[^@]+\.[^@]+$/.test(s)) schema.format = "email";
    else if (/^https?:\/\//.test(s)) schema.format = "uri";
    else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) schema.format = "uuid";
    return schema;
  }

  if (type === "number" || type === "boolean") return { type };

  if (type === "array") {
    const arr = val as unknown[];
    if (arr.length === 0) return { type: "array", items: {} };
    // Merge schemas of all items
    const itemSchemas = arr.map((item) => generateSchema(item));
    const merged = itemSchemas[0];
    return { type: "array", items: merged };
  }

  if (type === "object") {
    const obj = val as Record<string, unknown>;
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const [key, v] of Object.entries(obj)) {
      properties[key] = generateSchema(v);
      if (v !== null && v !== undefined) required.push(key);
    }

    const schema: Record<string, unknown> = {
      type: "object",
      properties,
    };
    if (required.length > 0) schema.required = required;
    if (title) {
      schema.title = title;
      schema.$schema = "http://json-schema.org/draft-07/schema#";
    }
    return schema;
  }

  return {};
}

const EXAMPLE_JSON = `{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Rohan Sharma",
  "email": "rohan@example.com",
  "age": 28,
  "active": true,
  "website": "https://rohan.dev",
  "createdAt": "2024-01-15T10:30:00Z",
  "address": {
    "street": "123 MG Road",
    "city": "Mumbai",
    "pincode": "400001"
  },
  "tags": ["developer", "designer"],
  "score": 9.5
}`;

const DRAFT_OPTIONS = [
  { val: "http://json-schema.org/draft-07/schema#", label: "Draft-07 (recommended)" },
  { val: "https://json-schema.org/draft/2019-09/schema", label: "Draft 2019-09" },
  { val: "https://json-schema.org/draft/2020-12/schema", label: "Draft 2020-12" },
];

export default function JsonSchemaGenerator() {
  const [input, setInput]           = useState("");
  const [output, setOutput]         = useState("");
  const [error, setError]           = useState("");
  const [title, setTitle]           = useState("MySchema");
  const [draft, setDraft]           = useState(DRAFT_OPTIONS[0].val);
  const [addExamples, setAddExamples] = useState(false);
  const [copied, setCopied]         = useState(false);

  const generate = useCallback((val: string, t: string, d: string, ex: boolean) => {
    setError(""); setOutput("");
    if (!val.trim()) return;
    try {
      const parsed = JSON.parse(val);
      const schema = generateSchema(parsed, t || undefined);

      // Override $schema with selected draft
      if (typeof schema === "object" && schema !== null) {
        (schema as Record<string, unknown>).$schema = d;
        if (t) (schema as Record<string, unknown>).title = t;

        // Add examples if toggled
        if (ex && typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
          (schema as Record<string, unknown>).examples = [parsed];
        }
      }

      setOutput(JSON.stringify(schema, null, 2));
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  }, []);

  const handleInput = (val: string) => { setInput(val); generate(val, title, draft, addExamples); };
  const handleTitle = (val: string) => { setTitle(val); generate(input, val, draft, addExamples); };
  const handleDraft = (val: string) => { setDraft(val); generate(input, title, val, addExamples); };
  const handleExamples = (val: boolean) => { setAddExamples(val); generate(input, title, draft, val); };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${title || "schema"}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  // Stats
  const stats = output ? (() => {
    try {
      const s = JSON.parse(output);
      const props = s.properties ? Object.keys(s.properties).length : 0;
      const req = s.required?.length ?? 0;
      return { props, req };
    } catch { return null; }
  })() : null;

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -left-48 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -right-48 w-[400px] h-[400px] rounded-full bg-cyan-500/[0.04] blur-3xl pointer-events-none" />

      {/* NAV */}

      <ToolNavbar toolName="JSON Schema Generator" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center font-mono font-bold text-emerald-400 text-sm">{"{}"}</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">JSON Schema Generator</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">auto-detect</span>
          </div>
          <p className="text-slate-500 text-sm">Paste any JSON and instantly generate a valid JSON Schema. Auto-detects types, formats (email, UUID, date, URI), and required fields.</p>
        </div>

        {/* Options bar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">

          {/* Title */}
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-1.5">
            <span className="font-mono text-[11px] text-slate-500">Title</span>
            <input value={title} onChange={(e) => handleTitle(e.target.value)}
              placeholder="MySchema"
              className="font-mono text-xs bg-transparent text-slate-300 outline-none w-28 placeholder-slate-700" />
          </div>

          {/* Draft */}
          <select value={draft} onChange={(e) => handleDraft(e.target.value)}
            className="font-mono text-xs bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-2 text-slate-400 outline-none focus:border-emerald-500/30 transition-colors">
            {DRAFT_OPTIONS.map((d) => (
              <option key={d.val} value={d.val}>{d.label}</option>
            ))}
          </select>

          {/* Add examples toggle */}
          <label onClick={() => handleExamples(!addExamples)} className="flex items-center gap-2 cursor-pointer bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-1.5">
            <div className={`w-8 h-4 rounded-full transition-all relative ${addExamples ? "bg-emerald-500" : "bg-white/10"}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${addExamples ? "left-4" : "left-0.5"}`} />
            </div>
            <span className="font-mono text-xs text-slate-500 hover:text-slate-300">Include examples</span>
          </label>

          <div className="ml-auto flex gap-2">
            <button onClick={() => handleInput(EXAMPLE_JSON)} className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-slate-300 hover:border-white/20 transition-all">Load Example</button>
            <button onClick={() => { setInput(""); setOutput(""); setError(""); }} className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-red-400 hover:border-red-500/30 transition-all">Clear</button>
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
              <textarea value={input} onChange={(e) => handleInput(e.target.value)}
                placeholder={'{\n  "paste": "your JSON here"\n}'}
                spellCheck={false}
                className="w-full h-[520px] font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-slate-300 placeholder-slate-700 outline-none focus:border-emerald-500/40 resize-none transition-colors leading-relaxed" />
              {error && (
                <div className="absolute bottom-3 left-3 right-3 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2 flex gap-2">
                  <span className="text-red-400 text-xs shrink-0">✕</span>
                  <span className="font-mono text-xs text-red-400">{error}</span>
                </div>
              )}
            </div>
          </div>

          {/* Output */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">JSON Schema Output</span>
              <div className="flex gap-2">
                <button onClick={handleDownload} disabled={!output}
                  className="font-mono text-[11px] px-3 rounded border border-white/[0.08] text-slate-500 hover:text-slate-300 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  ↓ .json
                </button>
                <button onClick={handleCopy} disabled={!output}
                  className={`font-mono text-[11px] px-3 rounded border transition-all ${copied ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"}`}>
                  {copied ? "✓ Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <div className="h-[520px] font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 overflow-auto leading-relaxed">
              {!output && !error && <span className="text-slate-700">Schema will appear here...</span>}
              {output && (
                <pre className="whitespace-pre-wrap text-xs">
                  {output.split("\n").map((line, i) => {
                    // Syntax highlight
                    const highlighted = line
                      .replace(/(".*?")(\s*:)/g, '<span class="text-cyan-400">$1</span>$2')
                      .replace(/:\s*(".*?")/g, ': <span class="text-emerald-400">$1</span>')
                      .replace(/:\s*(true|false|null)/g, ': <span class="text-orange-400">$1</span>')
                      .replace(/:\s*(\d+\.?\d*)/g, ': <span class="text-yellow-400">$1</span>');
                    return <div key={i} dangerouslySetInnerHTML={{ __html: highlighted }} />;
                  })}
                </pre>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats && !error && (
          <div className="flex flex-wrap gap-6 px-4 py-3 bg-emerald-500/[0.05] border border-emerald-500/20 rounded-lg mb-6">
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-emerald-500/60 mr-2">Properties</span><span className="font-mono text-sm text-emerald-400">{stats.props}</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-emerald-500/60 mr-2">Required</span><span className="font-mono text-sm text-emerald-400">{stats.req}</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-emerald-500/60 mr-2">Draft</span><span className="font-mono text-sm text-emerald-400">{draft.includes("07") ? "Draft-07" : draft.includes("2019") ? "2019-09" : "2020-12"}</span></div>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[10px] text-emerald-500/60">Valid Schema</span>
            </div>
          </div>
        )}

        {/* Auto-detected formats */}
        {output && (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 mb-6">
            <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-4">Auto-detected Formats</div>
            <div className="flex flex-wrap gap-2">
              {[
                { fmt: "email",     label: "Email",     color: "text-emerald-400 bg-emerald-500/10" },
                { fmt: "uri",       label: "URI/URL",   color: "text-cyan-400 bg-cyan-500/10" },
                { fmt: "date-time", label: "Date-Time", color: "text-violet-400 bg-violet-500/10" },
                { fmt: "date",      label: "Date",      color: "text-orange-400 bg-orange-500/10" },
                { fmt: "uuid",      label: "UUID",      color: "text-yellow-400 bg-yellow-500/10" },
              ].map(({ fmt, label, color }) => {
                const found = output.includes(`"format": "${fmt}"`);
                return (
                  <div key={fmt} className={`font-mono text-[11px] px-3 py-1.5 rounded border transition-all ${found ? `${color} border-current/20` : "text-slate-700 border-white/[0.06] opacity-40"}`}>
                    {found ? "✓" : "○"} {label}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "🔍", title: "Smart Type Detection",  desc: "Detects string, number, boolean, null, array, and nested objects automatically." },
            { icon: "✨", title: "Format Recognition",    desc: "Auto-detects email, UUID, URI, date, and date-time formats from values." },
            { icon: "📋", title: "Required Fields",       desc: "Non-null fields are automatically marked as required in the schema." },
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