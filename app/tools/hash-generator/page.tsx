"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useRef } from "react";

type Algorithm = "MD5" | "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

// MD5 implementation (pure JS, no lib needed)
function md5(input: string): string {
  function safeAdd(x: number, y: number) { const lsw = (x & 0xffff) + (y & 0xffff); return (((x >> 16) + (y >> 16) + (lsw >> 16)) << 16) | (lsw & 0xffff); }
  function bitRotateLeft(num: number, cnt: number) { return (num << cnt) | (num >>> (32 - cnt)); }
  function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number) { return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b); }
  function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return md5cmn((b & c) | (~b & d), a, b, x, s, t); }
  function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return md5cmn((b & d) | (c & ~d), a, b, x, s, t); }
  function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return md5cmn(b ^ c ^ d, a, b, x, s, t); }
  function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return md5cmn(c ^ (b | ~d), a, b, x, s, t); }
  function sbits(str: string) {
    const nblk = ((str.length + 8) >> 6) + 1;
    const blks = new Array(nblk * 16).fill(0);
    for (let i = 0; i < str.length; i++) blks[i >> 2] |= str.charCodeAt(i) << ((i % 4) * 8);
    blks[str.length >> 2] |= 0x80 << ((str.length % 4) * 8);
    blks[nblk * 16 - 2] = str.length * 8;
    return blks;
  }
  const x = sbits(input);
  let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
  for (let i = 0; i < x.length; i += 16) {
    const [oa, ob, oc, od] = [a, b, c, d];
    a = md5ff(a,b,c,d,x[i],7,-680876936); d = md5ff(d,a,b,c,x[i+1],12,-389564586); c = md5ff(c,d,a,b,x[i+2],17,606105819); b = md5ff(b,c,d,a,x[i+3],22,-1044525330);
    a = md5ff(a,b,c,d,x[i+4],7,-176418897); d = md5ff(d,a,b,c,x[i+5],12,1200080426); c = md5ff(c,d,a,b,x[i+6],17,-1473231341); b = md5ff(b,c,d,a,x[i+7],22,-45705983);
    a = md5ff(a,b,c,d,x[i+8],7,1770035416); d = md5ff(d,a,b,c,x[i+9],12,-1958414417); c = md5ff(c,d,a,b,x[i+10],17,-42063); b = md5ff(b,c,d,a,x[i+11],22,-1990404162);
    a = md5ff(a,b,c,d,x[i+12],7,1804603682); d = md5ff(d,a,b,c,x[i+13],12,-40341101); c = md5ff(c,d,a,b,x[i+14],17,-1502002290); b = md5ff(b,c,d,a,x[i+15],22,1236535329);
    a = md5gg(a,b,c,d,x[i+1],5,-165796510); d = md5gg(d,a,b,c,x[i+6],9,-1069501632); c = md5gg(c,d,a,b,x[i+11],14,643717713); b = md5gg(b,c,d,a,x[i+0],20,-373897302);
    a = md5gg(a,b,c,d,x[i+5],5,-701558691); d = md5gg(d,a,b,c,x[i+10],9,38016083); c = md5gg(c,d,a,b,x[i+15],14,-660478335); b = md5gg(b,c,d,a,x[i+4],20,-405537848);
    a = md5gg(a,b,c,d,x[i+9],5,568446438); d = md5gg(d,a,b,c,x[i+14],9,-1019803690); c = md5gg(c,d,a,b,x[i+3],14,-187363961); b = md5gg(b,c,d,a,x[i+8],20,1163531501);
    a = md5gg(a,b,c,d,x[i+13],5,-1444681467); d = md5gg(d,a,b,c,x[i+2],9,-51403784); c = md5gg(c,d,a,b,x[i+7],14,1735328473); b = md5gg(b,c,d,a,x[i+12],20,-1926607734);
    a = md5hh(a,b,c,d,x[i+5],4,-378558); d = md5hh(d,a,b,c,x[i+8],11,-2022574463); c = md5hh(c,d,a,b,x[i+11],16,1839030562); b = md5hh(b,c,d,a,x[i+14],23,-35309556);
    a = md5hh(a,b,c,d,x[i+1],4,-1530992060); d = md5hh(d,a,b,c,x[i+4],11,1272893353); c = md5hh(c,d,a,b,x[i+7],16,-155497632); b = md5hh(b,c,d,a,x[i+10],23,-1094730640);
    a = md5hh(a,b,c,d,x[i+13],4,681279174); d = md5hh(d,a,b,c,x[i+0],11,-358537222); c = md5hh(c,d,a,b,x[i+3],16,-722521979); b = md5hh(b,c,d,a,x[i+6],23,76029189);
    a = md5hh(a,b,c,d,x[i+9],4,-640364487); d = md5hh(d,a,b,c,x[i+12],11,-421815835); c = md5hh(c,d,a,b,x[i+15],16,530742520); b = md5hh(b,c,d,a,x[i+2],23,-995338651);
    a = md5ii(a,b,c,d,x[i+0],6,-198630844); d = md5ii(d,a,b,c,x[i+7],10,1126891415); c = md5ii(c,d,a,b,x[i+14],15,-1416354905); b = md5ii(b,c,d,a,x[i+5],21,-57434055);
    a = md5ii(a,b,c,d,x[i+12],6,1700485571); d = md5ii(d,a,b,c,x[i+3],10,-1894986606); c = md5ii(c,d,a,b,x[i+10],15,-1051523); b = md5ii(b,c,d,a,x[i+1],21,-2054922799);
    a = md5ii(a,b,c,d,x[i+8],6,1873313359); d = md5ii(d,a,b,c,x[i+15],10,-30611744); c = md5ii(c,d,a,b,x[i+6],15,-1560198380); b = md5ii(b,c,d,a,x[i+13],21,1309151649);
    a = md5ii(a,b,c,d,x[i+4],6,-145523070); d = md5ii(d,a,b,c,x[i+11],10,-1120210379); c = md5ii(c,d,a,b,x[i+2],15,718787259); b = md5ii(b,c,d,a,x[i+9],21,-343485551);
    a = safeAdd(a,oa); b = safeAdd(b,ob); c = safeAdd(c,oc); d = safeAdd(d,od);
  }
  const hex = (n: number) => [(n>>>0)&0xff,(n>>>8)&0xff,(n>>>16)&0xff,(n>>>24)&0xff].map(b=>b.toString(16).padStart(2,"0")).join("");
  return hex(a)+hex(b)+hex(c)+hex(d);
}

// SHA via Web Crypto
async function shaHash(algo: string, input: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest(algo, enc.encode(input));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
}

async function hashFile(algo: Algorithm, file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  if (algo === "MD5") {
    const text = new TextDecoder().decode(buf);
    return md5(text);
  }
  const algoMap: Record<string, string> = { "SHA-1": "SHA-1", "SHA-256": "SHA-256", "SHA-384": "SHA-384", "SHA-512": "SHA-512" };
  const hashBuf = await crypto.subtle.digest(algoMap[algo], buf);
  return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2,"0")).join("");
}

const ALGOS: Algorithm[] = ["MD5", "SHA-1", "SHA-256", "SHA-384", "SHA-512"];

const ALGO_META: Record<Algorithm, { bits: number; color: string; tag: string }> = {
  "MD5":    { bits: 128, color: "text-yellow-400",  tag: "bg-yellow-500/10 text-yellow-400" },
  "SHA-1":  { bits: 160, color: "text-orange-400",  tag: "bg-orange-500/10 text-orange-400" },
  "SHA-256":{ bits: 256, color: "text-emerald-400", tag: "bg-emerald-500/10 text-emerald-400" },
  "SHA-384":{ bits: 384, color: "text-cyan-400",    tag: "bg-cyan-500/10 text-cyan-400" },
  "SHA-512":{ bits: 512, color: "text-violet-400",  tag: "bg-violet-500/10 text-violet-400" },
};

interface HashResult {
  algo: Algorithm;
  hash: string;
  copied: boolean;
}

export default function HashGenerator() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<HashResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAlgos, setSelectedAlgos] = useState<Set<Algorithm>>(new Set(["MD5", "SHA-256", "SHA-512"]));
  const [uppercase, setUppercase] = useState(false);
  const [fileName, setFileName] = useState("");
  const [mode, setMode] = useState<"text" | "file">("text");
  const [compareInput, setCompareInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const toggleAlgo = (a: Algorithm) => {
    setSelectedAlgos(prev => {
      const next = new Set(prev);
      if (next.has(a) && next.size === 1) return prev;
      next.has(a) ? next.delete(a) : next.add(a);
      return next;
    });
  };

  const compute = async (text: string) => {
    if (!text.trim()) { setResults([]); return; }
    setLoading(true);
    const list: HashResult[] = [];
    for (const algo of ALGOS) {
      if (!selectedAlgos.has(algo)) continue;
      let hash = "";
      if (algo === "MD5") hash = md5(text);
      else hash = await shaHash(algo, text);
      list.push({ algo, hash, copied: false });
    }
    setResults(list);
    setLoading(false);
  };

  const handleTextInput = (val: string) => {
    setInput(val);
    compute(val);
  };

  const handleAlgoToggle = (a: Algorithm) => {
    const next = new Set(selectedAlgos);
    if (next.has(a) && next.size === 1) return;
    next.has(a) ? next.delete(a) : next.add(a);
    setSelectedAlgos(next);
    // recompute
    setTimeout(async () => {
      if (!input.trim() && mode === "text") return;
      setLoading(true);
      const list: HashResult[] = [];
      for (const algo of ALGOS) {
        if (!next.has(algo)) continue;
        let hash = "";
        if (algo === "MD5") hash = md5(input);
        else hash = await shaHash(algo, input);
        list.push({ algo, hash, copied: false });
      }
      setResults(list);
      setLoading(false);
    }, 0);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setLoading(true);
    const list: HashResult[] = [];
    for (const algo of ALGOS) {
      if (!selectedAlgos.has(algo)) continue;
      const hash = await hashFile(algo, file);
      list.push({ algo, hash, copied: false });
    }
    setResults(list);
    setLoading(false);
    e.target.value = "";
  };

  const copyHash = (algo: Algorithm) => {
    const r = results.find(r => r.algo === algo);
    if (!r) return;
    const val = uppercase ? r.hash.toUpperCase() : r.hash;
    navigator.clipboard.writeText(val);
    setResults(prev => prev.map(r => r.algo === algo ? { ...r, copied: true } : r));
    setTimeout(() => setResults(prev => prev.map(r => r.algo === algo ? { ...r, copied: false } : r)), 1500);
  };

  const compareHash = (hash: string) => {
    const clean = compareInput.trim().toLowerCase();
    if (!clean) return null;
    return clean === hash.toLowerCase();
  };

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.025) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-yellow-500/[0.04] blur-3xl pointer-events-none" />

      <ToolNavbar toolName="Hash Generator" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center text-lg">#</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Hash Generator</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">client-side</span>
          </div>
          <p className="text-slate-500 text-sm">Generate MD5, SHA-1, SHA-256, SHA-384, SHA-512 hashes from text or files.</p>
        </div>

        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {/* Text / File */}
          <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-md p-1 gap-1">
            {(["text", "file"] as const).map((t) => (
              <button key={t} onClick={() => { setMode(t); setResults([]); setInput(""); setFileName(""); }}
                className={`font-mono text-xs px-4 py-1.5 rounded capitalize transition-all ${mode === t ? "bg-white/10 text-slate-200" : "text-slate-500 hover:text-slate-300"}`}>
                {t === "text" ? "📝 Text" : "📁 File"}
              </button>
            ))}
          </div>

          {/* Algo toggles */}
          <div className="flex flex-wrap gap-1.5">
            {ALGOS.map((a) => (
              <button key={a} onClick={() => handleAlgoToggle(a)}
                className={`font-mono text-[11px] px-3 py-1.5 rounded border transition-all ${selectedAlgos.has(a) ? ALGO_META[a].tag + " border-transparent" : "border-white/[0.08] text-slate-600 hover:text-slate-300"}`}>
                {a}
              </button>
            ))}
          </div>

          {/* Uppercase */}
          <label className="flex items-center gap-2 cursor-pointer group ml-auto">
            <div onClick={() => setUppercase(!uppercase)} className={`w-9 h-5 rounded-full transition-all relative ${uppercase ? "bg-emerald-500" : "bg-white/10"}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${uppercase ? "left-4" : "left-0.5"}`} />
            </div>
            <span className="font-mono text-xs text-slate-500 group-hover:text-slate-300">UPPERCASE</span>
          </label>
        </div>

        {/* Input */}
        {mode === "text" ? (
          <textarea
            value={input}
            onChange={(e) => handleTextInput(e.target.value)}
            placeholder="Type or paste text to hash..."
            spellCheck={false}
            className="w-full h-32 font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-slate-300 placeholder-slate-700 outline-none focus:border-emerald-500/40 resize-none transition-colors leading-relaxed mb-5"
          />
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            className="h-32 mb-5 bg-white/[0.03] border border-dashed border-white/[0.12] rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-emerald-500/40 hover:bg-emerald-500/[0.02] transition-all"
          >
            {fileName ? (
              <>
                <div className="text-2xl">📄</div>
                <span className="font-mono text-sm text-slate-400">{fileName}</span>
              </>
            ) : (
              <>
                <div className="text-2xl">📁</div>
                <span className="font-mono text-sm text-slate-600">Click to upload any file</span>
              </>
            )}
            <input ref={fileRef} type="file" className="hidden" onChange={handleFileUpload} />
          </div>
        )}

        {/* Results */}
        {loading && (
          <div className="flex items-center gap-3 py-8 justify-center">
            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="font-mono text-sm text-slate-500">Computing hashes...</span>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-3 mb-6">
            {results.map((r) => {
              const meta = ALGO_META[r.algo];
              const display = uppercase ? r.hash.toUpperCase() : r.hash;
              const match = compareHash(r.hash);
              return (
                <div key={r.algo} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-white/[0.14] transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-xs font-bold ${meta.color}`}>{r.algo}</span>
                      <span className="font-mono text-[10px] text-slate-700">{meta.bits} bits • {r.hash.length} chars</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {match !== null && (
                        <span className={`font-mono text-[11px] px-2 py-0.5 rounded ${match ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                          {match ? "✓ Match" : "✕ No match"}
                        </span>
                      )}
                      <button onClick={() => copyHash(r.algo)}
                        className={`font-mono text-[11px] px-3 py-1 rounded border transition-all ${r.copied ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300 hover:border-white/20"}`}>
                        {r.copied ? "✓ Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                  <div className="font-mono text-xs text-slate-400 break-all bg-white/[0.02] rounded-md px-3 py-2.5 leading-relaxed">
                    {display}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && results.length === 0 && (
          <div className="text-center py-14 border border-dashed border-white/[0.06] rounded-xl mb-6">
            <div className="text-3xl mb-3">#</div>
            <p className="font-mono text-sm text-slate-600">{mode === "text" ? "Type something to generate hashes" : "Upload a file to hash it"}</p>
          </div>
        )}

        {/* Hash Compare */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 mb-6">
          <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">Hash Verifier</div>
          <input
            type="text"
            value={compareInput}
            onChange={(e) => setCompareInput(e.target.value)}
            placeholder="Paste a hash here to verify against results above..."
            className="w-full font-mono text-sm px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-slate-300 placeholder-slate-700 outline-none focus:border-emerald-500/40 transition-colors"
          />
          {compareInput && results.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {results.map((r) => {
                const match = compareHash(r.hash);
                return (
                  <span key={r.algo} className={`font-mono text-[11px] px-3 py-1 rounded ${match ? "bg-emerald-500/15 text-emerald-400" : "bg-white/[0.04] text-slate-600"}`}>
                    {r.algo}: {match ? "✓ Match" : "✕"}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "⚡", title: "Real-time", desc: "Hashes update instantly as you type — no button click needed." },
            { icon: "📁", title: "File Hashing", desc: "Upload any file to get its hash — useful for integrity verification." },
            { icon: "✅", title: "Hash Verifier", desc: "Paste an expected hash to instantly verify if it matches your input." },
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