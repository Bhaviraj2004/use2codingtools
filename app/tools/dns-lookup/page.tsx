"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────
type RecordType = "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS" | "SOA" | "PTR" | "SRV" | "CAA";

interface DNSRecord {
  name: string;
  type: string;
  ttl: number;
  data: string;
}

interface LookupResult {
  domain: string;
  type: RecordType;
  records: DNSRecord[];
  status: "success" | "error" | "empty";
  message?: string;
  responseTime: number;
}

// ── DNS via Google/Cloudflare DoH ─────────────────────────────
async function dnsLookup(domain: string, type: RecordType): Promise<LookupResult> {
  const start = performance.now();
  const clean = domain.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "");

  try {
    const url = `https://dns.google/resolve?name=${encodeURIComponent(clean)}&type=${type}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const elapsed = Math.round(performance.now() - start);

    if (data.Status === 3) {
      return { domain: clean, type, records: [], status: "empty", message: "NXDOMAIN — domain not found", responseTime: elapsed };
    }
    if (data.Status !== 0) {
      const codes: Record<number, string> = { 1: "Format error", 2: "Server failure", 4: "Not implemented", 5: "Refused" };
      return { domain: clean, type, records: [], status: "error", message: codes[data.Status] || `DNS error ${data.Status}`, responseTime: elapsed };
    }

    const records: DNSRecord[] = (data.Answer || []).map((r: { name: string; type: number; TTL: number; data: string }) => ({
      name: r.name,
      type: typeNumToName(r.type),
      ttl: r.TTL,
      data: r.data,
    }));

    return {
      domain: clean, type,
      records,
      status: records.length > 0 ? "success" : "empty",
      message: records.length === 0 ? `No ${type} records found` : undefined,
      responseTime: elapsed,
    };
  } catch (e: unknown) {
    return {
      domain: clean, type, records: [],
      status: "error",
      message: e instanceof Error ? e.message : "Lookup failed",
      responseTime: Math.round(performance.now() - start),
    };
  }
}

function typeNumToName(n: number): string {
  const map: Record<number, string> = { 1:"A",2:"NS",5:"CNAME",6:"SOA",12:"PTR",15:"MX",16:"TXT",28:"AAAA",33:"SRV",257:"CAA" };
  return map[n] || String(n);
}

function formatTTL(ttl: number): string {
  if (ttl < 60)   return `${ttl}s`;
  if (ttl < 3600) return `${Math.floor(ttl/60)}m ${ttl%60}s`;
  if (ttl < 86400) return `${Math.floor(ttl/3600)}h ${Math.floor((ttl%3600)/60)}m`;
  return `${Math.floor(ttl/86400)}d`;
}

// ── Record type meta ──────────────────────────────────────────
const RECORD_TYPES: { type: RecordType; desc: string; color: string; icon: string }[] = [
  { type: "A",     desc: "IPv4 address",           color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",  icon: "4️⃣" },
  { type: "AAAA",  desc: "IPv6 address",           color: "text-cyan-400    bg-cyan-500/10    border-cyan-500/25",     icon: "6️⃣" },
  { type: "CNAME", desc: "Canonical name alias",   color: "text-violet-400  bg-violet-500/10  border-violet-500/25",   icon: "🔗" },
  { type: "MX",    desc: "Mail exchange",          color: "text-orange-400  bg-orange-500/10  border-orange-500/25",   icon: "📧" },
  { type: "TXT",   desc: "Text records / SPF",     color: "text-yellow-400  bg-yellow-500/10  border-yellow-500/25",   icon: "📝" },
  { type: "NS",    desc: "Nameservers",            color: "text-blue-400    bg-blue-500/10    border-blue-500/25",     icon: "🗄️" },
  { type: "SOA",   desc: "Start of authority",     color: "text-pink-400    bg-pink-500/10    border-pink-500/25",     icon: "📋" },
  { type: "PTR",   desc: "Reverse DNS pointer",    color: "text-rose-400    bg-rose-500/10    border-rose-500/25",     icon: "↩️" },
  { type: "SRV",   desc: "Service locator",        color: "text-indigo-400  bg-indigo-500/10  border-indigo-500/25",   icon: "⚙️" },
  { type: "CAA",   desc: "Certificate authority",  color: "text-teal-400    bg-teal-500/10    border-teal-500/25",     icon: "🔒" },
];

const EXAMPLES = [
  "google.com", "github.com", "cloudflare.com", "vercel.com", "x.com",
];

export default function DNSLookup() {
  const [domain, setDomain]     = useState("google.com");
  const [selectedTypes, setSelectedTypes] = useState<Set<RecordType>>(new Set(["A", "AAAA", "MX", "NS", "TXT"]));
  const [results, setResults]   = useState<LookupResult[]>([]);
  const [loading, setLoading]   = useState(false);
  const [copied, setCopied]     = useState<string | null>(null);
  const [history, setHistory]   = useState<string[]>([]);
  const [allMode, setAllMode]   = useState(false);

  const toggleType = (t: RecordType) => {
    if (allMode) return;
    setSelectedTypes(prev => {
      const next = new Set(prev);
      if (next.has(t)) { if (next.size > 1) next.delete(t); }
      else next.add(t);
      return next;
    });
  };

  const lookup = useCallback(async (d?: string) => {
    const target = (d ?? domain).trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
    if (!target) return;

    const types = allMode ? RECORD_TYPES.map(r => r.type) : Array.from(selectedTypes) as RecordType[];

    setLoading(true);
    setResults([]);
    setHistory(prev => [target, ...prev.filter(h => h !== target)].slice(0, 8));

    try {
      const all = await Promise.all(types.map(t => dnsLookup(target, t)));
      setResults(all);
    } finally {
      setLoading(false);
    }
  }, [domain, selectedTypes, allMode]);

  const copy = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const successResults  = results.filter(r => r.status === "success");
  const totalRecords    = successResults.reduce((s, r) => s + r.records.length, 0);
  const avgResponseTime = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.responseTime, 0) / results.length)
    : 0;

  const getTypeMeta = (type: string) => RECORD_TYPES.find(r => r.type === type);

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-blue-500/[0.04] blur-3xl pointer-events-none" />

      {/* NAV */}

      <ToolNavbar toolName="DNS Lookup" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center text-lg">🌐</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">DNS Lookup</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">DoH · live</span>
          </div>
          <p className="text-slate-500 text-sm">Look up DNS records for any domain — A, AAAA, MX, TXT, NS, CNAME, SOA, PTR, SRV, CAA. Powered by Google DNS over HTTPS.</p>
        </div>

        {/* Input */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 mb-5">
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <input
                value={domain}
                onChange={e => setDomain(e.target.value)}
                onKeyDown={e => e.key === "Enter" && lookup()}
                placeholder="example.com or 8.8.8.8"
                className="w-full font-mono text-sm px-4 py-3 bg-black/40 border border-white/[0.08] rounded-xl text-slate-300 placeholder-slate-700 outline-none focus:border-emerald-500/40 transition-colors pr-10"
              />
              {domain && (
                <button onClick={() => setDomain("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-700 hover:text-slate-400 transition-colors font-mono text-lg">×</button>
              )}
            </div>
            <button onClick={() => lookup()} disabled={loading || !domain.trim()}
              className="font-mono text-sm px-6 py-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl hover:bg-emerald-500/25 transition-all disabled:opacity-50 shrink-0 flex items-center gap-2">
              {loading ? (
                <><span className="w-4 h-4 rounded-full border-2 border-emerald-400/30 border-t-emerald-400 animate-spin block" /> Looking up…</>
              ) : "🔍 Lookup"}
            </button>
          </div>

          {/* Quick examples */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="font-mono text-[10px] text-slate-700 self-center">Try:</span>
            {EXAMPLES.map(e => (
              <button key={e} onClick={() => { setDomain(e); lookup(e); }}
                className="font-mono text-[10px] px-2.5 py-1 border border-white/[0.08] text-slate-600 rounded hover:text-emerald-400 hover:border-emerald-500/30 transition-all">
                {e}
              </button>
            ))}
          </div>

          {/* Record type selector */}
          <div className="flex items-center gap-3 mb-3">
            <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Record Types</span>
            <label onClick={() => setAllMode(p => !p)} className="flex items-center gap-1.5 cursor-pointer ml-auto">
              <div className={`w-7 h-3.5 rounded-full relative transition-all ${allMode ? "bg-emerald-500" : "bg-white/10"}`}>
                <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all ${allMode ? "left-3.5" : "left-0.5"}`} />
              </div>
              <span className="font-mono text-[10px] text-slate-600">All types</span>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {RECORD_TYPES.map(({ type, desc, color, icon }) => {
              const active = allMode || selectedTypes.has(type);
              return (
                <button key={type} onClick={() => toggleType(type)}
                  title={desc}
                  className={`flex items-center gap-1.5 font-mono text-[11px] px-3 py-1.5 rounded-lg border transition-all ${active ? color : "border-white/[0.08] text-slate-700 hover:text-slate-400"} ${allMode ? "opacity-60 cursor-default" : "cursor-pointer"}`}>
                  <span className="text-[10px]">{icon}</span>
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats bar — shown after lookup */}
        {results.length > 0 && !loading && (
          <div className="flex flex-wrap gap-4 px-4 py-3 bg-emerald-500/[0.05] border border-emerald-500/15 rounded-lg mb-5">
            {[
              { label: "Domain",       val: results[0]?.domain },
              { label: "Types queried",val: String(results.length) },
              { label: "Records found",val: String(totalRecords) },
              { label: "Avg response", val: `${avgResponseTime}ms` },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-emerald-500/50 uppercase tracking-widest">{s.label}</span>
                <span className="font-mono text-sm text-emerald-400">{s.val}</span>
              </div>
            ))}
            <button onClick={() => { const all = results.flatMap(r => r.records.map(rec => `${rec.type.padEnd(6)} ${rec.ttl}s\t${rec.data}`)).join("\n"); copy(all, "all-records"); }}
              className={`ml-auto font-mono text-[11px] px-3 py-1 rounded border transition-all ${copied === "all-records" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-600 hover:text-slate-300"}`}>
              {copied === "all-records" ? "✓ Copied!" : "Copy all"}
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-16">
            <div className="w-10 h-10 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
            <div className="font-mono text-sm text-slate-600">Querying DNS records…</div>
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div className="flex flex-col gap-4">
            {results.map((result) => {
              const meta = getTypeMeta(result.type);
              if (!meta) return null;

              return (
                <div key={result.type} className={`bg-white/[0.03] border rounded-xl overflow-hidden ${result.status === "success" ? "border-white/[0.08]" : "border-white/[0.04]"}`}>

                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded border ${meta.color}`}>
                        {meta.icon} {result.type}
                      </span>
                      <span className="font-mono text-xs text-slate-600">{meta.desc}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-slate-700">{result.responseTime}ms</span>
                      {result.status === "success" && (
                        <span className="font-mono text-[10px] text-emerald-600">{result.records.length} record{result.records.length !== 1 ? "s" : ""}</span>
                      )}
                      {result.status === "empty" && (
                        <span className="font-mono text-[10px] text-slate-700">no records</span>
                      )}
                      {result.status === "error" && (
                        <span className="font-mono text-[10px] text-red-500">error</span>
                      )}
                    </div>
                  </div>

                  {/* Records */}
                  {result.status === "success" && result.records.length > 0 && (
                    <div className="divide-y divide-white/[0.04]">
                      {result.records.map((rec, i) => (
                        <div key={i} className="flex items-start gap-3 px-5 py-3 group hover:bg-white/[0.02] transition-colors">
                          {/* TTL badge */}
                          <div className="shrink-0 mt-0.5">
                            <span className="font-mono text-[9px] px-2 py-1 rounded bg-white/[0.04] text-slate-600 border border-white/[0.06]">
                              TTL {formatTTL(rec.ttl)}
                            </span>
                          </div>

                          {/* Data */}
                          <div className="flex-1 min-w-0">
                            <div className={`font-mono text-sm break-all ${meta.color.split(" ")[0]}`}>
                              {/* Special formatting per type */}
                              {result.type === "MX" ? (
                                <span>
                                  <span className="text-slate-500 text-xs mr-2">priority {rec.data.split(" ")[0]}</span>
                                  <span>{rec.data.split(" ").slice(1).join(" ")}</span>
                                </span>
                              ) : result.type === "TXT" ? (
                                <span className="text-yellow-400 break-all">{rec.data}</span>
                              ) : result.type === "SOA" ? (
                                <div className="flex flex-col gap-0.5">
                                  {rec.data.split(" ").map((part, pi) => {
                                    const labels = ["Primary NS", "Admin email", "Serial", "Refresh", "Retry", "Expire", "Min TTL"];
                                    return (
                                      <div key={pi} className="flex gap-3">
                                        <span className="font-mono text-[9px] text-slate-700 w-24 shrink-0 self-center">{labels[pi] || ""}</span>
                                        <span className="font-mono text-xs text-pink-400">{part}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                rec.data
                              )}
                            </div>
                            {rec.name !== `${result.domain}.` && (
                              <div className="font-mono text-[10px] text-slate-700 mt-0.5">{rec.name}</div>
                            )}
                          </div>

                          {/* Copy */}
                          <button onClick={() => copy(rec.data, `rec-${result.type}-${i}`)}
                            className={`font-mono text-[9px] px-1.5 py-1 rounded border shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-all ${copied === `rec-${result.type}-${i}` ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-700 hover:text-slate-400"}`}>
                            {copied === `rec-${result.type}-${i}` ? "✓" : "copy"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Empty / Error states */}
                  {(result.status === "empty" || result.status === "error") && (
                    <div className="px-5 py-3">
                      <span className={`font-mono text-xs ${result.status === "error" ? "text-red-400/60" : "text-slate-700"}`}>
                        {result.message}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && results.length === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 flex flex-col items-center justify-center py-16 gap-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
              <span className="text-5xl">🌐</span>
              <div className="font-mono text-sm text-slate-600 text-center">Enter a domain and click Lookup</div>
              <div className="font-mono text-xs text-slate-700">Supports A, AAAA, CNAME, MX, TXT, NS, SOA, PTR, SRV, CAA</div>
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden self-start">
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Recent</span>
                </div>
                {history.map(h => (
                  <button key={h} onClick={() => { setDomain(h); lookup(h); }}
                    className="w-full text-left px-4 py-2.5 font-mono text-xs text-slate-500 hover:text-emerald-400 hover:bg-white/[0.02] border-b border-white/[0.04] last:border-0 transition-all">
                    🌐 {h}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Show history sidebar alongside results */}
        {!loading && results.length > 0 && history.length > 1 && (
          <div className="mt-5 bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Recent Lookups</span>
              <button onClick={() => setHistory([])} className="font-mono text-[10px] text-slate-700 hover:text-red-400 transition-colors">clear</button>
            </div>
            <div className="flex flex-wrap gap-2 p-3">
              {history.map(h => (
                <button key={h} onClick={() => { setDomain(h); lookup(h); }}
                  className={`font-mono text-[10px] px-3 py-1.5 rounded border transition-all ${h === results[0]?.domain ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "border-white/[0.08] text-slate-600 hover:text-slate-300"}`}>
                  {h}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Record type reference */}
        <div className="mt-6 bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
          <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-4">Record Type Reference</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {RECORD_TYPES.map(({ type, desc, color, icon }) => (
              <div key={type} className="flex items-center gap-3 py-1.5">
                <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${color}`}>{icon} {type}</span>
                <span className="font-mono text-[11px] text-slate-600">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4">
          {[
            { icon: "🔍", title: "10 Record Types", desc: "A, AAAA, CNAME, MX, TXT, NS, SOA, PTR, SRV, CAA in one lookup." },
            { icon: "⚡", title: "DoH Powered",     desc: "Uses Google DNS-over-HTTPS for fast, private, accurate results." },
            { icon: "🎯", title: "Smart Formatting", desc: "MX priority, SOA fields, TXT records all formatted clearly." },
            { icon: "📋", title: "Copy Records",     desc: "Hover any record to copy, or copy all results at once." },
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