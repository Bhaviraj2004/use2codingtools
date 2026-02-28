"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useMemo, useRef, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
type SortBy = "frequency" | "alphabetical" | "length";
type ViewMode = "table" | "cloud" | "chart";
type FilterMode = "all" | "noStop" | "custom";

type WordEntry = {
  word: string;
  count: number;
  pct: number;
  rank: number;
  firstPos: number;
  avgPos: number;
};

// ── Stop words ─────────────────────────────────────────────────────────────
const STOP_WORDS = new Set([
  "a","about","above","after","again","against","all","am","an","and","any","are",
  "as","at","be","because","been","before","being","below","between","both","but","by",
  "can","cannot","could","did","do","does","doing","don","down","during","each","few",
  "for","from","further","get","got","had","has","have","having","he","her","here",
  "hers","herself","him","himself","his","how","i","if","in","into","is","it","its",
  "itself","let","me","more","most","my","myself","no","nor","not","of","off","on",
  "once","only","or","other","our","ours","ourselves","out","over","own","same","she",
  "should","so","some","such","than","that","the","their","theirs","them","themselves",
  "then","there","these","they","this","those","through","to","too","under","until",
  "up","very","was","we","were","what","when","where","which","while","who","whom",
  "why","will","with","you","your","yours","yourself","yourselves","s","t","re","ll",
  "ve","d","m","isn","aren","wasn","weren","haven","hasn","hadn","won","wouldn","couldn",
  "shouldn","doesn","didn","also","just","like","even","still","than","then","well",
]);

// ── Helpers ────────────────────────────────────────────────────────────────
function extractWords(text: string): { word: string; pos: number }[] {
  const result: { word: string; pos: number }[] = [];
  const re = /\b([a-zA-Z']{1,})\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const w = m[1].replace(/^'+|'+$/g, "").toLowerCase();
    if (w.length > 0) result.push({ word: w, pos: m.index });
  }
  return result;
}

function buildFrequency(
  text: string,
  filterMode: FilterMode,
  customStop: Set<string>,
  minLen: number,
  maxLen: number,
): WordEntry[] {
  if (!text.trim()) return [];
  const tokens = extractWords(text);
  const totalWords = tokens.length;
  if (totalWords === 0) return [];

  const freq: Record<string, { count: number; positions: number[] }> = {};
  tokens.forEach(({ word, pos }) => {
    const skip =
      (filterMode === "noStop" && STOP_WORDS.has(word)) ||
      (filterMode === "custom" && customStop.has(word)) ||
      word.length < minLen ||
      word.length > maxLen;
    if (skip) return;
    if (!freq[word]) freq[word] = { count: 0, positions: [] };
    freq[word].count++;
    freq[word].positions.push(pos);
  });

  const entries = Object.entries(freq)
    .map(([word, { count, positions }]) => ({
      word, count,
      pct: Math.round((count / totalWords) * 10000) / 100,
      rank: 0,
      firstPos: positions[0],
      avgPos: positions.reduce((a, b) => a + b, 0) / positions.length / Math.max(text.length, 1),
    }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));

  entries.forEach((e, i) => (e.rank = i + 1));
  return entries;
}

function sortEntries(entries: WordEntry[], sortBy: SortBy): WordEntry[] {
  return [...entries].sort((a, b) => {
    if (sortBy === "frequency")    return b.count - a.count || a.word.localeCompare(b.word);
    if (sortBy === "alphabetical") return a.word.localeCompare(b.word);
    if (sortBy === "length")       return b.word.length - a.word.length || b.count - a.count;
    return 0;
  });
}

function cloudSize(count: number, max: number, min: number): number {
  if (max === min) return 24;
  const t = (count - min) / (max - min);
  return Math.round(12 + t * 44);
}

function wordHue(word: string): number {
  let h = 0;
  for (let i = 0; i < word.length; i++) h = (h * 31 + word.charCodeAt(i)) % 360;
  return h;
}

const EXAMPLE = `The art of writing is the art of discovering what you believe. Writing is thinking on paper. Good writing is clear thinking made visible.

The best writers read voraciously they read everything they can get their hands on. They study the craft of writing with the same devotion a musician brings to music or a painter to painting. Writing requires practice, patience, and an unwillingness to settle for the first draft.

Writing clearly means thinking clearly. When writing becomes confused, it is usually because the writer has not yet worked out what they want to say. Clear writing reflects clear thinking, and clear thinking is the foundation of all good communication.

Every word matters. Every sentence should earn its place. Writing that is padded with unnecessary words loses power. The best writing is lean, precise, and alive with energy.`;

// ── Component ──────────────────────────────────────────────────────────────
export default function WordFrequency() {
  const [text, setText]             = useState("");
  const [sortBy, setSortBy]         = useState<SortBy>("frequency");
  const [viewMode, setViewMode]     = useState<ViewMode>("table");
  const [filterMode, setFilterMode] = useState<FilterMode>("noStop");
  const [minLen, setMinLen]         = useState(1);
  const [maxLen, setMaxLen]         = useState(30);
  const [search, setSearch]         = useState("");
  const [customStopRaw, setCustomStopRaw] = useState("");
  const [copied, setCopied]         = useState<string | null>(null);
  const [topN, setTopN]             = useState(50);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const customStop = useMemo(
    () => new Set(customStopRaw.split(/[\s,;]+/).map(w => w.trim().toLowerCase()).filter(Boolean)),
    [customStopRaw],
  );

  const allEntries = useMemo(
    () => buildFrequency(text, filterMode, customStop, minLen, maxLen),
    [text, filterMode, customStop, minLen, maxLen],
  );

  const displayed = useMemo(() => {
    const sorted = sortEntries(allEntries, sortBy);
    const filtered = search ? sorted.filter(e => e.word.includes(search.toLowerCase())) : sorted;
    return filtered.slice(0, topN);
  }, [allEntries, sortBy, search, topN]);

  const maxCount = allEntries[0]?.count ?? 1;
  const minCount = allEntries[allEntries.length - 1]?.count ?? 1;
  const totalTokens = useMemo(() => extractWords(text).length, [text]);
  const uniqueCount = allEntries.length;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setText(ev.target?.result as string ?? "");
    reader.readAsText(file);
    e.target.value = "";
  };

  const copy = useCallback((txt: string, key: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(key);
    setTimeout(() => setCopied(null), 1600);
  }, []);

  const exportCsv = () => {
    const csv = ["Rank,Word,Count,Percentage"]
      .concat(displayed.map(e => `${e.rank},${e.word},${e.count},${e.pct}%`))
      .join("\n");
    copy(csv, "csv");
  };

  const exportJson = () => {
    const json = JSON.stringify(
      displayed.map(e => ({ rank: e.rank, word: e.word, count: e.count, pct: e.pct })),
      null, 2
    );
    copy(json, "json");
  };

  const cloudEntries = useMemo(
    () => allEntries.slice(0, 80).map(e => ({
      ...e,
      fontSize: cloudSize(e.count, maxCount, minCount),
      hue: wordHue(e.word),
    })),
    [allEntries, maxCount, minCount],
  );

  const chartEntries = displayed.slice(0, 30);

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-orange-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

      <ToolNavbar toolName="Word Frequency" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-orange-500/10 flex items-center justify-center font-mono font-bold text-orange-400 text-sm">∑</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Word Frequency</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded">real-time</span>
          </div>
          <p className="text-slate-500 text-sm">
            Analyze word frequency in any text — table, word cloud, bar chart. Filter stop words, set min length, export CSV/JSON.
          </p>
        </div>

        {/* Options bar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {/* View mode */}
          <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-md px-1.5 py-1.5">
            {([
              { key: "table", label: "⊞ Table" },
              { key: "cloud", label: "☁ Cloud" },
              { key: "chart", label: "▦ Chart" },
            ] as { key: ViewMode; label: string }[]).map(v => (
              <button key={v.key} onClick={() => setViewMode(v.key)}
                className={`font-mono text-xs px-3 py-0.5 rounded transition-all
                  ${viewMode === v.key ? "bg-orange-500/20 text-orange-400" : "text-slate-500 hover:text-slate-300"}`}>
                {v.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-md px-1.5 py-1.5">
            <span className="font-mono text-[10px] text-slate-600 px-1">Sort</span>
            {([
              { key: "frequency",    label: "Freq"   },
              { key: "alphabetical", label: "A–Z"    },
              { key: "length",       label: "Length" },
            ] as { key: SortBy; label: string }[]).map(s => (
              <button key={s.key} onClick={() => setSortBy(s.key)}
                className={`font-mono text-xs px-2.5 py-0.5 rounded transition-all
                  ${sortBy === s.key ? "bg-orange-500/20 text-orange-400" : "text-slate-500 hover:text-slate-300"}`}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Filter */}
          <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-md px-1.5 py-1.5">
            <span className="font-mono text-[10px] text-slate-600 px-1">Filter</span>
            {([
              { key: "all",    label: "All"     },
              { key: "noStop", label: "No Stop" },
              { key: "custom", label: "Custom"  },
            ] as { key: FilterMode; label: string }[]).map(f => (
              <button key={f.key} onClick={() => setFilterMode(f.key)}
                className={`font-mono text-xs px-2.5 py-0.5 rounded transition-all
                  ${filterMode === f.key ? "bg-orange-500/20 text-orange-400" : "text-slate-500 hover:text-slate-300"}`}>
                {f.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex gap-2">
            <input type="file" accept=".txt,.md,.html,.csv" ref={fileInputRef} onChange={handleFile} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()}
              className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-slate-300 hover:border-white/20 transition-all">
              Upload
            </button>
            <button onClick={() => setText(EXAMPLE)}
              className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-slate-300 hover:border-white/20 transition-all">
              Example
            </button>
            <button onClick={() => { setText(""); setSearch(""); }}
              className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-red-400 hover:border-red-500/30 transition-all">
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">

          {/* ── Left ── */}
          <div className="flex flex-col gap-4">

            {/* Textarea */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Input Text</span>
                <span className="font-mono text-[10px] text-slate-700">{totalTokens.toLocaleString()} tokens · {uniqueCount.toLocaleString()} unique</span>
              </div>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={"Paste any text here — article, essay, book chapter, code comments…\n\nWord frequency updates in real time."}
                spellCheck={false}
                className="w-full h-44 font-sans text-sm bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 text-slate-200 placeholder-slate-700 outline-none resize-none leading-relaxed transition-colors focus:border-orange-500/40"
              />
            </div>

            {/* Quick stats */}
            {allEntries.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Unique Words", value: uniqueCount.toLocaleString(),           accent: "orange"  },
                  { label: "Total Tokens", value: totalTokens.toLocaleString(),           accent: "blue"    },
                  { label: "Top Word",     value: allEntries[0]?.word ?? "—",             accent: "emerald" },
                  { label: "Top Count",    value: (allEntries[0]?.count ?? 0).toString(), accent: "purple"  },
                ].map(s => (
                  <div key={s.label} className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600 block mb-1">{s.label}</span>
                    <span className={`font-mono text-xl font-bold text-${s.accent}-400 truncate block`}>{s.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Results */}
            {allEntries.length > 0 && (
              <>
                {/* Search + export bar */}
                <div className="flex items-center gap-2">
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search words…"
                    className="flex-1 font-mono text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-slate-300 placeholder-slate-600 outline-none focus:border-orange-500/30 transition-colors" />
                  <select value={topN} onChange={e => setTopN(+e.target.value)}
                    className="font-mono text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-2 text-slate-400 outline-none cursor-pointer">
                    {[20, 50, 100, 200, 500].map(n => <option key={n} value={n}>Top {n}</option>)}
                  </select>
                  <button onClick={exportCsv}
                    className={`font-mono text-xs px-3 py-2 rounded-lg border transition-all
                      ${copied === "csv" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                    {copied === "csv" ? "✓" : "CSV"}
                  </button>
                  <button onClick={exportJson}
                    className={`font-mono text-xs px-3 py-2 rounded-lg border transition-all
                      ${copied === "json" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                    {copied === "json" ? "✓" : "JSON"}
                  </button>
                </div>

                {/* TABLE */}
                {viewMode === "table" && (
                  <div className="rounded-xl overflow-hidden border border-white/[0.08]">
                    <div className="grid grid-cols-[40px_1fr_70px_1fr_60px] px-4 py-2 bg-white/[0.04] border-b border-white/[0.06]">
                      {["#", "Word", "Count", "Frequency", ""].map((h, i) => (
                        <span key={i} className="font-mono text-[10px] uppercase tracking-widest text-slate-600">{h}</span>
                      ))}
                    </div>
                    <div className="divide-y divide-white/[0.04] max-h-[500px] overflow-y-auto">
                      {displayed.map(e => {
                        const barPct = (e.count / maxCount) * 100;
                        const hue    = wordHue(e.word);
                        return (
                          <div key={e.word}
                            className="grid grid-cols-[40px_1fr_70px_1fr_60px] px-4 py-2.5 hover:bg-white/[0.03] group transition-colors items-center">
                            <span className="font-mono text-[11px] text-slate-700">{e.rank}</span>
                            <span className="font-mono text-sm font-semibold text-slate-200">{e.word}</span>
                            <span className="font-mono text-sm text-orange-400">{e.count}</span>
                            <div className="flex items-center gap-2 pr-2">
                              <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-300"
                                  style={{ width: `${barPct}%`, backgroundColor: `hsl(${hue}, 70%, 55%)` }} />
                              </div>
                              <span className="font-mono text-[10px] text-slate-600 w-10 text-right shrink-0">{e.pct}%</span>
                            </div>
                            <button onClick={() => copy(e.word, `w-${e.word}`)}
                              className={`font-mono text-[10px] px-1.5 py-0.5 rounded border transition-all opacity-0 group-hover:opacity-100
                                ${copied === `w-${e.word}` ? "text-emerald-400 border-emerald-500/30" : "border-white/[0.08] text-slate-600 hover:text-slate-300"}`}>
                              {copied === `w-${e.word}` ? "✓" : "copy"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    {allEntries.length > topN && (
                      <div className="px-4 py-2 bg-white/[0.02] border-t border-white/[0.06] font-mono text-[10px] text-slate-600 text-center">
                        Showing top {Math.min(displayed.length, topN)} of {allEntries.length} words
                      </div>
                    )}
                  </div>
                )}

                {/* CLOUD */}
                {viewMode === "cloud" && (
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 min-h-64">
                    <div className="flex flex-wrap gap-x-4 gap-y-3 justify-center items-baseline">
                      {cloudEntries.map(e => (
                        <button key={e.word}
                          onClick={() => copy(e.word, `c-${e.word}`)}
                          title={`${e.word}: ${e.count} (${e.pct}%)`}
                          className="transition-all hover:scale-110 relative group"
                          style={{
                            fontSize: e.fontSize,
                            color: `hsl(${e.hue}, 65%, ${55 + (e.count / maxCount) * 20}%)`,
                            fontFamily: "monospace",
                            fontWeight: e.count > maxCount * 0.5 ? 700 : 400,
                            lineHeight: 1.2,
                          }}>
                          {e.word}
                          {copied === `c-${e.word}` && (
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 font-mono text-[9px] text-emerald-400 whitespace-nowrap">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* CHART */}
                {viewMode === "chart" && (
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
                    <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
                      {chartEntries.map(e => {
                        const barPct = (e.count / maxCount) * 100;
                        const hue    = wordHue(e.word);
                        return (
                          <div key={e.word} className="flex items-center gap-3 group">
                            <span className="font-mono text-xs text-slate-300 w-28 truncate shrink-0 text-right">{e.word}</span>
                            <div className="flex-1 relative h-6 bg-white/[0.04] rounded-md overflow-hidden cursor-pointer"
                              onClick={() => copy(e.word, `ch-${e.word}`)}>
                              <div className="h-full rounded-md transition-all duration-500"
                                style={{ width: `${barPct}%`, backgroundColor: `hsl(${hue}, 60%, 45%)` }} />
                              <span className="absolute inset-0 flex items-center pl-2 font-mono text-[10px] text-white/70">
                                {e.count}{copied === `ch-${e.word}` ? " ✓" : ""}
                              </span>
                            </div>
                            <span className="font-mono text-[10px] text-slate-600 w-10 text-right shrink-0">{e.pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {text && allEntries.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 border border-white/[0.06] rounded-xl bg-white/[0.01] text-slate-600">
                <span className="text-3xl mb-2">🔍</span>
                <p className="font-mono text-sm">No words found with current filters.</p>
              </div>
            )}
          </div>

          {/* ── Right: Settings + insights ── */}
          <div className="flex flex-col gap-4">

            {/* Filter settings */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4 space-y-4">
              <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600">Filter Settings</p>
              <div className="space-y-3">
                {[
                  { label: "Min Length", val: minLen, min: 1,  max: 10, set: setMinLen },
                  { label: "Max Length", val: maxLen, min: 2,  max: 40, set: setMaxLen },
                ].map(({ label, val, min, max, set }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-slate-600 w-20 shrink-0">{label}</span>
                    <input type="range" min={min} max={max} value={val}
                      onChange={e => set(+e.target.value)}
                      className="flex-1 accent-orange-500" />
                    <span className="font-mono text-xs text-orange-400 w-5 text-right shrink-0">{val}</span>
                  </div>
                ))}
              </div>
              {filterMode === "custom" && (
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-widest text-slate-600 block mb-1.5">Custom Stop Words</label>
                  <textarea
                    value={customStopRaw}
                    onChange={e => setCustomStopRaw(e.target.value)}
                    placeholder={"the, a, is, are…\nOne per line or comma-separated"}
                    className="w-full h-28 font-mono text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg p-3 text-slate-400 placeholder-slate-700 outline-none resize-none focus:border-orange-500/30 transition-colors"
                  />
                  {customStop.size > 0 && (
                    <p className="font-mono text-[10px] text-orange-400/70 mt-1">{customStop.size} stop words set</p>
                  )}
                </div>
              )}
              {filterMode === "noStop" && (
                <p className="font-mono text-[10px] text-slate-700 leading-relaxed">
                  Filtering {STOP_WORDS.size}+ common English stop words
                </p>
              )}
            </div>

            {/* Insights */}
            {allEntries.length > 0 && (
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4 space-y-3">
                <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600">Insights</p>
                <div className="space-y-2.5">
                  {[
                    { label: "Vocabulary Richness", value: `${Math.round((uniqueCount / Math.max(totalTokens,1)) * 100)}%`, note: "unique/total",    color: "text-emerald-400" },
                    { label: "Avg Word Length",     value: `${(allEntries.reduce((s,e)=>s+e.word.length,0)/Math.max(allEntries.length,1)).toFixed(1)} chars`, note: "", color: "text-orange-400" },
                    { label: "Hapax Legomena",      value: allEntries.filter(e=>e.count===1).length.toLocaleString(), note: "appear once",  color: "text-blue-400"    },
                    { label: "Top 10 Coverage",     value: `${Math.round(allEntries.slice(0,10).reduce((s,e)=>s+e.count,0)/Math.max(totalTokens,1)*100)}%`, note: "of total", color: "text-purple-400" },
                  ].map(({ label, value, note, color }) => (
                    <div key={label} className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-[10px] text-slate-600 block">{label}</span>
                        {note && <span className="font-mono text-[9px] text-slate-700">{note}</span>}
                      </div>
                      <span className={`font-mono text-sm font-bold ${color} shrink-0`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top 5 medals */}
            {allEntries.length > 0 && (
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
                <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-3">Top 5 Words</p>
                <div className="space-y-2">
                  {allEntries.slice(0, 5).map((e, i) => {
                    const medals = ["🥇","🥈","🥉","4️⃣","5️⃣"];
                    return (
                      <div key={e.word} className="flex items-center gap-2">
                        <span className="text-base shrink-0">{medals[i]}</span>
                        <span className="font-mono text-sm font-bold text-slate-200 flex-1">{e.word}</span>
                        <span className="font-mono text-sm text-orange-400 shrink-0">{e.count}×</span>
                        <span className="font-mono text-[10px] text-slate-700 shrink-0">{e.pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Distribution */}
            {allEntries.length > 0 && (
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
                <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-3">Frequency Distribution</p>
                <div className="space-y-1.5">
                  {[
                    { label: "≥ 10×", count: allEntries.filter(e=>e.count>=10).length                          },
                    { label: "5–9×",  count: allEntries.filter(e=>e.count>=5&&e.count<10).length               },
                    { label: "2–4×",  count: allEntries.filter(e=>e.count>=2&&e.count<5).length                },
                    { label: "Once",  count: allEntries.filter(e=>e.count===1).length                          },
                  ].map(({ label, count }) => {
                    const pct = allEntries.length > 0 ? Math.round((count / allEntries.length) * 100) : 0;
                    return (
                      <div key={label} className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-600 w-10 shrink-0">{label}</span>
                        <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500/40 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="font-mono text-[10px] text-slate-500 w-8 text-right shrink-0">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Stats bar */}
        {allEntries.length > 0 && (
          <div className="flex flex-wrap gap-6 px-4 py-3 bg-orange-500/[0.05] border border-orange-500/20 rounded-lg mt-5 mb-5">
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Total</span><span className="font-mono text-sm text-orange-400">{totalTokens.toLocaleString()}</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Unique</span><span className="font-mono text-sm text-orange-400">{uniqueCount.toLocaleString()}</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Top Word</span><span className="font-mono text-sm text-orange-400">{allEntries[0]?.word} ({allEntries[0]?.count}×)</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Filter</span><span className="font-mono text-sm text-orange-400">{filterMode==="noStop"?"No Stop Words":filterMode==="custom"?"Custom":"All Words"}</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Sort</span><span className="font-mono text-sm text-orange-400 capitalize">{sortBy}</span></div>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              <span className="font-mono text-[10px] text-orange-500/60">Live</span>
            </div>
          </div>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "☁",  title: "3 Views",          desc: "Table with frequency bars, word cloud sized by frequency, and horizontal bar chart — switch anytime." },
            { icon: "🔍", title: "Smart Filtering",   desc: "Filter 300+ English stop words, build a custom stop list, or control min/max word length." },
            { icon: "📤", title: "Export CSV / JSON", desc: "Copy results as CSV or JSON with rank, word, count, and percentage for every displayed word." },
          ].map(c => (
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