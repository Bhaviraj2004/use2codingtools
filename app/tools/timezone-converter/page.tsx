"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useEffect, useMemo } from "react";

// ── Timezone data ─────────────────────────────────────────────
const TIMEZONES = [
  { zone: "Pacific/Midway",        label: "Midway Island",        abbr: "SST",  offset: -11 },
  { zone: "Pacific/Honolulu",      label: "Hawaii",               abbr: "HST",  offset: -10 },
  { zone: "America/Anchorage",     label: "Alaska",               abbr: "AKST", offset: -9  },
  { zone: "America/Los_Angeles",   label: "Los Angeles (PST)",    abbr: "PST",  offset: -8  },
  { zone: "America/Denver",        label: "Denver (MST)",         abbr: "MST",  offset: -7  },
  { zone: "America/Chicago",       label: "Chicago (CST)",        abbr: "CST",  offset: -6  },
  { zone: "America/New_York",      label: "New York (EST)",       abbr: "EST",  offset: -5  },
  { zone: "America/Caracas",       label: "Caracas",              abbr: "VET",  offset: -4.5},
  { zone: "America/Halifax",       label: "Halifax (AST)",        abbr: "AST",  offset: -4  },
  { zone: "America/Sao_Paulo",     label: "São Paulo (BRT)",      abbr: "BRT",  offset: -3  },
  { zone: "Atlantic/Azores",       label: "Azores",               abbr: "AZOT", offset: -1  },
  { zone: "Europe/London",         label: "London (GMT)",         abbr: "GMT",  offset: 0   },
  { zone: "Europe/Paris",          label: "Paris (CET)",          abbr: "CET",  offset: 1   },
  { zone: "Europe/Istanbul",       label: "Istanbul (TRT)",       abbr: "TRT",  offset: 3   },
  { zone: "Asia/Dubai",            label: "Dubai (GST)",          abbr: "GST",  offset: 4   },
  { zone: "Asia/Karachi",          label: "Karachi (PKT)",        abbr: "PKT",  offset: 5   },
  { zone: "Asia/Kolkata",          label: "India (IST)",          abbr: "IST",  offset: 5.5 },
  { zone: "Asia/Dhaka",            label: "Dhaka (BST)",          abbr: "BST",  offset: 6   },
  { zone: "Asia/Bangkok",          label: "Bangkok (ICT)",        abbr: "ICT",  offset: 7   },
  { zone: "Asia/Shanghai",         label: "Shanghai (CST)",       abbr: "CST",  offset: 8   },
  { zone: "Asia/Singapore",        label: "Singapore (SGT)",      abbr: "SGT",  offset: 8   },
  { zone: "Asia/Tokyo",            label: "Tokyo (JST)",          abbr: "JST",  offset: 9   },
  { zone: "Australia/Adelaide",    label: "Adelaide (ACST)",      abbr: "ACST", offset: 9.5 },
  { zone: "Australia/Sydney",      label: "Sydney (AEST)",        abbr: "AEST", offset: 10  },
  { zone: "Pacific/Auckland",      label: "Auckland (NZST)",      abbr: "NZST", offset: 12  },
];

function getTimeInZone(date: Date, zone: string): string {
  return date.toLocaleTimeString("en-US", {
    timeZone: zone,
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: true,
  });
}

function getDateInZone(date: Date, zone: string): string {
  return date.toLocaleDateString("en-US", {
    timeZone: zone,
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

function getOffsetLabel(offset: number): string {
  const sign = offset >= 0 ? "+" : "-";
  const abs = Math.abs(offset);
  const h = Math.floor(abs);
  const m = (abs % 1) * 60;
  return `UTC${sign}${String(h).padStart(2, "0")}:${m === 0 ? "00" : String(m)}`;
}

function convertTime(
  timeStr: string, dateStr: string,
  fromZone: string, toZone: string
): string {
  try {
    const combined = `${dateStr}T${timeStr}`;
    // Create date in fromZone context
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: fromZone,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    });
    // Parse the input as local time in fromZone
    const d = new Date(combined);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString("en-US", {
      timeZone: toZone,
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: true,
    });
  } catch { return "—"; }
}

function getHourInZone(date: Date, zone: string): number {
  const h = parseInt(date.toLocaleString("en-US", { timeZone: zone, hour: "numeric", hour12: false }));
  return isNaN(h) ? 12 : h % 24;
}

function isDaytime(hour: number): boolean {
  return hour >= 6 && hour < 20;
}

function isWorkHour(hour: number): boolean {
  return hour >= 9 && hour < 18;
}

const POPULAR = ["Asia/Kolkata", "America/New_York", "Europe/London", "Asia/Tokyo", "America/Los_Angeles", "Asia/Dubai"];

export default function TimezoneConverter() {
  const [now, setNow]           = useState(new Date());
  const [fromZone, setFromZone] = useState("Asia/Kolkata");
  const [toZone, setToZone]     = useState("America/New_York");
  const [pinned, setPinned]     = useState<string[]>(POPULAR);
  const [search, setSearch]     = useState("");
  const [timeInput, setTimeInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showAll, setShowAll]   = useState(false);

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Init custom time
  useEffect(() => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const d = new Date();
    setTimeInput(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
    setDateInput(d.toISOString().split("T")[0]);
  }, []);

  const refDate = useMemo(() => {
    if (!useCustomTime) return now;
    try {
      const d = new Date(`${dateInput}T${timeInput}:00`);
      return isNaN(d.getTime()) ? now : d;
    } catch { return now; }
  }, [useCustomTime, timeInput, dateInput, now]);

  const copy = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const togglePin = (zone: string) => {
    setPinned((prev) =>
      prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]
    );
  };

  const filteredZones = useMemo(() => {
    const q = search.toLowerCase();
    return TIMEZONES.filter(
      (tz) =>
        tz.label.toLowerCase().includes(q) ||
        tz.abbr.toLowerCase().includes(q) ||
        tz.zone.toLowerCase().includes(q)
    );
  }, [search]);

  const displayZones = showAll ? filteredZones : filteredZones.filter((tz) => pinned.includes(tz.zone));

  // Main conversion
  const fromTZ = TIMEZONES.find((t) => t.zone === fromZone)!;
  const toTZ   = TIMEZONES.find((t) => t.zone === toZone)!;

  const fromTime = getTimeInZone(refDate, fromZone);
  const toTime   = getTimeInZone(refDate, toZone);
  const fromDate = getDateInZone(refDate, fromZone);
  const toDate   = getDateInZone(refDate, toZone);

  const diffHours = toTZ?.offset - fromTZ?.offset;
  const diffLabel = diffHours === 0 ? "Same timezone" :
    `${diffHours > 0 ? "+" : ""}${diffHours}h ${Math.abs(diffHours) === 1 ? "ahead" : diffHours > 0 ? "ahead" : "behind"}`;

  const fromHour = getHourInZone(refDate, fromZone);
  const toHour   = getHourInZone(refDate, toZone);

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -left-48 w-[500px] h-[500px] rounded-full bg-cyan-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -right-48 w-[400px] h-[400px] rounded-full bg-violet-500/[0.04] blur-3xl pointer-events-none" />

      {/* NAV */}

      <ToolNavbar toolName="Timezone Converter" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-cyan-500/10 flex items-center justify-center text-lg">🌍</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Timezone Converter</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded">live</span>
          </div>
          <p className="text-slate-500 text-sm">Convert time between any timezones. Live clock, custom time input, and a world clock for pinned cities.</p>
        </div>

        {/* Main converter card */}
        <div className="bg-white/[0.03] border border-cyan-500/20 rounded-xl p-6 mb-6">

          {/* Custom time toggle */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <label onClick={() => setUseCustomTime(!useCustomTime)} className="flex items-center gap-2.5 cursor-pointer group">
              <div className={`w-9 h-5 rounded-full transition-all relative ${useCustomTime ? "bg-cyan-500" : "bg-white/10"}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${useCustomTime ? "left-4" : "left-0.5"}`} />
              </div>
              <span className="font-mono text-xs text-slate-500 group-hover:text-slate-300 transition-colors">Custom time</span>
            </label>

            {useCustomTime ? (
              <div className="flex items-center gap-2">
                <input type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)}
                  className="font-mono text-sm px-3 py-1.5 bg-white/[0.05] border border-white/[0.1] rounded-lg text-slate-300 outline-none focus:border-cyan-500/40 transition-colors" />
                <input type="time" value={timeInput} onChange={(e) => setTimeInput(e.target.value)}
                  className="font-mono text-sm px-3 py-1.5 bg-white/[0.05] border border-white/[0.1] rounded-lg text-slate-300 outline-none focus:border-cyan-500/40 transition-colors" />
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="font-mono text-xs text-cyan-500/70">Live — updates every second</span>
              </div>
            )}
          </div>

          {/* From → To */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">

            {/* From */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
              <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">From</div>
              <select value={fromZone} onChange={(e) => setFromZone(e.target.value)}
                className="w-full font-mono text-sm bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-slate-300 outline-none focus:border-cyan-500/40 mb-4 transition-colors">
                {TIMEZONES.map((tz) => (
                  <option key={tz.zone} value={tz.zone}>{tz.label} ({getOffsetLabel(tz.offset)})</option>
                ))}
              </select>
              <div className="text-3xl font-bold font-mono text-cyan-400 tracking-tight mb-1">{fromTime}</div>
              <div className="font-mono text-xs text-slate-500 mb-1">{fromDate}</div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-slate-600">{getOffsetLabel(fromTZ?.offset ?? 0)}</span>
                <span className={`font-mono text-[10px] px-2 py-0.5 rounded ${isDaytime(fromHour) ? "bg-yellow-500/10 text-yellow-400" : "bg-slate-500/10 text-slate-500"}`}>
                  {isDaytime(fromHour) ? "☀️ Day" : "🌙 Night"}
                </span>
                <span className={`font-mono text-[10px] px-2 py-0.5 rounded ${isWorkHour(fromHour) ? "bg-emerald-500/10 text-emerald-400" : "bg-white/[0.04] text-slate-600"}`}>
                  {isWorkHour(fromHour) ? "💼 Work hours" : "Off hours"}
                </span>
              </div>
            </div>

            {/* Swap button */}
            <div className="flex flex-col items-center gap-2">
              <button onClick={() => { setFromZone(toZone); setToZone(fromZone); }}
                className="w-10 h-10 rounded-full border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-all flex items-center justify-center text-lg font-bold">
                ⇄
              </button>
              <div className={`font-mono text-[11px] text-center px-2 py-1 rounded ${diffHours === 0 ? "text-emerald-400" : "text-slate-500"}`}>
                {diffLabel}
              </div>
            </div>

            {/* To */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
              <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">To</div>
              <select value={toZone} onChange={(e) => setToZone(e.target.value)}
                className="w-full font-mono text-sm bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-slate-300 outline-none focus:border-cyan-500/40 mb-4 transition-colors">
                {TIMEZONES.map((tz) => (
                  <option key={tz.zone} value={tz.zone}>{tz.label} ({getOffsetLabel(tz.offset)})</option>
                ))}
              </select>
              <div className="text-3xl font-bold font-mono text-violet-400 tracking-tight mb-1">{toTime}</div>
              <div className="font-mono text-xs text-slate-500 mb-1">{toDate}</div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-slate-600">{getOffsetLabel(toTZ?.offset ?? 0)}</span>
                <span className={`font-mono text-[10px] px-2 py-0.5 rounded ${isDaytime(toHour) ? "bg-yellow-500/10 text-yellow-400" : "bg-slate-500/10 text-slate-500"}`}>
                  {isDaytime(toHour) ? "☀️ Day" : "🌙 Night"}
                </span>
                <span className={`font-mono text-[10px] px-2 py-0.5 rounded ${isWorkHour(toHour) ? "bg-emerald-500/10 text-emerald-400" : "bg-white/[0.04] text-slate-600"}`}>
                  {isWorkHour(toHour) ? "💼 Work hours" : "Off hours"}
                </span>
              </div>
            </div>
          </div>

          {/* Copy result */}
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { key: "from", label: `Copy ${fromTZ?.abbr}`, val: `${fromTime} ${fromTZ?.abbr} = ${toTime} ${toTZ?.abbr}` },
              { key: "full", label: "Copy full", val: `${fromDate} ${fromTime} (${fromTZ?.abbr}) → ${toDate} ${toTime} (${toTZ?.abbr})` },
            ].map((btn) => (
              <button key={btn.key} onClick={() => copy(btn.key, btn.val)}
                className={`font-mono text-[11px] px-3 py-1.5 rounded border transition-all ${copiedKey === btn.key ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300 hover:border-white/20"}`}>
                {copiedKey === btn.key ? "✓ Copied!" : btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* World Clock */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden mb-6">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
            <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">World Clock</span>
            <div className="flex items-center gap-3">
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search cities..."
                className="font-mono text-xs px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded text-slate-300 placeholder-slate-700 outline-none focus:border-cyan-500/30 w-40 transition-colors" />
              <button onClick={() => setShowAll(!showAll)}
                className="font-mono text-[11px] px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded hover:text-slate-300 hover:border-white/20 transition-all">
                {showAll ? "Pinned only" : `All (${TIMEZONES.length})`}
              </button>
            </div>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {displayZones.length === 0 && (
              <div className="px-5 py-8 text-center font-mono text-sm text-slate-600">No timezones found for "{search}"</div>
            )}
            {displayZones.map((tz) => {
              const tzHour = getHourInZone(refDate, tz.zone);
              const day    = isDaytime(tzHour);
              const work   = isWorkHour(tzHour);
              const isPinned = pinned.includes(tz.zone);
              return (
                <div key={tz.zone}
                  className={`flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group cursor-pointer ${(tz.zone === fromZone || tz.zone === toZone) ? "bg-cyan-500/[0.04]" : ""}`}
                  onClick={() => {
                    if (tz.zone !== fromZone && tz.zone !== toZone) setToZone(tz.zone);
                  }}>
                  {/* Day/night indicator */}
                  <div className={`w-2 h-2 rounded-full shrink-0 ${day ? "bg-yellow-400" : "bg-slate-600"}`} />

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-slate-300 truncate">{tz.label}</span>
                      {tz.zone === fromZone && <span className="font-mono text-[9px] px-1.5 py-0.5 bg-cyan-500/15 text-cyan-400 rounded">FROM</span>}
                      {tz.zone === toZone   && <span className="font-mono text-[9px] px-1.5 py-0.5 bg-violet-500/15 text-violet-400 rounded">TO</span>}
                    </div>
                    <div className="font-mono text-[10px] text-slate-700">{getOffsetLabel(tz.offset)} • {tz.abbr}</div>
                  </div>

                  {/* Work hours badge */}
                  {work && <span className="font-mono text-[10px] text-emerald-600 hidden sm:block">💼</span>}

                  {/* Time */}
                  <div className="text-right shrink-0">
                    <div className="font-mono text-sm text-slate-200 tabular-nums">{getTimeInZone(refDate, tz.zone)}</div>
                    <div className="font-mono text-[10px] text-slate-600">{getDateInZone(refDate, tz.zone).split(",")[0]}</div>
                  </div>

                  {/* Pin */}
                  <button onClick={(e) => { e.stopPropagation(); togglePin(tz.zone); }}
                    className={`text-sm transition-all shrink-0 ${isPinned ? "opacity-60 hover:opacity-100" : "opacity-0 group-hover:opacity-40 hover:!opacity-100"}`}
                    title={isPinned ? "Unpin" : "Pin"}>
                    📌
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "⚡", title: "Click to Convert", desc: "Click any city in the world clock to instantly set it as the destination timezone." },
            { icon: "📌", title: "Pin Cities",       desc: "Pin your favourite timezones to keep them in the world clock list." },
            { icon: "⏰", title: "Custom Time",      desc: "Toggle custom time to convert a specific date and time instead of now." },
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