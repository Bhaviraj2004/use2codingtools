"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useCallback } from "react";

type UUIDVersion = "v4" | "v7";

// UUID v4 generator
function generateV4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// UUID v7 generator (time-ordered)
function generateV7(): string {
  const now = Date.now();
  const timeHex = now.toString(16).padStart(12, "0");
  const rand1 = Math.floor(Math.random() * 0x0fff)
    .toString(16)
    .padStart(3, "0");
  const rand2 = Math.floor(Math.random() * 0x3fff + 0x8000)
    .toString(16)
    .padStart(4, "0");
  const rand3 = Array.from({ length: 12 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
  return `${timeHex.slice(0, 8)}-${timeHex.slice(8, 12)}-7${rand1}-${rand2}-${rand3}`;
}

function generate(version: UUIDVersion): string {
  return version === "v4" ? generateV4() : generateV7();
}

interface UUIDEntry {
  id: number;
  value: string;
  version: UUIDVersion;
  copiedAt: number | null;
}

export default function UUIDGenerator() {
  const [version, setVersion] = useState<UUIDVersion>("v4");
  const [count, setCount] = useState(5);
  const [uuids, setUuids] = useState<UUIDEntry[]>([]);
  const [uppercase, setUppercase] = useState(false);
  const [noDashes, setNoDashes] = useState(false);
  const [allCopied, setAllCopied] = useState(false);

  const format = useCallback(
    (uuid: string) => {
      let u = uuid;
      if (noDashes) u = u.replace(/-/g, "");
      if (uppercase) u = u.toUpperCase();
      return u;
    },
    [uppercase, noDashes]
  );

  const generateBatch = useCallback(() => {
    const batch: UUIDEntry[] = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      value: generate(version),
      version,
      copiedAt: null,
    }));
    setUuids(batch);
    setAllCopied(false);
  }, [count, version]);

  const copySingle = (id: number, value: string) => {
    navigator.clipboard.writeText(format(value));
    setUuids((prev) =>
      prev.map((u) => (u.id === id ? { ...u, copiedAt: Date.now() } : u))
    );
    setTimeout(() => {
      setUuids((prev) =>
        prev.map((u) => (u.id === id ? { ...u, copiedAt: null } : u))
      );
    }, 1500);
  };

  const copyAll = () => {
    const text = uuids.map((u) => format(u.value)).join("\n");
    navigator.clipboard.writeText(text);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 1800);
  };

  const downloadTxt = () => {
    const text = uuids.map((u) => format(u.value)).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `uuids-${version}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const regenerateOne = (id: number) => {
    setUuids((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, value: generate(u.version), copiedAt: null } : u
      )
    );
  };

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,255,136,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.025) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-orange-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

      {/* NAV */}
      <ToolNavbar toolName="UUID Generator" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-orange-500/10 flex items-center justify-center text-lg">🔑</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">UUID Generator</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded">client-side</span>
          </div>
          <p className="text-slate-500 text-sm">Generate unique UUIDs in bulk — v4 (random) or v7 (time-ordered). Instant, private, free.</p>
        </div>

        {/* Controls */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Version */}
            <div>
              <label className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 block mb-3">
                Version
              </label>
              <div className="flex gap-2">
                {(["v4", "v7"] as UUIDVersion[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setVersion(v)}
                    className={`flex-1 font-mono text-sm py-2.5 rounded-md border transition-all ${
                      version === v
                        ? "bg-orange-500/20 border-orange-500/50 text-orange-400 font-bold"
                        : "bg-transparent border-white/[0.08] text-slate-500 hover:text-slate-300 hover:border-white/20"
                    }`}
                  >
                    {v.toUpperCase()}
                    <div className="text-[9px] font-normal mt-0.5 opacity-60">
                      {v === "v4" ? "Random" : "Time-ordered"}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Count */}
            <div>
              <label className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 block mb-3">
                Count — <span className="text-orange-400">{count}</span>
              </label>
              <input
                type="range"
                min={1}
                max={50}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full accent-orange-400 cursor-pointer"
              />
              <div className="flex justify-between font-mono text-[10px] text-slate-700 mt-1">
                <span>1</span>
                <span>50</span>
              </div>
            </div>

            {/* Options */}
            <div>
              <label className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 block mb-3">
                Format Options
              </label>
              <div className="space-y-2.5">
                {[
                  { label: "UPPERCASE", val: uppercase, set: setUppercase },
                  { label: "No dashes", val: noDashes, set: setNoDashes },
                ].map((opt) => (
                  <label key={opt.label} className="flex items-center gap-3 cursor-pointer group">
                    <div
                      onClick={() => opt.set(!opt.val)}
                      className={`w-9 h-5 rounded-full transition-all relative ${
                        opt.val ? "bg-orange-500" : "bg-white/10"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                          opt.val ? "left-4" : "left-0.5"
                        }`}
                      />
                    </div>
                    <span className="font-mono text-xs text-slate-500 group-hover:text-slate-300 transition-colors">
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={generateBatch}
            className="mt-6 w-full font-mono text-sm font-bold py-3.5 bg-orange-500 hover:bg-orange-400 text-white rounded-md transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            ⚡ Generate {count} UUID{count > 1 ? "s" : ""}
          </button>
        </div>

        {/* Output */}
        {uuids.length > 0 && (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
            {/* Output toolbar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">
                {uuids.length} UUID{uuids.length > 1 ? "s" : ""} — <span className="text-orange-400">{version.toUpperCase()}</span>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={copyAll}
                  className={`font-mono text-[11px] px-3 py-1.5 rounded border transition-all ${
                    allCopied
                      ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                      : "border-white/[0.08] text-slate-500 hover:text-slate-300 hover:border-white/20"
                  }`}
                >
                  {allCopied ? "✓ Copied All!" : "Copy All"}
                </button>
                <button
                  onClick={downloadTxt}
                  className="font-mono text-[11px] px-3 py-1.5 rounded border border-white/[0.08] text-slate-500 hover:text-slate-300 hover:border-white/20 transition-all"
                >
                  Download .txt
                </button>
              </div>
            </div>

            {/* UUID list */}
            <div className="divide-y divide-white/[0.04]">
              {uuids.map((u, i) => (
                <div
                  key={u.id}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] group transition-colors"
                >
                  <span className="font-mono text-[10px] text-slate-700 w-5 text-right shrink-0">
                    {i + 1}
                  </span>
                  <span className="font-mono text-sm text-slate-300 flex-1 tracking-wide break-all">
                    {format(u.value)}
                  </span>
                  <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => regenerateOne(u.id)}
                      title="Regenerate"
                      className="font-mono text-xs px-2 py-1 rounded border border-white/[0.08] text-slate-600 hover:text-slate-300 hover:border-white/20 transition-all"
                    >
                      ↻
                    </button>
                    <button
                      onClick={() => copySingle(u.id, u.value)}
                      className={`font-mono text-xs px-3 py-1 rounded border transition-all ${
                        u.copiedAt
                          ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                          : "border-white/[0.08] text-slate-500 hover:text-slate-300 hover:border-white/20"
                      }`}
                    >
                      {u.copiedAt ? "✓" : "Copy"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {uuids.length === 0 && (
          <div className="text-center py-20 border border-dashed border-white/[0.06] rounded-xl">
            <div className="text-4xl mb-4">🔑</div>
            <p className="font-mono text-sm text-slate-600">Click Generate to create UUIDs</p>
          </div>
        )}

        {/* Info section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-5 py-5">
            <div className="font-mono text-xs text-orange-400 mb-2">UUID v4</div>
            <div className="font-semibold text-slate-300 text-sm mb-1">Completely Random</div>
            <div className="text-slate-600 text-xs leading-relaxed">
              Generated using cryptographic randomness. Best for most use cases — user IDs, session tokens, database primary keys.
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-5 py-5">
            <div className="font-mono text-xs text-orange-400 mb-2">UUID v7</div>
            <div className="font-semibold text-slate-300 text-sm mb-1">Time-Ordered</div>
            <div className="text-slate-600 text-xs leading-relaxed">
              Embeds a millisecond timestamp prefix. Sortable by creation time — great for databases, logs, and distributed systems.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}