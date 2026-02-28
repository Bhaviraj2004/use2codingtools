"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useMemo } from "react";

interface PermSet { read: boolean; write: boolean; execute: boolean; }
interface Permissions { owner: PermSet; group: PermSet; others: PermSet; }

const DEFAULT_PERMS: Permissions = {
  owner:  { read: true,  write: true,  execute: false },
  group:  { read: true,  write: false, execute: false },
  others: { read: true,  write: false, execute: false },
};

function permToOctal(p: PermSet): number {
  return (p.read ? 4 : 0) + (p.write ? 2 : 0) + (p.execute ? 1 : 0);
}

function octalToString(n: number): string {
  return (n & 4 ? "r" : "-") + (n & 2 ? "w" : "-") + (n & 1 ? "x" : "-");
}

function octalToPerms(n: number): PermSet {
  return { read: !!(n & 4), write: !!(n & 2), execute: !!(n & 1) };
}

function permsToBits(p: Permissions): string {
  return octalToString(permToOctal(p.owner)) + octalToString(permToOctal(p.group)) + octalToString(permToOctal(p.others));
}

const PRESETS = [
  { label: "644", desc: "Standard file",       owner: 6, group: 4, others: 4, icon: "📄" },
  { label: "755", desc: "Executable / dir",    owner: 7, group: 5, others: 5, icon: "📁" },
  { label: "777", desc: "Full access (risky)", owner: 7, group: 7, others: 7, icon: "⚠️" },
  { label: "600", desc: "Private file",        owner: 6, group: 0, others: 0, icon: "🔒" },
  { label: "700", desc: "Private directory",   owner: 7, group: 0, others: 0, icon: "🔐" },
  { label: "664", desc: "Group writable",      owner: 6, group: 6, others: 4, icon: "👥" },
  { label: "775", desc: "Group executable",    owner: 7, group: 7, others: 5, icon: "⚙️" },
  { label: "444", desc: "Read-only",           owner: 4, group: 4, others: 4, icon: "👁️" },
  { label: "400", desc: "Owner read-only",     owner: 4, group: 0, others: 0, icon: "🔑" },
  { label: "000", desc: "No permissions",      owner: 0, group: 0, others: 0, icon: "🚫" },
];

const WHO = [
  { key: "owner"  as const, label: "Owner (u)",  color: "text-emerald-400", activeBg: "bg-emerald-500/10 border-emerald-500/30" },
  { key: "group"  as const, label: "Group (g)",  color: "text-blue-400",    activeBg: "bg-blue-500/10    border-blue-500/30"    },
  { key: "others" as const, label: "Others (o)", color: "text-orange-400",  activeBg: "bg-orange-500/10  border-orange-500/30"  },
];

const BITS = [
  { key: "read"    as const, label: "Read",    short: "r", val: 4, activeClass: "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]"  },
  { key: "write"   as const, label: "Write",   short: "w", val: 2, activeClass: "bg-blue-500/20    border-blue-500/50    text-blue-400    shadow-[0_0_12px_rgba(59,130,246,0.15)]"  },
  { key: "execute" as const, label: "Execute", short: "x", val: 1, activeClass: "bg-orange-500/20  border-orange-500/50  text-orange-400  shadow-[0_0_12px_rgba(249,115,22,0.15)]"  },
];

const BIT_REF = [
  { oct: "7", bin: "111", sym: "rwx", meaning: "Read, write & execute" },
  { oct: "6", bin: "110", sym: "rw-", meaning: "Read & write" },
  { oct: "5", bin: "101", sym: "r-x", meaning: "Read & execute" },
  { oct: "4", bin: "100", sym: "r--", meaning: "Read only" },
  { oct: "3", bin: "011", sym: "-wx", meaning: "Write & execute" },
  { oct: "2", bin: "010", sym: "-w-", meaning: "Write only" },
  { oct: "1", bin: "001", sym: "--x", meaning: "Execute only" },
  { oct: "0", bin: "000", sym: "---", meaning: "No permissions" },
];

export default function ChmodCalculator() {
  const [perms, setPerms]         = useState<Permissions>(DEFAULT_PERMS);
  const [octalInput, setOctalInput] = useState("644");
  const [copied, setCopied]       = useState<string | null>(null);

  const octal    = useMemo(() => `${permToOctal(perms.owner)}${permToOctal(perms.group)}${permToOctal(perms.others)}`, [perms]);
  const symbolic = useMemo(() => permsToBits(perms), [perms]);

  const toggle = (who: keyof Permissions, bit: keyof PermSet) => {
    const next = { ...perms, [who]: { ...perms[who], [bit]: !perms[who][bit] } };
    setPerms(next);
    setOctalInput(`${permToOctal(next.owner)}${permToOctal(next.group)}${permToOctal(next.others)}`);
  };

  const applyOctal = (val: string) => {
    setOctalInput(val);
    if (/^[0-7]{3}$/.test(val)) {
      setPerms({
        owner:  octalToPerms(parseInt(val[0])),
        group:  octalToPerms(parseInt(val[1])),
        others: octalToPerms(parseInt(val[2])),
      });
    }
  };

  const applyPreset = (p: typeof PRESETS[0]) => {
    setOctalInput(p.label);
    setPerms({ owner: octalToPerms(p.owner), group: octalToPerms(p.group), others: octalToPerms(p.others) });
  };

  const copy = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const risk = useMemo(() => {
    if (octal === "777") return { label: "Dangerous", color: "text-red-400",    bg: "bg-red-500/10    border-red-500/30"    };
    if (perms.others.write) return { label: "Risky",     color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30" };
    if (["600","700","400"].includes(octal)) return { label: "Private", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/30" };
    return { label: "Standard", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" };
  }, [octal, perms.others.write]);

  const symCmd = useMemo(() => {
    const u = `${perms.owner.read?"r":""}${perms.owner.write?"w":""}${perms.owner.execute?"x":""}` || "''";
    const g = `${perms.group.read?"r":""}${perms.group.write?"w":""}${perms.group.execute?"x":""}` || "''";
    const o = `${perms.others.read?"r":""}${perms.others.write?"w":""}${perms.others.execute?"x":""}` || "''";
    return `chmod u=${u},g=${g},o=${o} filename`;
  }, [perms]);

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-orange-500/[0.04] blur-3xl pointer-events-none" />

      {/* NAV */}

               <ToolNavbar toolName="Chmod Calculator" />


      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center font-mono font-bold text-emerald-400 text-sm">rwx</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Chmod Calculator</h1>
            <span className={`font-mono text-[11px] px-2 py-0.5 rounded border ${risk.bg} ${risk.color}`}>{risk.label}</span>
          </div>
          <p className="text-slate-500 text-sm">Visually calculate Unix file permissions. Toggle bits or type an octal code to instantly see what each permission means.</p>
        </div>

        {/* Top row — octal + symbolic */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">

          {/* Octal input */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
            <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">Octal Code</div>
            <div className="flex items-baseline gap-4">
              <input value={octalInput} onChange={(e) => applyOctal(e.target.value)}
                maxLength={3}
                className="font-mono text-6xl font-extrabold text-emerald-400 bg-transparent outline-none w-36 tracking-widest" />
              <div className="flex flex-col gap-1.5">
                <span className={`font-mono text-xs px-2.5 py-1 rounded border ${risk.bg} ${risk.color}`}>{risk.label}</span>
                <span className="font-mono text-[10px] text-slate-600">chmod {octal} file</span>
              </div>
            </div>
            {!/^[0-7]{3}$/.test(octalInput) && octalInput.length > 0 && (
              <div className="font-mono text-xs text-red-400 mt-2">Invalid — use digits 0–7 only</div>
            )}
          </div>

          {/* Symbolic */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
            <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">Symbolic Notation</div>
            <div className="flex items-center gap-0.5 mb-3">
              <span className="font-mono text-4xl font-bold text-slate-600">-</span>
              {symbolic.split("").map((ch, i) => (
                <span key={i} className={`font-mono text-4xl font-bold ${
                  ch === "-" ? "text-slate-700" :
                  ch === "r" ? "text-emerald-400" :
                  ch === "w" ? "text-blue-400" :
                  "text-orange-400"
                }`}>{ch}</span>
              ))}
            </div>
            <div className="flex gap-4">
              {[
                { ch: "r", color: "text-emerald-400", label: "Read"    },
                { ch: "w", color: "text-blue-400",    label: "Write"   },
                { ch: "x", color: "text-orange-400",  label: "Execute" },
              ].map((item) => (
                <div key={item.ch} className="flex items-center gap-1.5">
                  <span className={`font-mono text-sm font-bold ${item.color}`}>{item.ch}</span>
                  <span className="font-mono text-[10px] text-slate-600">= {item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Permission grid */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden mb-6">
          {/* Header */}
          <div className="grid grid-cols-4 border-b border-white/[0.06] bg-white/[0.02]">
            <div className="px-5 py-3" />
            {BITS.map((bit) => (
              <div key={bit.key} className="px-4 py-3 text-center">
                <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-500">{bit.label}</div>
                <div className="font-mono text-[10px] text-slate-700 mt-0.5">{bit.short} = {bit.val}</div>
              </div>
            ))}
          </div>

          {/* Rows */}
          {WHO.map((who, wi) => (
            <div key={who.key} className={`grid grid-cols-4 ${wi < 2 ? "border-b border-white/[0.04]" : ""} hover:bg-white/[0.01] transition-colors`}>
              {/* Who label */}
              <div className="px-5 py-5 flex items-center gap-3">
                <div className={`font-mono text-sm font-bold px-3 py-1.5 rounded border ${who.activeBg} ${who.color}`}>
                  {permToOctal(perms[who.key])}
                </div>
                <div>
                  <div className={`font-mono text-sm font-semibold ${who.color}`}>{who.label}</div>
                  <div className="font-mono text-[11px] text-slate-700">{octalToString(permToOctal(perms[who.key]))}</div>
                </div>
              </div>

              {/* Bit toggles */}
              {BITS.map((bit) => {
                const isOn = perms[who.key][bit.key];
                return (
                  <div key={bit.key} className="flex items-center justify-center py-5">
                    <button onClick={() => toggle(who.key, bit.key)}
                      className={`w-14 h-14 rounded-xl border-2 font-mono text-xl font-bold transition-all hover:scale-105 active:scale-95 ${
                        isOn ? bit.activeClass : "bg-white/[0.03] border-white/[0.1] text-slate-700 hover:border-white/[0.2] hover:text-slate-500"
                      }`}>
                      {isOn ? bit.short : "-"}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Presets */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 mb-6">
          <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-4">Common Presets</div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {PRESETS.map((p) => (
              <button key={p.label} onClick={() => applyPreset(p)}
                className={`flex flex-col items-center gap-1.5 px-3 py-3.5 rounded-xl border transition-all ${
                  octal === p.label
                    ? "bg-emerald-500/15 border-emerald-500/40"
                    : "border-white/[0.06] hover:border-white/[0.16]"
                }`}>
                <span className="text-xl">{p.icon}</span>
                <span className={`font-mono text-base font-bold ${octal === p.label ? "text-emerald-400" : "text-slate-300"}`}>{p.label}</span>
                <span className="font-mono text-[10px] text-slate-600 text-center leading-tight">{p.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Commands */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 mb-6">
          <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-4">Ready-to-use Commands</div>
          <div className="flex flex-col gap-2">
            {[
              { key: "basic",     label: "Basic",             cmd: `chmod ${octal} filename` },
              { key: "recursive", label: "Recursive (dir)",   cmd: `chmod -R ${octal} directory/` },
              { key: "symbolic",  label: "Symbolic notation", cmd: symCmd },
            ].map((item) => (
              <div key={item.key} className="flex items-center gap-3 bg-black/30 border border-white/[0.06] rounded-lg px-4 py-3 group">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[10px] text-slate-600 mb-1">{item.label}</div>
                  <code className="font-mono text-sm text-emerald-400 break-all">$ {item.cmd}</code>
                </div>
                <button onClick={() => copy(item.key, item.cmd)}
                  className={`font-mono text-[11px] px-3 py-1.5 rounded border shrink-0 transition-all ${
                    copied === item.key ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-600 hover:text-slate-300 opacity-0 group-hover:opacity-100"
                  }`}>
                  {copied === item.key ? "✓" : "Copy"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Reference table */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-white/[0.06]">
            <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Permission Bit Reference</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Octal", "Binary", "Symbolic", "Meaning"].map((h) => (
                    <th key={h} className="font-mono text-[10px] uppercase tracking-widest text-slate-600 text-left px-5 py-2.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BIT_REF.map((row) => (
                  <tr key={row.oct} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="font-mono text-sm px-5 py-3 text-emerald-400 font-bold">{row.oct}</td>
                    <td className="font-mono text-sm px-5 py-3 text-slate-600">{row.bin}</td>
                    <td className="font-mono text-sm px-5 py-3">
                      {row.sym.split("").map((c, i) => (
                        <span key={i} className={c === "-" ? "text-slate-700" : c === "r" ? "text-emerald-400" : c === "w" ? "text-blue-400" : "text-orange-400"}>{c}</span>
                      ))}
                    </td>
                    <td className="font-mono text-xs px-5 py-3 text-slate-400">{row.meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "🖱️", title: "Click to Toggle",  desc: "Click any r/w/x button to toggle that permission on or off instantly." },
            { icon: "⌨️",  title: "Type Octal",       desc: "Type any 3-digit octal (e.g. 755) to set permissions directly." },
            { icon: "⚡",  title: "Quick Presets",    desc: "Pick from 10 common presets like 644, 755, 600 instantly." },
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