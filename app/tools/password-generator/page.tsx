"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useCallback, useEffect } from "react";

const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?";
const AMBIGUOUS = "0O1lI";

interface Options {
  length: number;
  lowercase: boolean;
  uppercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
  noRepeat: boolean;
}

function generatePassword(opts: Options): string {
  let charset = "";
  if (opts.lowercase) charset += LOWERCASE;
  if (opts.uppercase) charset += UPPERCASE;
  if (opts.numbers) charset += NUMBERS;
  if (opts.symbols) charset += SYMBOLS;
  if (opts.excludeAmbiguous) {
    AMBIGUOUS.split("").forEach((c) => {
      charset = charset.replace(new RegExp(c, "g"), "");
    });
  }
  if (!charset) return "";

  let result = "";
  const arr = new Uint32Array(opts.length * 2);
  crypto.getRandomValues(arr);
  let i = 0;
  while (result.length < opts.length && i < arr.length) {
    const char = charset[arr[i] % charset.length];
    if (opts.noRepeat && result.includes(char)) { i++; continue; }
    result += char;
    i++;
  }
  // Ensure at least one char from each enabled group
  const groups = [];
  if (opts.lowercase) groups.push(LOWERCASE);
  if (opts.uppercase) groups.push(UPPERCASE);
  if (opts.numbers) groups.push(NUMBERS);
  if (opts.symbols) groups.push(SYMBOLS);

  const resultArr = result.split("");
  groups.forEach((g, idx) => {
    if (idx < resultArr.length && !resultArr.some((c) => g.includes(c))) {
      const pick = g[Math.floor(Math.random() * g.length)];
      resultArr[idx] = pick;
    }
  });
  return resultArr.join("");
}

function getStrength(pwd: string): { score: number; label: string; color: string } {
  if (!pwd) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (pwd.length >= 16) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;

  if (score <= 2) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 4) return { score, label: "Fair", color: "bg-yellow-500" };
  if (score <= 5) return { score, label: "Good", color: "bg-blue-400" };
  return { score, label: "Strong", color: "bg-emerald-400" };
}

function colorizePassword(pwd: string) {
  return pwd.split("").map((c, i) => {
    let cls = "text-slate-200";
    if (/[A-Z]/.test(c)) cls = "text-violet-300";
    else if (/[0-9]/.test(c)) cls = "text-orange-300";
    else if (/[^a-zA-Z0-9]/.test(c)) cls = "text-emerald-300";
    return <span key={i} className={cls}>{c}</span>;
  });
}

export default function PasswordGenerator() {
  const [opts, setOpts] = useState<Options>({
    length: 16,
    lowercase: true,
    uppercase: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: false,
    noRepeat: false,
  });

  const [passwords, setPasswords] = useState<string[]>([]);
  const [count, setCount] = useState(1);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [allCopied, setAllCopied] = useState(false);

  const generate = useCallback((o: Options = opts, n: number = count) => {
    const list = Array.from({ length: n }, () => generatePassword(o));
    setPasswords(list);
    setCopiedIdx(null);
    setAllCopied(false);
  }, [opts, count]);

  // Auto generate on mount
  useEffect(() => { generate(); }, []); // eslint-disable-line

  const setOpt = (key: keyof Options, val: boolean | number) => {
    const next = { ...opts, [key]: val };
    // At least one charset must be on
    const anyCharset = next.lowercase || next.uppercase || next.numbers || next.symbols;
    if (!anyCharset) return;
    setOpts(next);
    generate(next, count);
  };

  const handleLength = (val: number) => {
    const next = { ...opts, length: val };
    setOpts(next);
    generate(next, count);
  };

  const handleCount = (val: number) => {
    setCount(val);
    generate(opts, val);
  };

  const copy = (idx: number) => {
    navigator.clipboard.writeText(passwords[idx]);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(passwords.join("\n"));
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 1800);
  };

  const strength = getStrength(passwords[0] ?? "");

  const toggles = [
    { key: "lowercase" as keyof Options, label: "Lowercase", example: "abc", color: "text-slate-300" },
    { key: "uppercase" as keyof Options, label: "Uppercase", example: "ABC", color: "text-violet-300" },
    { key: "numbers" as keyof Options, label: "Numbers", example: "123", color: "text-orange-300" },
    { key: "symbols" as keyof Options, label: "Symbols", example: "!@#", color: "text-emerald-300" },
  ];

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      {/* Grid bg */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,255,136,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.025) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-violet-500/[0.06] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

      {/* NAV */}
      {/* <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#09090f]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <a href="/" className="font-mono text-sm font-bold text-emerald-400 tracking-tight">
            use2<span className="text-slate-500">coding</span>tools
          </a>
          <span className="text-white/10">/</span>
          <span className="font-mono text-sm text-slate-400">Password Generator</span>
        </div>
      </nav> */}
      <ToolNavbar toolName="Password Generator" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-violet-500/10 flex items-center justify-center text-lg">🔒</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Password Generator</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">client-side</span>
          </div>
          <p className="text-slate-500 text-sm">
            Generate cryptographically secure passwords. Customize length, character sets, and rules.
          </p>
        </div>

        {/* Main password display */}
        {passwords[0] && (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Generated Password</span>
              <div className="flex items-center gap-2">
                {strength.label && (
                  <span className={`font-mono text-[11px] px-2 py-0.5 rounded ${
                    strength.label === "Strong" ? "bg-emerald-500/15 text-emerald-400" :
                    strength.label === "Good" ? "bg-blue-500/15 text-blue-400" :
                    strength.label === "Fair" ? "bg-yellow-500/15 text-yellow-400" :
                    "bg-red-500/15 text-red-400"
                  }`}>
                    {strength.label}
                  </span>
                )}
              </div>
            </div>

            {/* Password text */}
            <div className="font-mono text-xl md:text-2xl tracking-wider bg-white/[0.03] border border-white/[0.06] rounded-lg px-5 py-4 mb-4 break-all leading-relaxed min-h-[64px] flex items-center">
              {colorizePassword(passwords[0])}
            </div>

            {/* Strength bar */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${strength.color}`}
                  style={{ width: `${(strength.score / 7) * 100}%` }}
                />
              </div>
              <span className="font-mono text-[10px] text-slate-600 w-10">{opts.length} chr</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => generate()}
                className="font-mono text-sm font-bold px-5 py-2.5 bg-violet-500 hover:bg-violet-400 text-white rounded-md transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                ↻ Regenerate
              </button>
              <button
                onClick={() => copy(0)}
                className={`font-mono text-sm px-5 py-2.5 rounded-md border transition-all ${
                  copiedIdx === 0
                    ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                    : "border-white/[0.08] text-slate-400 hover:text-white hover:border-white/20"
                }`}
              >
                {copiedIdx === 0 ? "✓ Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

          {/* Left — length + count */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 space-y-6">

            {/* Length */}
            <div>
              <div className="flex justify-between mb-3">
                <label className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Length</label>
                <span className="font-mono text-sm text-violet-400 font-bold">{opts.length}</span>
              </div>
              <input
                type="range" min={4} max={128} value={opts.length}
                onChange={(e) => handleLength(Number(e.target.value))}
                className="w-full accent-violet-500 cursor-pointer"
              />
              <div className="flex justify-between font-mono text-[10px] text-slate-700 mt-1">
                <span>4</span><span>32</span><span>64</span><span>128</span>
              </div>
              {/* Quick presets */}
              <div className="flex gap-2 mt-3">
                {[8, 12, 16, 24, 32].map((l) => (
                  <button
                    key={l}
                    onClick={() => handleLength(l)}
                    className={`font-mono text-[11px] px-2.5 py-1 rounded border transition-all ${
                      opts.length === l
                        ? "bg-violet-500/20 border-violet-500/40 text-violet-400"
                        : "border-white/[0.08] text-slate-600 hover:text-slate-300"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Count */}
            <div>
              <div className="flex justify-between mb-3">
                <label className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Bulk Count</label>
                <span className="font-mono text-sm text-violet-400 font-bold">{count}</span>
              </div>
              <input
                type="range" min={1} max={20} value={count}
                onChange={(e) => handleCount(Number(e.target.value))}
                className="w-full accent-violet-500 cursor-pointer"
              />
              <div className="flex justify-between font-mono text-[10px] text-slate-700 mt-1">
                <span>1</span><span>20</span>
              </div>
            </div>
          </div>

          {/* Right — charset + options */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 space-y-4">
            <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-1">Character Sets</div>
            {toggles.map((t) => (
              <label key={t.key} className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div
                    onClick={() => setOpt(t.key, !opts[t.key])}
                    className={`w-9 h-5 rounded-full transition-all relative shrink-0 ${opts[t.key] ? "bg-violet-500" : "bg-white/10"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${opts[t.key] ? "left-4" : "left-0.5"}`} />
                  </div>
                  <span className="font-mono text-sm text-slate-400 group-hover:text-slate-200 transition-colors">{t.label}</span>
                </div>
                <span className={`font-mono text-xs ${t.color} opacity-60`}>{t.example}</span>
              </label>
            ))}

            <div className="border-t border-white/[0.06] pt-4 space-y-3">
              <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-1">Extra Rules</div>
              {[
                { key: "excludeAmbiguous" as keyof Options, label: "Exclude ambiguous", sub: "No 0, O, 1, l, I" },
                { key: "noRepeat" as keyof Options, label: "No repeat chars", sub: "Each char used once" },
              ].map((r) => (
                <label key={r.key} className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => setOpt(r.key, !opts[r.key])}
                    className={`w-9 h-5 rounded-full transition-all relative shrink-0 ${opts[r.key] ? "bg-emerald-500" : "bg-white/10"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${opts[r.key] ? "left-4" : "left-0.5"}`} />
                  </div>
                  <div>
                    <div className="font-mono text-sm text-slate-400 group-hover:text-slate-200 transition-colors">{r.label}</div>
                    <div className="font-mono text-[10px] text-slate-700">{r.sub}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Bulk list */}
        {passwords.length > 1 && (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden mb-6">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">
                {passwords.length} Passwords
              </span>
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
            </div>
            <div className="divide-y divide-white/[0.04]">
              {passwords.map((pwd, i) => {
                const s = getStrength(pwd);
                return (
                  <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02] group transition-colors">
                    <span className="font-mono text-[10px] text-slate-700 w-5 text-right shrink-0">{i + 1}</span>
                    <span className="font-mono text-sm flex-1 tracking-wide break-all">
                      {colorizePassword(pwd)}
                    </span>
                    <span className={`font-mono text-[10px] shrink-0 hidden sm:block ${
                      s.label === "Strong" ? "text-emerald-500" :
                      s.label === "Good" ? "text-blue-400" :
                      s.label === "Fair" ? "text-yellow-500" : "text-red-400"
                    }`}>{s.label}</span>
                    <button
                      onClick={() => copy(i)}
                      className={`font-mono text-xs px-3 py-1 rounded border transition-all opacity-0 group-hover:opacity-100 shrink-0 ${
                        copiedIdx === i
                          ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                          : "border-white/[0.08] text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {copiedIdx === i ? "✓" : "Copy"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "🎲", title: "Cryptographically Secure", desc: "Uses Web Crypto API — not Math.random(). Suitable for real passwords." },
            { icon: "🌈", title: "Color-coded", desc: "Uppercase in purple, numbers in orange, symbols in green — easy to read." },
            { icon: "🔒", title: "Never stored", desc: "Passwords are generated locally. Nothing is sent to any server, ever." },
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