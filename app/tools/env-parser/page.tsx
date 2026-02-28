"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useCallback, useRef } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
type EnvEntry = {
  key: string;
  value: string;
  comment: string;
  type: "string" | "number" | "boolean" | "url" | "empty" | "json";
  isComment: boolean;
  isBlank: boolean;
  lineNum: number;
  hasQuotes: boolean;
  quoteChar: string;
  isSecret: boolean;
};

type OutputFormat = "json" | "yaml" | "dotenv" | "export" | "typescript";
type ViewMode = "table" | "raw";

// ── Helpers ────────────────────────────────────────────────────────────────
const SECRET_PATTERNS = /secret|password|passwd|token|key|auth|api_key|private|credential|cert|jwt|session|salt|seed|webhook/i;

function detectType(val: string): EnvEntry["type"] {
  if (val === "") return "empty";
  if (val === "true" || val === "false") return "boolean";
  if (!isNaN(Number(val)) && val.trim() !== "") return "number";
  try { JSON.parse(val); if (typeof JSON.parse(val) === "object") return "json"; } catch {}
  if (/^https?:\/\/.+/i.test(val) || /^postgres(ql)?:\/\/.+/i.test(val) || /^mysql:\/\/.+/i.test(val) || /^mongodb(\+srv)?:\/\/.+/i.test(val) || /^redis:\/\/.+/i.test(val)) return "url";
  return "string";
}

function stripQuotes(raw: string): { value: string; hasQuotes: boolean; quoteChar: string } {
  const dq = raw.match(/^"([\s\S]*)"$/);
  if (dq) return { value: dq[1].replace(/\\n/g, "\n").replace(/\\t/g, "\t"), hasQuotes: true, quoteChar: '"' };
  const sq = raw.match(/^'([\s\S]*)'$/);
  if (sq) return { value: sq[1], hasQuotes: true, quoteChar: "'" };
  const bq = raw.match(/^`([\s\S]*)`$/);
  if (bq) return { value: bq[1], hasQuotes: true, quoteChar: "`" };
  return { value: raw, hasQuotes: false, quoteChar: "" };
}

// ── Parser ─────────────────────────────────────────────────────────────────
function parseEnv(text: string): EnvEntry[] {
  const lines = text.split("\n");
  const entries: EnvEntry[] = [];
  let pendingComment = "";

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (trimmed === "") {
      pendingComment = "";
      entries.push({ key: "", value: "", comment: "", type: "empty", isComment: false, isBlank: true, lineNum: i + 1, hasQuotes: false, quoteChar: "", isSecret: false });
      continue;
    }

    if (trimmed.startsWith("#")) {
      const commentText = trimmed.slice(1).trim();
      pendingComment = commentText;
      entries.push({ key: "", value: trimmed, comment: commentText, type: "string", isComment: true, isBlank: false, lineNum: i + 1, hasQuotes: false, quoteChar: "", isSecret: false });
      continue;
    }

    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) {
      pendingComment = "";
      continue;
    }

    const key = trimmed.slice(0, eqIdx).trim();
    const rawVal = trimmed.slice(eqIdx + 1).trim();
    const { value, hasQuotes, quoteChar } = stripQuotes(rawVal);
    const type = detectType(value);
    const isSecret = SECRET_PATTERNS.test(key);

    entries.push({
      key, value, comment: pendingComment,
      type, isComment: false, isBlank: false,
      lineNum: i + 1, hasQuotes, quoteChar,
      isSecret,
    });
    pendingComment = "";
  }

  return entries;
}

// ── Serializers ────────────────────────────────────────────────────────────
function toJson(entries: EnvEntry[]): string {
  const obj: Record<string, string | number | boolean> = {};
  entries.filter(e => !e.isComment && !e.isBlank && e.key).forEach(e => {
    if (e.type === "number") obj[e.key] = Number(e.value);
    else if (e.type === "boolean") obj[e.key] = e.value === "true";
    else obj[e.key] = e.value;
  });
  return JSON.stringify(obj, null, 2);
}

function toYaml(entries: EnvEntry[]): string {
  const lines: string[] = [];
  entries.filter(e => !e.isComment && !e.isBlank && e.key).forEach(e => {
    const needsQuote = /[:#{}[\]|>&*!,]/.test(e.value) || e.value.includes("\n");
    const val = needsQuote ? `"${e.value.replace(/"/g, '\\"')}"` : (e.value || '""');
    if (e.comment) lines.push(`# ${e.comment}`);
    lines.push(`${e.key}: ${val}`);
  });
  return lines.join("\n");
}

function toDotenv(entries: EnvEntry[]): string {
  return entries.map(e => {
    if (e.isBlank) return "";
    if (e.isComment) return e.value;
    if (!e.key) return "";
    const needsQuote = e.value.includes(" ") || e.value.includes("#") || e.value === "";
    const val = needsQuote ? `"${e.value}"` : e.value;
    return `${e.key}=${val}`;
  }).join("\n");
}

function toExport(entries: EnvEntry[]): string {
  return entries.filter(e => !e.isComment && !e.isBlank && e.key)
    .map(e => `export ${e.key}="${e.value.replace(/"/g, '\\"')}"`)
    .join("\n");
}

function toTypeScript(entries: EnvEntry[]): string {
  const vars = entries.filter(e => !e.isComment && !e.isBlank && e.key);
  const typeLines = vars.map(e => {
    const tsType = e.type === "number" ? "number" : e.type === "boolean" ? "boolean" : "string";
    return `  ${e.key}: ${tsType};`;
  });
  const valLines = vars.map(e => `  ${e.key}: process.env.${e.key}!,`);
  return `// Auto-generated from .env\n\ninterface Env {\n${typeLines.join("\n")}\n}\n\nexport const env: Env = {\n${valLines.join("\n")}\n};`;
}

function serializeEntries(entries: EnvEntry[], fmt: OutputFormat): string {
  switch (fmt) {
    case "json":       return toJson(entries);
    case "yaml":       return toYaml(entries);
    case "dotenv":     return toDotenv(entries);
    case "export":     return toExport(entries);
    case "typescript": return toTypeScript(entries);
  }
}

// ── Type badge ─────────────────────────────────────────────────────────────
const TYPE_COLORS: Record<EnvEntry["type"], string> = {
  string:  "bg-blue-500/15 text-blue-400 border-blue-500/25",
  number:  "bg-purple-500/15 text-purple-400 border-purple-500/25",
  boolean: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  url:     "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
  empty:   "bg-white/[0.06] text-slate-600 border-white/[0.08]",
  json:    "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
};

const EXAMPLE_ENV = `# App Config
APP_NAME=MyAwesomeApp
APP_ENV=production
APP_PORT=3000
APP_DEBUG=false

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
DB_POOL_SIZE=10
DB_SSL=true

# Auth & Secrets
JWT_SECRET=super_secret_jwt_key_change_in_prod
API_KEY=sk-1234567890abcdef
SESSION_SECRET=my_session_secret

# Redis
REDIS_URL=redis://localhost:6379
REDIS_TTL=3600

# External APIs
STRIPE_SECRET_KEY=sk_live_abc123
SENDGRID_API_KEY=SG.xxxx
WEBHOOK_SECRET=whsec_xxxx

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_BETA=false
MAX_UPLOAD_SIZE=10485760

# Empty value
OPTIONAL_CONFIG=
`;

const OUTPUT_FORMATS: { key: OutputFormat; label: string; note: string }[] = [
  { key: "json",       label: "JSON",       note: "Object with typed values"   },
  { key: "yaml",       label: "YAML",       note: "YAML key: value format"     },
  { key: "dotenv",     label: ".env",       note: "Clean .env output"          },
  { key: "export",     label: "export",     note: "Shell export statements"    },
  { key: "typescript", label: "TypeScript", note: "Typed env interface"        },
];

// ── Component ──────────────────────────────────────────────────────────────
export default function EnvParser() {
  const [input, setInput]       = useState("");
  const [entries, setEntries]   = useState<EnvEntry[]>([]);
  const [outFmt, setOutFmt]     = useState<OutputFormat>("json");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [copied, setCopied]     = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState(false);
  const [editIdx, setEditIdx]   = useState<number | null>(null);
  const [editVal, setEditVal]   = useState("");
  const [search, setSearch]     = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parse = useCallback((text: string) => {
    setEntries(parseEnv(text));
  }, []);

  const handleInput = (val: string) => {
    setInput(val);
    parse(val);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      setInput(text);
      parse(text);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleLoadExample = () => {
    setInput(EXAMPLE_ENV);
    parse(EXAMPLE_ENV);
  };

  const handleClear = () => {
    setInput(""); setEntries([]); setSearch("");
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1600);
  };

  // Inline edit
  const startEdit = (idx: number, val: string) => {
    setEditIdx(idx); setEditVal(val);
  };

  const commitEdit = (idx: number) => {
    const entry = entries[idx];
    if (!entry) return;
    const newEntries = [...entries];
    newEntries[idx] = { ...entry, value: editVal, type: detectType(editVal) };
    setEntries(newEntries);
    // Sync input
    const lines = input.split("\n");
    lines[entry.lineNum - 1] = `${entry.key}=${editVal}`;
    setInput(lines.join("\n"));
    setEditIdx(null);
  };

  const handleDeleteEntry = (idx: number) => {
    const entry = entries[idx];
    const lines = input.split("\n");
    lines.splice(entry.lineNum - 1, 1);
    const newInput = lines.join("\n");
    setInput(newInput);
    parse(newInput);
  };

  const outputText = serializeEntries(entries, outFmt);

  // Stats
  const realEntries = entries.filter(e => !e.isComment && !e.isBlank && e.key);
  const secretCount = realEntries.filter(e => e.isSecret).length;
  const typeCounts  = realEntries.reduce((acc, e) => { acc[e.type] = (acc[e.type] || 0) + 1; return acc; }, {} as Record<string, number>);

  // Filtered for table
  const filtered = entries.filter(e => {
    if (!search) return true;
    if (e.isBlank) return false;
    return e.key.toLowerCase().includes(search.toLowerCase()) || e.value.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      {/* BG */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-orange-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

      <ToolNavbar toolName="ENV Parser" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-orange-500/10 flex items-center justify-center font-mono font-bold text-orange-400 text-sm">.env</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">ENV Parser</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded">client-side</span>
          </div>
          <p className="text-slate-500 text-sm">
            Parse, validate, edit, and convert <code className="text-orange-400 font-mono text-xs">.env</code> files — to JSON, YAML, TypeScript, shell exports and more.
          </p>
        </div>

        {/* Options bar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-md px-1.5 py-1.5">
            {(["table", "raw"] as ViewMode[]).map(v => (
              <button key={v} onClick={() => setViewMode(v)}
                className={`font-mono text-xs px-3 py-0.5 rounded transition-all capitalize
                  ${viewMode === v ? "bg-orange-500/20 text-orange-400" : "text-slate-500 hover:text-slate-300"}`}>
                {v === "table" ? "⊞ Table" : "☰ Raw"}
              </button>
            ))}
          </div>

          {/* Secret toggle */}
          <label onClick={() => setShowSecrets(p => !p)}
            className="flex items-center gap-2 cursor-pointer group bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-1.5">
            <div className={`w-8 h-4 rounded-full transition-all relative ${showSecrets ? "bg-orange-500" : "bg-white/10"}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${showSecrets ? "left-4" : "left-0.5"}`} />
            </div>
            <span className="font-mono text-xs text-slate-500 group-hover:text-slate-300 transition-colors">Show Secrets</span>
          </label>

          <div className="ml-auto flex gap-2">
            <input type="file" accept=".env,.txt" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()}
              className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-slate-300 hover:border-white/20 transition-all">
              Upload .env
            </button>
            <button onClick={handleLoadExample}
              className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-slate-300 hover:border-white/20 transition-all">
              Load Example
            </button>
            <button onClick={handleClear}
              className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-red-400 hover:border-red-500/30 transition-all">
              Clear
            </button>
          </div>
        </div>

        {/* Main split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">

          {/* ── Left: Input ── */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">.env Input</span>
              <span className="font-mono text-[10px] text-slate-700">{input.split("\n").length} lines</span>
            </div>
            <textarea
              value={input}
              onChange={e => handleInput(e.target.value)}
              placeholder={"Paste your .env file:\n\nAPP_NAME=MyApp\nAPP_PORT=3000\nDATABASE_URL=postgres://...\nJWT_SECRET=your_secret\nDEBUG=true"}
              spellCheck={false}
              className="w-full h-[520px] font-mono text-xs bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-slate-300 placeholder-slate-700 outline-none resize-none leading-relaxed transition-colors focus:border-orange-500/40"
            />
          </div>

          {/* ── Right: Parsed view ── */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">
                {viewMode === "table" ? "Parsed Entries" : `Output — ${OUTPUT_FORMATS.find(f => f.key === outFmt)?.label}`}
              </span>
              {viewMode === "raw" && (
                <button onClick={() => copy(outputText, "output")}
                  className={`font-mono text-[11px] px-3 py-1 rounded border transition-all
                    ${copied === "output" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                  {copied === "output" ? "✓ Copied!" : "Copy"}
                </button>
              )}
            </div>

            {viewMode === "table" ? (
              <div className="flex flex-col gap-2 h-[520px]">
                {/* Search */}
                {entries.length > 0 && (
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search keys or values…"
                    className="font-mono text-xs bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-slate-300 placeholder-slate-600 outline-none focus:border-orange-500/30 transition-colors" />
                )}

                {/* Table */}
                <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                  {entries.length === 0 && (
                    <div className="flex items-center justify-center h-full text-slate-700 font-mono text-sm">
                      Parsed entries will appear here…
                    </div>
                  )}
                  {filtered.map((entry, i) => {
                    if (entry.isBlank) return <div key={i} className="h-3" />;
                    if (entry.isComment) return (
                      <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-md">
                        <span className="font-mono text-xs text-slate-600 italic">{entry.value}</span>
                      </div>
                    );
                    const displayVal = entry.isSecret && !showSecrets ? "•".repeat(Math.min(entry.value.length, 16)) : entry.value;
                    const isEditing = editIdx === i;
                    return (
                      <div key={i}
                        className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg hover:border-white/[0.12] group transition-all">

                        {/* Secret indicator */}
                        {entry.isSecret && (
                          <span title="Secret value" className="text-yellow-500/70 text-xs shrink-0">🔒</span>
                        )}

                        {/* Key */}
                        <span className="font-mono text-xs text-orange-300 shrink-0 min-w-0 max-w-[35%] truncate" title={entry.key}>
                          {entry.key}
                        </span>

                        <span className="text-slate-700 font-mono text-xs shrink-0">=</span>

                        {/* Value (editable) */}
                        {isEditing ? (
                          <input
                            autoFocus
                            value={editVal}
                            onChange={e => setEditVal(e.target.value)}
                            onBlur={() => commitEdit(i)}
                            onKeyDown={e => { if (e.key === "Enter") commitEdit(i); if (e.key === "Escape") setEditIdx(null); }}
                            className="flex-1 bg-orange-500/10 border border-orange-500/30 font-mono text-xs text-slate-200 rounded px-2 py-0.5 outline-none min-w-0"
                          />
                        ) : (
                          <span
                            className="font-mono text-xs text-slate-400 flex-1 truncate cursor-text hover:text-slate-200 transition-colors min-w-0"
                            title={entry.value}
                            onClick={() => startEdit(i, entry.value)}
                          >
                            {displayVal || <span className="text-slate-700 italic">empty</span>}
                          </span>
                        )}

                        {/* Type badge */}
                        <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded border shrink-0 uppercase ${TYPE_COLORS[entry.type]}`}>
                          {entry.type}
                        </span>

                        {/* Actions */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={() => copy(`${entry.key}=${entry.value}`, `entry-${i}`)}
                            className={`font-mono text-[10px] px-1.5 py-0.5 rounded border transition-all
                              ${copied === `entry-${i}` ? "text-emerald-400 border-emerald-500/30" : "border-white/[0.08] text-slate-600 hover:text-slate-300"}`}>
                            {copied === `entry-${i}` ? "✓" : "copy"}
                          </button>
                          <button onClick={() => handleDeleteEntry(i)}
                            className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-white/[0.08] text-slate-600 hover:text-red-400 transition-all">
                            del
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Raw output */
              <div className="flex flex-col gap-2 h-[520px]">
                {/* Format tabs */}
                <div className="flex gap-1 flex-wrap">
                  {OUTPUT_FORMATS.map(f => (
                    <button key={f.key} onClick={() => setOutFmt(f.key)}
                      title={f.note}
                      className={`font-mono text-[11px] px-3 py-1 rounded border transition-all
                        ${outFmt === f.key ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="flex-1 font-mono text-xs bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-slate-300 overflow-auto leading-relaxed">
                  {!outputText && <span className="text-slate-700">Output will appear here…</span>}
                  <pre className="whitespace-pre-wrap">{outputText}</pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats bar */}
        {realEntries.length > 0 && (
          <div className="flex flex-wrap gap-6 px-4 py-3 bg-orange-500/[0.05] border border-orange-500/20 rounded-lg mb-5">
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Total</span><span className="font-mono text-sm text-orange-400">{realEntries.length}</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Secrets</span>
              <span className={`font-mono text-sm ${secretCount > 0 ? "text-yellow-400" : "text-slate-500"}`}>
                {secretCount > 0 ? `🔒 ${secretCount}` : "0"}
              </span>
            </div>
            {Object.entries(typeCounts).map(([type, count]) => (
              <div key={type}>
                <span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">{type}</span>
                <span className="font-mono text-sm text-orange-400">{count}</span>
              </div>
            ))}
            <div className="ml-auto flex items-center gap-3">
              {viewMode === "table" && (
                <button onClick={() => setViewMode("raw")}
                  className="font-mono text-[11px] px-3 py-1 rounded border border-white/[0.08] text-slate-500 hover:text-slate-300 transition-all">
                  Export →
                </button>
              )}
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                <span className="font-mono text-[10px] text-orange-500/60">Parsed</span>
              </div>
            </div>
          </div>
        )}

        {/* Validation warnings */}
        {(() => {
          const warnings: string[] = [];
          const duplicates = realEntries.reduce((acc, e) => { acc[e.key] = (acc[e.key] || 0) + 1; return acc; }, {} as Record<string, number>);
          Object.entries(duplicates).filter(([, c]) => c > 1).forEach(([k]) => warnings.push(`Duplicate key: ${k}`));
          realEntries.filter(e => e.type === "empty").forEach(e => warnings.push(`Empty value: ${e.key}`));
          realEntries.filter(e => e.isSecret && !e.hasQuotes && e.value.includes(" ")).forEach(e => warnings.push(`Secret with spaces, missing quotes: ${e.key}`));
          if (!warnings.length) return null;
          return (
            <div className="mb-5 bg-yellow-500/[0.05] border border-yellow-500/20 rounded-lg p-4">
              <p className="font-mono text-[11px] uppercase tracking-widest text-yellow-500/60 mb-2">⚠ Warnings</p>
              <div className="space-y-1">
                {warnings.map((w, i) => (
                  <p key={i} className="font-mono text-xs text-yellow-400/80">{w}</p>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "🔍", title: "Smart Parser",   desc: "Auto-detects types (string, number, boolean, URL, JSON), strips quotes, parses comments and blank lines." },
            { icon: "🔒", title: "Secret Masking", desc: "Auto-detects secret keys (token, password, key, etc.) and masks their values. Toggle to reveal." },
            { icon: "🔄", title: "5 Export Formats", desc: "Convert .env to JSON, YAML, clean .env, shell export statements, or a typed TypeScript interface." },
          ].map(c => (
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