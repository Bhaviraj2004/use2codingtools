"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useMemo } from "react";

// ── Types ─────────────────────────────────────────────────────
type OutputLang = "fetch" | "axios" | "got" | "python";

const LANG_META: Record<OutputLang, { label: string; color: string; tag: string; ext: string }> = {
  fetch:  { label: "JS Fetch",   color: "text-yellow-400",  tag: "bg-yellow-500/10  border-yellow-500/20",  ext: "js"  },
  axios:  { label: "Axios",      color: "text-blue-400",    tag: "bg-blue-500/10    border-blue-500/20",    ext: "js"  },
  got:    { label: "Got (Node)", color: "text-emerald-400", tag: "bg-emerald-500/10 border-emerald-500/20", ext: "js"  },
  python: { label: "Python",     color: "text-cyan-400",    tag: "bg-cyan-500/10    border-cyan-500/20",    ext: "py"  },
};

// ── Parser ────────────────────────────────────────────────────
interface ParsedCurl {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string | null;
  isJson: boolean;
  isForm: boolean;
  auth: { user: string; pass: string } | null;
  insecure: boolean;
  params: Record<string, string>;
}

function parseCurl(raw: string): ParsedCurl {
  // Normalize multiline
  const cmd = raw
    .replace(/\\\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^curl\s+/, "");

  const result: ParsedCurl = {
    method: "GET",
    url: "",
    headers: {},
    body: null,
    isJson: false,
    isForm: false,
    auth: null,
    insecure: false,
    params: {},
  };

  // Tokenize
  const tokens: string[] = [];
  let i = 0;
  while (i < cmd.length) {
    if (cmd[i] === " ") { i++; continue; }
    if (cmd[i] === '"' || cmd[i] === "'") {
      const q = cmd[i]; i++;
      let val = "";
      while (i < cmd.length && cmd[i] !== q) {
        if (cmd[i] === "\\" && i + 1 < cmd.length) { i++; val += cmd[i]; }
        else val += cmd[i];
        i++;
      }
      i++;
      tokens.push(val);
    } else {
      let val = "";
      while (i < cmd.length && cmd[i] !== " ") { val += cmd[i]; i++; }
      tokens.push(val);
    }
  }

  let ti = 0;
  while (ti < tokens.length) {
    const t = tokens[ti];

    if (!t.startsWith("-") && (t.startsWith("http://") || t.startsWith("https://"))) {
      result.url = t; ti++; continue;
    }

    if (t === "-X" || t === "--request") {
      result.method = tokens[++ti]?.toUpperCase() ?? "GET"; ti++; continue;
    }

    if (t === "-H" || t === "--header") {
      const hdr = tokens[++ti] ?? "";
      const colonIdx = hdr.indexOf(":");
      if (colonIdx > -1) {
        const key = hdr.slice(0, colonIdx).trim();
        const val = hdr.slice(colonIdx + 1).trim();
        result.headers[key] = val;
        if (key.toLowerCase() === "content-type" && val.toLowerCase().includes("application/json")) result.isJson = true;
        if (key.toLowerCase() === "content-type" && val.toLowerCase().includes("application/x-www-form-urlencoded")) result.isForm = true;
      }
      ti++; continue;
    }

    if (t === "-d" || t === "--data" || t === "--data-raw" || t === "--data-binary") {
      result.body = tokens[++ti] ?? null;
      if (result.method === "GET") result.method = "POST";
      ti++; continue;
    }

    if (t === "--data-urlencode") {
      const val = tokens[++ti] ?? "";
      if (!result.body) result.body = val;
      else result.body += "&" + val;
      result.isForm = true;
      if (result.method === "GET") result.method = "POST";
      ti++; continue;
    }

    if (t === "-F" || t === "--form") {
      const val = tokens[++ti] ?? "";
      if (!result.body) result.body = val;
      else result.body += "&" + val;
      result.isForm = true;
      if (result.method === "GET") result.method = "POST";
      ti++; continue;
    }

    if (t === "-u" || t === "--user") {
      const creds = tokens[++ti] ?? "";
      const [user, pass] = creds.split(":");
      result.auth = { user: user ?? "", pass: pass ?? "" };
      ti++; continue;
    }

    if (t === "-k" || t === "--insecure") { result.insecure = true; ti++; continue; }

    if (t === "--get" || t === "-G") { result.method = "GET"; ti++; continue; }

    // URL without flag
    if (!t.startsWith("-") && !result.url) { result.url = t; ti++; continue; }

    ti++;
  }

  // Extract URL params
  try {
    const u = new URL(result.url);
    u.searchParams.forEach((v, k) => { result.params[k] = v; });
  } catch { /* invalid url, skip */ }

  // Detect JSON body
  if (result.body && !result.isJson) {
    try { JSON.parse(result.body); result.isJson = true; } catch { /* not json */ }
  }

  return result;
}

// ── Code generators ───────────────────────────────────────────
function toFetch(p: ParsedCurl): string {
  const lines: string[] = [];

  // Headers
  const hasHeaders = Object.keys(p.headers).length > 0 || p.auth;
  let headersVar = "";
  if (hasHeaders) {
    const allHeaders = { ...p.headers };
    if (p.auth) {
      allHeaders["Authorization"] = `Basic ${btoa(`${p.auth.user}:${p.auth.pass}`)}`;
    }
    headersVar = JSON.stringify(allHeaders, null, 2);
  }

  // Body
  let bodyStr = "";
  if (p.body) {
    if (p.isJson) {
      try { bodyStr = `JSON.stringify(${JSON.stringify(JSON.parse(p.body), null, 2)})`; }
      catch { bodyStr = `\`${p.body}\``; }
    } else {
      bodyStr = `"${p.body.replace(/"/g, '\\"')}"`;
    }
  }

  lines.push(`const response = await fetch("${p.url}", {`);
  lines.push(`  method: "${p.method}",`);
  if (hasHeaders) {
    lines.push(`  headers: ${headersVar.replace(/\n/g, "\n  ")},`);
  }
  if (bodyStr) lines.push(`  body: ${bodyStr},`);
  lines.push(`});`);
  lines.push(``);
  lines.push(`const data = await response.json();`);
  lines.push(`console.log(data);`);

  return lines.join("\n");
}

function toAxios(p: ParsedCurl): string {
  const lines: string[] = [];

  const allHeaders = { ...p.headers };
  if (p.auth) allHeaders["Authorization"] = `Basic ${btoa(`${p.auth.user}:${p.auth.pass}`)}`;

  lines.push(`import axios from "axios";`);
  lines.push(``);
  lines.push(`const response = await axios({`);
  lines.push(`  method: "${p.method.toLowerCase()}",`);
  lines.push(`  url: "${p.url}",`);

  if (Object.keys(allHeaders).length > 0) {
    lines.push(`  headers: ${JSON.stringify(allHeaders, null, 2).replace(/\n/g, "\n  ")},`);
  }

  if (p.body) {
    if (p.isJson) {
      try { lines.push(`  data: ${JSON.stringify(JSON.parse(p.body), null, 2).replace(/\n/g, "\n  ")},`); }
      catch { lines.push(`  data: "${p.body}",`); }
    } else {
      lines.push(`  data: "${p.body}",`);
    }
  }

  lines.push(`});`);
  lines.push(``);
  lines.push(`console.log(response.data);`);

  return lines.join("\n");
}

function toGot(p: ParsedCurl): string {
  const lines: string[] = [];

  const allHeaders = { ...p.headers };
  if (p.auth) allHeaders["Authorization"] = `Basic ${btoa(`${p.auth.user}:${p.auth.pass}`)}`;

  lines.push(`import got from "got";`);
  lines.push(``);
  lines.push(`const response = await got("${p.url}", {`);
  lines.push(`  method: "${p.method}",`);

  if (Object.keys(allHeaders).length > 0) {
    lines.push(`  headers: ${JSON.stringify(allHeaders, null, 2).replace(/\n/g, "\n  ")},`);
  }

  if (p.body) {
    if (p.isJson) {
      try { lines.push(`  json: ${JSON.stringify(JSON.parse(p.body), null, 2).replace(/\n/g, "\n  ")},`); }
      catch { lines.push(`  body: "${p.body}",`); }
    } else {
      lines.push(`  body: "${p.body}",`);
    }
  }

  lines.push(`}).json();`);
  lines.push(``);
  lines.push(`console.log(response);`);

  return lines.join("\n");
}

function toPython(p: ParsedCurl): string {
  const lines: string[] = [];

  lines.push(`import requests`);
  lines.push(``);

  const allHeaders = { ...p.headers };
  const hasHeaders = Object.keys(allHeaders).length > 0;

  if (hasHeaders) lines.push(`headers = ${JSON.stringify(allHeaders, null, 4).replace(/\n/g, "\n")}`);

  if (p.auth) lines.push(`auth = ("${p.auth.user}", "${p.auth.pass}")`);

  if (p.body) {
    if (p.isJson) {
      try { lines.push(`payload = ${JSON.stringify(JSON.parse(p.body), null, 4)}`); }
      catch { lines.push(`payload = '${p.body}'`); }
    } else {
      lines.push(`payload = "${p.body}"`);
    }
  }

  lines.push(``);
  const method = p.method.toLowerCase();
  const args: string[] = [`"${p.url}"`];
  if (hasHeaders) args.push(`headers=headers`);
  if (p.auth) args.push(`auth=auth`);
  if (p.body) args.push(p.isJson ? `json=payload` : `data=payload`);

  lines.push(`response = requests.${method}(`);
  args.forEach((a, i) => lines.push(`    ${a}${i < args.length - 1 ? "," : ""}`));
  lines.push(`)`);
  lines.push(``);
  lines.push(`print(response.json())`);

  return lines.join("\n");
}

const GENERATORS: Record<OutputLang, (p: ParsedCurl) => string> = {
  fetch:  toFetch,
  axios:  toAxios,
  got:    toGot,
  python: toPython,
};

// ── Examples ──────────────────────────────────────────────────
const EXAMPLES = [
  {
    label: "GET with headers",
    curl: `curl -X GET "https://api.example.com/users" \\\n  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.token" \\\n  -H "Accept: application/json"`,
  },
  {
    label: "POST JSON",
    curl: `curl -X POST "https://api.example.com/users" \\\n  -H "Content-Type: application/json" \\\n  -d '{"name":"Rohan","email":"rohan@example.com","age":28}'`,
  },
  {
    label: "PUT with auth",
    curl: `curl -X PUT "https://api.example.com/users/1" \\\n  -u admin:secret123 \\\n  -H "Content-Type: application/json" \\\n  -d '{"name":"Rohan Kumar","active":true}'`,
  },
  {
    label: "DELETE",
    curl: `curl -X DELETE "https://api.example.com/users/42" \\\n  -H "Authorization: Bearer mytoken123"`,
  },
  {
    label: "Form data",
    curl: `curl -X POST "https://api.example.com/login" \\\n  -H "Content-Type: application/x-www-form-urlencoded" \\\n  -d "username=rohan&password=secret123"`,
  },
];

// Simple syntax highlighter
function highlight(code: string, lang: OutputLang): JSX.Element[] {
  const isPython = lang === "python";
  return code.split("\n").map((line, i) => {
    const tokens = line.split(/(\s+|"[^"]*"|'[^']*'|`[^`]*`|\/\/.*|#.*|\b(?:const|await|import|from|async|function|return|print)\b)/g);
    return (
      <div key={i}>
        {tokens.map((tok, ti) => {
          let cls = "text-slate-300";
          if (/^["'`]/.test(tok)) cls = "text-emerald-400";
          else if (/^\/\/|^#/.test(tok)) cls = "text-slate-600 italic";
          else if (/^\b(const|await|import|from|async|function|return|print)\b$/.test(tok)) cls = "text-violet-400";
          else if (/^(fetch|axios|got|requests)\b/.test(tok)) cls = "text-yellow-400";
          else if (/^(method|headers|body|data|url|json|auth)\b/.test(tok)) cls = "text-cyan-400";
          return <span key={ti} className={cls}>{tok}</span>;
        })}
      </div>
    );
  });
}

export default function CurlToFetch() {
  const [input, setInput]     = useState("");
  const [lang, setLang]       = useState<OutputLang>("fetch");
  const [copied, setCopied]   = useState(false);
  const [activeEx, setActiveEx] = useState<string | null>(null);

  const parsed = useMemo(() => {
    if (!input.trim()) return null;
    try { return parseCurl(input); } catch { return null; }
  }, [input]);

  const output = useMemo(() => {
    if (!parsed) return "";
    try { return GENERATORS[lang](parsed); } catch { return ""; }
  }, [parsed, lang]);

  const copy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const loadExample = (ex: typeof EXAMPLES[0]) => {
    setInput(ex.curl);
    setActiveEx(ex.label);
  };

  const meta = LANG_META[lang];

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-yellow-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-blue-500/[0.04] blur-3xl pointer-events-none" />

      {/* NAV */}
               <ToolNavbar toolName="Curl to Fetch" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-yellow-500/10 flex items-center justify-center font-mono font-bold text-yellow-400 text-sm">$_</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Curl → Fetch</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded">4 outputs</span>
          </div>
          <p className="text-slate-500 text-sm">
            Paste a curl command and instantly get JS Fetch, Axios, Got, or Python requests code. Handles headers, auth, JSON body, form data, and more.
          </p>
        </div>

        {/* Examples */}
        <div className="flex flex-wrap gap-2 mb-5">
          <span className="font-mono text-[11px] text-slate-600 self-center uppercase tracking-wider">Examples:</span>
          {EXAMPLES.map((ex) => (
            <button key={ex.label} onClick={() => loadExample(ex)}
              className={`font-mono text-[11px] px-3 py-1.5 border rounded transition-all ${
                activeEx === ex.label
                  ? "bg-yellow-500/15 border-yellow-500/30 text-yellow-400"
                  : "border-white/[0.08] text-slate-500 hover:text-yellow-400 hover:border-yellow-500/30"
              }`}>
              {ex.label}
            </button>
          ))}
        </div>

        {/* Output language */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <span className="font-mono text-[11px] text-slate-600 uppercase tracking-wider">Convert to:</span>
          {(Object.keys(LANG_META) as OutputLang[]).map((l) => (
            <button key={l} onClick={() => setLang(l)}
              className={`font-mono text-xs px-3 py-1.5 rounded border transition-all ${
                lang === l ? `${LANG_META[l].tag} font-bold` : "border-white/[0.08] text-slate-600 hover:text-slate-300"
              }`}>
              {LANG_META[l].label}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            <button onClick={() => { setInput(""); setActiveEx(null); }}
              className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-red-400 hover:border-red-500/30 transition-all">
              Clear
            </button>
          </div>
        </div>

        {/* Editors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">

          {/* Input */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">curl command</span>
              {parsed && (
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-[11px] px-2 py-0.5 rounded border ${
                    parsed.method === "GET" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                    parsed.method === "POST" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                    parsed.method === "PUT" ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" :
                    parsed.method === "DELETE" ? "bg-red-500/10 border-red-500/20 text-red-400" :
                    "bg-white/[0.06] text-slate-400"
                  }`}>{parsed.method}</span>
                </div>
              )}
            </div>
            <textarea value={input} onChange={(e) => { setInput(e.target.value); setActiveEx(null); }}
              placeholder={"curl -X POST \"https://api.example.com/users\" \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\"name\":\"Rohan\"}'"}
              spellCheck={false} rows={16}
              className="w-full font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 text-slate-300 placeholder-slate-700 outline-none focus:border-yellow-500/30 resize-none transition-colors leading-relaxed" />
          </div>

          {/* Output */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className={`font-mono text-[11px] uppercase tracking-[2px] ${meta.color}`}>
                {meta.label} Output
              </span>
              <button onClick={copy} disabled={!output}
                className={`font-mono text-[11px] px-3 rounded border transition-all ${copied ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300 disabled:opacity-30"}`}>
                {copied ? "✓ Copied!" : "Copy"}
              </button>
            </div>
            <div className="h-[397px] font-mono bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 overflow-auto leading-relaxed">
              {!output && !input && <span className="text-slate-700 text-sm">Converted code will appear here...</span>}
              {input && !output && <span className="text-red-400 text-sm font-mono">Invalid or unrecognized curl command</span>}
              {output && <pre className="text-xs">{highlight(output, lang)}</pre>}
            </div>
          </div>
        </div>

        {/* Parsed details */}
        {parsed && (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 mb-5">
            <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-4">Parsed Details</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Method",  val: parsed.method, color: parsed.method === "GET" ? "text-emerald-400" : parsed.method === "POST" ? "text-blue-400" : parsed.method === "DELETE" ? "text-red-400" : "text-yellow-400" },
                { label: "Headers", val: `${Object.keys(parsed.headers).length}`, color: "text-cyan-400" },
                { label: "Body",    val: parsed.body ? (parsed.isJson ? "JSON" : parsed.isForm ? "Form" : "Raw") : "None", color: parsed.body ? "text-orange-400" : "text-slate-600" },
                { label: "Auth",    val: parsed.auth ? `Basic (${parsed.auth.user})` : "None", color: parsed.auth ? "text-violet-400" : "text-slate-600" },
              ].map((item) => (
                <div key={item.label} className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2.5">
                  <div className="font-mono text-[10px] text-slate-700 mb-0.5">{item.label}</div>
                  <div className={`font-mono text-sm font-bold ${item.color}`}>{item.val}</div>
                </div>
              ))}
            </div>
            {parsed.url && (
              <div className="mt-3 bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2.5">
                <div className="font-mono text-[10px] text-slate-700 mb-0.5">URL</div>
                <div className="font-mono text-xs text-slate-400 break-all">{parsed.url}</div>
              </div>
            )}
            {Object.keys(parsed.headers).length > 0 && (
              <div className="mt-3">
                <div className="font-mono text-[10px] text-slate-700 mb-2">Headers</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(parsed.headers).map(([k, v]) => (
                    <div key={k} className="font-mono text-[11px] px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded">
                      {k}: <span className="text-slate-400">{v.length > 30 ? v.slice(0, 30) + "…" : v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[
            { icon: "🔑", title: "Auth",      desc: "Handles -u user:pass as Basic auth header." },
            { icon: "📋", title: "JSON Body", desc: "Auto-detects and pretty-formats JSON payloads." },
            { icon: "🔗", title: "Headers",   desc: "All -H headers mapped correctly to output." },
            { icon: "4",   title: "Outputs",  desc: "Fetch, Axios, Got (Node.js), Python requests." },
          ].map((c) => (
            <div key={c.title} className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-4 py-4">
              <div className="text-xl mb-2 font-mono font-bold text-yellow-400">{c.icon}</div>
              <div className="font-semibold text-slate-300 text-sm mb-1">{c.title}</div>
              <div className="text-slate-600 text-xs leading-relaxed">{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}