"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState } from "react";

type TokenFormat = "hex" | "base64" | "base64url" | "alphanumeric" | "numeric" | "custom";

const FORMAT_META: Record<TokenFormat, { label: string; desc: string; charset?: string; color: string; tag: string }> = {
  hex:          { label: "Hex",          desc: "0-9, a-f",              color: "text-emerald-400", tag: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  base64:       { label: "Base64",       desc: "A-Z, a-z, 0-9, +/=",   color: "text-cyan-400",    tag: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  base64url:    { label: "Base64URL",    desc: "A-Z, a-z, 0-9, -_",    color: "text-violet-400",  tag: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  alphanumeric: { label: "Alphanumeric", desc: "A-Z, a-z, 0-9",        color: "text-orange-400",  tag: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  numeric:      { label: "Numeric",      desc: "0-9 only",              color: "text-yellow-400",  tag: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  custom:       { label: "Custom",       desc: "Your own charset",      color: "text-pink-400",    tag: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
};

const PRESETS = [
  { label: "API Key",       length: 32,  format: "hex"          as TokenFormat },
  { label: "Session Token", length: 48,  format: "base64url"    as TokenFormat },
  { label: "OTP (6 digit)", length: 6,   format: "numeric"      as TokenFormat },
  { label: "OTP (8 digit)", length: 8,   format: "numeric"      as TokenFormat },
  { label: "Secret Key",    length: 64,  format: "hex"          as TokenFormat },
  { label: "Invite Code",   length: 8,   format: "alphanumeric" as TokenFormat },
];

const USE_CASES = [
  { icon: "🔑", title: "API Keys",        example: "32-byte hex" },
  { icon: "🍪", title: "Session Tokens",  example: "48-byte base64url" },
  { icon: "📱", title: "OTP Codes",       example: "6-digit numeric" },
  { icon: "🔗", title: "Invite Links",    example: "8-char alphanumeric" },
  { icon: "🔒", title: "CSRF Tokens",     example: "32-byte hex" },
  { icon: "📧", title: "Email Verify",    example: "64-byte base64url" },
];

function generateToken(bytes: number, format: TokenFormat, customCharset: string): string {
  const rawBytes = crypto.getRandomValues(new Uint8Array(bytes));

  if (format === "hex") {
    return Array.from(rawBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  if (format === "base64") {
    return btoa(String.fromCharCode(...rawBytes));
  }

  if (format === "base64url") {
    return btoa(String.fromCharCode(...rawBytes))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }

  // For charset-based formats, derive chars from random bytes
  let charset = "";
  if (format === "alphanumeric") charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  else if (format === "numeric") charset = "0123456789";
  else if (format === "custom") charset = customCharset || "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  // Use rejection sampling for uniform distribution
  const result: string[] = [];
  const maxValid = Math.floor(256 / charset.length) * charset.length;
  let i = 0;
  while (result.length < bytes && i < rawBytes.length * 10) {
    const extraBytes = crypto.getRandomValues(new Uint8Array(bytes * 2));
    for (const b of extraBytes) {
      if (result.length >= bytes) break;
      if (b < maxValid) result.push(charset[b % charset.length]);
    }
    i++;
  }
  return result.join("");
}

interface TokenEntry {
  id: number;
  value: string;
  format: TokenFormat;
  bytes: number;
  copied: boolean;
}

export default function RandomToken() {
  const [format, setFormat]             = useState<TokenFormat>("hex");
  const [byteLength, setByteLength]     = useState(32);
  const [count, setCount]               = useState(1);
  const [customCharset, setCustomCharset] = useState("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*");
  const [prefix, setPrefix]             = useState("");
  const [tokens, setTokens]             = useState<TokenEntry[]>([]);
  const [allCopied, setAllCopied]       = useState(false);
  const [history, setHistory]           = useState<string[]>([]);

  const generate = (fmt = format, bytes = byteLength, cnt = count) => {
    const newTokens: TokenEntry[] = Array.from({ length: cnt }, (_, i) => ({
      id: Date.now() + i,
      value: (prefix ? prefix + "_" : "") + generateToken(bytes, fmt, customCharset),
      format: fmt,
      bytes,
      copied: false,
    }));
    setTokens(newTokens);
    setAllCopied(false);
    // Add to history (first token only)
    if (newTokens[0]) {
      setHistory((prev) => [newTokens[0].value, ...prev.filter((h) => h !== newTokens[0].value)].slice(0, 10));
    }
  };

  const loadPreset = (p: typeof PRESETS[0]) => {
    setFormat(p.format);
    setByteLength(p.length);
    setCount(1);
    generate(p.format, p.length, 1);
  };

  const copyToken = (id: number, value: string) => {
    navigator.clipboard.writeText(value);
    setTokens((prev) => prev.map((t) => t.id === id ? { ...t, copied: true } : t));
    setTimeout(() => setTokens((prev) => prev.map((t) => t.id === id ? { ...t, copied: false } : t)), 1500);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(tokens.map((t) => t.value).join("\n"));
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 1800);
  };

  const downloadTxt = () => {
    const blob = new Blob([tokens.map((t) => t.value).join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `tokens-${format}-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const regenerateOne = (id: number) => {
    setTokens((prev) => prev.map((t) =>
      t.id === id
        ? { ...t, value: (prefix ? prefix + "_" : "") + generateToken(t.bytes, t.format, customCharset), copied: false }
        : t
    ));
  };

  // Calculate output length preview
  const outputLengthPreview = (() => {
    const pLen = prefix ? prefix.length + 1 : 0;
    if (format === "hex") return byteLength * 2 + pLen;
    if (format === "base64") return Math.ceil(byteLength / 3) * 4 + pLen;
    if (format === "base64url") return Math.ceil(byteLength * 4 / 3) + pLen;
    return byteLength + pLen; // alphanumeric / numeric / custom
  })();

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -left-48 w-[500px] h-[500px] rounded-full bg-violet-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -right-48 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

      {/* NAV */}
      {/* <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#09090f]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <a href="/" className="font-mono text-sm font-bold text-emerald-400">use2<span className="text-slate-500">coding</span>tools</a>
          <span className="text-white/10">/</span>
          <span className="font-mono text-sm text-slate-400">Random Token Generator</span>
        </div>
      </nav> */}

      <ToolNavbar toolName="Random Token Generator" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-violet-500/10 flex items-center justify-center text-lg">🎲</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Random Token Generator</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded">Web Crypto API</span>
          </div>
          <p className="text-slate-500 text-sm">
            Generate cryptographically secure random tokens in hex, base64, alphanumeric, and more. API keys, OTPs, session tokens — all in one place.
          </p>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="font-mono text-[11px] text-slate-600 self-center uppercase tracking-wider">Presets:</span>
          {PRESETS.map((p) => (
            <button key={p.label} onClick={() => loadPreset(p)}
              className="font-mono text-[11px] px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded hover:text-violet-400 hover:border-violet-500/30 transition-all">
              {p.label}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Format */}
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">Format</div>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(FORMAT_META) as TokenFormat[]).map((f) => (
                  <button key={f} onClick={() => { setFormat(f); }}
                    className={`font-mono text-xs py-2 px-2 rounded border transition-all text-left ${
                      format === f ? `${FORMAT_META[f].tag}` : "border-white/[0.08] text-slate-600 hover:text-slate-300"
                    }`}>
                    <div className="font-bold">{FORMAT_META[f].label}</div>
                    <div className="text-[9px] opacity-60 mt-0.5">{FORMAT_META[f].desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Length + Count */}
            <div className="space-y-5">
              {/* Byte length */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">
                    {format === "numeric" || format === "alphanumeric" || format === "custom" ? "Length (chars)" : "Length (bytes)"}
                  </span>
                  <span className="font-mono text-sm text-violet-400 font-bold">{byteLength}</span>
                </div>
                <input type="range" min={4} max={128} value={byteLength}
                  onChange={(e) => setByteLength(Number(e.target.value))}
                  className="w-full accent-violet-500 cursor-pointer" />
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {[8, 16, 24, 32, 48, 64].map((l) => (
                    <button key={l} onClick={() => setByteLength(l)}
                      className={`font-mono text-[10px] px-2 py-0.5 rounded border transition-all ${
                        byteLength === l ? "bg-violet-500/20 border-violet-500/30 text-violet-400" : "border-white/[0.08] text-slate-700 hover:text-slate-400"
                      }`}>{l}</button>
                  ))}
                </div>
              </div>

              {/* Count */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Count</span>
                  <span className="font-mono text-sm text-violet-400 font-bold">{count}</span>
                </div>
                <input type="range" min={1} max={20} value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full accent-violet-500 cursor-pointer" />
              </div>
            </div>

            {/* Options */}
            <div className="space-y-4">
              {/* Prefix */}
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-2">Prefix (optional)</div>
                <input type="text" value={prefix} onChange={(e) => setPrefix(e.target.value.replace(/\s/g, ""))}
                  placeholder="e.g. sk, pk, tok"
                  className="w-full font-mono text-sm px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-slate-300 placeholder-slate-700 outline-none focus:border-violet-500/30 transition-colors" />
                {prefix && <div className="font-mono text-[10px] text-slate-700 mt-1">Preview: <span className="text-violet-400">{prefix}_</span>…</div>}
              </div>

              {/* Custom charset */}
              {format === "custom" && (
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-2">Custom Charset</div>
                  <textarea value={customCharset} onChange={(e) => setCustomCharset(e.target.value)}
                    rows={3}
                    className="w-full font-mono text-xs px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-slate-300 placeholder-slate-700 outline-none focus:border-pink-500/30 resize-none transition-colors" />
                  <div className="font-mono text-[10px] text-slate-700 mt-1">{new Set(customCharset).size} unique chars</div>
                </div>
              )}

              {/* Output length preview */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2.5">
                <div className="font-mono text-[10px] text-slate-700 mb-1">Output length</div>
                <div className="font-mono text-sm text-violet-400 font-bold">~{outputLengthPreview} chars</div>
              </div>
            </div>
          </div>

          {/* Generate button */}
          <button onClick={() => generate()}
            className="mt-6 w-full font-mono text-sm font-bold py-3.5 bg-violet-500 hover:bg-violet-400 text-white rounded-md transition-all hover:-translate-y-0.5 active:translate-y-0">
            ⚡ Generate {count > 1 ? `${count} Tokens` : "Token"}
          </button>
        </div>

        {/* Output */}
        {tokens.length > 0 && (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden mb-5">
            {/* Output toolbar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">
                  {tokens.length} Token{tokens.length > 1 ? "s" : ""}
                </span>
                <span className={`font-mono text-[11px] px-2 py-0.5 rounded border ${FORMAT_META[format].tag}`}>
                  {FORMAT_META[format].label}
                </span>
              </div>
              <div className="flex gap-2">
                {tokens.length > 1 && (
                  <>
                    <button onClick={copyAll}
                      className={`font-mono text-[11px] px-3 py-1.5 rounded border transition-all ${
                        allCopied ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"
                      }`}>
                      {allCopied ? "✓ Copied All!" : "Copy All"}
                    </button>
                    <button onClick={downloadTxt}
                      className="font-mono text-[11px] px-3 py-1.5 rounded border border-white/[0.08] text-slate-500 hover:text-slate-300 hover:border-white/20 transition-all">
                      ↓ .txt
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Token list */}
            <div className="divide-y divide-white/[0.04]">
              {tokens.map((t, i) => (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] group transition-colors">
                  <span className="font-mono text-[10px] text-slate-700 w-5 text-right shrink-0">{i + 1}</span>
                  <span className={`font-mono text-sm flex-1 break-all tracking-wide ${FORMAT_META[t.format].color}`}>
                    {t.value}
                  </span>
                  <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => regenerateOne(t.id)} title="Regenerate this token"
                      className="font-mono text-xs px-2 py-1 rounded border border-white/[0.08] text-slate-600 hover:text-slate-300 hover:border-white/20 transition-all">
                      ↻
                    </button>
                    <button onClick={() => copyToken(t.id, t.value)}
                      className={`font-mono text-xs px-3 py-1 rounded border transition-all ${
                        t.copied ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"
                      }`}>
                      {t.copied ? "✓" : "Copy"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {tokens.length === 0 && (
          <div className="text-center py-16 border border-dashed border-white/[0.06] rounded-xl mb-5">
            <div className="text-4xl mb-4">🎲</div>
            <p className="font-mono text-sm text-slate-600">Click Generate to create secure random tokens</p>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden mb-6">
            <div className="px-5 py-3 border-b border-white/[0.06] font-mono text-[11px] uppercase tracking-[2px] text-slate-600">
              Recent Tokens
            </div>
            <div className="divide-y divide-white/[0.04]">
              {history.map((h, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-2.5 hover:bg-white/[0.02] group transition-colors">
                  <span className="font-mono text-xs text-slate-500 flex-1 break-all">{h}</span>
                  <button onClick={() => navigator.clipboard.writeText(h)}
                    className="font-mono text-[11px] px-2 py-1 border border-white/[0.08] text-slate-600 rounded opacity-0 group-hover:opacity-100 hover:text-slate-300 transition-all">
                    Copy
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Use cases */}
        <div className="mb-6">
          <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">Common Use Cases</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {USE_CASES.map((u) => (
              <div key={u.title} className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-4 py-3 flex items-center gap-3">
                <span className="text-lg shrink-0">{u.icon}</span>
                <div>
                  <div className="font-mono text-xs text-slate-300 font-semibold">{u.title}</div>
                  <div className="font-mono text-[10px] text-slate-700">{u.example}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "🔐", title: "Cryptographically Secure", desc: "Uses Web Crypto API's getRandomValues — not Math.random(). Safe for security tokens." },
            { icon: "⚡", title: "6 Formats",                desc: "Hex, Base64, Base64URL, Alphanumeric, Numeric, and Custom charset — all covered." },
            { icon: "📋", title: "Prefix Support",           desc: "Add prefixes like sk_, pk_, tok_ to identify token type at a glance." },
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