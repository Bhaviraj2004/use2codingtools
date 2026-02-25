"use client";

import { useState, useCallback } from "react";
import bcrypt from "bcryptjs";
import ToolNavbar from "@/app/components/toolsNavBar";

const DEFAULT_ROUNDS = 12;

export default function BcryptHash() {
  const [password, setPassword] = useState("");
  const [hash, setHash] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verifyInput, setVerifyInput] = useState("");
  const [showVerifyInput, setShowVerifyInput] = useState(false);
  const [verifyResult, setVerifyResult] = useState<"match" | "no-match" | null>(null);
  const [rounds, setRounds] = useState(DEFAULT_ROUNDS);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [hashTime, setHashTime] = useState<number | null>(null);

  // Custom hash input (verify against external hash)
  const [customHash, setCustomHash] = useState("");
  const [useCustomHash, setUseCustomHash] = useState(false);

  const generateHash = useCallback(async () => {
    if (!password.trim()) { setError("Enter a password first"); return; }
    setError("");
    setGenerating(true);
    setHash("");
    setHashTime(null);
    setVerifyResult(null);
    try {
      const t0 = performance.now();
      const salt = await bcrypt.genSalt(rounds);
      const hashed = await bcrypt.hash(password, salt);
      const t1 = performance.now();
      setHash(hashed);
      setHashTime(Math.round(t1 - t0));
      setVerifyInput("");
      setVerifyResult(null);
    } catch {
      setError("Hash generation failed");
    } finally {
      setGenerating(false);
    }
  }, [password, rounds]);

  const handleVerify = useCallback(async () => {
    const targetHash = useCustomHash ? customHash.trim() : hash;
    if (!targetHash || !verifyInput.trim()) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const isMatch = await bcrypt.compare(verifyInput, targetHash);
      setVerifyResult(isMatch ? "match" : "no-match");
    } catch {
      setVerifyResult("no-match");
    } finally {
      setVerifying(false);
    }
  }, [hash, verifyInput, customHash, useCustomHash]);

  const handleCopy = () => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleClear = () => {
    setPassword(""); setHash(""); setVerifyInput("");
    setVerifyResult(null); setError(""); setHashTime(null);
    setCustomHash(""); setUseCustomHash(false);
  };

  const activeHash = useCustomHash ? customHash.trim() : hash;

  // Parse bcrypt hash info
  const hashInfo = hash ? (() => {
    const parts = hash.split("$");
    return parts.length >= 4 ? {
      version: parts[1],
      cost: parts[2],
      salt: parts[3]?.slice(0, 22),
    } : null;
  })() : null;

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-orange-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

      {/* NAV */}
      <ToolNavbar toolName="bcrypt" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-orange-500/10 flex items-center justify-center text-lg">🔒</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">bcrypt Hash Generator & Verifier</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded">client-side</span>
          </div>
          <p className="text-slate-500 text-sm">
            Generate secure bcrypt hashes or verify passwords against existing hashes. Runs entirely in your browser — no server involved.
          </p>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

          {/* ── Generate ── */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              <h2 className="font-mono text-sm font-bold text-orange-400 uppercase tracking-wider">Generate Hash</h2>
            </div>

            {/* Password input */}
            <div className="mb-4">
              <label className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 block mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && generateHash()}
                  placeholder="Enter your password..."
                  className="w-full font-mono text-sm bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 pr-12 text-slate-200 placeholder-slate-700 outline-none focus:border-orange-500/40 transition-colors"
                />
                <button onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors text-sm">
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {/* Cost rounds */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Cost Factor (rounds)</label>
                <span className="font-mono text-sm text-orange-400 font-bold">{rounds}</span>
              </div>
              <div className="flex gap-2 mb-2">
                {[8, 10, 12, 14, 16].map((r) => (
                  <button key={r} onClick={() => setRounds(r)}
                    className={`flex-1 font-mono text-xs py-1.5 rounded border transition-all ${
                      rounds === r
                        ? "bg-orange-500/20 border-orange-500/40 text-orange-400"
                        : "border-white/[0.08] text-slate-600 hover:text-slate-300"
                    }`}>
                    {r}{r === 12 ? "*" : ""}
                  </button>
                ))}
              </div>
              <div className="flex justify-between font-mono text-[10px] text-slate-700">
                <span>← faster / less secure</span>
                <span>* recommended</span>
                <span>slower / more secure →</span>
              </div>
              <p className="font-mono text-[10px] text-slate-700 mt-1">
                2^{rounds} = {(Math.pow(2, rounds)).toLocaleString()} iterations
              </p>
            </div>

            {/* Generate button */}
            <button onClick={generateHash} disabled={generating || !password.trim()}
              className={`w-full font-mono text-sm font-bold py-3 rounded-lg transition-all ${
                generating
                  ? "bg-orange-500/10 border border-orange-500/20 text-orange-400/50 cursor-wait"
                  : "bg-orange-500 hover:bg-orange-400 text-white hover:-translate-y-0.5"
              } disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0`}>
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-orange-400/50 border-t-orange-400 rounded-full animate-spin" />
                  Hashing... (cost {rounds})
                </span>
              ) : "⚡ Generate Hash"}
            </button>

            {/* Hash output */}
            {hash && (
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Generated Hash</span>
                  <div className="flex items-center gap-2">
                    {hashTime && <span className="font-mono text-[10px] text-slate-700">{hashTime}ms</span>}
                    <button onClick={handleCopy}
                      className={`font-mono text-[11px] px-3 py-1 rounded border transition-all ${
                        copied ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"
                      }`}>
                      {copied ? "✓ Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
                <div className="bg-white/[0.03] border border-orange-500/20 rounded-lg p-3 font-mono text-xs break-all text-orange-300 leading-relaxed">
                  {hash}
                </div>

                {/* Hash breakdown */}
                {hashInfo && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {[
                      { label: "Version", val: `$${hashInfo.version}$` },
                      { label: "Cost", val: hashInfo.cost },
                      { label: "Salt (22 chars)", val: hashInfo.salt?.slice(0, 10) + "…" },
                    ].map((item) => (
                      <div key={item.label} className="bg-white/[0.02] border border-white/[0.06] rounded px-2 py-1.5 text-center">
                        <div className="font-mono text-[9px] text-slate-700 mb-0.5">{item.label}</div>
                        <div className="font-mono text-[11px] text-slate-400">{item.val}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Verify ── */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <h2 className="font-mono text-sm font-bold text-emerald-400 uppercase tracking-wider">Verify Password</h2>
            </div>

            {/* Custom hash toggle */}
            <div className="mb-4">
              <label onClick={() => setUseCustomHash(!useCustomHash)} className="flex items-center gap-2.5 cursor-pointer group mb-3">
                <div className={`w-9 h-5 rounded-full transition-all relative ${useCustomHash ? "bg-emerald-500" : "bg-white/10"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${useCustomHash ? "left-4" : "left-0.5"}`} />
                </div>
                <span className="font-mono text-xs text-slate-500 group-hover:text-slate-300 transition-colors">Use custom hash</span>
              </label>

              {useCustomHash ? (
                <div>
                  <label className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 block mb-2">Paste bcrypt Hash</label>
                  <textarea value={customHash} onChange={(e) => { setCustomHash(e.target.value); setVerifyResult(null); }}
                    placeholder="$2a$12$..."
                    rows={3}
                    className="w-full font-mono text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-slate-300 placeholder-slate-700 outline-none focus:border-emerald-500/40 resize-none transition-colors" />
                </div>
              ) : (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-4 py-3">
                  <div className="font-mono text-[11px] text-slate-600 mb-1">Active hash</div>
                  <div className="font-mono text-xs break-all text-slate-600 truncate">
                    {hash ? hash : "Generate a hash first →"}
                  </div>
                </div>
              )}
            </div>

            {/* Password to verify */}
            <div className="mb-5">
              <label className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 block mb-2">Password to Verify</label>
              <div className="relative">
                <input
                  type={showVerifyInput ? "text" : "password"}
                  value={verifyInput}
                  onChange={(e) => { setVerifyInput(e.target.value); setVerifyResult(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                  placeholder="Enter password to check..."
                  disabled={!activeHash}
                  className="w-full font-mono text-sm bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 pr-12 text-slate-200 placeholder-slate-700 outline-none focus:border-emerald-500/40 disabled:opacity-40 transition-colors"
                />
                <button onClick={() => setShowVerifyInput(!showVerifyInput)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors text-sm">
                  {showVerifyInput ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {/* Verify button */}
            <button onClick={handleVerify} disabled={!activeHash || !verifyInput.trim() || verifying}
              className={`w-full font-mono text-sm font-bold py-3 rounded-lg border transition-all mb-4 ${
                verifyResult === "match"
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                  : verifyResult === "no-match"
                  ? "bg-red-500/20 border-red-500/40 text-red-300"
                  : "bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-white hover:border-white/20"
              } disabled:opacity-40 disabled:cursor-not-allowed`}>
              {verifying ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-slate-400/50 border-t-slate-400 rounded-full animate-spin" />
                  Verifying...
                </span>
              ) : verifyResult === "match" ? "✓ Password Matches!"
                : verifyResult === "no-match" ? "✕ No Match"
                : "Verify Password"}
            </button>

            {/* Result card */}
            {verifyResult && (
              <div className={`rounded-lg px-4 py-3 border ${
                verifyResult === "match"
                  ? "bg-emerald-500/10 border-emerald-500/25"
                  : "bg-red-500/10 border-red-500/25"
              }`}>
                <div className={`font-mono text-sm font-bold mb-1 ${verifyResult === "match" ? "text-emerald-400" : "text-red-400"}`}>
                  {verifyResult === "match" ? "✓ Match confirmed" : "✕ Password does not match"}
                </div>
                <div className="font-mono text-[11px] text-slate-600">
                  {verifyResult === "match"
                    ? "The password matches the bcrypt hash successfully."
                    : "The provided password does not match this hash."}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!activeHash && !useCustomHash && (
              <div className="text-center py-8 border border-dashed border-white/[0.06] rounded-lg">
                <div className="text-2xl mb-2">🔒</div>
                <p className="font-mono text-xs text-slate-700">Generate a hash first, or enable custom hash</p>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <button onClick={() => { setPassword("password123"); }}
            className="font-mono text-xs px-4 py-2 border border-white/[0.08] text-slate-500 rounded-md hover:text-slate-200 hover:border-white/20 transition-all">
            Load Test Password
          </button>
          <button onClick={handleClear}
            className="font-mono text-xs px-4 py-2 border border-red-500/20 text-red-400/70 rounded-md hover:text-red-300 hover:border-red-500/40 transition-all">
            Clear All
          </button>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "🛡️", title: "Secure Hashing", desc: "bcrypt with salt + cost factor — resistant to brute-force & rainbow table attacks." },
            { icon: "⚡", title: "Client-Side Only", desc: "No password or hash is ever sent to any server. Fully private, even for testing." },
            { icon: "🔄", title: "Verify Instantly", desc: "Check if a password matches any bcrypt hash — paste external hashes too." },
          ].map((c) => (
            <div key={c.title} className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-5 py-4 hover:border-orange-500/20 transition-all">
              <div className="text-xl mb-2">{c.icon}</div>
              <div className="font-semibold text-slate-300 text-sm mb-1">{c.title}</div>
              <div className="text-slate-600 text-xs leading-relaxed">{c.desc}</div>
            </div>
          ))}
        </div>

        {/* Error toast */}
        {error && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-500/20 border border-red-500/40 text-red-300 px-6 py-3 rounded-lg font-mono text-sm z-50">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}