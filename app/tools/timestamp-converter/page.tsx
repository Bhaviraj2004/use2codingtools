"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useEffect } from "react";

const FORMATS = [
  { label: "ISO 8601", fn: (d: Date) => d.toISOString() },
  { label: "UTC String", fn: (d: Date) => d.toUTCString() },
  { label: "Local String", fn: (d: Date) => d.toLocaleString() },
  { label: "Date Only", fn: (d: Date) => d.toISOString().split("T")[0] },
  {
    label: "Time Only",
    fn: (d: Date) => d.toISOString().split("T")[1].replace("Z", ""),
  },
  { label: "Unix (ms)", fn: (d: Date) => String(d.getTime()) },
];

export default function TimestampConverter() {
  const [liveTs, setLiveTs] = useState(Date.now());
  const [tsInput, setTsInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [tsResult, setTsResult] = useState<Date | null>(null);
  const [dateResult, setDateResult] = useState<Date | null>(null);
  const [tsError, setTsError] = useState("");
  const [dateError, setDateError] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setLiveTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const copy = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  // Timestamp → Date
  const handleTs = (val: string) => {
    setTsInput(val);
    setTsError("");
    setTsResult(null);
    if (!val.trim()) return;
    const num = Number(val.trim());
    if (isNaN(num)) {
      setTsError("Enter a valid number");
      return;
    }
    // Auto-detect seconds vs ms
    const ms = num < 1e10 ? num * 1000 : num;
    const d = new Date(ms);
    if (isNaN(d.getTime())) {
      setTsError("Invalid timestamp");
      return;
    }
    setTsResult(d);
  };

  // Date → Timestamp
  const handleDate = (val: string) => {
    setDateInput(val);
    setDateError("");
    setDateResult(null);
    if (!val.trim()) return;
    const d = new Date(val.trim());
    if (isNaN(d.getTime())) {
      setDateError("Invalid date string");
      return;
    }
    setDateResult(d);
  };

  const liveDate = new Date(liveTs);

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,255,136,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.025) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="fixed -top-48 -left-48 w-[500px] h-[500px] rounded-full bg-cyan-500/[0.06] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -right-48 w-[400px] h-[400px] rounded-full bg-violet-500/[0.04] blur-3xl pointer-events-none" />

      <ToolNavbar toolName="Timestamp Converter" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-cyan-500/10 flex items-center justify-center text-lg">
              🕒
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Timestamp Converter
            </h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded">
              client-side
            </span>
          </div>
          <p className="text-slate-500 text-sm">
            Convert Unix timestamps to human dates and back. Live clock
            included.
          </p>
        </div>

        {/* Live Clock */}
        <div className="bg-white/[0.03] border border-cyan-500/20 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-mono text-[11px] uppercase tracking-[2px] text-cyan-500/70">
              Live Unix Clock
            </span>
          </div>
          <div className="font-mono text-4xl md:text-5xl font-bold text-cyan-400 tracking-tight mb-3">
            {Math.floor(liveTs / 1000)}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
            {FORMATS.map((f) => {
              const val = f.fn(liveDate);
              return (
                <button
                  key={f.label}
                  onClick={() => copy(`live-${f.label}`, val)}
                  className="text-left bg-white/[0.03] border border-white/[0.06] hover:border-cyan-500/30 rounded-lg px-3 py-2.5 transition-all group"
                >
                  <div className="font-mono text-[10px] text-slate-600 mb-1 group-hover:text-cyan-500/60 transition-colors">
                    {f.label}
                  </div>
                  <div
                    className={`font-mono text-xs break-all ${copiedKey === `live-${f.label}` ? "text-cyan-400" : "text-slate-400"}`}
                  >
                    {copiedKey === `live-${f.label}` ? "✓ Copied!" : val}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="font-mono text-[10px] text-slate-700 mt-3">
            Click any format to copy • Updates every second
          </p>
        </div>

        {/* Two converters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Timestamp → Date */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
            <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-4">
              Unix Timestamp → Date
            </div>
            <input
              type="text"
              value={tsInput}
              onChange={(e) => handleTs(e.target.value)}
              placeholder="e.g. 1700000000 or 1700000000000"
              className="w-full font-mono text-sm px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-slate-300 placeholder-slate-700 outline-none focus:border-cyan-500/40 transition-colors mb-3"
            />
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => handleTs(String(Math.floor(Date.now() / 1000)))}
                className="font-mono text-[11px] px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded hover:text-slate-300 hover:border-white/20 transition-all"
              >
                Now (s)
              </button>
              <button
                onClick={() => handleTs(String(Date.now()))}
                className="font-mono text-[11px] px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded hover:text-slate-300 hover:border-white/20 transition-all"
              >
                Now (ms)
              </button>
            </div>

            {tsError && (
              <div className="font-mono text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2 mb-3">
                {tsError}
              </div>
            )}

            {tsResult && (
              <div className="space-y-2">
                {FORMATS.map((f) => {
                  const val = f.fn(tsResult);
                  const key = `ts-${f.label}`;
                  return (
                    <button
                      key={f.label}
                      onClick={() => copy(key, val)}
                      className="w-full text-left flex items-center justify-between bg-white/[0.03] border border-white/[0.06] hover:border-cyan-500/30 rounded-lg px-3 py-2.5 transition-all group"
                    >
                      <div>
                        <div className="font-mono text-[10px] text-slate-600 group-hover:text-cyan-500/60">
                          {f.label}
                        </div>
                        <div
                          className={`font-mono text-xs ${copiedKey === key ? "text-cyan-400" : "text-slate-300"}`}
                        >
                          {copiedKey === key ? "✓ Copied!" : val}
                        </div>
                      </div>
                      <span className="text-slate-700 text-xs group-hover:text-slate-500 ml-2">
                        copy
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {!tsResult && !tsError && (
              <div className="font-mono text-xs text-slate-700 text-center py-8">
                Enter a timestamp above
              </div>
            )}
          </div>

          {/* Date → Timestamp */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
            <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-4">
              Date String → Unix Timestamp
            </div>
            <input
              type="text"
              value={dateInput}
              onChange={(e) => handleDate(e.target.value)}
              placeholder="e.g. 2024-01-15 or Jan 15 2024"
              className="w-full font-mono text-sm px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-slate-300 placeholder-slate-700 outline-none focus:border-cyan-500/40 transition-colors mb-3"
            />
            <div className="flex gap-2 mb-4">
              <button
                onClick={() =>
                  handleDate(new Date().toISOString().split("T")[0])
                }
                className="font-mono text-[11px] px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded hover:text-slate-300 hover:border-white/20 transition-all"
              >
                Today
              </button>
              <button
                onClick={() => handleDate(new Date().toISOString())}
                className="font-mono text-[11px] px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded hover:text-slate-300 hover:border-white/20 transition-all"
              >
                Now ISO
              </button>
            </div>

            {dateError && (
              <div className="font-mono text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2 mb-3">
                {dateError}
              </div>
            )}

            {dateResult && (
              <div className="space-y-2">
                {[
                  {
                    label: "Unix (seconds)",
                    val: String(Math.floor(dateResult.getTime() / 1000)),
                  },
                  { label: "Unix (ms)", val: String(dateResult.getTime()) },
                  ...FORMATS.slice(0, 4).map((f) => ({
                    label: f.label,
                    val: f.fn(dateResult),
                  })),
                ].map((row) => {
                  const key = `date-${row.label}`;
                  return (
                    <button
                      key={row.label}
                      onClick={() => copy(key, row.val)}
                      className="w-full text-left flex items-center justify-between bg-white/[0.03] border border-white/[0.06] hover:border-cyan-500/30 rounded-lg px-3 py-2.5 transition-all group"
                    >
                      <div>
                        <div className="font-mono text-[10px] text-slate-600 group-hover:text-cyan-500/60">
                          {row.label}
                        </div>
                        <div
                          className={`font-mono text-xs ${copiedKey === key ? "text-cyan-400" : "text-slate-300"}`}
                        >
                          {copiedKey === key ? "✓ Copied!" : row.val}
                        </div>
                      </div>
                      <span className="text-slate-700 text-xs group-hover:text-slate-500 ml-2">
                        copy
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {!dateResult && !dateError && (
              <div className="font-mono text-xs text-slate-700 text-center py-8">
                Enter a date string above
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
          {[
            {
              icon: "⚡",
              title: "Auto-detect",
              desc: "Automatically detects seconds vs milliseconds based on value magnitude.",
            },
            {
              icon: "🌍",
              title: "6 Formats",
              desc: "ISO 8601, UTC, Local, Date-only, Time-only, Unix ms — all in one click.",
            },
            {
              icon: "📋",
              title: "Click to Copy",
              desc: "Click any result row to instantly copy it to your clipboard.",
            },
          ].map((c) => (
            <div
              key={c.title}
              className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-5 py-4"
            >
              <div className="text-xl mb-2">{c.icon}</div>
              <div className="font-semibold text-slate-300 text-sm mb-1">
                {c.title}
              </div>
              <div className="text-slate-600 text-xs leading-relaxed">
                {c.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
