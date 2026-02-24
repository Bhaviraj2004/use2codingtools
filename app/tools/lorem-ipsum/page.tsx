"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState } from "react";

const LOREM_WORDS = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum curabitur pretium tincidunt lacus nulla gravida orci lobortis tempus donec vitae sapien ut libero venenatis faucibus nullam varius nulla facilisi cras non velit nec nisi vulputate nonummy".split(" ");

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

function randomWord(exclude?: string): string {
  let w = LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];
  if (exclude && LOREM_WORDS.length > 1) while (w === exclude) w = LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];
  return w;
}

function generateSentence(minWords = 6, maxWords = 18): string {
  const count = minWords + Math.floor(Math.random() * (maxWords - minWords + 1));
  const words: string[] = [];
  for (let i = 0; i < count; i++) words.push(randomWord(words[words.length - 1]));
  // Occasionally add a comma
  const result = words.map((w, i) => {
    if (i === 0) return capitalize(w);
    if (i > 1 && i < words.length - 1 && Math.random() < 0.15) return w + ",";
    return w;
  });
  return result.join(" ") + ".";
}

function generateParagraph(minSentences = 3, maxSentences = 6): string {
  const count = minSentences + Math.floor(Math.random() * (maxSentences - minSentences + 1));
  return Array.from({ length: count }, () => generateSentence()).join(" ");
}

function generateWords(count: number): string {
  return Array.from({ length: count }, () => randomWord()).join(" ");
}

type GenType = "paragraphs" | "sentences" | "words" | "bytes";

const FORMATS: { key: GenType; label: string; icon: string }[] = [
  { key: "paragraphs", label: "Paragraphs", icon: "¶" },
  { key: "sentences", label: "Sentences", icon: "S" },
  { key: "words", label: "Words", icon: "W" },
  { key: "bytes", label: "Bytes", icon: "B" },
];

export default function LoremIpsum() {
  const [type, setType] = useState<GenType>("paragraphs");
  const [count, setCount] = useState(3);
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [htmlMode, setHtmlMode] = useState(false);

  const generate = (t: GenType = type, c: number = count, lorem: boolean = startWithLorem, html: boolean = htmlMode) => {
    let result = "";

    if (t === "paragraphs") {
      const paras = Array.from({ length: c }, (_, i) => {
        let p = generateParagraph();
        if (i === 0 && lorem) p = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. " + p;
        return p;
      });
      result = html
        ? paras.map((p) => `<p>${p}</p>`).join("\n\n")
        : paras.join("\n\n");
    } else if (t === "sentences") {
      const sentences = Array.from({ length: c }, (_, i) => {
        if (i === 0 && lorem) return "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
        return generateSentence();
      });
      result = html
        ? `<p>${sentences.join(" ")}</p>`
        : sentences.join(" ");
    } else if (t === "words") {
      let words = generateWords(c);
      if (lorem && c >= 5) words = "lorem ipsum dolor sit amet " + words.split(" ").slice(5).join(" ");
      result = html ? `<p>${capitalize(words)}.</p>` : capitalize(words) + ".";
    } else if (t === "bytes") {
      // Generate enough text to fill bytes
      let text = "";
      while (new Blob([text]).size < c) text += generateSentence() + " ";
      text = text.slice(0, c);
      result = html ? `<p>${text}</p>` : text;
    }

    setOutput(result);
    setCopied(false);
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const wordCount = output ? output.split(/\s+/).filter(Boolean).length : 0;
  const charCount = output.length;
  const byteCount = new Blob([output]).size;

  const PRESETS: { label: string; type: GenType; count: number }[] = [
    { label: "1 para", type: "paragraphs", count: 1 },
    { label: "3 paras", type: "paragraphs", count: 3 },
    { label: "5 paras", type: "paragraphs", count: 5 },
    { label: "50 words", type: "words", count: 50 },
    { label: "100 words", type: "words", count: 100 },
    { label: "500 bytes", type: "bytes", count: 500 },
  ];

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.025) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -left-48 w-[500px] h-[500px] rounded-full bg-pink-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -right-48 w-[400px] h-[400px] rounded-full bg-violet-500/[0.04] blur-3xl pointer-events-none" />


      <ToolNavbar toolName="Lorem Ipsum Generator" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-pink-500/10 flex items-center justify-center font-serif text-pink-400 font-bold text-lg">¶</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Lorem Ipsum Generator</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-pink-500/10 text-pink-400 rounded">placeholder text</span>
          </div>
          <p className="text-slate-500 text-sm">Generate placeholder text by paragraphs, sentences, words, or bytes. HTML output supported.</p>
        </div>

        {/* Controls */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Type */}
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">Generate by</div>
              <div className="grid grid-cols-2 gap-1.5">
                {FORMATS.map((f) => (
                  <button key={f.key} onClick={() => { setType(f.key); setCount(f.key === "bytes" ? 500 : f.key === "words" ? 50 : 3); }}
                    className={`font-mono text-xs py-2 rounded border transition-all flex items-center justify-center gap-1.5 ${type === f.key ? "bg-pink-500/15 border-pink-500/40 text-pink-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                    <span className="opacity-60">{f.icon}</span> {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Count */}
            <div>
              <div className="flex justify-between mb-3">
                <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Count</div>
                <span className="font-mono text-sm text-pink-400 font-bold">{count} {type}</span>
              </div>
              <input type="range"
                min={type === "bytes" ? 100 : 1}
                max={type === "bytes" ? 5000 : type === "words" ? 500 : type === "sentences" ? 20 : 10}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full accent-pink-500 cursor-pointer mb-3"
              />
              <input type="number"
                value={count}
                onChange={(e) => setCount(Math.max(1, Number(e.target.value)))}
                className="w-full font-mono text-sm px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-slate-300 outline-none focus:border-pink-500/40 transition-colors"
              />
            </div>

            {/* Options */}
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">Options</div>
              <div className="space-y-3">
                {[
                  { label: "Start with 'Lorem ipsum...'", val: startWithLorem, set: setStartWithLorem },
                  { label: "HTML output (<p> tags)", val: htmlMode, set: setHtmlMode },
                ].map((opt) => (
                  <label key={opt.label} className="flex items-center gap-3 cursor-pointer group">
                    <div onClick={() => { opt.set(!opt.val); }} className={`w-9 h-5 rounded-full transition-all relative shrink-0 ${opt.val ? "bg-pink-500" : "bg-white/10"}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${opt.val ? "left-4" : "left-0.5"}`} />
                    </div>
                    <span className="font-mono text-xs text-slate-500 group-hover:text-slate-300">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-white/[0.06]">
            <span className="font-mono text-[11px] text-slate-600 self-center">Quick:</span>
            {PRESETS.map((p) => (
              <button key={p.label} onClick={() => { setType(p.type); setCount(p.count); }}
                className="font-mono text-[11px] px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded hover:text-pink-400 hover:border-pink-500/30 transition-all">
                {p.label}
              </button>
            ))}
          </div>

          <button onClick={() => generate(type, count, startWithLorem, htmlMode)}
            className="mt-4 w-full font-mono text-sm font-bold py-3 bg-pink-500 hover:bg-pink-400 text-white rounded-md transition-all hover:-translate-y-0.5">
            ⚡ Generate
          </button>
        </div>

        {/* Output */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-4">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Output</span>
              {output && (
                <>
                  <span className="font-mono text-[10px] text-slate-700">{wordCount} words</span>
                  <span className="font-mono text-[10px] text-slate-700">{charCount} chars</span>
                  <span className="font-mono text-[10px] text-slate-700">{byteCount} bytes</span>
                </>
              )}
            </div>
            <button onClick={handleCopy} disabled={!output}
              className={`font-mono text-[11px] px-3 py-1.5 rounded border transition-all ${copied ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"}`}>
              {copied ? "✓ Copied!" : "Copy"}
            </button>
          </div>

          <div className="p-5 min-h-[200px]">
            {!output ? (
              <div className="text-center py-12">
                <div className="text-3xl mb-3 opacity-20">¶</div>
                <p className="font-mono text-sm text-slate-700">Click Generate to create placeholder text</p>
              </div>
            ) : (
              <div className={`leading-relaxed ${htmlMode ? "font-mono text-xs text-slate-400" : "text-slate-300 text-sm"} whitespace-pre-wrap`}>
                {output}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}