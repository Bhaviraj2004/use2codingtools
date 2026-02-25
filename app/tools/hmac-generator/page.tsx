"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useCallback } from "react";

type HMACAlgo = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";
type InputEncoding = "utf8" | "hex" | "base64";
type OutputEncoding = "hex" | "base64";

const ALGOS: HMACAlgo[] = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];

const ALGO_META: Record<HMACAlgo, { bits: number; color: string; tag: string; border: string }> = {
  "SHA-1":   { bits: 160, color: "text-yellow-400",  tag: "bg-yellow-500/10 text-yellow-400",  border: "border-yellow-500/20" },
  "SHA-256": { bits: 256, color: "text-emerald-400", tag: "bg-emerald-500/10 text-emerald-400", border: "border-emerald-500/20" },
  "SHA-384": { bits: 384, color: "text-cyan-400",    tag: "bg-cyan-500/10 text-cyan-400",       border: "border-cyan-500/20" },
  "SHA-512": { bits: 512, color: "text-violet-400",  tag: "bg-violet-500/10 text-violet-400",   border: "border-violet-500/20" },
};

const EXAMPLES = [
  { label: "Webhook secret", message: '{"event":"push","repo":"use2codingtools"}', key: "my-webhook-secret-key" },
  { label: "API signature",  message: "GET /api/users?page=1&limit=10",            key: "sk_live_abc123def456" },
  { label: "JWT signing",    message: '{"sub":"user123","iat":1700000000}',         key: "super-secret-jwt-key" },
];

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/\s/g, "");
  if (clean.length % 2 !== 0) throw new Error("Hex string must have even length");
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2)
    bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  return bytes;
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64.trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function encodeInput(val: string, enc: InputEncoding): Uint8Array {
  if (enc === "hex")    return hexToBytes(val);
  if (enc === "base64") return base64ToBytes(val);
  return new TextEncoder().encode(val);
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function toBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

interface HMACResult { algo: HMACAlgo; hex: string; base64: string; }

export default function HMACGenerator() {
  const [message,       setMessage]       = useState("");
  const [secretKey,     setSecretKey]     = useState("");
  const [showKey,       setShowKey]       = useState(false);
  const [msgEncoding,   setMsgEncoding]   = useState<InputEncoding>("utf8");
  const [keyEncoding,   setKeyEncoding]   = useState<InputEncoding>("utf8");
  const [outputEnc,     setOutputEnc]     = useState<OutputEncoding>("hex");
  const [selectedAlgos, setSelectedAlgos] = useState<Set<HMACAlgo>>(new Set(["SHA-256"]));
  const [results,       setResults]       = useState<HMACResult[]>([]);
  const [error,         setError]         = useState("");
  const [loading,       setLoading]       = useState(false);
  const [copiedKey,     setCopiedKey]     = useState<string | null>(null);

  // verify
  const [verifyMode,   setVerifyMode]   = useState(false);
  const [verifyHMAC,   setVerifyHMAC]   = useState("");
  const [verifyResult, setVerifyResult] = useState<"match" | "no-match" | null>(null);

  const generate = useCallback(async (
    msg: string, key: string,
    algos: Set<HMACAlgo>,
    msgEnc: InputEncoding, keyEnc: InputEncoding,
  ) => {
    setError(""); setVerifyResult(null);
    if (!msg || !key) { setResults([]); return; }
    setLoading(true);
    try {
      const msgBytes = encodeInput(msg, msgEnc);
      const keyBytes = encodeInput(key, keyEnc);
      const list: HMACResult[] = [];
      for (const algo of ALGOS) {
        if (!algos.has(algo)) continue;
        const ck = await crypto.subtle.importKey(
          "raw", keyBytes, { name: "HMAC", hash: algo }, false, ["sign"]
        );
        const sig = await crypto.subtle.sign("HMAC", ck, msgBytes);
        list.push({ algo, hex: toHex(sig), base64: toBase64(sig) });
      }
      setResults(list);
    } catch (e: unknown) {
      setError((e as Error).message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const run = (
    msg = message, key = secretKey,
    algos = selectedAlgos,
    msgEnc = msgEncoding, keyEnc = keyEncoding,
  ) => generate(msg, key, algos, msgEnc, keyEnc);

  const handleMessage    = (v: string)         => { setMessage(v);      run(v, secretKey, selectedAlgos, msgEncoding, keyEncoding); };
  const handleKey        = (v: string)         => { setSecretKey(v);    run(message, v, selectedAlgos, msgEncoding, keyEncoding); };
  const handleMsgEnc     = (e: InputEncoding)  => { setMsgEncoding(e);  run(message, secretKey, selectedAlgos, e, keyEncoding); };
  const handleKeyEnc     = (e: InputEncoding)  => { setKeyEncoding(e);  run(message, secretKey, selectedAlgos, msgEncoding, e); };
  const handleAlgoToggle = (a: HMACAlgo) => {
    const next = new Set(selectedAlgos);
    if (next.has(a) && next.size === 1) return;
    next.has(a) ? next.delete(a) : next.add(a);
    setSelectedAlgos(next);
    run(message, secretKey, next, msgEncoding, keyEncoding);
  };

  const loadExample = (ex: typeof EXAMPLES[0]) => {
    setMessage(ex.message); setSecretKey(ex.key);
    setMsgEncoding("utf8"); setKeyEncoding("utf8");
    generate(ex.message, ex.key, selectedAlgos, "utf8", "utf8");
  };

  const copy = (id: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleVerify = () => {
    if (!verifyHMAC.trim() || results.length === 0) return;
    const clean = verifyHMAC.trim().toLowerCase();
    const match = results.some((r) =>
      r.hex.toLowerCase() === clean || r.base64 === verifyHMAC.trim()
    );
    setVerifyResult(match ? "match" : "no-match");
  };

  const generateRandomKey = () => {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    setKeyEncoding("hex");
    handleKey(hex);
  };

  const ENCODINGS: { key: InputEncoding; label: string }[] = [
    { key: "utf8",   label: "UTF-8"  },
    { key: "hex",    label: "Hex"    },
    { key: "base64", label: "Base64" },
  ];

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-cyan-500/[0.04] blur-3xl pointer-events-none" />

      {/* NAV */}
      {/* <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#09090f]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <a href="/" className="font-mono text-sm font-bold text-emerald-400">use2<span className="text-slate-500">coding</span>tools</a>
          <span className="text-white/10">/</span>
          <span className="font-mono text-sm text-slate-400">HMAC Generator</span>
        </div>
      </nav> */}

      <ToolNavbar toolName="HMAC Generator" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center font-mono font-bold text-emerald-400">Hm</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">HMAC Generator</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">Web Crypto API</span>
          </div>
          <p className="text-slate-500 text-sm">
            Generate Hash-based Message Authentication Codes using SHA-256, SHA-512 and more. Perfect for webhook verification, API signing, and JWT.
          </p>
        </div>

        {/* Examples */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="font-mono text-[11px] text-slate-600 self-center uppercase tracking-wider">Examples:</span>
          {EXAMPLES.map((ex) => (
            <button key={ex.label} onClick={() => loadExample(ex)}
              className="font-mono text-[11px] px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded hover:text-emerald-400 hover:border-emerald-500/30 transition-all">
              {ex.label}
            </button>
          ))}
        </div>

        {/* Algo + output encoding bar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <span className="font-mono text-[11px] text-slate-600 uppercase tracking-wider">Algorithm:</span>
          {ALGOS.map((a) => (
            <button key={a} onClick={() => handleAlgoToggle(a)}
              className={`font-mono text-xs px-3 py-1.5 rounded border transition-all ${
                selectedAlgos.has(a)
                  ? `${ALGO_META[a].tag} ${ALGO_META[a].border}`
                  : "border-white/[0.08] text-slate-600 hover:text-slate-300"
              }`}>
              {a} <span className="opacity-50 text-[10px]">{ALGO_META[a].bits}b</span>
            </button>
          ))}

          <div className="ml-auto flex bg-white/[0.04] border border-white/[0.08] rounded-md p-1 gap-1">
            {(["hex", "base64"] as OutputEncoding[]).map((enc) => (
              <button key={enc} onClick={() => setOutputEnc(enc)}
                className={`font-mono text-[11px] px-3 py-1 rounded transition-all ${outputEnc === enc ? "bg-emerald-500/20 text-emerald-400" : "text-slate-500 hover:text-slate-300"}`}>
                {enc}
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

          {/* Message */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Message</span>
              <div className="flex bg-white/[0.04] border border-white/[0.08] rounded p-0.5 gap-0.5">
                {ENCODINGS.map(({ key: enc, label }) => (
                  <button key={enc} onClick={() => handleMsgEnc(enc)}
                    className={`font-mono text-[10px] px-2 py-0.5 rounded transition-all ${msgEncoding === enc ? "bg-white/10 text-slate-200" : "text-slate-600 hover:text-slate-400"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <textarea value={message} onChange={(e) => handleMessage(e.target.value)}
              placeholder={
                msgEncoding === "hex"    ? "48656c6c6f20576f726c64..." :
                msgEncoding === "base64" ? "SGVsbG8gV29ybGQ=..." :
                "Enter message or payload..."
              }
              spellCheck={false} rows={5}
              className="w-full font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg p-3 text-slate-300 placeholder-slate-700 outline-none focus:border-emerald-500/30 resize-none transition-colors leading-relaxed"
            />
            <div className="flex justify-between mt-2">
              <span className="font-mono text-[10px] text-slate-700">{message.length} chars</span>
              <span className="font-mono text-[10px] text-slate-700">{msgEncoding}</span>
            </div>
          </div>

          {/* Secret Key */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Secret Key</span>
              <div className="flex items-center gap-2">
                <div className="flex bg-white/[0.04] border border-white/[0.08] rounded p-0.5 gap-0.5">
                  {ENCODINGS.map(({ key: enc, label }) => (
                    <button key={enc} onClick={() => handleKeyEnc(enc)}
                      className={`font-mono text-[10px] px-2 py-0.5 rounded transition-all ${keyEncoding === enc ? "bg-white/10 text-slate-200" : "text-slate-600 hover:text-slate-400"}`}>
                      {label}
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowKey(!showKey)} className="text-slate-600 hover:text-slate-300 text-sm transition-colors">
                  {showKey ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <input
              type={showKey ? "text" : "password"}
              value={secretKey} onChange={(e) => handleKey(e.target.value)}
              placeholder="Enter your secret key..."
              className="w-full font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg p-3 text-slate-300 placeholder-slate-700 outline-none focus:border-emerald-500/30 transition-colors mb-3"
            />

            <div className="flex gap-2">
              <button onClick={generateRandomKey}
                className="font-mono text-[11px] px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded hover:text-emerald-400 hover:border-emerald-500/30 transition-all">
                ⚡ Random 256-bit key
              </button>
              {secretKey && (
                <button onClick={() => copy("key", secretKey)}
                  className={`font-mono text-[11px] px-3 py-1.5 border rounded transition-all ${copiedKey === "key" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                  {copiedKey === "key" ? "✓ Copied" : "Copy key"}
                </button>
              )}
            </div>
            <div className="flex justify-between mt-2">
              <span className="font-mono text-[10px] text-slate-700">{secretKey.length} chars</span>
              <span className="font-mono text-[10px] text-slate-700">{keyEncoding}</span>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 flex gap-2">
            <span className="text-red-400 shrink-0">✕</span>
            <span className="font-mono text-xs text-red-400">{error}</span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-3 py-10 justify-center">
            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="font-mono text-sm text-slate-500">Computing HMAC...</span>
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div className="space-y-3 mb-6">
            {results.map((r) => {
              const meta = ALGO_META[r.algo];
              const display = outputEnc === "hex" ? r.hex : r.base64;
              return (
                <div key={r.algo} className={`bg-white/[0.03] border ${meta.border} rounded-xl p-5`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-xs font-bold ${meta.color}`}>{r.algo}</span>
                      <span className="font-mono text-[10px] text-slate-700">{meta.bits} bits • {display.length} chars</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => copy(`${r.algo}-hex`, r.hex)}
                        className={`font-mono text-[11px] px-2.5 py-1 rounded border transition-all ${copiedKey === `${r.algo}-hex` ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                        {copiedKey === `${r.algo}-hex` ? "✓" : "hex"}
                      </button>
                      <button onClick={() => copy(`${r.algo}-b64`, r.base64)}
                        className={`font-mono text-[11px] px-2.5 py-1 rounded border transition-all ${copiedKey === `${r.algo}-b64` ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                        {copiedKey === `${r.algo}-b64` ? "✓" : "base64"}
                      </button>
                    </div>
                  </div>
                  <div className="font-mono text-xs text-slate-300 break-all bg-white/[0.02] rounded-md px-3 py-2.5 leading-relaxed">
                    {display}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && results.length === 0 && !error && (
          <div className="text-center py-14 border border-dashed border-white/[0.06] rounded-xl mb-6">
            <div className="font-mono text-3xl text-slate-700 mb-3">Hm</div>
            <p className="font-mono text-sm text-slate-600">Enter a message and secret key to generate HMAC</p>
          </div>
        )}

        {/* Verify section */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">HMAC Verifier</span>
            </div>
            <label onClick={() => { setVerifyMode(!verifyMode); setVerifyResult(null); }} className="flex items-center gap-2 cursor-pointer">
              <div className={`w-8 h-4 rounded-full transition-all relative ${verifyMode ? "bg-cyan-500" : "bg-white/10"}`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${verifyMode ? "left-4" : "left-0.5"}`} />
              </div>
              <span className="font-mono text-xs text-slate-500">Enable</span>
            </label>
          </div>

          {verifyMode && (
            <div className="space-y-3">
              <p className="font-mono text-[11px] text-slate-600">Paste an expected HMAC — it will be compared against the generated results above.</p>
              <div className="flex gap-2">
                <input value={verifyHMAC} onChange={(e) => { setVerifyHMAC(e.target.value); setVerifyResult(null); }}
                  placeholder="Paste hex or base64 HMAC to verify..."
                  className="flex-1 font-mono text-sm px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-slate-300 placeholder-slate-700 outline-none focus:border-cyan-500/40 transition-colors"
                />
                <button onClick={handleVerify} disabled={!verifyHMAC.trim() || results.length === 0}
                  className="font-mono text-sm px-5 py-2.5 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg hover:bg-cyan-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  Verify
                </button>
              </div>
              {verifyResult && (
                <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${verifyResult === "match" ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" : "bg-red-500/10 border-red-500/25 text-red-400"}`}>
                  <span className="text-lg">{verifyResult === "match" ? "✓" : "✕"}</span>
                  <div>
                    <div className="font-mono text-sm font-bold">{verifyResult === "match" ? "HMAC verified!" : "HMAC does not match"}</div>
                    <div className="font-mono text-[11px] opacity-60">
                      {verifyResult === "match" ? "Signature matches one of the generated HMACs." : "No matching HMAC found for the given message + key."}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "🔑", title: "What is HMAC?",   desc: "HMAC uses a secret key + hash function to authenticate messages. Proves both integrity and authenticity." },
            { icon: "🌐", title: "Use Cases",        desc: "Webhook verification, API request signing, JWT tokens, and secure cookie signing." },
            { icon: "🔒", title: "Web Crypto API",   desc: "Uses browser-native crypto.subtle — no JS libraries, no server calls, maximum privacy." },
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