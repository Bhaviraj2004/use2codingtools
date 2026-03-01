"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useEffect, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────
interface IPData {
  ip: string;
  city: string;
  region: string;
  country: string;
  country_name: string;
  postal: string;
  latitude: number;
  longitude: number;
  timezone: string;
  org: string;
  asn?: string;
}

interface LookupResult {
  ip: string;
  type: "IPv4" | "IPv6" | "Unknown";
  city: string;
  region: string;
  country: string;
  countryName: string;
  postal: string;
  lat: number;
  lon: number;
  timezone: string;
  org: string;
  isp: string;
  localTime: string;
  mapUrl: string;
}

// ── Helpers ───────────────────────────────────────────────────
function detectIPType(ip: string): "IPv4" | "IPv6" | "Unknown" {
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) return "IPv4";
  if (/^[0-9a-fA-F:]+$/.test(ip) && ip.includes(":")) return "IPv6";
  return "Unknown";
}

function isValidIP(ip: string): boolean {
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6 = /^[0-9a-fA-F:]+$/;
  return ipv4.test(ip) || (ipv6.test(ip) && ip.includes(":"));
}

async function fetchIPData(ip: string = ""): Promise<LookupResult> {
  const url = ip ? `https://ipapi.co/${ip}/json/` : `https://ipapi.co/json/`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const d: IPData = await res.json();
  if ((d as { error?: boolean }).error) throw new Error("Invalid IP or lookup failed");

  const now = new Date();
  const localTime = new Intl.DateTimeFormat("en-US", {
    timeZone: d.timezone,
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: true, weekday: "short", month: "short", day: "numeric",
  }).format(now);

  const [isp, ...asnParts] = (d.org || "Unknown").split(" ");
  const ispName = asnParts.join(" ") || isp;

  return {
    ip: d.ip,
    type: detectIPType(d.ip),
    city: d.city || "—",
    region: d.region || "—",
    country: d.country || "—",
    countryName: d.country_name || "—",
    postal: d.postal || "—",
    lat: d.latitude,
    lon: d.longitude,
    timezone: d.timezone || "—",
    org: d.org || "—",
    isp: ispName || "—",
    localTime,
    mapUrl: `https://www.openstreetmap.org/?mlat=${d.latitude}&mlon=${d.longitude}&zoom=10`,
  };
}

// ── Country flag emoji from country code ──────────────────────
function countryFlag(code: string): string {
  if (!code || code.length !== 2) return "🌐";
  const offset = 127397;
  return String.fromCodePoint(...code.toUpperCase().split("").map(c => c.charCodeAt(0) + offset));
}

// ── History ───────────────────────────────────────────────────
const MAX_HISTORY = 8;

export default function IPInfo() {
  const [myIP, setMyIP]           = useState<LookupResult | null>(null);
  const [myIPLoading, setMyIPLoading] = useState(true);
  const [myIPError, setMyIPError] = useState("");

  const [query, setQuery]         = useState("");
  const [result, setResult]       = useState<LookupResult | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [copied, setCopied]       = useState<string | null>(null);
  const [history, setHistory]     = useState<LookupResult[]>([]);
  const [activeTab, setActiveTab] = useState<"my"|"lookup">("my");

  // Fetch my IP on mount
  useEffect(() => {
    setMyIPLoading(true);
    fetchIPData()
      .then(data => { setMyIP(data); setMyIPLoading(false); })
      .catch(e => { setMyIPError(e.message); setMyIPLoading(false); });
  }, []);

  const lookup = useCallback(async (ip?: string) => {
    const target = (ip ?? query).trim();
    if (!target) { setError("Enter an IP address"); return; }
    if (!isValidIP(target)) { setError("Invalid IP address format"); return; }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await fetchIPData(target);
      setResult(data);
      setHistory(prev => {
        const filtered = prev.filter(h => h.ip !== data.ip);
        return [data, ...filtered].slice(0, MAX_HISTORY);
      });
      setActiveTab("lookup");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  }, [query]);

  const copy = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const displayed = activeTab === "my" ? myIP : result;
  const displayedLoading = activeTab === "my" ? myIPLoading : loading;
  const displayedError = activeTab === "my" ? myIPError : error;

  const InfoRow = ({ label, value, copyKey }: { label: string; value: string; copyKey?: string }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-b-0 group">
      <span className="font-mono text-xs text-slate-600 w-28 shrink-0">{label}</span>
      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
        <span className="font-mono text-xs text-slate-300 truncate text-right">{value}</span>
        {copyKey && (
          <button onClick={() => copy(value, copyKey)}
            className={`font-mono text-[9px] px-1.5 py-0.5 rounded border transition-all opacity-0 group-hover:opacity-100 shrink-0 ${copied === copyKey ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-700 hover:text-slate-400"}`}>
            {copied === copyKey ? "✓" : "copy"}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-cyan-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

      {/* NAV */}
      {/* <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#09090f]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <a href="/" className="font-mono text-sm font-bold text-emerald-400">use2<span className="text-slate-500">coding</span>tools</a>
          <span className="text-white/10">/</span>
          <span className="font-mono text-sm text-slate-400">IP Info</span>
        </div>
      </nav> */}

      <ToolNavbar toolName="IP Info" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-cyan-500/10 flex items-center justify-center text-lg">🌐</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">IP Info Lookup</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded">live data</span>
          </div>
          <p className="text-slate-500 text-sm">Lookup any IP address — geolocation, ISP, timezone, and more. Or instantly view your own public IP info.</p>
        </div>

        {/* Lookup input */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 mb-6">
          <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">Lookup Any IP</div>
          <div className="flex gap-3">
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && lookup()}
              placeholder="e.g. 8.8.8.8 or 2001:4860:4860::8888"
              className="flex-1 font-mono text-sm px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-slate-300 placeholder-slate-700 outline-none focus:border-cyan-500/40 transition-colors"
            />
            <button onClick={() => lookup()}
              disabled={loading}
              className="font-mono text-sm px-6 py-3 bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 rounded-xl hover:bg-cyan-500/25 transition-all disabled:opacity-50 shrink-0">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin block" />
                  Looking up…
                </span>
              ) : "🔍 Lookup"}
            </button>
          </div>
          {error && <p className="font-mono text-xs text-red-400 mt-2">{error}</p>}

          {/* Quick examples */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="font-mono text-[10px] text-slate-700 self-center">Try:</span>
            {["8.8.8.8", "1.1.1.1", "208.67.222.222", "2606:4700:4700::1111"].map(ip => (
              <button key={ip} onClick={() => { setQuery(ip); lookup(ip); }}
                className="font-mono text-[10px] px-2.5 py-1 border border-white/[0.08] text-slate-600 rounded hover:text-cyan-400 hover:border-cyan-500/30 transition-all">
                {ip}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main info panel */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Tabs */}
            <div className="flex gap-2">
              <button onClick={() => setActiveTab("my")}
                className={`font-mono text-xs px-4 py-2 rounded-lg border transition-all ${activeTab === "my" ? "bg-cyan-500/20 border-cyan-500/30 text-cyan-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                📍 My IP
              </button>
              <button onClick={() => setActiveTab("lookup")} disabled={!result}
                className={`font-mono text-xs px-4 py-2 rounded-lg border transition-all ${activeTab === "lookup" ? "bg-cyan-500/20 border-cyan-500/30 text-cyan-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300 disabled:opacity-30"}`}>
                🔍 Lookup Result
              </button>
            </div>

            {/* Loading */}
            {displayedLoading && (
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-12 flex flex-col items-center gap-4">
                <div className="w-8 h-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
                <span className="font-mono text-sm text-slate-600">Fetching IP data…</span>
              </div>
            )}

            {/* Error */}
            {!displayedLoading && displayedError && (
              <div className="bg-red-500/[0.06] border border-red-500/20 rounded-xl p-6 text-center">
                <div className="text-2xl mb-2">⚠️</div>
                <div className="font-mono text-sm text-red-400">{displayedError}</div>
              </div>
            )}

            {/* Results */}
            {!displayedLoading && !displayedError && displayed && (
              <>
                {/* Big IP display */}
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">{countryFlag(displayed.country)}</span>
                        <div>
                          <div className="font-mono text-2xl font-bold text-white tracking-wide">{displayed.ip}</div>
                          <div className="font-mono text-xs text-slate-600 mt-0.5">{displayed.countryName} · {displayed.city}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end shrink-0">
                      <span className={`font-mono text-[11px] px-2.5 py-1 rounded border ${displayed.type === "IPv4" ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" : "bg-violet-500/10 border-violet-500/20 text-violet-400"}`}>
                        {displayed.type}
                      </span>
                      <button onClick={() => copy(displayed.ip, "ip-main")}
                        className={`font-mono text-[11px] px-3 py-1 rounded border transition-all ${copied === "ip-main" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                        {copied === "ip-main" ? "✓ Copied" : "Copy IP"}
                      </button>
                    </div>
                  </div>

                  {/* Local time */}
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-4 py-3 flex items-center gap-3">
                    <span className="text-lg">🕐</span>
                    <div>
                      <div className="font-mono text-[10px] text-slate-600 mb-0.5">Local time in {displayed.timezone}</div>
                      <div className="font-mono text-sm text-slate-300">{displayed.localTime}</div>
                    </div>
                  </div>
                </div>

                {/* Detailed info grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Location */}
                  <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm">📍</span>
                      <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Location</span>
                    </div>
                    <InfoRow label="City"       value={displayed.city}        copyKey="city" />
                    <InfoRow label="Region"     value={displayed.region}      copyKey="region" />
                    <InfoRow label="Country"    value={`${displayed.countryName} (${displayed.country})`} copyKey="country" />
                    <InfoRow label="Postal"     value={displayed.postal}      copyKey="postal" />
                    <InfoRow label="Latitude"   value={String(displayed.lat)} copyKey="lat" />
                    <InfoRow label="Longitude"  value={String(displayed.lon)} copyKey="lon" />
                  </div>

                  {/* Network */}
                  <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm">🌐</span>
                      <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Network</span>
                    </div>
                    <InfoRow label="IP Address" value={displayed.ip}       copyKey="ip-row" />
                    <InfoRow label="Type"       value={displayed.type}     />
                    <InfoRow label="ISP / Org"  value={displayed.org}      copyKey="org" />
                    <InfoRow label="Timezone"   value={displayed.timezone} copyKey="tz" />
                  </div>
                </div>

                {/* Map link */}
                <a href={displayed.mapUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between px-5 py-4 bg-white/[0.03] border border-white/[0.08] rounded-xl hover:border-cyan-500/30 transition-all group">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🗺️</span>
                    <div>
                      <div className="font-mono text-sm text-slate-300 group-hover:text-cyan-400 transition-colors">View on OpenStreetMap</div>
                      <div className="font-mono text-[10px] text-slate-700">{displayed.lat}, {displayed.lon}</div>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-slate-700 group-hover:text-cyan-400 transition-colors">↗</span>
                </a>
              </>
            )}

            {/* Empty state for lookup tab */}
            {activeTab === "lookup" && !result && !loading && (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-12 flex flex-col items-center gap-3 text-center">
                <span className="text-4xl">🔍</span>
                <div className="font-mono text-sm text-slate-600">Enter an IP address above and click Lookup</div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">

            {/* Stats for current result */}
            {displayed && !displayedLoading && (
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
                <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-4">Quick Stats</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Type",    value: displayed.type,    color: "text-cyan-400"    },
                    { label: "Country", value: displayed.country, color: "text-emerald-400" },
                    { label: "Lat",     value: displayed.lat?.toFixed(2) ?? "—", color: "text-orange-400" },
                    { label: "Lon",     value: displayed.lon?.toFixed(2) ?? "—", color: "text-violet-400" },
                  ].map(s => (
                    <div key={s.label} className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-3 text-center">
                      <div className={`font-mono text-sm font-bold ${s.color}`}>{s.value}</div>
                      <div className="font-mono text-[9px] text-slate-700 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lookup history */}
            {history.length > 0 && (
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Recent Lookups</span>
                  <button onClick={() => setHistory([])}
                    className="font-mono text-[10px] text-slate-700 hover:text-red-400 transition-colors">clear</button>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {history.map((h) => (
                    <button key={h.ip} onClick={() => { setQuery(h.ip); setResult(h); setActiveTab("lookup"); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left">
                      <span className="text-base shrink-0">{countryFlag(h.country)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-xs text-slate-400 truncate">{h.ip}</div>
                        <div className="font-mono text-[10px] text-slate-700 truncate">{h.city}, {h.country}</div>
                      </div>
                      <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded border shrink-0 ${h.type === "IPv4" ? "border-cyan-500/20 text-cyan-600" : "border-violet-500/20 text-violet-600"}`}>
                        {h.type}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Info cards */}
            <div className="flex flex-col gap-2">
              {[
                { icon: "🌐", title: "Your Public IP",   desc: "Instantly see your real public IP and geolocation." },
                { icon: "🔍", title: "Any IP Lookup",    desc: "Look up any IPv4 or IPv6 address in the world." },
                { icon: "📍", title: "Geo + Network",    desc: "City, region, country, ISP, timezone and coordinates." },
                { icon: "🕐", title: "Local Time",       desc: "See the current local time at the IP's timezone." },
              ].map(c => (
                <div key={c.title} className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-4 py-3 flex items-start gap-3">
                  <span className="text-lg shrink-0">{c.icon}</span>
                  <div>
                    <div className="font-semibold text-slate-400 text-xs mb-0.5">{c.title}</div>
                    <div className="text-slate-700 text-[10px] leading-relaxed">{c.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}