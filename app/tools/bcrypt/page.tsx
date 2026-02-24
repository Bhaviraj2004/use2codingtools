"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useCallback } from "react";
import bcrypt from "bcryptjs";

const DEFAULT_ROUNDS = 12;

export default function BcryptHash() {
  const [password, setPassword] = useState("");
  const [hash, setHash] = useState("");
  const [verifyInput, setVerifyInput] = useState("");
  const [verifyResult, setVerifyResult] = useState<"match" | "no-match" | null>(null);
  const [rounds, setRounds] = useState(DEFAULT_ROUNDS);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const generateHash = useCallback(async () => {
    if (!password.trim()) {
      setError("Enter a password first");
      return;
    }
    setError("");
    setGenerating(true);
    try {
      const salt = await bcrypt.genSalt(rounds);
      const hashed = await bcrypt.hash(password, salt);
      setHash(hashed);
      setVerifyInput(""); // reset verify
      setVerifyResult(null);
    } catch (e) {
      setError("Hash generation failed");
    } finally {
      setGenerating(false);
    }
  }, [password, rounds]);

  const verifyHash = useCallback(async () => {
    if (!hash || !verifyInput.trim()) {
      setVerifyResult(null);
      return;
    }
    try {
      const isMatch = await bcrypt.compare(verifyInput, hash);
      setVerifyResult(isMatch ? "match" : "no-match");
    } catch (e) {
      setVerifyResult("no-match");
    }
  }, [hash, verifyInput]);

  const handleGenerate = () => {
    generateHash();
  };

  const handleCopy = () => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleClear = () => {
    setPassword("");
    setHash("");
    setVerifyInput("");
    setVerifyResult(null);
    setError("");
  };

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-orange-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

      <ToolNavbar toolName="bcrypt Hash Generator & Verifier" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-orange-500/10 flex items-center justify-center font-mono font-bold text-orange-400 text-sm">🔒</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">bcrypt Hash Generator & Verifier</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded">client-side</span>
          </div>
          <p className="text-slate-500 text-sm">Generate secure bcrypt hashes or verify passwords against existing hashes. Runs entirely in your browser – no server involved.</p>
        </div>

        {/* Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* Generate Hash */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-orange-400 mb-4">Generate bcrypt Hash</h2>

            <div className="mb-4">
              <label className="block font-mono text-xs uppercase text-slate-500 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password..."
                className="w-full font-mono text-sm bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-2.5 text-slate-200 outline-none focus:border-orange-500/40 transition-colors"
              />
            </div>

            <div className="mb-4">
              <label className="block font-mono text-xs uppercase text-slate-500 mb-1">Cost Factor (Rounds)</label>
              <select
                value={rounds}
                onChange={(e) => setRounds(Number(e.target.value))}
                className="w-full font-mono text-sm bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-2.5 text-slate-200 outline-none focus:border-orange-500/40"
              >
                {[8, 10, 12, 14, 16].map((r) => (
                  <option key={r} value={r}>
                    {r} {r === 12 ? "(recommended)" : ""}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-600 mt-1">
                Higher = more secure but slower. 12 is good balance for 2025.
              </p>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating || !password.trim()}
              className={`w-full font-mono py-3 rounded-lg transition-all ${
                generating
                  ? "bg-orange-600/50 cursor-wait"
                  : "bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {generating ? "Hashing..." : "Generate Hash"}
            </button>

            {hash && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-mono text-xs uppercase text-slate-500">Generated Hash</label>
                  <button
                    onClick={handleCopy}
                    className={`text-xs ${copied ? "text-emerald-400" : "text-slate-400 hover:text-orange-400"}`}
                  >
                    {copied ? "✓ Copied" : "Copy"}
                  </button>
                </div>
                <div className="bg-white/[0.04] border border-white/[0.1] rounded-lg p-3 font-mono text-xs break-all text-slate-300">
                  {hash}
                </div>
              </div>
            )}
          </div>

          {/* Verify Hash */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-orange-400 mb-4">Verify Password</h2>

            <div className="mb-4">
              <label className="block font-mono text-xs uppercase text-slate-500 mb-1">Password to Verify</label>
              <input
                type="password"
                value={verifyInput}
                onChange={(e) => {
                  setVerifyInput(e.target.value);
                  setVerifyResult(null); // reset on change
                }}
                placeholder="Re-enter password to check..."
                disabled={!hash}
                className="w-full font-mono text-sm bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-2.5 text-slate-200 outline-none focus:border-orange-500/40 disabled:opacity-50"
              />
            </div>

            <button
              onClick={verifyHash}
              disabled={!hash || !verifyInput.trim()}
              className={`w-full font-mono py-3 rounded-lg transition-all ${
                verifyResult === "match"
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                  : verifyResult === "no-match"
                  ? "bg-red-500/20 border-red-500/40 text-red-300"
                  : "bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.15] text-slate-300"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {verifyResult === "match"
                ? "✓ Match!"
                : verifyResult === "no-match"
                ? "✕ No Match"
                : "Verify"}
            </button>

            {hash && (
              <div className="mt-6">
                <label className="block font-mono text-xs uppercase text-slate-500 mb-1">Existing Hash (for reference)</label>
                <div className="bg-white/[0.04] border border-white/[0.1] rounded-lg p-3 font-mono text-xs break-all text-slate-500">
                  {hash}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => { setPassword("password123"); generateHash(); }}
            className="font-mono text-xs px-4 py-2 border border-white/[0.08] text-slate-400 rounded hover:text-slate-200 hover:border-white/20 transition-all"
          >
            Load Test Password
          </button>
          <button
            onClick={handleClear}
            className="font-mono text-xs px-4 py-2 border border-white/[0.08] text-red-400/80 rounded hover:text-red-300 hover:border-red-500/30 transition-all"
          >
            Clear All
          </button>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { 
              icon: "🛡️", 
              title: "Secure Hashing", 
              desc: "bcrypt with salt + cost factor – resistant to brute-force & rainbow tables." 
            },
            { 
              icon: "⚡", 
              title: "Client-Side Only", 
              desc: "No password or hash sent to server – fully private, even for testing." 
            },
            { 
              icon: "🔄", 
              title: "Verify Instantly", 
              desc: "Check if a password matches the hash without revealing the original." 
            },
          ].map((c) => (
            <div 
              key={c.title} 
              className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-5 py-4 transition-all hover:border-orange-500/30 hover:bg-white/[0.04]"
            >
              <div className="text-2xl mb-3">{c.icon}</div>
              <div className="font-semibold text-slate-300 text-sm mb-1">{c.title}</div>
              <div className="text-slate-600 text-xs leading-relaxed">{c.desc}</div>
            </div>
          ))}
        </div>

        {error && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-500/20 border border-red-500/40 text-red-300 px-6 py-3 rounded-lg font-mono text-sm">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}