"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useMemo, useRef } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
type ReadingLevel = "Elementary" | "Middle School" | "High School" | "College" | "Graduate";

// ── Helpers ────────────────────────────────────────────────────────────────
function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

function countSentences(text: string): number {
  if (!text.trim()) return 0;
  const matches = text.match(/[^.!?]*[.!?]+/g);
  return matches ? matches.length : (text.trim() ? 1 : 0);
}

function countParagraphs(text: string): number {
  if (!text.trim()) return 0;
  return text.split(/\n\s*\n/).filter(p => p.trim() !== "").length;
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!word) return 0;
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  word = word.replace(/^y/, "");
  const m = word.match(/[aeiouy]{1,2}/g);
  return m ? m.length : 1;
}

function fleschKincaid(text: string): { score: number; grade: number; level: ReadingLevel } {
  const words = countWords(text);
  const sentences = countSentences(text);
  const syllables = text.trim().split(/\s+/).reduce((s, w) => s + countSyllables(w), 0);
  if (words === 0 || sentences === 0) return { score: 0, grade: 0, level: "Elementary" };
  const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  const grade = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
  const level: ReadingLevel =
    score >= 90 ? "Elementary" :
    score >= 70 ? "Middle School" :
    score >= 60 ? "High School" :
    score >= 30 ? "College" : "Graduate";
  return { score: Math.max(0, Math.min(100, Math.round(score))), grade: Math.max(0, Math.round(grade)), level };
}

function avgWordsPerSentence(text: string): number {
  const w = countWords(text), s = countSentences(text);
  return s === 0 ? 0 : Math.round((w / s) * 10) / 10;
}

function avgSyllablesPerWord(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 0;
  const total = words.reduce((s, w) => s + countSyllables(w), 0);
  return Math.round((total / words.length) * 100) / 100;
}

function readingTime(words: number): string {
  const mins = words / 238; // avg reading speed
  if (mins < 1) return `< 1 min`;
  return `${Math.ceil(mins)} min`;
}

function speakingTime(words: number): string {
  const mins = words / 130; // avg speaking speed
  if (mins < 1) return `< 1 min`;
  if (mins >= 60) return `${Math.floor(mins / 60)}h ${Math.round(mins % 60)}m`;
  return `${Math.ceil(mins)} min`;
}

function topWords(text: string, n = 10): { word: string; count: number }[] {
  const stopWords = new Set(["the","a","an","and","or","but","in","on","at","to","for","of","with","by","from","is","are","was","were","be","been","have","has","had","do","does","did","will","would","could","should","may","might","that","this","it","he","she","we","they","i","you","not","as","so","if","than","then","when","where","who","what","which","how","all","any","my","your","his","her","its","our","their","there","here","just","also","more","about","up","out","into","after","before","over","under","again","s","t"]);
  const words = text.toLowerCase().match(/\b[a-z]{2,}\b/g) ?? [];
  const freq: Record<string, number> = {};
  words.forEach(w => { if (!stopWords.has(w)) freq[w] = (freq[w] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, n).map(([word, count]) => ({ word, count }));
}

function charFrequency(text: string): { char: string; count: number }[] {
  const freq: Record<string, number> = {};
  for (const c of text.toLowerCase()) {
    if (/[a-z]/.test(c)) freq[c] = (freq[c] || 0) + 1;
  }
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([char, count]) => ({ char, count }));
}

const EXAMPLE = `The quick brown fox jumps over the lazy dog. This sentence has been used for centuries to showcase typography and test keyboards.

Writing is a powerful tool for communication. When we craft our words carefully, we can convey complex ideas with clarity and precision. Good writing requires practice, patience, and a willingness to revise.

The best writers read voraciously and write daily. They study the craft, seek feedback, and never stop learning. Whether you are writing a novel, an email, or a tweet — every word counts.`;

// ── Component ──────────────────────────────────────────────────────────────
export default function WordCounter() {
  const [text, setText]       = useState("");
  const [copied, setCopied]   = useState<string | null>(null);
  const [showKeywords, setShowKeywords] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // All stats — memoized
  const stats = useMemo(() => {
    const words      = countWords(text);
    const chars      = text.length;
    const charsNoSp  = text.replace(/\s/g, "").length;
    const sentences  = countSentences(text);
    const paragraphs = countParagraphs(text);
    const lines      = text === "" ? 0 : text.split("\n").length;
    const fk         = fleschKincaid(text);
    const top        = topWords(text, 12);
    const charFreq   = charFrequency(text);
    const longest    = text.trim().split(/\s+/).filter(Boolean).reduce((a, b) => b.length > a.length ? b : a, "");
    const unique     = new Set(text.toLowerCase().match(/\b[a-z]+\b/g) ?? []).size;

    return {
      words, chars, charsNoSp, sentences, paragraphs, lines,
      readingTime: readingTime(words),
      speakingTime: speakingTime(words),
      avgWordsPerSentence: avgWordsPerSentence(text),
      avgSyllablesPerWord: avgSyllablesPerWord(text),
      fk, top, charFreq, longest, unique,
    };
  }, [text]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setText(ev.target?.result as string ?? "");
    reader.readAsText(file);
    e.target.value = "";
  };

  const copy = (txt: string, key: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(key);
    setTimeout(() => setCopied(null), 1600);
  };

  const maxTopCount = stats.top[0]?.count ?? 1;
  const maxCharCount = stats.charFreq[0]?.count ?? 1;

  const READING_LEVEL_COLOR: Record<ReadingLevel, string> = {
    "Elementary":   "text-emerald-400",
    "Middle School":"text-sky-400",
    "High School":  "text-blue-400",
    "College":      "text-orange-400",
    "Graduate":     "text-red-400",
  };

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      {/* BG */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-orange-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

      <ToolNavbar toolName="Word Counter" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-orange-500/10 flex items-center justify-center text-orange-400 text-lg font-bold font-mono">W</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Word Counter</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded">real-time</span>
          </div>
          <p className="text-slate-500 text-sm">
            Count words, characters, sentences, reading time — plus keyword frequency, readability score, and more.
          </p>
        </div>

        {/* Top bar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="ml-auto flex gap-2">
            <input type="file" accept=".txt,.md,.html,.csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()}
              className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-slate-300 hover:border-white/20 transition-all">
              Upload File
            </button>
            <button onClick={() => { setText(EXAMPLE); }}
              className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-slate-300 hover:border-white/20 transition-all">
              Load Example
            </button>
            <button onClick={() => setText("")}
              className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-red-400 hover:border-red-500/30 transition-all">
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">

          {/* ── Left: Editor ── */}
          <div className="flex flex-col gap-4">

            {/* Textarea */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Your Text</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-slate-700">{stats.words} words · {stats.chars} chars</span>
                  <button onClick={() => copy(text, "text")}
                    disabled={!text}
                    className={`font-mono text-[11px] px-3 py-1 rounded border transition-all
                      ${copied === "text" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300 disabled:opacity-20"}`}>
                    {copied === "text" ? "✓ Copied!" : "Copy"}
                  </button>
                </div>
              </div>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Start typing or paste your text here…&#10;&#10;Word count, character count, reading time, keyword frequency — all update in real time."
                spellCheck
                className="w-full h-80 font-sans text-sm bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 text-slate-200 placeholder-slate-700 outline-none resize-none leading-relaxed transition-colors focus:border-orange-500/40"
              />
            </div>

            {/* Quick stats strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Words",       value: stats.words.toLocaleString(),      accent: "orange"  },
                { label: "Characters",  value: stats.chars.toLocaleString(),      accent: "blue"    },
                { label: "Sentences",   value: stats.sentences.toLocaleString(),  accent: "emerald" },
                { label: "Paragraphs",  value: stats.paragraphs.toLocaleString(), accent: "purple"  },
              ].map(s => (
                <div key={s.label} className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 flex flex-col">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600 mb-1">{s.label}</span>
                  <span className={`font-mono text-2xl font-bold text-${s.accent}-400`}>{s.value}</span>
                </div>
              ))}
            </div>

            {/* Detailed stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Chars (no spaces)", value: stats.charsNoSp.toLocaleString() },
                { label: "Lines",             value: stats.lines.toLocaleString()      },
                { label: "Unique Words",      value: stats.unique.toLocaleString()     },
                { label: "Avg Words/Sentence",value: stats.avgWordsPerSentence         },
                { label: "Avg Syllables/Word",value: stats.avgSyllablesPerWord         },
                { label: "Longest Word",      value: stats.longest || "—"              },
              ].map(s => (
                <div key={s.label} className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-4 py-3">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600 block mb-1">{s.label}</span>
                  <span className="font-mono text-sm text-slate-300 font-semibold truncate block">{s.value}</span>
                </div>
              ))}
            </div>

            {/* Reading & speaking time */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Reading Time",  sub: "@ 238 wpm",  value: stats.readingTime,  icon: "📖" },
                { label: "Speaking Time", sub: "@ 130 wpm",  value: stats.speakingTime, icon: "🎙" },
              ].map(s => (
                <div key={s.label} className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-5 py-4 flex items-center gap-4">
                  <span className="text-2xl">{s.icon}</span>
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600 block">{s.label}</span>
                    <span className="font-mono text-xl font-bold text-orange-400">{s.value}</span>
                    <span className="font-mono text-[10px] text-slate-700 ml-1">{s.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Keyword frequency */}
            {stats.top.length > 0 && (
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600">Top Keywords</p>
                  <span className="font-mono text-[10px] text-slate-700">excl. stop words</span>
                </div>
                <div className="space-y-2">
                  {stats.top.map(({ word, count }) => (
                    <div key={word} className="flex items-center gap-3 group">
                      <span className="font-mono text-xs text-slate-400 w-28 truncate shrink-0">{word}</span>
                      <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500/50 rounded-full transition-all duration-500"
                          style={{ width: `${(count / maxTopCount) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-orange-400 w-6 text-right shrink-0">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Char frequency */}
            {stats.charFreq.length > 0 && (
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-5">
                <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-4">Top Characters</p>
                <div className="flex flex-wrap gap-3">
                  {stats.charFreq.map(({ char, count }) => (
                    <div key={char} className="flex flex-col items-center gap-1">
                      <div className="relative w-8 h-16 bg-white/[0.04] rounded-md overflow-hidden flex items-end">
                        <div
                          className="w-full bg-orange-500/40 rounded-b-md transition-all duration-500"
                          style={{ height: `${(count / maxCharCount) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs text-slate-300 font-bold">{char}</span>
                      <span className="font-mono text-[9px] text-slate-700">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Readability + extras ── */}
          <div className="flex flex-col gap-4">

            {/* Readability score */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-5">
              <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-4">Readability</p>

              {/* Flesch score gauge */}
              <div className="flex items-end gap-3 mb-4">
                <span className={`font-mono text-5xl font-black ${READING_LEVEL_COLOR[stats.fk.level]}`}>
                  {text ? stats.fk.score : "—"}
                </span>
                <div className="pb-1">
                  <span className={`font-mono text-sm font-bold block ${READING_LEVEL_COLOR[stats.fk.level]}`}>{text ? stats.fk.level : "—"}</span>
                  <span className="font-mono text-[10px] text-slate-600">Flesch Reading Ease</span>
                </div>
              </div>

              {/* Score bar */}
              <div className="relative h-2 rounded-full overflow-hidden mb-2"
                style={{ background: "linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e)" }}>
                {text && (
                  <div className="absolute top-0 w-3 h-3 -mt-0.5 rounded-full bg-white shadow-lg border border-white/20"
                    style={{ left: `calc(${stats.fk.score}% - 6px)` }} />
                )}
              </div>
              <div className="flex justify-between font-mono text-[9px] text-slate-700 mb-4">
                <span>Hard</span><span>Easy</span>
              </div>

              {/* Grade */}
              <div className="flex items-center justify-between py-2 border-t border-white/[0.06]">
                <span className="font-mono text-[11px] text-slate-600">Grade Level</span>
                <span className="font-mono text-sm text-orange-400 font-bold">{text ? `Grade ${stats.fk.grade}` : "—"}</span>
              </div>

              {/* Score guide */}
              <div className="mt-3 space-y-1">
                {[
                  { range: "90–100", level: "Elementary",    color: "text-emerald-400" },
                  { range: "70–89",  level: "Middle School", color: "text-sky-400"     },
                  { range: "60–69",  level: "High School",   color: "text-blue-400"    },
                  { range: "30–59",  level: "College",       color: "text-orange-400"  },
                  { range: "0–29",   level: "Graduate",      color: "text-red-400"     },
                ].map(r => (
                  <div key={r.range} className="flex items-center justify-between">
                    <span className={`font-mono text-[10px] ${r.color}`}>{r.level}</span>
                    <span className="font-mono text-[10px] text-slate-700">{r.range}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Density */}
            {text && (
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-5">
                <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-4">Density</p>
                <div className="space-y-3">
                  {[
                    { label: "Unique / Total Words", value: stats.words > 0 ? Math.round((stats.unique / stats.words) * 100) : 0, unit: "%" },
                    { label: "Chars / Word (avg)", value: stats.words > 0 ? Math.round((stats.charsNoSp / stats.words) * 10) / 10 : 0, unit: "" },
                  ].map(d => (
                    <div key={d.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[10px] text-slate-600">{d.label}</span>
                        <span className="font-mono text-xs text-orange-400 font-bold">{d.value}{d.unit}</span>
                      </div>
                      {d.unit === "%" && (
                        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500/50 rounded-full" style={{ width: `${d.value}%` }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Social limits */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-5">
              <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-3">Platform Limits</p>
              <div className="space-y-2.5">
                {[
                  { platform: "Twitter/X",    limit: 280,   unit: "chars" },
                  { platform: "Instagram",    limit: 2200,  unit: "chars" },
                  { platform: "LinkedIn",     limit: 3000,  unit: "chars" },
                  { platform: "Facebook",     limit: 63206, unit: "chars" },
                  { platform: "SMS",          limit: 160,   unit: "chars" },
                  { platform: "Meta Title",   limit: 60,    unit: "chars" },
                  { platform: "Meta Desc",    limit: 160,   unit: "chars" },
                ].map(({ platform: p, limit, unit }) => {
                  const used = unit === "chars" ? stats.chars : stats.words;
                  const pct  = Math.min(100, Math.round((used / limit) * 100));
                  const over = used > limit;
                  return (
                    <div key={p}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[10px] text-slate-500">{p}</span>
                        <span className={`font-mono text-[10px] font-bold ${over ? "text-red-400" : pct > 80 ? "text-yellow-400" : "text-slate-500"}`}>
                          {used.toLocaleString()}/{limit.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${over ? "bg-red-500" : pct > 80 ? "bg-yellow-500" : "bg-orange-500/50"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Stats bar */}
        {text && (
          <div className="flex flex-wrap gap-6 px-4 py-3 bg-orange-500/[0.05] border border-orange-500/20 rounded-lg mt-5 mb-5">
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Words</span><span className="font-mono text-sm text-orange-400">{stats.words.toLocaleString()}</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Chars</span><span className="font-mono text-sm text-orange-400">{stats.chars.toLocaleString()}</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Reading</span><span className="font-mono text-sm text-orange-400">{stats.readingTime}</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Speaking</span><span className="font-mono text-sm text-orange-400">{stats.speakingTime}</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Level</span><span className={`font-mono text-sm ${READING_LEVEL_COLOR[stats.fk.level]}`}>{stats.fk.level}</span></div>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              <span className="font-mono text-[10px] text-orange-500/60">Live</span>
            </div>
          </div>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "📊", title: "Deep Analysis",     desc: "Words, chars, sentences, paragraphs, lines, unique words, avg words per sentence, longest word." },
            { icon: "📖", title: "Readability Score", desc: "Flesch Reading Ease + grade level — instantly know if your text is easy or complex to read." },
            { icon: "📱", title: "Platform Limits",   desc: "See how your text fits Twitter, Instagram, LinkedIn, SMS, Meta title/description and more." },
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