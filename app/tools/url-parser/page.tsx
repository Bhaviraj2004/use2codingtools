"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useMemo } from "react";

// ── Helpers ───────────────────────────────────────────────────
interface ParsedURL {
  valid: boolean;
  raw: string;
  protocol: string;
  username: string;
  password: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  origin: string;
  host: string;
  tld: string;
  subdomain: string;
  domain: string;
  params: { key: string; value: string }[];
  isSecure: boolean;
  isLocalhost: boolean;
  isIP: boolean;
}

function parseURL(raw: string): ParsedURL {
  const empty: ParsedURL = {
    valid: false, raw, protocol: "", username: "", password: "",
    hostname: "", port: "", pathname: "", search: "", hash: "", origin: "",
    host: "", tld: "", subdomain: "", domain: "", params: [],
    isSecure: false, isLocalhost: false, isIP: false,
  };

  if (!raw.trim()) return empty;

  let urlStr = raw.trim();
  // Auto-add protocol if missing
  if (!/^https?:\/\//i.test(urlStr) && !urlStr.startsWith("//")) {
    urlStr = "https://" + urlStr;
  }

  try {
    const u = new URL(urlStr);

    const hostname = u.hostname;
    const isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.includes(":");
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";

    // Domain decomposition
    let tld = "", subdomain = "", domain = "";
    if (!isIP && !isLocalhost) {
      const parts = hostname.split(".");
      if (parts.length >= 2) {
        tld = parts.slice(-1)[0];
        domain = parts.slice(-2).join(".");
        subdomain = parts.slice(0, -2).join(".");
      }
    }

    // Query params
    const params: { key: string; value: string }[] = [];
    u.searchParams.forEach((value, key) => params.push({ key, value }));

    return {
      valid: true, raw: urlStr,
      protocol: u.protocol.replace(":", ""),
      username: u.username,
      password: u.password,
      hostname: u.hostname,
      port: u.port,
      pathname: u.pathname,
      search: u.search,
      hash: u.hash.replace("#", ""),
      origin: u.origin,
      host: u.host,
      tld, subdomain, domain,
      params,
      isSecure: u.protocol === "https:",
      isLocalhost,
      isIP,
    };
  } catch {
    return empty;
  }
}

function buildURL(parts: {
  protocol: string; username: string; password: string;
  hostname: string; port: string; pathname: string;
  params: { key: string; value: string }[]; hash: string;
}): string {
  try {
    const auth = parts.username
      ? parts.password
        ? `${encodeURIComponent(parts.username)}:${encodeURIComponent(parts.password)}@`
        : `${encodeURIComponent(parts.username)}@`
      : "";
    const port = parts.port ? `:${parts.port}` : "";
    const path = parts.pathname.startsWith("/") ? parts.pathname : `/${parts.pathname}`;
    const query = parts.params.length
      ? "?" + parts.params.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join("&")
      : "";
    const hash = parts.hash ? `#${parts.hash}` : "";
    return `${parts.protocol}://${auth}${parts.hostname}${port}${path}${query}${hash}`;
  } catch {
    return "";
  }
}

const EXAMPLES = [
  { label: "GitHub",     url: "https://github.com/user/repo?tab=readme#section" },
  { label: "API",        url: "https://api.example.com/v2/users?page=1&limit=20&sort=desc" },
  { label: "Auth URL",   url: "https://admin:secret@db.internal.example.com:5432/mydb?ssl=true" },
  { label: "Localhost",  url: "http://localhost:3000/api/health?debug=true" },
  { label: "Complex",    url: "https://www.google.com/search?q=tailwind+css&hl=en&num=10&as_sitesearch=docs.example.com#results" },
];

const ENCODE_PRESETS = [
  { label: "Spaces",    input: "hello world foo bar" },
  { label: "Special",   input: "name=John&age=30&city=New York" },
  { label: "Unicode",   input: "café résumé naïve" },
];

type Tab = "parse" | "build" | "encode";

export default function URLParser() {
  // Parse tab
  const [input, setInput]       = useState("https://api.example.com/v2/users?page=1&limit=20&sort=desc#results");
  const [copied, setCopied]     = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("parse");

  // Build tab
  const [buildProtocol, setBuildProtocol] = useState("https");
  const [buildHost, setBuildHost]     = useState("example.com");
  const [buildPort, setBuildPort]     = useState("");
  const [buildPath, setBuildPath]     = useState("/api/users");
  const [buildUser, setBuildUser]     = useState("");
  const [buildPass, setBuildPass]     = useState("");
  const [buildHash, setBuildHash]     = useState("");
  const [buildParams, setBuildParams] = useState<{ key: string; value: string }[]>([
    { key: "page", value: "1" },
    { key: "limit", value: "20" },
  ]);

  // Encode tab
  const [encodeInput, setEncodeInput] = useState("hello world & foo=bar");
  const [encodeMode, setEncodeMode]   = useState<"encode" | "decode">("encode");

  const parsed = useMemo(() => parseURL(input), [input]);

  const builtURL = useMemo(() => buildURL({
    protocol: buildProtocol,
    username: buildUser,
    password: buildPass,
    hostname: buildHost,
    port: buildPort,
    pathname: buildPath,
    params: buildParams.filter(p => p.key.trim()),
    hash: buildHash,
  }), [buildProtocol, buildHost, buildPort, buildPath, buildUser, buildPass, buildHash, buildParams]);

  const encodeOutput = useMemo(() => {
    try {
      return encodeMode === "encode"
        ? encodeURIComponent(encodeInput)
        : decodeURIComponent(encodeInput);
    } catch { return "⚠️ Invalid input"; }
  }, [encodeInput, encodeMode]);

  const copy = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const addParam = () => setBuildParams(p => [...p, { key: "", value: "" }]);
  const removeParam = (i: number) => setBuildParams(p => p.filter((_, idx) => idx !== i));
  const updateParam = (i: number, field: "key" | "value", val: string) =>
    setBuildParams(p => p.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  // ── Section component ──
  const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
        <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">{label}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );

  const Field = ({ label, value, color = "text-slate-300", copyKey }: { label: string; value: string; color?: string; copyKey?: string }) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-3 py-2 border-b border-white/[0.04] last:border-0 group">
        <span className="font-mono text-[10px] text-slate-600 w-24 shrink-0 pt-0.5">{label}</span>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className={`font-mono text-xs ${color} break-all`}>{value}</span>
          {copyKey && (
            <button onClick={() => copy(value, copyKey)}
              className={`font-mono text-[9px] px-1.5 py-0.5 rounded border transition-all shrink-0 opacity-0 group-hover:opacity-100 ${copied === copyKey ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-700 hover:text-slate-400"}`}>
              {copied === copyKey ? "✓" : "copy"}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-cyan-500/[0.04] blur-3xl pointer-events-none" />

      {/* NAV */}

      <ToolNavbar toolName="url-parser" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center text-lg">🔗</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">URL Parser</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">parse · build · encode</span>
          </div>
          <p className="text-slate-500 text-sm">Break down any URL into its components. Build URLs from parts. Encode or decode query strings — all client-side.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-6">
          {([
            { key: "parse",  label: "🔍 Parse URL"   },
            { key: "build",  label: "🔨 Build URL"   },
            { key: "encode", label: "🔐 Encode / Decode" },
          ] as { key: Tab; label: string }[]).map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`font-mono text-xs px-4 py-2.5 rounded-lg border transition-all ${activeTab === t.key ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── PARSE TAB ── */}
        {activeTab === "parse" && (
          <div className="flex flex-col gap-5">

            {/* Input */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
              <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">URL Input</div>
              <div className="flex gap-2 mb-3">
                <input value={input} onChange={e => setInput(e.target.value)}
                  placeholder="https://example.com/path?key=value#hash"
                  className="flex-1 font-mono text-sm px-4 py-3 bg-black/40 border border-white/[0.08] rounded-xl text-slate-300 placeholder-slate-700 outline-none focus:border-emerald-500/40 transition-colors" />
                <button onClick={() => copy(input, "input-url")}
                  className={`font-mono text-xs px-3 py-2 border rounded-xl transition-all shrink-0 ${copied === "input-url" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                  {copied === "input-url" ? "✓" : "Copy"}
                </button>
              </div>

              {/* Examples */}
              <div className="flex flex-wrap gap-2">
                <span className="font-mono text-[10px] text-slate-700 self-center">Examples:</span>
                {EXAMPLES.map(ex => (
                  <button key={ex.label} onClick={() => setInput(ex.url)}
                    className="font-mono text-[10px] px-2.5 py-1 border border-white/[0.08] text-slate-600 rounded hover:text-emerald-400 hover:border-emerald-500/30 transition-all">
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Validity badge */}
            {input && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-mono ${parsed.valid ? "bg-emerald-500/[0.08] border-emerald-500/20 text-emerald-400" : "bg-red-500/[0.08] border-red-500/20 text-red-400"}`}>
                <span>{parsed.valid ? "✓" : "✗"}</span>
                <span>{parsed.valid ? `Valid URL · ${parsed.protocol.toUpperCase()}${parsed.isSecure ? " (Secure)" : ""}${parsed.isLocalhost ? " · Localhost" : ""}${parsed.isIP ? " · IP Address" : ""}` : "Invalid URL"}</span>
              </div>
            )}

            {parsed.valid && (
              <>
                {/* Visual URL breakdown */}
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 overflow-x-auto">
                  <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-4">Visual Breakdown</div>
                  <div className="flex flex-wrap gap-0 font-mono text-sm leading-none">
                    {[
                      { part: parsed.protocol + "://",        color: "bg-violet-500/20 text-violet-400",  label: "protocol" },
                      parsed.username && { part: parsed.username, color: "bg-orange-500/20 text-orange-400", label: "user" },
                      parsed.password && { part: ":" + parsed.password, color: "bg-orange-500/20 text-orange-300", label: "pass" },
                      (parsed.username || parsed.password) && { part: "@", color: "text-slate-600", label: "" },
                      parsed.subdomain && { part: parsed.subdomain + ".", color: "bg-cyan-500/20 text-cyan-400", label: "subdomain" },
                      { part: parsed.domain || parsed.hostname, color: "bg-emerald-500/20 text-emerald-400", label: "domain" },
                      parsed.port && { part: ":" + parsed.port, color: "bg-yellow-500/20 text-yellow-400", label: "port" },
                      { part: parsed.pathname, color: "bg-blue-500/20 text-blue-400", label: "path" },
                      parsed.search && { part: parsed.search, color: "bg-pink-500/20 text-pink-400", label: "query" },
                      parsed.hash && { part: "#" + parsed.hash, color: "bg-red-500/20 text-red-400", label: "hash" },
                    ].filter(Boolean).map((item, i) => {
                      if (!item) return null;
                      const p = item as { part: string; color: string; label: string };
                      return (
                        <div key={i} className="flex flex-col items-start mb-2 mr-0.5">
                          <span className={`px-1.5 py-1 rounded text-xs ${p.color}`}>{p.part}</span>
                          {p.label && <span className="font-mono text-[8px] text-slate-700 px-1.5 mt-0.5">{p.label}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Components */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <Section label="Protocol & Auth">
                    <Field label="Protocol"  value={parsed.protocol}  color="text-violet-400"  copyKey="proto" />
                    <Field label="Origin"    value={parsed.origin}    color="text-slate-300"   copyKey="origin" />
                    <Field label="Host"      value={parsed.host}      color="text-emerald-400" copyKey="host" />
                    <Field label="Hostname"  value={parsed.hostname}  color="text-emerald-300" copyKey="hostname" />
                    <Field label="Port"      value={parsed.port}      color="text-yellow-400"  copyKey="port" />
                    <Field label="Username"  value={parsed.username}  color="text-orange-400"  copyKey="user" />
                    <Field label="Password"  value={parsed.password}  color="text-orange-300"  copyKey="pass" />
                  </Section>

                  <Section label="Domain Breakdown">
                    <Field label="Full domain"  value={parsed.domain}    color="text-emerald-400" copyKey="domain" />
                    <Field label="Subdomain"    value={parsed.subdomain} color="text-cyan-400"    copyKey="sub" />
                    <Field label="TLD"          value={parsed.tld}       color="text-slate-400"   copyKey="tld" />
                    <Field label="Path"         value={parsed.pathname}  color="text-blue-400"    copyKey="path" />
                    <Field label="Hash"         value={parsed.hash}      color="text-red-400"     copyKey="hash" />
                  </Section>
                </div>

                {/* Query params */}
                {parsed.params.length > 0 && (
                  <Section label={`Query Parameters (${parsed.params.length})`}>
                    <div className="flex flex-col gap-0">
                      {/* Header */}
                      <div className="flex items-center gap-3 pb-2 border-b border-white/[0.06] mb-1">
                        <span className="font-mono text-[10px] text-slate-700 w-6 text-center">#</span>
                        <span className="font-mono text-[10px] text-slate-700 flex-1">Key</span>
                        <span className="font-mono text-[10px] text-slate-700 flex-1">Value</span>
                        <span className="font-mono text-[10px] text-slate-700 w-10 text-right">Copy</span>
                      </div>
                      {parsed.params.map((p, i) => (
                        <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0 group hover:bg-white/[0.02] px-1 rounded transition-colors">
                          <span className="font-mono text-[10px] text-slate-700 w-6 text-center">{i + 1}</span>
                          <span className="font-mono text-xs text-pink-400 flex-1 truncate">{p.key}</span>
                          <span className="font-mono text-xs text-slate-300 flex-1 truncate">{decodeURIComponent(p.value)}</span>
                          <button onClick={() => copy(`${p.key}=${p.value}`, `param-${i}`)}
                            className={`font-mono text-[9px] px-1.5 py-0.5 rounded border transition-all w-10 text-center ${copied === `param-${i}` ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-700 opacity-0 group-hover:opacity-100"}`}>
                            {copied === `param-${i}` ? "✓" : "copy"}
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t border-white/[0.06]">
                      <button onClick={() => copy(parsed.search.replace("?", ""), "all-params")}
                        className={`font-mono text-[11px] px-3 py-1.5 rounded border transition-all ${copied === "all-params" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                        {copied === "all-params" ? "✓ Copied" : "Copy query string"}
                      </button>
                      <button onClick={() => copy(JSON.stringify(Object.fromEntries(parsed.params.map(p => [p.key, decodeURIComponent(p.value)])), null, 2), "params-json")}
                        className={`font-mono text-[11px] px-3 py-1.5 rounded border transition-all ${copied === "params-json" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                        {copied === "params-json" ? "✓ Copied" : "Copy as JSON"}
                      </button>
                    </div>
                  </Section>
                )}
              </>
            )}
          </div>
        )}

        {/* ── BUILD TAB ── */}
        {activeTab === "build" && (
          <div className="flex flex-col gap-5">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Inputs */}
              <div className="flex flex-col gap-4">

                <Section label="Base">
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                      <div className="flex gap-1">
                        {["https","http"].map(p => (
                          <button key={p} onClick={() => setBuildProtocol(p)}
                            className={`font-mono text-xs px-3 py-2 rounded border transition-all ${buildProtocol === p ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-600 hover:text-slate-300"}`}>
                            {p}
                          </button>
                        ))}
                      </div>
                      <input value={buildHost} onChange={e => setBuildHost(e.target.value)}
                        placeholder="example.com"
                        className="flex-1 font-mono text-xs px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-slate-300 placeholder-slate-700 outline-none focus:border-emerald-500/30" />
                      <input value={buildPort} onChange={e => setBuildPort(e.target.value)}
                        placeholder="Port"
                        className="w-20 font-mono text-xs px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-slate-300 placeholder-slate-700 outline-none focus:border-emerald-500/30" />
                    </div>
                    <input value={buildPath} onChange={e => setBuildPath(e.target.value)}
                      placeholder="/path/to/resource"
                      className="font-mono text-xs px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-slate-300 placeholder-slate-700 outline-none focus:border-emerald-500/30" />
                    <input value={buildHash} onChange={e => setBuildHash(e.target.value)}
                      placeholder="hash (without #)"
                      className="font-mono text-xs px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-slate-300 placeholder-slate-700 outline-none focus:border-emerald-500/30" />
                  </div>
                </Section>

                <Section label="Auth (optional)">
                  <div className="flex gap-2">
                    <input value={buildUser} onChange={e => setBuildUser(e.target.value)}
                      placeholder="username"
                      className="flex-1 font-mono text-xs px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-slate-300 placeholder-slate-700 outline-none focus:border-emerald-500/30" />
                    <input value={buildPass} onChange={e => setBuildPass(e.target.value)}
                      placeholder="password" type="password"
                      className="flex-1 font-mono text-xs px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-slate-300 placeholder-slate-700 outline-none focus:border-emerald-500/30" />
                  </div>
                </Section>

                <Section label="Query Parameters">
                  <div className="flex flex-col gap-2">
                    {buildParams.map((p, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input value={p.key} onChange={e => updateParam(i, "key", e.target.value)}
                          placeholder="key"
                          className="flex-1 font-mono text-xs px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-pink-400 placeholder-slate-700 outline-none focus:border-pink-500/30" />
                        <input value={p.value} onChange={e => updateParam(i, "value", e.target.value)}
                          placeholder="value"
                          className="flex-1 font-mono text-xs px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-slate-300 placeholder-slate-700 outline-none focus:border-emerald-500/30" />
                        <button onClick={() => removeParam(i)}
                          className="font-mono text-slate-700 hover:text-red-400 transition-colors text-lg leading-none shrink-0">×</button>
                      </div>
                    ))}
                    <button onClick={addParam}
                      className="font-mono text-[11px] px-3 py-2 border border-dashed border-white/[0.12] text-slate-600 rounded-lg hover:text-emerald-400 hover:border-emerald-500/30 transition-all">
                      + Add parameter
                    </button>
                  </div>
                </Section>
              </div>

              {/* Output */}
              <div className="flex flex-col gap-4">
                <Section label="Built URL">
                  <div className="flex flex-col gap-3">
                    <div className="bg-black/40 border border-white/[0.06] rounded-lg p-4 min-h-20">
                      <p className="font-mono text-sm text-emerald-400 break-all leading-relaxed">{builtURL || <span className="text-slate-700">URL will appear here…</span>}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => copy(builtURL, "built-url")} disabled={!builtURL}
                        className={`flex-1 font-mono text-xs py-2.5 rounded-lg border transition-all ${copied === "built-url" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-30"}`}>
                        {copied === "built-url" ? "✓ Copied!" : "Copy URL"}
                      </button>
                      <button onClick={() => { setInput(builtURL); setActiveTab("parse"); }}
                        disabled={!builtURL}
                        className="font-mono text-xs px-4 py-2.5 rounded-lg border border-white/[0.08] text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-all">
                        → Parse it
                      </button>
                    </div>
                  </div>
                </Section>

                {/* Visual preview of built parts */}
                {builtURL && (
                  <Section label="Preview">
                    {[
                      { label: "Protocol", value: buildProtocol, color: "text-violet-400" },
                      { label: "Host",     value: buildHost + (buildPort ? `:${buildPort}` : ""), color: "text-emerald-400" },
                      { label: "Path",     value: buildPath, color: "text-blue-400" },
                      { label: "Params",   value: buildParams.filter(p=>p.key).length + " parameter(s)", color: "text-pink-400" },
                      buildHash && { label: "Hash", value: buildHash, color: "text-red-400" },
                      buildUser && { label: "Auth", value: buildUser + (buildPass ? ":***" : ""), color: "text-orange-400" },
                    ].filter(Boolean).map((item) => {
                      if (!item) return null;
                      return (
                        <div key={item.label} className="flex items-center gap-3 py-1.5 border-b border-white/[0.04] last:border-0">
                          <span className="font-mono text-[10px] text-slate-700 w-16 shrink-0">{item.label}</span>
                          <span className={`font-mono text-xs ${item.color}`}>{item.value}</span>
                        </div>
                      );
                    })}
                  </Section>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── ENCODE TAB ── */}
        {activeTab === "encode" && (
          <div className="flex flex-col gap-5">

            {/* Mode toggle */}
            <div className="flex gap-2">
              {(["encode", "decode"] as const).map(m => (
                <button key={m} onClick={() => setEncodeMode(m)}
                  className={`font-mono text-xs px-5 py-2.5 rounded-lg border capitalize transition-all ${encodeMode === m ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                  {m === "encode" ? "🔒 Encode" : "🔓 Decode"}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Input */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Input</span>
                  <div className="flex gap-1.5">
                    {ENCODE_PRESETS.map(p => (
                      <button key={p.label} onClick={() => setEncodeInput(p.input)}
                        className="font-mono text-[10px] px-2 py-1 border border-white/[0.08] text-slate-600 rounded hover:text-emerald-400 hover:border-emerald-500/30 transition-all">
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea value={encodeInput} onChange={e => setEncodeInput(e.target.value)}
                  rows={8} spellCheck={false}
                  placeholder={encodeMode === "encode" ? "Enter text to encode…" : "Enter encoded string to decode…"}
                  className="font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 text-slate-300 placeholder-slate-700 outline-none resize-none focus:border-emerald-500/30 transition-colors leading-relaxed" />
                <div className="font-mono text-[10px] text-slate-700">{encodeInput.length} chars</div>
              </div>

              {/* Output */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">
                    {encodeMode === "encode" ? "Encoded" : "Decoded"}
                  </span>
                  <button onClick={() => copy(encodeOutput, "encode-out")} disabled={!encodeOutput}
                    className={`font-mono text-[11px] px-3 py-1 rounded border transition-all ${copied === "encode-out" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                    {copied === "encode-out" ? "✓ Copied!" : "Copy"}
                  </button>
                </div>
                <div className="flex-1 min-h-[200px] font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 text-emerald-400 break-all leading-relaxed overflow-auto">
                  {encodeOutput || <span className="text-slate-700">Output will appear here…</span>}
                </div>
                <div className="font-mono text-[10px] text-slate-700">{encodeOutput.length} chars · {encodeOutput.startsWith("⚠️") ? "error" : encodeMode === "encode" ? `+${encodeOutput.length - encodeInput.length} chars` : `-${encodeInput.length - encodeOutput.length} chars`}</div>

                {/* Swap */}
                <button onClick={() => setEncodeInput(encodeOutput)}
                  className="font-mono text-xs px-4 py-2 border border-white/[0.08] text-slate-500 rounded-lg hover:text-slate-300 transition-all">
                  ⇄ Use output as input
                </button>
              </div>
            </div>

            {/* Quick reference */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">Common Encodings</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { char: "Space", encoded: "%20" },
                  { char: "&",     encoded: "%26" },
                  { char: "=",     encoded: "%3D" },
                  { char: "+",     encoded: "%2B" },
                  { char: "#",     encoded: "%23" },
                  { char: "?",     encoded: "%3F" },
                  { char: "/",     encoded: "%2F" },
                  { char: "@",     encoded: "%40" },
                ].map(item => (
                  <div key={item.char} className="flex items-center justify-between bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2">
                    <span className="font-mono text-xs text-slate-400">{item.char}</span>
                    <span className="font-mono text-xs text-emerald-400">{item.encoded}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
          {[
            { icon: "🔍", title: "Parse",  desc: "Break any URL into protocol, subdomain, domain, TLD, path, query params, hash — with visual breakdown." },
            { icon: "🔨", title: "Build",  desc: "Construct URLs from parts. Add query params key-value pairs. Then copy or send to parser." },
            { icon: "🔐", title: "Encode", desc: "URL encode/decode strings. Copy as JSON. Handles special chars, unicode, and query strings." },
          ].map(c => (
            <div key={c.title} className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-4 py-4">
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