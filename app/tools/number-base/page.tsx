"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useMemo } from "react";

// ── Types ─────────────────────────────────────────────────────
type BaseKey = "bin" | "oct" | "dec" | "hex" | "b32" | "b36" | "b58" | "b64";

interface BaseConfig {
  key: BaseKey;
  label: string;
  name: string;
  radix: number;
  prefix: string;
  color: string;
  icon: string;
}

const BASES: BaseConfig[] = [
  { key:"bin", label:"BIN", name:"Binary",      radix:2,  prefix:"0b", color:"text-emerald-400", icon:"2" },
  { key:"oct", label:"OCT", name:"Octal",       radix:8,  prefix:"0o", color:"text-cyan-400",    icon:"8" },
  { key:"dec", label:"DEC", name:"Decimal",     radix:10, prefix:"",   color:"text-white",        icon:"10"},
  { key:"hex", label:"HEX", name:"Hexadecimal", radix:16, prefix:"0x", color:"text-violet-400",  icon:"16"},
  { key:"b32", label:"B32", name:"Base 32",     radix:32, prefix:"",   color:"text-orange-400",  icon:"32"},
  { key:"b36", label:"B36", name:"Base 36",     radix:36, prefix:"",   color:"text-yellow-400",  icon:"36"},
  { key:"b58", label:"B58", name:"Base 58",     radix:58, prefix:"",   color:"text-pink-400",    icon:"58"},
  { key:"b64", label:"B64", name:"Base 64",     radix:64, prefix:"",   color:"text-sky-400",     icon:"64"},
];

// ── Base 58 ──────────────────────────────────────────────────
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function encodeB58(n: bigint): string {
  if (n === 0n) return "1";
  let r = ""; let x = n;
  while (x > 0n) { r = B58[Number(x % 58n)] + r; x /= 58n; }
  return r;
}
function decodeB58(s: string): bigint {
  let r = 0n;
  for (const c of s) { const i = B58.indexOf(c); if (i < 0) throw new Error("bad B58"); r = r * 58n + BigInt(i); }
  return r;
}

// ── Base 32 (RFC 4648) ────────────────────────────────────────
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function encodeB32(n: bigint): string {
  if (n === 0n) return "A";
  let r = ""; let x = n;
  while (x > 0n) { r = B32[Number(x % 32n)] + r; x /= 32n; }
  return r;
}
function decodeB32(s: string): bigint {
  let r = 0n;
  for (const c of s.toUpperCase()) { const i = B32.indexOf(c); if (i < 0) throw new Error("bad B32"); r = r * 32n + BigInt(i); }
  return r;
}

// ── Base 64 (numeric) ─────────────────────────────────────────
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function encodeB64(n: bigint): string {
  if (n === 0n) return "A";
  let r = ""; let x = n;
  while (x > 0n) { r = B64[Number(x % 64n)] + r; x /= 64n; }
  return r;
}
function decodeB64(s: string): bigint {
  let r = 0n;
  for (const c of s) { const i = B64.indexOf(c); if (i < 0) throw new Error("bad B64"); r = r * 64n + BigInt(i); }
  return r;
}

// ── Generic radix ─────────────────────────────────────────────
const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";
function toBigInt(s: string, radix: number): bigint {
  if (!s) return 0n;
  const neg = s.startsWith("-"); const str = neg ? s.slice(1) : s;
  let r = 0n;
  for (const c of str.toLowerCase()) {
    const d = DIGITS.indexOf(c);
    if (d < 0 || d >= radix) throw new Error(`Invalid char '${c}'`);
    r = r * BigInt(radix) + BigInt(d);
  }
  return neg ? -r : r;
}
function fromBigInt(n: bigint, radix: number): string {
  if (n === 0n) return "0";
  const neg = n < 0n; let x = neg ? -n : n;
  let r = "";
  while (x > 0n) { r = DIGITS[Number(x % BigInt(radix))] + r; x /= BigInt(radix); }
  return (neg ? "-" : "") + r;
}

// ── Master convert ────────────────────────────────────────────
function convertAll(raw: string, from: BaseKey): Record<BaseKey, string> {
  const empty = Object.fromEntries(BASES.map(b => [b.key, ""])) as Record<BaseKey, string>;
  if (!raw.trim()) return empty;
  let n: bigint;
  try {
    if (from === "b58") n = decodeB58(raw.trim());
    else if (from === "b32") n = decodeB32(raw.trim());
    else if (from === "b64") n = decodeB64(raw.trim());
    else n = toBigInt(raw.trim(), BASES.find(b => b.key === from)!.radix);
  } catch { return empty; }

  const out: Record<string, string> = {};
  for (const b of BASES) {
    try {
      if (b.key === "b58") out[b.key] = encodeB58(n);
      else if (b.key === "b32") out[b.key] = encodeB32(n);
      else if (b.key === "b64") out[b.key] = encodeB64(n);
      else out[b.key] = fromBigInt(n, b.radix).toUpperCase();
    } catch { out[b.key] = "—"; }
  }
  return out as Record<BaseKey, string>;
}

// ── Bit helpers ───────────────────────────────────────────────
function groupBits(bin: string, g: number): string {
  const p = bin.padStart(Math.ceil(bin.length / g) * g, "0");
  return p.match(new RegExp(`.{1,${g}}`, "g"))?.join(" ") ?? bin;
}
function groupHex(hex: string): string {
  return hex.padStart(Math.ceil(hex.length / 2) * 2, "0").match(/.{1,2}/g)?.join(" ") ?? hex;
}

// ── Properties ───────────────────────────────────────────────
function getProps(n: bigint) {
  if (n < 0n || n > 2n ** 64n) return null;
  const bitLength  = n === 0n ? 1 : n.toString(2).length;
  const byteLength = Math.ceil(bitLength / 8);
  const isEven     = n % 2n === 0n;
  const isPow2     = n > 0n && (n & (n - 1n)) === 0n;
  const isPrime    = n > 1n && (() => {
    if (n < 4n) return true;
    if (n % 2n === 0n || n % 3n === 0n) return false;
    for (let i = 5n; i * i <= n && i < 10000n; i += 6n)
      if (n % i === 0n || n % (i + 2n) === 0n) return false;
    return n < 10000n;
  })();
  return { bitLength, byteLength, isEven, isPow2, isPrime };
}

const QUICK = [
  { label:"0",      val:"0",                    base:"dec" as BaseKey },
  { label:"255",    val:"255",                  base:"dec" as BaseKey },
  { label:"256",    val:"256",                  base:"dec" as BaseKey },
  { label:"1024",   val:"1024",                 base:"dec" as BaseKey },
  { label:"0xFF",   val:"FF",                   base:"hex" as BaseKey },
  { label:"2³²−1",  val:"4294967295",           base:"dec" as BaseKey },
  { label:"2⁶⁴−1",  val:"18446744073709551615", base:"dec" as BaseKey },
  { label:"42",     val:"42",                   base:"dec" as BaseKey },
  { label:"0b1010", val:"1010",                 base:"bin" as BaseKey },
];

export default function NumberBase() {
  const initInputs = () => {
    const r = Object.fromEntries(BASES.map(b => [b.key, ""])) as Record<BaseKey, string>;
    r.dec = "255";
    return r;
  };

  const [inputs, setInputs]     = useState<Record<BaseKey, string>>(initInputs);
  const [active, setActive]     = useState<BaseKey>("dec");
  const [copied, setCopied]     = useState<string | null>(null);
  const [bitGroup, setBitGroup] = useState<4 | 8>(4);

  const converted = useMemo(() => convertAll(inputs[active], active), [inputs, active]);

  const decVal = useMemo(() => {
    try { return toBigInt(converted.dec || "0", 10); } catch { return null; }
  }, [converted.dec]);

  const props = useMemo(() => decVal !== null ? getProps(decVal) : null, [decVal]);

  const setInput = (base: BaseKey, val: string) => {
    setActive(base);
    setInputs(prev => ({ ...prev, [base]: val }));
  };

  const applyQuick = (val: string, base: BaseKey) => {
    setActive(base);
    setInputs(() => {
      const r = Object.fromEntries(BASES.map(b => [b.key, ""])) as Record<BaseKey, string>;
      r[base] = val;
      return r;
    });
  };

  const copy = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(null), 1400);
  };

  const binStr = converted.bin?.replace(/\s/g, "") || "";
  const hexStr = converted.hex?.replace(/\s/g, "") || "";
  const padLen  = Math.max(8, Math.ceil(binStr.length / 8) * 8);
  const binPad  = binStr.padStart(padLen, "0");

  const hasValue = !!inputs[active]?.trim();

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-mono">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage:"linear-gradient(rgba(0,255,136,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.02) 1px,transparent 1px)", backgroundSize:"40px 40px" }} />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-56 bg-emerald-500/[0.04] blur-3xl pointer-events-none rounded-full" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-violet-500/[0.04] blur-3xl pointer-events-none rounded-full" />
      
      <ToolNavbar toolName="Number Base Converter" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">01</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Number Base Converter</h1>
            <span className="text-[11px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded">8 bases · BigInt</span>
          </div>
          <p className="text-slate-500 text-sm">Convert between Binary, Octal, Decimal, Hex, Base32, Base36, Base58 and Base64 instantly. No overflow — handles 64-bit+ numbers.</p>
        </div>

        {/* Quick values */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-[10px] text-slate-700 self-center uppercase tracking-wider">Quick:</span>
          {QUICK.map(q => (
            <button key={q.label} onClick={() => applyQuick(q.val, q.base)}
              className="text-[11px] px-3 py-1.5 border border-white/[0.08] text-slate-600 rounded-lg hover:text-emerald-400 hover:border-emerald-500/30 transition-all">
              {q.label}
            </button>
          ))}
          <button onClick={() => applyQuick("", "dec")} className="text-[11px] px-3 py-1.5 border border-white/[0.06] text-slate-700 rounded-lg hover:text-red-400 hover:border-red-500/20 transition-all ml-auto">clear</button>
        </div>

        {/* ── Conversion inputs ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {BASES.map(base => {
            const isAct = active === base.key;
            const displayVal = isAct ? inputs[base.key] : (converted[base.key] || "");
            const isEmpty    = !displayVal;

            return (
              <div key={base.key}
                className={`group relative border rounded-xl transition-all duration-150 overflow-hidden ${isAct ? "border-emerald-500/40 bg-emerald-500/[0.04] shadow-lg shadow-emerald-500/5" : "border-white/[0.07] bg-white/[0.015] hover:border-white/[0.14]"}`}>
                <div className={`absolute left-0 top-3 bottom-3 w-[2px] rounded-r transition-all ${isAct ? "bg-emerald-500" : "bg-transparent"}`} />

                <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${isAct ? "bg-emerald-500/25 border-emerald-500/40 text-emerald-400" : "border-white/[0.08] text-slate-600"}`}>
                      {base.label}
                    </span>
                    <span className="text-[10px] text-slate-700">{base.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-800">base {base.radix}</span>
                    {displayVal && displayVal !== "—" && (
                      <button onClick={() => copy(base.prefix + displayVal, base.key)}
                        className={`text-[9px] px-1.5 py-0.5 rounded border opacity-0 group-hover:opacity-100 transition-all ${copied === base.key ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-700 hover:text-slate-400"}`}>
                        {copied === base.key ? "✓" : "copy"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="px-4 pb-3">
                  <input
                    value={displayVal}
                    onChange={e => setInput(base.key, e.target.value.toUpperCase().replace(/\s/g, ""))}
                    onFocus={() => setActive(base.key)}
                    placeholder={`0  ·  ${base.name.toLowerCase()}`}
                    spellCheck={false}
                    readOnly={!isAct}
                    className={`w-full text-xl font-bold bg-transparent outline-none tracking-widest transition-colors placeholder-slate-800 ${isAct ? "text-emerald-400 caret-emerald-400" : isEmpty ? "text-slate-800" : base.color}`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Bit visualizer ── */}
        {hasValue && binStr && (
          <div className="bg-white/[0.02] border border-white/[0.07] rounded-xl p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-[11px] uppercase tracking-[2px] text-slate-600">Bit Map</span>
                <div className="flex gap-1">
                  {([4, 8] as const).map(g => (
                    <button key={g} onClick={() => setBitGroup(g)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-all ${bitGroup === g ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-700 hover:text-slate-400"}`}>
                      {g}-bit
                    </button>
                  ))}
                </div>
              </div>
              <span className="text-[10px] text-slate-700">{binPad.length} bits · {Math.ceil(binPad.length / 8)} byte{Math.ceil(binPad.length / 8) !== 1 ? "s" : ""}</span>
            </div>

            {/* Bit cells */}
            <div className="flex flex-wrap gap-y-1.5 mb-4">
              {binPad.split("").map((bit, i) => (
                <span key={i} className={i > 0 && i % bitGroup === 0 ? "ml-2" : ""}>
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-[11px] font-bold border transition-colors ${bit === "1" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-white/[0.02] text-slate-700 border-white/[0.05]"}`}>
                    {bit}
                  </span>
                </span>
              ))}
            </div>

            {/* Byte breakdown */}
            <div className="flex flex-wrap gap-3">
              {Array.from({ length: Math.ceil(binPad.length / 8) }).map((_, bi) => {
                const bits  = binPad.slice(bi * 8, bi * 8 + 8);
                const dec   = parseInt(bits, 2);
                const hx    = dec.toString(16).padStart(2, "0").toUpperCase();
                return (
                  <div key={bi} className="flex flex-col items-center gap-0.5 bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2">
                    <span className="text-[8px] text-slate-700">byte {bi}</span>
                    <span className="text-xs text-violet-400 font-bold">{hx}</span>
                    <span className="text-[9px] text-slate-600">{dec}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Properties ── */}
        {hasValue && decVal !== null && props && converted.dec && (
          <div className="bg-white/[0.02] border border-white/[0.07] rounded-xl p-5 mb-5">
            <div className="text-[11px] uppercase tracking-[2px] text-slate-600 mb-4">Number Properties</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: "Bit length",  val: String(props.bitLength)  },
                { label: "Byte length", val: String(props.byteLength) },
                { label: "Decimal",     val: converted.dec            },
                { label: "0x Hex",      val: "0x" + converted.hex     },
              ].map(s => (
                <div key={s.label} className="bg-black/30 border border-white/[0.06] rounded-lg px-3 py-2.5 text-center">
                  <div className="text-sm font-bold text-white truncate">{s.val}</div>
                  <div className="text-[9px] text-slate-700 mt-0.5 uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Even",       active: props.isEven,  color: "text-cyan-400    border-cyan-500/25    bg-cyan-500/10"    },
                { label: "Odd",        active: !props.isEven, color: "text-slate-500   border-white/[0.08]   bg-white/[0.03]"   },
                { label: "Prime",      active: props.isPrime, color: "text-violet-400  border-violet-500/25  bg-violet-500/10"  },
                { label: "Power of 2", active: props.isPow2,  color: "text-emerald-400 border-emerald-500/25 bg-emerald-500/10" },
              ].filter(f => f.active).map(f => (
                <span key={f.label} className={`text-[11px] px-2.5 py-1 rounded border font-semibold ${f.color}`}>✓ {f.label}</span>
              ))}
            </div>
          </div>
        )}

        {/* ── Formatted values ── */}
        {hasValue && binStr && (
          <div className="bg-white/[0.02] border border-white/[0.07] rounded-xl p-5 mb-5">
            <div className="text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">Formatted Values</div>
            <div className="flex flex-col gap-0">
              {[
                { label: `Binary (${bitGroup}-bit groups)`, val: groupBits(binStr, bitGroup), color: "text-emerald-400", key: "fmtbin" },
                { label: "Hex (byte pairs)",                val: groupHex(hexStr),            color: "text-violet-400",  key: "fmthex" },
                { label: "0b prefix",                      val: "0b" + binStr,                color: "text-emerald-300", key: "fmtbin2"},
                { label: "0x prefix",                      val: "0x" + converted.hex,         color: "text-violet-300",  key: "fmthex2"},
              ].map(row => (
                <div key={row.key} className="flex items-center gap-4 py-2.5 border-b border-white/[0.04] last:border-0 group">
                  <span className="text-[10px] text-slate-700 w-36 shrink-0">{row.label}</span>
                  <span className={`text-xs ${row.color} flex-1 break-all leading-relaxed`}>{row.val}</span>
                  <button onClick={() => copy(row.val, row.key)}
                    className={`text-[9px] px-2 py-0.5 rounded border shrink-0 opacity-0 group-hover:opacity-100 transition-all ${copied === row.key ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-700 hover:text-slate-400"}`}>
                    {copied === row.key ? "✓" : "copy"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Quick ops ── */}
        {hasValue && decVal !== null && (
          <div className="bg-white/[0.02] border border-white/[0.07] rounded-xl p-5 mb-6">
            <div className="text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">Quick Operations</div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {[
                { label: "+1",      fn: () => (decVal + 1n).toString()  },
                { label: "−1",      fn: () => (decVal > 0n ? decVal - 1n : 0n).toString() },
                { label: "×2",      fn: () => (decVal * 2n).toString()  },
                { label: "÷2",      fn: () => (decVal / 2n).toString()  },
                { label: "<<1",     fn: () => (decVal << 1n).toString() },
                { label: ">>1",     fn: () => (decVal >> 1n).toString() },
                { label: "NOT",     fn: () => { const bits = props?.bitLength ?? 8; return (decVal ^ ((1n << BigInt(bits)) - 1n)).toString(); } },
                { label: "Next 2ⁿ", fn: () => { let p = 1n; while (p <= decVal) p <<= 1n; return p.toString(); } },
              ].map(op => (
                <button key={op.label}
                  onClick={() => {
                    try {
                      const r = op.fn();
                      setActive("dec");
                      setInputs(() => { const n = Object.fromEntries(BASES.map(b => [b.key, ""])) as Record<BaseKey,string>; n.dec = r; return n; });
                    } catch {}
                  }}
                  className="text-xs py-2 bg-white/[0.02] border border-white/[0.07] rounded-lg text-slate-500 hover:text-white hover:border-white/[0.2] hover:bg-white/[0.05] transition-all">
                  {op.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: "🔢", title: "8 Bases",      desc: "BIN, OCT, DEC, HEX, B32, B36, B58, B64" },
            { icon: "🦕", title: "BigInt safe",   desc: "No overflow — handles 64-bit+ integers" },
            { icon: "🎯", title: "Bit Map",       desc: "Visual bit grid with byte-level breakdown" },
            { icon: "⚡", title: "Live convert",  desc: "Type in any field, all others update instantly" },
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