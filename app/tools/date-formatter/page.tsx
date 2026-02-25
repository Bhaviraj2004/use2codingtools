"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState } from "react";

const FORMAT_PRESETS = [
  { label: "ISO 8601", format: "YYYY-MM-DDTHH:mm:ssZ" },
  { label: "DD/MM/YYYY", format: "DD/MM/YYYY" },
  { label: "MM-DD-YYYY", format: "MM-DD-YYYY" },
  { label: "Long Date", format: "MMMM DD, YYYY" },
  { label: "Short Date", format: "MMM D, YYYY" },
  { label: "Unix Timestamp", format: "X" },
  { label: "Time Only", format: "HH:mm:ss" },
  { label: "12-Hour", format: "hh:mm:ss A" },
  { label: "Full DateTime", format: "dddd, MMMM DD YYYY HH:mm:ss" },
  { label: "RFC 2822", format: "ddd, DD MMM YYYY HH:mm:ss ZZ" },
];

const TIMEZONES = [
  "UTC","Asia/Kolkata","America/New_York","America/Los_Angeles",
  "Europe/London","Europe/Paris","Asia/Tokyo","Asia/Dubai",
  "Australia/Sydney","America/Chicago",
];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const SHORT_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const SHORT_DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function getUTCOffset(timezone: string): string {
  try {
    const date = new Date();
    const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
    const tzDate = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
    const diff = (tzDate.getTime() - utcDate.getTime()) / 60000;
    const sign = diff >= 0 ? "+" : "-";
    const abs = Math.abs(diff);
    const h = String(Math.floor(abs / 60)).padStart(2, "0");
    const m = String(abs % 60).padStart(2, "0");
    return `${sign}${h}:${m}`;
  } catch { return "+00:00"; }
}

function formatDate(date: Date, format: string, timezone: string): string {
  try {
    const tzDate = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
    const utcOffset = getUTCOffset(timezone);
    const Y = tzDate.getFullYear();
    const M = tzDate.getMonth();
    const D = tzDate.getDate();
    const H = tzDate.getHours();
    const m = tzDate.getMinutes();
    const s = tzDate.getSeconds();
    const day = tzDate.getDay();
    const pad = (n: number) => String(n).padStart(2, "0");
    const unix = Math.floor(date.getTime() / 1000);

    let result = format;
    result = result.replace("YYYY", String(Y)).replace("YY", String(Y).slice(-2));
    result = result.replace("MMMM", MONTHS[M]).replace("MMM", SHORT_MONTHS[M]);
    result = result.replace("MM", pad(M + 1));
    result = result.replace("dddd", DAYS[day]).replace("ddd", SHORT_DAYS[day]);
    result = result.replace("DD", pad(D)).replace(/\bD\b/, String(D));
    result = result.replace("HH", pad(H));
    result = result.replace("hh", pad(H % 12 === 0 ? 12 : H % 12));
    result = result.replace("mm", pad(m)).replace("ss", pad(s));
    result = result.replace("A", H >= 12 ? "PM" : "AM").replace("a", H >= 12 ? "pm" : "am");
    result = result.replace("X", String(unix));
    result = result.replace("ZZ", utcOffset.replace(":", "")).replace("Z", utcOffset);
    return result;
  } catch { return "Invalid Date"; }
}

function parseInput(input: string): Date | null {
  if (!input.trim()) return null;
  if (/^\d{10}$/.test(input.trim())) return new Date(parseInt(input.trim()) * 1000);
  if (/^\d{13}$/.test(input.trim())) return new Date(parseInt(input.trim()));
  const d = new Date(input.trim());
  return isNaN(d.getTime()) ? null : d;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export default function DateFormatter() {
  const [input, setInput] = useState("");
  const [customFormat, setCustomFormat] = useState("YYYY-MM-DDTHH:mm:ssZ");
  const [selectedPreset, setSelectedPreset] = useState("ISO 8601");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState("");

  const parsedDate = input.trim() ? parseInput(input) : new Date();
  const isValid = parsedDate !== null;

  const handleInput = (val: string) => {
    setInput(val);
    setError("");
    if (val.trim() && !parseInput(val)) {
      setError("Could not parse this date. Try ISO format, Unix timestamp, or natural date strings.");
    }
  };

  const handlePreset = (preset: typeof FORMAT_PRESETS[0]) => {
    setSelectedPreset(preset.label);
    setCustomFormat(preset.format);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  };

  const handleNow = () => { setInput(new Date().toISOString()); setError(""); };
  const handleClear = () => { setInput(""); setError(""); };

  const formattedOutput = isValid && parsedDate ? formatDate(parsedDate, customFormat, timezone) : "";
  const allFormats = isValid && parsedDate
    ? FORMAT_PRESETS.map((p) => ({ ...p, result: formatDate(parsedDate, p.format, timezone) }))
    : [];

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-orange-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

      <ToolNavbar toolName="Date Formatter" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-orange-500/10 flex items-center justify-center font-mono font-bold text-orange-400 text-sm">📅</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Date Formatter</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded">client-side</span>
          </div>
          <p className="text-slate-500 text-sm">Parse and format any date into multiple formats. Supports ISO, Unix timestamps, natural strings, and timezone conversion.</p>
        </div>

        {/* Input Row */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex-1 min-w-[260px]">
            <input
              value={input}
              onChange={(e) => handleInput(e.target.value)}
              placeholder="Enter date: ISO, Unix timestamp, or natural string…"
              spellCheck={false}
              className="w-full font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg px-4 py-2.5 text-slate-300 placeholder-slate-700 outline-none focus:border-orange-500/40 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-2">
            <span className="font-mono text-[11px] text-slate-500 uppercase tracking-wide shrink-0">TZ</span>
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="bg-transparent font-mono text-xs text-slate-300 outline-none cursor-pointer">
              {TIMEZONES.map((tz) => <option key={tz} value={tz} className="bg-[#09090f]">{tz}</option>)}
            </select>
          </div>
          <button onClick={handleNow} className="font-mono text-xs px-3 py-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-md hover:bg-orange-500/20 transition-all">Use Now</button>
          <button onClick={handleClear} className="font-mono text-xs px-3 py-2 border border-white/[0.08] text-slate-500 rounded-md hover:text-red-400 hover:border-red-500/30 transition-all">Clear</button>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-md px-4 py-2.5 flex gap-2 items-center">
            <span className="text-red-400 text-xs shrink-0">✕</span>
            <span className="font-mono text-xs text-red-400">{error}</span>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">

          {/* Left: Custom Format */}
          <div className="flex flex-col gap-3">
            <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Custom Format</span>
            <div className="flex flex-wrap gap-2">
              {FORMAT_PRESETS.map((p) => (
                <button key={p.label} onClick={() => handlePreset(p)}
                  className={`font-mono text-[11px] px-2.5 py-1 rounded border transition-all ${selectedPreset === p.label ? "bg-orange-500/20 border-orange-500/40 text-orange-400" : "border-white/[0.06] text-slate-500 hover:text-slate-300 hover:border-white/20"}`}>
                  {p.label}
                </button>
              ))}
            </div>
            <input
              value={customFormat}
              onChange={(e) => { setCustomFormat(e.target.value); setSelectedPreset("Custom"); }}
              placeholder="e.g. DD/MM/YYYY HH:mm"
              className="font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg px-4 py-2.5 text-orange-300 placeholder-slate-700 outline-none focus:border-orange-500/40 transition-colors"
            />
            <div className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 min-h-[120px] flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600 block mb-2">Output</span>
                <div className="font-mono text-2xl font-bold text-orange-400 break-all">
                  {formattedOutput || <span className="text-slate-700 text-base font-normal">Formatted date appears here…</span>}
                </div>
              </div>
              {formattedOutput && (
                <button onClick={() => handleCopy(formattedOutput, "custom")}
                  className={`mt-4 self-start font-mono text-[11px] px-3 py-1 rounded border transition-all ${copied === "custom" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                  {copied === "custom" ? "✓ Copied!" : "Copy"}
                </button>
              )}
            </div>
            {/* Token Reference */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-4 py-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600 block mb-2">Format Tokens</span>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {[["YYYY","2024"],["YY","24"],["MMMM","January"],["MMM","Jan"],["MM","01"],["DD","01"],["D","1"],["dddd","Monday"],["ddd","Mon"],["HH","14 (24hr)"],["hh","02 (12hr)"],["mm","05"],["ss","09"],["A","AM/PM"],["X","Unix sec"],["x","Unix ms"]].map(([token, desc]) => (
                  <div key={token} className="flex gap-2 items-baseline">
                    <span className="font-mono text-[11px] text-orange-400 w-14 shrink-0">{token}</span>
                    <span className="font-mono text-[10px] text-slate-600">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: All Formats */}
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">All Formats</span>
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg overflow-hidden h-full">
              {allFormats.length === 0 ? (
                <div className="p-6 text-slate-700 font-mono text-sm">Enter a date to see all formats…</div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {allFormats.map((f) => (
                    <div key={f.label} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors group">
                      <div>
                        <div className="font-mono text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">{f.label}</div>
                        <div className="font-mono text-sm text-slate-200">{f.result}</div>
                      </div>
                      <button onClick={() => handleCopy(f.result, f.label)}
                        className={`opacity-0 group-hover:opacity-100 font-mono text-[10px] px-2.5 py-1 rounded border transition-all ${copied === f.label ? "opacity-100 bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                        {copied === f.label ? "✓" : "Copy"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        {isValid && parsedDate && (
          <div className="flex flex-wrap gap-6 px-4 py-3 bg-orange-500/[0.05] border border-orange-500/20 rounded-lg mb-5">
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Day</span><span className="font-mono text-sm text-orange-400">{DAYS[parsedDate.getDay()]}</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Week #</span><span className="font-mono text-sm text-orange-400">{getWeekNumber(parsedDate)}</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Unix</span><span className="font-mono text-sm text-orange-400">{Math.floor(parsedDate.getTime() / 1000)}</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">UTC Offset</span><span className="font-mono text-sm text-orange-400">{getUTCOffset(timezone)}</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Leap Year</span><span className="font-mono text-sm text-orange-400">{isLeapYear(parsedDate.getFullYear()) ? "Yes" : "No"}</span></div>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              <span className="font-mono text-[10px] text-orange-500/60">Parsed</span>
            </div>
          </div>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "🕐", title: "Timezone Aware", desc: "Convert dates across all major timezones. UTC offset shown for each conversion." },
            { icon: "⚡", title: "Multiple Formats", desc: "ISO 8601, Unix timestamps, human-readable, RFC 2822 and more — all at once." },
            { icon: "🔧", title: "Custom Patterns", desc: "Build your own format using tokens like YYYY, MM, DD, HH — live preview as you type." },
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