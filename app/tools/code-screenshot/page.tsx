"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ── Themes ────────────────────────────────────────────────────
const THEMES = {
  "One Dark":    { bg: "#282c34", panel: "#21252b", text: "#abb2bf", keyword: "#c678dd", string: "#98c379", comment: "#5c6370", number: "#d19a66", fn: "#61afef", operator: "#56b6c2", tag: "#e06c75" },
  "Dracula":     { bg: "#282a36", panel: "#1e1f29", text: "#f8f8f2", keyword: "#ff79c6", string: "#f1fa8c", comment: "#6272a4", number: "#bd93f9", fn: "#50fa7b", operator: "#ff79c6", tag: "#ff5555" },
  "GitHub Dark": { bg: "#0d1117", panel: "#161b22", text: "#c9d1d9", keyword: "#ff7b72", string: "#a5d6ff", comment: "#8b949e", number: "#79c0ff", fn: "#d2a8ff", operator: "#79c0ff", tag: "#7ee787" },
  "Monokai":     { bg: "#272822", panel: "#1e1f1c", text: "#f8f8f2", keyword: "#f92672", string: "#e6db74", comment: "#75715e", number: "#ae81ff", fn: "#a6e22e", operator: "#f92672", tag: "#66d9ef" },
  "Night Owl":   { bg: "#011627", panel: "#01121f", text: "#d6deeb", keyword: "#c792ea", string: "#addb67", comment: "#637777", number: "#f78c6c", fn: "#82aaff", operator: "#c792ea", tag: "#ef5350" },
  "Solarized":   { bg: "#002b36", panel: "#073642", text: "#839496", keyword: "#859900", string: "#2aa198", comment: "#586e75", number: "#d33682", fn: "#268bd2", operator: "#cb4b16", tag: "#dc322f" },
  "Tokyo Night": { bg: "#1a1b2e", panel: "#16213e", text: "#c0caf5", keyword: "#bb9af7", string: "#9ece6a", comment: "#565f89", number: "#ff9e64", fn: "#7aa2f7", operator: "#89ddff", tag: "#f7768e" },
  "Catppuccin":  { bg: "#1e1e2e", panel: "#181825", text: "#cdd6f4", keyword: "#cba6f7", string: "#a6e3a1", comment: "#6c7086", number: "#fab387", fn: "#89b4fa", operator: "#89dceb", tag: "#f38ba8" },
};

const GRADIENTS = [
  { label: "None",     value: "transparent", class: "bg-transparent border border-white/10" },
  { label: "Sunset",   value: "linear-gradient(135deg,#f97316,#ec4899,#8b5cf6)", class: "bg-gradient-to-br from-orange-500 via-pink-500 to-violet-500" },
  { label: "Ocean",    value: "linear-gradient(135deg,#0ea5e9,#6366f1)", class: "bg-gradient-to-br from-sky-500 to-indigo-500" },
  { label: "Forest",   value: "linear-gradient(135deg,#22c55e,#06b6d4)", class: "bg-gradient-to-br from-green-500 to-cyan-500" },
  { label: "Candy",    value: "linear-gradient(135deg,#f472b6,#818cf8)", class: "bg-gradient-to-br from-pink-400 to-indigo-400" },
  { label: "Noir",     value: "linear-gradient(135deg,#1e293b,#0f172a)", class: "bg-gradient-to-br from-slate-800 to-slate-950" },
  { label: "Lava",     value: "linear-gradient(135deg,#ef4444,#f97316)", class: "bg-gradient-to-br from-red-500 to-orange-500" },
  { label: "Aurora",   value: "linear-gradient(135deg,#34d399,#818cf8,#f472b6)", class: "bg-gradient-to-br from-emerald-400 via-indigo-400 to-pink-400" },
];

const FONT_SIZES = [12, 13, 14, 15, 16, 18, 20];
const PADDING_SIZES = [16, 24, 32, 48, 64];

const LANGUAGES = ["JavaScript","TypeScript","Python","JSX/TSX","Go","Rust","CSS","HTML","Bash","SQL","JSON","Other"];

// ── Simple tokenizer ──────────────────────────────────────────
function tokenize(code: string, theme: typeof THEMES["One Dark"]) {
  const lines = code.split("\n");

  const KW_JS   = /\b(const|let|var|function|return|if|else|for|while|do|class|extends|import|export|default|from|async|await|try|catch|throw|new|typeof|instanceof|in|of|break|continue|switch|case|this|super|static|get|set|true|false|null|undefined|void|delete)\b/g;
  const KW_PY   = /\b(def|class|return|if|elif|else|for|while|import|from|as|try|except|raise|with|lambda|and|or|not|in|is|True|False|None|pass|break|continue|yield|async|await|print)\b/g;
  const KW_GO   = /\b(func|return|if|else|for|range|package|import|type|struct|interface|var|const|map|chan|go|defer|select|case|default|break|continue|switch|make|len|cap|append|nil|true|false)\b/g;
  const KW_RUST = /\b(fn|let|mut|return|if|else|for|while|loop|match|use|mod|pub|struct|enum|impl|trait|where|type|const|static|async|await|move|ref|in|as|true|false|self|Self|super|crate)\b/g;
  const STR     = /(["'`])(?:(?!\1)[^\\]|\\.)*?\1/g;
  const COMMENT = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)/g;
  const NUM     = /\b(\d+\.?\d*)\b/g;

  return lines.map((line) => {
    // Build spans
    type Span = { start: number; end: number; color: string };
    const spans: Span[] = [];

    const addSpans = (re: RegExp, color: string) => {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(line)) !== null) {
        spans.push({ start: m.index, end: m.index + m[0].length, color });
      }
    };

    addSpans(COMMENT, theme.comment);
    addSpans(STR,     theme.string);
    addSpans(NUM,     theme.number);
    addSpans(KW_JS,   theme.keyword);
    addSpans(KW_PY,   theme.keyword);
    addSpans(KW_GO,   theme.keyword);
    addSpans(KW_RUST, theme.keyword);

    // Sort by start, resolve overlaps
    spans.sort((a, b) => a.start - b.start);
    const merged: Span[] = [];
    let cursor = 0;
    for (const span of spans) {
      if (span.start < cursor) continue;
      merged.push(span);
      cursor = span.end;
    }

    // Build output
    const parts: { text: string; color: string }[] = [];
    let pos = 0;
    for (const span of merged) {
      if (span.start > pos) parts.push({ text: line.slice(pos, span.start), color: theme.text });
      parts.push({ text: line.slice(span.start, span.end), color: span.color });
      pos = span.end;
    }
    if (pos < line.length) parts.push({ text: line.slice(pos), color: theme.text });
    if (parts.length === 0) parts.push({ text: line, color: theme.text });

    return parts;
  });
}

const EXAMPLE_CODE = `async function fetchUser(id: string) {
  try {
    const response = await fetch(\`/api/users/\${id}\`);
    
    if (!response.ok) {
      throw new Error(\`HTTP \${response.status}\`);
    }
    
    const user = await response.json();
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: new Date(user.created_at),
    };
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return null;
  }
}`;

export default function CodeScreenshot() {
  const [code, setCode]           = useState(EXAMPLE_CODE);
  const [theme, setTheme]         = useState("One Dark");
  const [gradient, setGradient]   = useState(GRADIENTS[1]);
  const [fontSize, setFontSize]   = useState(14);
  const [padding, setPadding]     = useState(48);
  const [language, setLanguage]   = useState("TypeScript");
  const [showLines, setShowLines] = useState(true);
  const [showDots, setShowDots]   = useState(true);
  const [title, setTitle]         = useState("index.ts");
  const [watermark, setWatermark] = useState(true);
  const [shadow, setShadow]       = useState(true);
  const [copied, setCopied]       = useState(false);
  const [downloading, setDownloading] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const currentTheme = THEMES[theme as keyof typeof THEMES];
  const tokens = tokenize(code, currentTheme);
  const lines = code.split("\n");

  const downloadImage = useCallback(async () => {
    if (!previewRef.current) return;
    setDownloading(true);
    try {
      // Use html-to-image via CDN — since no network, we'll use canvas approach
      const el = previewRef.current;
      const { default: domtoimage } = await import("dom-to-image-more" as string).catch(() => ({ default: null }));

      if (domtoimage) {
        const blob = await domtoimage.toBlob(el, { scale: 2 });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = "code.png"; a.click();
        URL.revokeObjectURL(url);
      } else {
        // Fallback: copy SVG representation
        alert("Download requires the dom-to-image-more package.\nInstall: npm install dom-to-image-more");
      }
    } catch {
      alert("Install dom-to-image-more for image export:\nnpm install dom-to-image-more");
    } finally {
      setDownloading(false);
    }
  }, []);

  const copyCSS = () => {
    const css = `background: ${gradient.value}; padding: ${padding}px; border-radius: 16px;`;
    navigator.clipboard.writeText(css);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-violet-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-pink-500/[0.04] blur-3xl pointer-events-none" />

      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#09090f]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <a href="/" className="font-mono text-sm font-bold text-emerald-400">use2<span className="text-slate-500">coding</span>tools</a>
          <span className="text-white/10">/</span>
          <span className="font-mono text-sm text-slate-400">Code Screenshot</span>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-violet-500/10 flex items-center justify-center text-lg">📸</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Code Screenshot</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded">8 themes</span>
          </div>
          <p className="text-slate-500 text-sm">Turn your code into a beautiful, shareable image. Pick a theme, gradient background, and font size — then export.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Controls — left */}
          <div className="xl:col-span-1 flex flex-col gap-5">

            {/* Code input */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">Code</div>
              <div className="flex gap-2 mb-2">
                <input value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="filename.ts"
                  className="flex-1 font-mono text-xs px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded text-slate-300 outline-none focus:border-violet-500/30" />
                <select value={language} onChange={(e) => setLanguage(e.target.value)}
                  className="font-mono text-xs px-2 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded text-slate-400 outline-none">
                  {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
              <textarea value={code} onChange={(e) => setCode(e.target.value)}
                spellCheck={false} rows={12}
                className="w-full font-mono text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg p-3 text-slate-300 placeholder-slate-700 outline-none focus:border-violet-500/30 resize-none leading-relaxed" />
            </div>

            {/* Theme */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">Theme</div>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(THEMES).map(([name, t]) => (
                  <button key={name} onClick={() => setTheme(name)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all ${theme === name ? "border-violet-500/40 bg-violet-500/10" : "border-white/[0.06] hover:border-white/[0.14]"}`}>
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: t.keyword }} />
                    <span className={`font-mono text-[11px] ${theme === name ? "text-violet-400" : "text-slate-500"}`}>{name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Background */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">Background</div>
              <div className="grid grid-cols-4 gap-1.5">
                {GRADIENTS.map((g) => (
                  <button key={g.label} onClick={() => setGradient(g)} title={g.label}
                    className={`h-10 rounded-lg border-2 transition-all ${g.class} ${gradient.label === g.label ? "border-white/60 scale-105" : "border-transparent hover:border-white/20"}`} />
                ))}
              </div>
              <div className="font-mono text-[10px] text-slate-700 mt-2 text-center">{gradient.label}</div>
            </div>

            {/* Options */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">Options</div>

              {/* Font size */}
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs text-slate-500">Font size</span>
                <div className="flex gap-1">
                  {FONT_SIZES.map((s) => (
                    <button key={s} onClick={() => setFontSize(s)}
                      className={`font-mono text-[10px] px-2 py-1 rounded border transition-all ${fontSize === s ? "bg-violet-500/20 border-violet-500/30 text-violet-400" : "border-white/[0.08] text-slate-600 hover:text-slate-300"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Padding */}
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs text-slate-500">Padding</span>
                <div className="flex gap-1">
                  {PADDING_SIZES.map((s) => (
                    <button key={s} onClick={() => setPadding(s)}
                      className={`font-mono text-[10px] px-2 py-1 rounded border transition-all ${padding === s ? "bg-violet-500/20 border-violet-500/30 text-violet-400" : "border-white/[0.08] text-slate-600 hover:text-slate-300"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              {[
                { label: "Line numbers", val: showLines, set: setShowLines },
                { label: "Window dots",  val: showDots,  set: setShowDots  },
                { label: "Drop shadow",  val: shadow,    set: setShadow    },
                { label: "Watermark",    val: watermark, set: setWatermark },
              ].map(({ label, val, set }) => (
                <label key={label} onClick={() => set(!val)} className="flex items-center justify-between mb-2 cursor-pointer">
                  <span className="font-mono text-xs text-slate-500">{label}</span>
                  <div className={`w-8 h-4 rounded-full relative transition-all ${val ? "bg-violet-500" : "bg-white/10"}`}>
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${val ? "left-4" : "left-0.5"}`} />
                  </div>
                </label>
              ))}
            </div>

            {/* Export */}
            <div className="flex gap-2">
              <button onClick={downloadImage} disabled={downloading}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 text-violet-400 font-mono text-sm rounded-xl transition-all disabled:opacity-50">
                {downloading ? "⏳ Exporting..." : "📸 Download PNG"}
              </button>
              <button onClick={copyCSS} title="Copy CSS"
                className={`px-4 py-3 border rounded-xl font-mono text-sm transition-all ${copied ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                {copied ? "✓" : "CSS"}
              </button>
            </div>
          </div>

          {/* Preview — right */}
          <div className="xl:col-span-2">
            <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">Preview</div>

            {/* Canvas wrapper */}
            <div className="w-full min-h-[500px] flex items-center justify-center bg-[#111] rounded-2xl border border-white/[0.06] p-8 overflow-auto">
              {/* This is the actual exportable element */}
              <div ref={previewRef}
                style={{ padding, background: gradient.value, borderRadius: 16, display: "inline-block" }}>

                {/* Code window */}
                <div style={{
                  background: currentTheme.bg,
                  borderRadius: 12,
                  overflow: "hidden",
                  minWidth: 400,
                  maxWidth: 700,
                  boxShadow: shadow ? "0 32px 64px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.4)" : "none",
                }}>
                  {/* Title bar */}
                  <div style={{ background: currentTheme.panel, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
                    {showDots && (
                      <div style={{ display: "flex", gap: 6 }}>
                        {["#ff5f57","#ffbd2e","#28ca41"].map((c) => (
                          <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
                        ))}
                      </div>
                    )}
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <span style={{ fontFamily: "monospace", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{title}</span>
                    </div>
                    {showDots && <div style={{ width: 42 }} />}
                  </div>

                  {/* Code body */}
                  <div style={{ padding: "20px 0", overflowX: "auto" }}>
                    {tokens.map((lineTokens, li) => (
                      <div key={li} style={{ display: "flex", minHeight: fontSize * 1.7, alignItems: "baseline" }}>
                        {showLines && (
                          <div style={{
                            fontFamily: "monospace", fontSize, lineHeight: 1.7,
                            color: "rgba(255,255,255,0.2)", textAlign: "right",
                            minWidth: 40, paddingRight: 16, userSelect: "none",
                          }}>
                            {li + 1}
                          </div>
                        )}
                        <div style={{ paddingLeft: showLines ? 0 : 20, paddingRight: 20, fontFamily: "monospace", fontSize, lineHeight: 1.7 }}>
                          {lineTokens.length === 0 || (lineTokens.length === 1 && lineTokens[0].text === "")
                            ? <span>&nbsp;</span>
                            : lineTokens.map((tok, ti) => (
                                <span key={ti} style={{ color: tok.color }}>{tok.text || " "}</span>
                              ))
                          }
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Watermark */}
                  {watermark && (
                    <div style={{ padding: "8px 16px", borderTop: `1px solid rgba(255,255,255,0.06)`, textAlign: "right" }}>
                      <span style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
                        use2codingtools.com
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats bar */}
            <div className="flex gap-4 mt-3 px-2">
              {[
                { label: "Lines",    val: lines.length },
                { label: "Chars",    val: code.length  },
                { label: "Theme",    val: theme        },
                { label: "Font",     val: `${fontSize}px` },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-slate-700">{s.label}</span>
                  <span className="font-mono text-[10px] text-slate-500">{s.val}</span>
                </div>
              ))}
            </div>

            {/* Install hint */}
            <div className="mt-4 px-4 py-3 bg-yellow-500/[0.06] border border-yellow-500/20 rounded-lg">
              <p className="font-mono text-xs text-yellow-600">
                💡 For PNG export, install: <code className="text-yellow-400">npm install dom-to-image-more</code>
              </p>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-6">
          {[
            { icon: "🎨", title: "8 Themes",         desc: "One Dark, Dracula, GitHub, Monokai, Night Owl, Solarized, Tokyo Night, Catppuccin." },
            { icon: "🌈", title: "8 Backgrounds",    desc: "Transparent or gradient backgrounds — Sunset, Ocean, Aurora, Lava and more." },
            { icon: "✨", title: "Syntax Highlight",  desc: "Auto-highlights keywords, strings, numbers, and comments across major languages." },
            { icon: "📸", title: "PNG Export",        desc: "Export high-res 2x screenshot. Requires dom-to-image-more package." },
          ].map((c) => (
            <div key={c.title} className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-4 py-4">
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