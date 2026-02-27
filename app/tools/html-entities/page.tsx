"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useMemo } from "react";

// ── Entity maps ───────────────────────────────────────────────
const ENCODE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "©": "&copy;",
  "®": "&reg;",
  "™": "&trade;",
  "€": "&euro;",
  "£": "&pound;",
  "¥": "&yen;",
  "¢": "&cent;",
  "§": "&sect;",
  "°": "&deg;",
  "±": "&plusmn;",
  "×": "&times;",
  "÷": "&divide;",
  "²": "&sup2;",
  "³": "&sup3;",
  "½": "&frac12;",
  "¼": "&frac14;",
  "¾": "&frac34;",
  "—": "&mdash;",
  "–": "&ndash;",
  "…": "&hellip;",
  "•": "&bull;",
  "·": "&middot;",
  "←": "&larr;",
  "→": "&rarr;",
  "↑": "&uarr;",
  "↓": "&darr;",
  "↔": "&harr;",
  "♠": "&spades;",
  "♣": "&clubs;",
  "♥": "&hearts;",
  "♦": "&diams;",
  "\u00A0": "&nbsp;",
};

const DECODE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(ENCODE_MAP).map(([k, v]) => [v, k])
);

// Named reference table (for display)
const ENTITY_REFERENCE = [
  { char: "&",    entity: "&amp;",    desc: "Ampersand",         category: "Essential" },
  { char: "<",    entity: "&lt;",     desc: "Less than",         category: "Essential" },
  { char: ">",    entity: "&gt;",     desc: "Greater than",      category: "Essential" },
  { char: '"',    entity: "&quot;",   desc: "Double quote",      category: "Essential" },
  { char: "'",    entity: "&#39;",    desc: "Single quote",      category: "Essential" },
  { char: "\u00A0",entity: "&nbsp;",  desc: "Non-breaking space",category: "Essential" },
  { char: "©",    entity: "&copy;",   desc: "Copyright",         category: "Symbols" },
  { char: "®",    entity: "&reg;",    desc: "Registered",        category: "Symbols" },
  { char: "™",    entity: "&trade;",  desc: "Trademark",         category: "Symbols" },
  { char: "€",    entity: "&euro;",   desc: "Euro",              category: "Currency" },
  { char: "£",    entity: "&pound;",  desc: "Pound",             category: "Currency" },
  { char: "¥",    entity: "&yen;",    desc: "Yen",               category: "Currency" },
  { char: "¢",    entity: "&cent;",   desc: "Cent",              category: "Currency" },
  { char: "°",    entity: "&deg;",    desc: "Degree",            category: "Math" },
  { char: "±",    entity: "&plusmn;", desc: "Plus-minus",        category: "Math" },
  { char: "×",    entity: "&times;",  desc: "Multiply",          category: "Math" },
  { char: "÷",    entity: "&divide;", desc: "Divide",            category: "Math" },
  { char: "½",    entity: "&frac12;", desc: "One half",          category: "Math" },
  { char: "¼",    entity: "&frac14;", desc: "One quarter",       category: "Math" },
  { char: "¾",    entity: "&frac34;", desc: "Three quarters",    category: "Math" },
  { char: "—",    entity: "&mdash;",  desc: "Em dash",           category: "Punctuation" },
  { char: "–",    entity: "&ndash;",  desc: "En dash",           category: "Punctuation" },
  { char: "…",    entity: "&hellip;", desc: "Ellipsis",          category: "Punctuation" },
  { char: "•",    entity: "&bull;",   desc: "Bullet",            category: "Punctuation" },
  { char: "←",    entity: "&larr;",   desc: "Left arrow",        category: "Arrows" },
  { char: "→",    entity: "&rarr;",   desc: "Right arrow",       category: "Arrows" },
  { char: "↑",    entity: "&uarr;",   desc: "Up arrow",          category: "Arrows" },
  { char: "↓",    entity: "&darr;",   desc: "Down arrow",        category: "Arrows" },
  { char: "↔",    entity: "&harr;",   desc: "Left-right arrow",  category: "Arrows" },
  { char: "♠",    entity: "&spades;", desc: "Spades",            category: "Symbols" },
  { char: "♣",    entity: "&clubs;",  desc: "Clubs",             category: "Symbols" },
  { char: "♥",    entity: "&hearts;", desc: "Hearts",            category: "Symbols" },
  { char: "♦",    entity: "&diams;",  desc: "Diamonds",          category: "Symbols" },
];

const CATEGORIES = ["All", "Essential", "Currency", "Math", "Symbols", "Punctuation", "Arrows"];

type Mode = "encode" | "decode";

function encode(text: string, encodeAll: boolean): string {
  if (encodeAll) {
    return text.split("").map((ch) => {
      if (ENCODE_MAP[ch]) return ENCODE_MAP[ch];
      const code = ch.codePointAt(0) ?? 0;
      if (code > 127) return `&#${code};`;
      return ch;
    }).join("");
  }
  return text.replace(/[&<>"'\u00A0©®™€£¥¢§°±×÷²³½¼¾—–…•·←→↑↓↔♠♣♥♦]/g, (ch) => ENCODE_MAP[ch] ?? ch);
}

function decode(text: string): string {
  // Named entities
  let result = text.replace(/&[a-z]+;/gi, (e) => DECODE_MAP[e] ?? e);
  // Decimal numeric entities
  result = result.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n)));
  // Hex numeric entities
  result = result.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));
  return result;
}

const EXAMPLES: Record<Mode, string> = {
  encode: `<div class="hello">\n  <p>5 > 3 & 2 < 4</p>\n  <a href="page?id=1&type=2">Link © 2024</a>\n  Price: €29.99 or £24.99\n</div>`,
  decode: `&lt;div class=&quot;hello&quot;&gt;\n  &lt;p&gt;5 &gt; 3 &amp; 2 &lt; 4&lt;/p&gt;\n  Price: &euro;29.99 &copy; 2024\n&lt;/div&gt;`,
};

export default function HtmlEntities() {
  const [mode, setMode]           = useState<Mode>("encode");
  const [input, setInput]         = useState("");
  const [encodeAll, setEncodeAll] = useState(false);
  const [search, setSearch]       = useState("");
  const [category, setCategory]   = useState("All");
  const [copied, setCopied]       = useState<string | null>(null);

  const output = useMemo(() => {
    if (!input.trim()) return "";
    return mode === "encode" ? encode(input, encodeAll) : decode(input);
  }, [input, mode, encodeAll]);

  const filtered = useMemo(() => {
    return ENTITY_REFERENCE.filter((e) => {
      const matchCat = category === "All" || e.category === category;
      const q = search.toLowerCase();
      const matchSearch = !q || e.entity.toLowerCase().includes(q) || e.desc.toLowerCase().includes(q) || e.char.includes(q);
      return matchCat && matchSearch;
    });
  }, [search, category]);

  const copy = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setInput("");
  };

  const stats = useMemo(() => {
    if (!output) return null;
    const entityCount = (output.match(/&[^;]+;/g) || []).length;
    const saved = Math.abs(output.length - input.length);
    return { entityCount, saved };
  }, [input, output]);

  const CATEGORY_COLORS: Record<string, string> = {
    Essential:   "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    Currency:    "text-yellow-400  bg-yellow-500/10  border-yellow-500/20",
    Math:        "text-violet-400  bg-violet-500/10  border-violet-500/20",
    Symbols:     "text-cyan-400    bg-cyan-500/10    border-cyan-500/20",
    Punctuation: "text-orange-400  bg-orange-500/10  border-orange-500/20",
    Arrows:      "text-pink-400    bg-pink-500/10    border-pink-500/20",
  };

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-orange-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

      {/* NAV */}
      {/* <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#09090f]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <a href="/" className="font-mono text-sm font-bold text-emerald-400">use2<span className="text-slate-500">coding</span>tools</a>
          <span className="text-white/10">/</span>
          <span className="font-mono text-sm text-slate-400">HTML Entities</span>
        </div>
      </nav> */}

      <ToolNavbar toolName="HTML Entities" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-orange-500/10 flex items-center justify-center font-mono font-bold text-orange-400 text-sm">&amp;</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">HTML Entities</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded">encode & decode</span>
          </div>
          <p className="text-slate-500 text-sm">
            Encode special characters into HTML entities or decode them back. Includes a full reference table with 30+ common entities.
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-lg p-1 gap-1">
            {(["encode", "decode"] as Mode[]).map((m) => (
              <button key={m} onClick={() => switchMode(m)}
                className={`font-mono text-xs px-6 py-2 rounded-md capitalize transition-all ${mode === m ? "bg-orange-500/20 text-orange-400" : "text-slate-500 hover:text-slate-300"}`}>
                {m === "encode" ? "⬆ Encode" : "⬇ Decode"}
              </button>
            ))}
          </div>

          {mode === "encode" && (
            <label onClick={() => setEncodeAll(!encodeAll)} className="flex items-center gap-2 cursor-pointer bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-1.5">
              <div className={`w-8 h-4 rounded-full transition-all relative ${encodeAll ? "bg-orange-500" : "bg-white/10"}`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${encodeAll ? "left-4" : "left-0.5"}`} />
              </div>
              <span className="font-mono text-xs text-slate-500">Encode all non-ASCII</span>
            </label>
          )}

          <div className="ml-auto flex gap-2">
            <button onClick={() => { setInput(EXAMPLES[mode]); }}
              className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-slate-300 hover:border-white/20 transition-all">
              Load Example
            </button>
            <button onClick={() => { setInput(""); }}
              className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-red-400 hover:border-red-500/30 transition-all">
              Clear
            </button>
          </div>
        </div>

        {/* Input / Output */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">
                {mode === "encode" ? "Plain Text / HTML" : "Encoded HTML"}
              </span>
              <span className="font-mono text-[10px] text-slate-700">{input.length} chars</span>
            </div>
            <textarea value={input} onChange={(e) => setInput(e.target.value)}
              placeholder={mode === "encode" ? 'Type <html> with & symbols...' : 'Paste &lt;encoded&gt; text...'}
              spellCheck={false} rows={12}
              className="w-full font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 text-slate-300 placeholder-slate-700 outline-none focus:border-orange-500/40 resize-none transition-colors leading-relaxed" />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">
                {mode === "encode" ? "Encoded Output" : "Decoded Output"}
              </span>
              <button onClick={() => copy("output", output)} disabled={!output}
                className={`font-mono text-[11px] px-3  rounded border transition-all ${copied === "output" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300 disabled:opacity-30"}`}>
                {copied === "output" ? "✓ Copied!" : "Copy"}
              </button>
            </div>
            <div className="h-[306px] font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 overflow-auto leading-relaxed">
              {!output && <span className="text-slate-700">Output will appear here as you type...</span>}
              {output && <pre className="text-orange-300 text-xs whitespace-pre-wrap break-all">{output}</pre>}
            </div>
          </div>
        </div>

        {/* Stats */}
        {output && stats && (
          <div className="flex flex-wrap gap-6 px-4 py-3 bg-orange-500/[0.05] border border-orange-500/20 rounded-lg mb-6">
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Input</span><span className="font-mono text-sm text-orange-400">{input.length} chars</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Output</span><span className="font-mono text-sm text-orange-400">{output.length} chars</span></div>
            {mode === "encode" && <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Entities</span><span className="font-mono text-sm text-orange-400">{stats.entityCount}</span></div>}
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Difference</span><span className="font-mono text-sm text-orange-400">{stats.saved > 0 ? "+" : ""}{output.length - input.length} chars</span></div>
          </div>
        )}

        {/* Reference Table */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden mb-6">
          <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
            <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Entity Reference</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search entities..."
              className="font-mono text-xs px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded text-slate-300 placeholder-slate-700 outline-none focus:border-orange-500/30 w-40 transition-colors" />
            <div className="flex flex-wrap gap-1.5 ml-auto">
              {CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`font-mono text-[10px] px-2.5 py-1 rounded border transition-all ${
                    category === cat
                      ? cat === "All" ? "bg-white/10 border-white/20 text-white" : `${CATEGORY_COLORS[cat]} border-current/30`
                      : "border-white/[0.06] text-slate-600 hover:text-slate-400"
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.04]">
            {/* Left half */}
            <div className="divide-y divide-white/[0.04]">
              {filtered.slice(0, Math.ceil(filtered.length / 2)).map((e) => (
                <EntityRow key={e.entity} e={e} onCopyChar={() => copy(e.entity + "-char", e.char)} onCopyEntity={() => copy(e.entity + "-ent", e.entity)} copiedKey={copied} colorMap={CATEGORY_COLORS} />
              ))}
            </div>
            {/* Right half */}
            <div className="divide-y divide-white/[0.04]">
              {filtered.slice(Math.ceil(filtered.length / 2)).map((e) => (
                <EntityRow key={e.entity} e={e} onCopyChar={() => copy(e.entity + "-char", e.char)} onCopyEntity={() => copy(e.entity + "-ent", e.entity)} copiedKey={copied} colorMap={CATEGORY_COLORS} />
              ))}
            </div>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-8 font-mono text-sm text-slate-600">No entities found for "{search}"</div>
          )}
        </div>

        {/* Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "⬆", title: "Encode",   desc: "Convert <, >, &, quotes and symbols into safe HTML entity codes." },
            { icon: "⬇", title: "Decode",   desc: "Convert &amp; &lt; &copy; and numeric entities back to characters." },
            { icon: "📋", title: "Reference",desc: "30+ common entities organized by category — click to copy instantly." },
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

function EntityRow({
  e, onCopyChar, onCopyEntity, copiedKey, colorMap,
}: {
  e: typeof ENTITY_REFERENCE[0];
  onCopyChar: () => void;
  onCopyEntity: () => void;
  copiedKey: string | null;
  colorMap: Record<string, string>;
}) {
  const catClass = colorMap[e.category] ?? "text-slate-400 bg-white/[0.04]";
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] group transition-colors">
      <button onClick={onCopyChar} title="Copy character"
        className="font-mono text-base w-7 text-center text-slate-200 hover:text-orange-400 transition-colors shrink-0">
        {e.char === "\u00A0" ? "·" : e.char}
      </button>
      <div className="flex-1 min-w-0">
        <div className="font-mono text-xs text-slate-400">{e.desc}</div>
      </div>
      <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded border hidden sm:inline ${catClass}`}>{e.category}</span>
      <button onClick={onCopyEntity} title="Copy entity"
        className={`font-mono text-xs px-2 py-0.5 rounded border transition-all shrink-0 ${
          copiedKey === e.entity + "-ent"
            ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
            : "border-white/[0.06] text-slate-500 hover:text-orange-400 hover:border-orange-500/30"
        }`}>
        {copiedKey === e.entity + "-ent" ? "✓" : e.entity}
      </button>
    </div>
  );
}