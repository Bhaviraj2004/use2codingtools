"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useCallback } from "react";

const EXAMPLE_JWT = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlJvaGFuIFNoYXJtYSIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNzM1NzA5MDAwLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6InJvaGFuQGV4YW1wbGUuY29tIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`;

export default function JwtDecoder() {
  const [input, setInput] = useState("");
  const [header, setHeader] = useState<any>(null);
  const [payload, setPayload] = useState<any>(null);
  const [signature, setSignature] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const decodeJwt = useCallback((token: string) => {
    setError("");
    setHeader(null);
    setPayload(null);
    setSignature("");
    if (!token.trim()) return;

    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        throw new Error("Invalid JWT format – must have 3 parts separated by '.'");
      }

      const [headerB64, payloadB64, sig] = parts;

      // Decode header
      const decodedHeader = atob(headerB64.replace(/-/g, "+").replace(/_/g, "/"));
      const parsedHeader = JSON.parse(decodedHeader);
      setHeader(parsedHeader);

      // Decode payload
      const decodedPayload = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
      const parsedPayload = JSON.parse(decodedPayload);
      setPayload(parsedPayload);

      // Signature (just show as is, base64url)
      setSignature(sig);

    } catch (e: unknown) {
      setError((e as Error).message || "Failed to decode JWT");
    }
  }, []);

  const handleInput = (val: string) => {
    setInput(val);
    decodeJwt(val);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleCopyFull = () => {
    if (!header || !payload) return;
    const full = {
      header,
      payload,
      signature,
    };
    navigator.clipboard.writeText(JSON.stringify(full, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-orange-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

      <ToolNavbar toolName="JWT Decoder" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-orange-500/10 flex items-center justify-center font-mono font-bold text-orange-400 text-sm">JWT</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">JWT Decoder</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded">client-side • no verification</span>
          </div>
          <p className="text-slate-500 text-sm">Paste any JWT to instantly decode Header, Payload, and Signature. Pure browser – no secret key needed, no verification done.</p>
        </div>

        {/* Input */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">JWT Token</span>
            <div className="flex gap-2">
              <button
                onClick={() => { setInput(EXAMPLE_JWT); decodeJwt(EXAMPLE_JWT); }}
                className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-slate-300 hover:border-white/20 transition-all"
              >
                Load Example
              </button>
              <button
                onClick={() => { setInput(""); setHeader(null); setPayload(null); setSignature(""); setError(""); }}
                className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-red-400 hover:border-red-500/30 transition-all"
              >
                Clear
              </button>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => handleInput(e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gZG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
            spellCheck={false}
            className="w-full h-32 font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-slate-300 placeholder-slate-700 outline-none focus:border-orange-500/40 resize-none transition-colors"
          />
          {error && (
            <div className="mt-2 bg-red-500/10 border border-red-500/30 rounded-md px-4 py-2 flex gap-2">
              <span className="text-red-400 text-xs mt-0.5 shrink-0">✕</span>
              <span className="font-mono text-xs text-red-400">{error}</span>
            </div>
          )}
        </div>

        {/* Decoded Sections */}
        {(header || payload || signature) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">

            {/* Header */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-orange-500/[0.1] border-b border-white/[0.08] flex justify-between items-center">
                <span className="font-mono text-sm text-orange-400">Header</span>
                {header && (
                  <button
                    onClick={() => handleCopy(JSON.stringify(header, null, 2))}
                    className="text-xs text-slate-400 hover:text-orange-400"
                  >
                    Copy
                  </button>
                )}
              </div>
              <div className="p-4 font-mono text-xs overflow-auto max-h-80">
                {header ? (
                  <pre className="whitespace-pre-wrap">{JSON.stringify(header, null, 2)}</pre>
                ) : (
                  <span className="text-slate-600">No header decoded</span>
                )}
              </div>
            </div>

            {/* Payload */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-orange-500/[0.1] border-b border-white/[0.08] flex justify-between items-center">
                <span className="font-mono text-sm text-orange-400">Payload</span>
                {payload && (
                  <button
                    onClick={() => handleCopy(JSON.stringify(payload, null, 2))}
                    className="text-xs text-slate-400 hover:text-orange-400"
                  >
                    Copy
                  </button>
                )}
              </div>
              <div className="p-4 font-mono text-xs overflow-auto max-h-80">
                {payload ? (
                  <pre className="whitespace-pre-wrap">{JSON.stringify(payload, null, 2)}</pre>
                ) : (
                  <span className="text-slate-600">No payload decoded</span>
                )}
              </div>
            </div>

            {/* Signature */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-orange-500/[0.1] border-b border-white/[0.08] flex justify-between items-center">
                <span className="font-mono text-sm text-orange-400">Signature</span>
                {signature && (
                  <button
                    onClick={() => handleCopy(signature)}
                    className="text-xs text-slate-400 hover:text-orange-400"
                  >
                    Copy
                  </button>
                )}
              </div>
              <div className="p-4 font-mono text-xs overflow-auto max-h-80 break-all">
                {signature || <span className="text-slate-600">No signature</span>}
              </div>
            </div>
          </div>
        )}

        {/* Copy Full Button & Stats */}
        {(header || payload) && (
          <div className="flex flex-wrap gap-6 px-4 py-3 bg-orange-500/[0.05] border border-orange-500/20 rounded-lg mb-8">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Algo</span>
              <span className="font-mono text-sm text-orange-400">{header?.alg || "—"}</span>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Type</span>
              <span className="font-mono text-sm text-orange-400">{header?.typ || "—"}</span>
            </div>
            <div className="ml-auto">
              <button
                onClick={handleCopyFull}
                className={`font-mono text-xs px-4 py-2 rounded border transition-all ${copied ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-300 hover:border-white/30"}`}
              >
                {copied ? "✓ Copied Full JWT!" : "Copy Full Decoded"}
              </button>
            </div>
          </div>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { 
              icon: "🧩", 
              title: "Header & Payload", 
              desc: "Instantly decodes alg, typ, iss, sub, exp, iat, roles, custom claims – readable JSON format." 
            },
            { 
              icon: "🔍", 
              title: "No Verification", 
              desc: "Only decodes – does NOT verify signature (needs secret/public key). Great for debugging & inspection." 
            },
            { 
              icon: "🔒", 
              title: "Fully Private", 
              desc: "Runs 100% in your browser – token never leaves your device. Safe for sensitive JWTs." 
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

      </div>
    </main>
  );
}