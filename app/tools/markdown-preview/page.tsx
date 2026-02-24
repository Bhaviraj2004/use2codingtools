"use client";

import { useState, useMemo } from "react";

// Simple markdown parser (no external lib needed)
function parseMarkdown(md: string): string {
  let html = md;

  // Escape HTML
  html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Code blocks (``` ```)
  html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, (_, lang, code) =>
    `<pre class="code-block"><code class="language-${lang || "text"}">${code.trim()}</code></pre>`
  );

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code class=\"inline-code\">$1</code>");

  // Headers
  html = html.replace(/^###### (.+)$/gm, "<h6>$1</h6>");
  html = html.replace(/^##### (.+)$/gm, "<h5>$1</h5>");
  html = html.replace(/^#### (.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Blockquote
  html = html.replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>");

  // HR
  html = html.replace(/^---$/gm, "<hr />");
  html = html.replace(/^\*\*\*$/gm, "<hr />");

  // Bold + Italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/_(.+?)_/g, "<em>$1</em>");

  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");

  // Images (before links)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="md-img" />');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="md-link">$1</a>');

  // Unordered lists
  html = html.replace(/^(\s*[-*+] .+\n?)+/gm, (match) => {
    const items = match.trim().split("\n").map((line) => {
      const content = line.replace(/^\s*[-*+] /, "");
      return `<li>${content}</li>`;
    });
    return `<ul>${items.join("")}</ul>`;
  });

  // Ordered lists
  html = html.replace(/^(\s*\d+\. .+\n?)+/gm, (match) => {
    const items = match.trim().split("\n").map((line) => {
      const content = line.replace(/^\s*\d+\. /, "");
      return `<li>${content}</li>`;
    });
    return `<ol>${items.join("")}</ol>`;
  });

  // Tables
  html = html.replace(/^\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)+)/gm, (_, header, body) => {
    const headers = header.split("|").map((h: string) => h.trim()).filter(Boolean);
    const rows = body.trim().split("\n").map((row: string) => {
      const cells = row.split("|").map((c: string) => c.trim()).filter(Boolean);
      return `<tr>${cells.map((c: string) => `<td>${c}</td>`).join("")}</tr>`;
    });
    return `<table><thead><tr>${headers.map((h: string) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table>`;
  });

  // Paragraphs (wrap lines that aren't already tagged)
  html = html.replace(/^(?!<[a-z]|$)(.+)$/gm, "<p>$1</p>");

  // Clean up extra newlines
  html = html.replace(/\n{3,}/g, "\n\n");

  return html;
}

const DEFAULT_MD = `# Hello, Markdown! 👋

Welcome to the **Markdown Preview** tool. This is a *live* renderer — type on the left and see the result on the right.

---

## Features

- ✅ Headers (H1–H6)
- ✅ **Bold**, *italic*, ~~strikethrough~~
- ✅ \`inline code\` and code blocks
- ✅ Links and images
- ✅ Lists (ordered & unordered)
- ✅ Tables
- ✅ Blockquotes
- ✅ Horizontal rules

---

## Code Example

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("World"));
\`\`\`

---

## Table

| Tool | Category | Status |
|------|----------|--------|
| JSON Formatter | Data | ✅ Done |
| UUID Generator | Security | ✅ Done |
| Markdown Preview | Dev Utils | ✅ Live |

---

## Blockquote

> The best developer tools are the ones you don't have to think about.

---

## Links

Check out [use2codingtools](https://use2codingtools.com) for more tools.
`;

export default function MarkdownPreview() {
  const [input, setInput] = useState(DEFAULT_MD);
  const [view, setView] = useState<"split" | "edit" | "preview">("split");
  const [copied, setCopied] = useState(false);
  const [copyHtml, setCopyHtml] = useState(false);

  const rendered = useMemo(() => parseMarkdown(input), [input]);

  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0;
  const lineCount = input.split("\n").length;

  const handleCopy = () => {
    navigator.clipboard.writeText(copyHtml ? rendered : input);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans flex flex-col">
      <style>{`
        .md-preview h1 { font-size: 1.9rem; font-weight: 800; color: #f1f5f9; margin: 1.2rem 0 0.6rem; letter-spacing: -0.5px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.4rem; }
        .md-preview h2 { font-size: 1.4rem; font-weight: 700; color: #e2e8f0; margin: 1.1rem 0 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 0.3rem; }
        .md-preview h3 { font-size: 1.15rem; font-weight: 600; color: #cbd5e1; margin: 1rem 0 0.4rem; }
        .md-preview h4,h5,h6 { font-size: 1rem; font-weight: 600; color: #94a3b8; margin: 0.8rem 0 0.3rem; }
        .md-preview p { color: #94a3b8; line-height: 1.75; margin: 0.5rem 0; }
        .md-preview strong { color: #e2e8f0; font-weight: 700; }
        .md-preview em { color: #a5b4fc; font-style: italic; }
        .md-preview del { color: #64748b; text-decoration: line-through; }
        .md-preview ul { list-style: disc; padding-left: 1.5rem; margin: 0.5rem 0; color: #94a3b8; }
        .md-preview ol { list-style: decimal; padding-left: 1.5rem; margin: 0.5rem 0; color: #94a3b8; }
        .md-preview li { margin: 0.2rem 0; line-height: 1.65; }
        .md-preview .inline-code { font-family: 'Space Mono', monospace; font-size: 0.8rem; background: rgba(0,255,136,0.08); color: #6ee7b7; border: 1px solid rgba(0,255,136,0.15); border-radius: 3px; padding: 0.1em 0.4em; }
        .md-preview .code-block { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 1rem 1.2rem; margin: 0.8rem 0; overflow-x: auto; }
        .md-preview .code-block code { font-family: 'Space Mono', monospace; font-size: 0.78rem; color: #86efac; line-height: 1.65; }
        .md-preview blockquote { border-left: 3px solid #7c3aed; background: rgba(124,58,237,0.06); padding: 0.6rem 1rem; margin: 0.8rem 0; border-radius: 0 6px 6px 0; color: #a78bfa; font-style: italic; }
        .md-preview hr { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 1.2rem 0; }
        .md-preview table { width: 100%; border-collapse: collapse; margin: 0.8rem 0; font-size: 0.85rem; }
        .md-preview th { background: rgba(255,255,255,0.05); color: #e2e8f0; font-weight: 600; text-align: left; padding: 0.5rem 0.75rem; border: 1px solid rgba(255,255,255,0.08); }
        .md-preview td { color: #94a3b8; padding: 0.45rem 0.75rem; border: 1px solid rgba(255,255,255,0.06); }
        .md-preview tr:hover td { background: rgba(255,255,255,0.02); }
        .md-preview .md-link { color: #34d399; text-decoration: underline; text-underline-offset: 2px; }
        .md-preview .md-link:hover { color: #6ee7b7; }
        .md-preview .md-img { max-width: 100%; border-radius: 8px; margin: 0.5rem 0; }
      `}</style>

      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#09090f]/80 backdrop-blur-xl">
        <div className="max-w-full px-6 py-3 flex items-center gap-4">
          <a href="/" className="font-mono text-sm font-bold text-emerald-400 tracking-tight">use2<span className="text-slate-500">coding</span>tools</a>
          <span className="text-white/10">/</span>
          <span className="font-mono text-sm text-slate-400">Markdown Preview</span>

          <div className="ml-auto flex items-center gap-3">
            {/* View toggle */}
            <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-md p-0.5 gap-0.5">
              {(["edit", "split", "preview"] as const).map((v) => (
                <button key={v} onClick={() => setView(v)}
                  className={`font-mono text-[11px] px-3 py-1.5 rounded capitalize transition-all ${view === v ? "bg-emerald-500/20 text-emerald-400" : "text-slate-500 hover:text-slate-300"}`}>
                  {v === "split" ? "⇔ Split" : v === "edit" ? "✏ Edit" : "👁 Preview"}
                </button>
              ))}
            </div>

            {/* Copy toggle */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <div onClick={() => setCopyHtml(!copyHtml)} className={`w-7 h-4 rounded-full transition-all relative ${copyHtml ? "bg-emerald-500" : "bg-white/10"}`}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${copyHtml ? "left-3" : "left-0.5"}`} />
                </div>
                <span className="font-mono text-[10px] text-slate-600">HTML</span>
              </label>
              <button onClick={handleCopy}
                className={`font-mono text-[11px] px-3 py-1.5 rounded border transition-all ${copied ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                {copied ? "✓ Copied!" : `Copy ${copyHtml ? "HTML" : "MD"}`}
              </button>
            </div>

            {/* Stats */}
            <div className="hidden md:flex items-center gap-3 font-mono text-[10px] text-slate-700">
              <span>{wordCount} words</span>
              <span>{lineCount} lines</span>
              <span>{input.length} chars</span>
            </div>

            <button onClick={() => setInput("")} className="font-mono text-[11px] text-slate-600 hover:text-red-400 transition-colors">Clear</button>
          </div>
        </div>
      </nav>

      {/* Editor area */}
      <div className="flex-1 flex overflow-hidden" style={{ height: "calc(100vh - 57px)" }}>

        {/* Editor pane */}
        {(view === "edit" || view === "split") && (
          <div className={`flex flex-col ${view === "split" ? "w-1/2 border-r border-white/[0.06]" : "w-full"}`}>
            <div className="px-4 py-2 border-b border-white/[0.06] flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-700">Markdown</span>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
              placeholder="# Start writing Markdown..."
              className="flex-1 w-full font-mono text-sm bg-transparent text-slate-300 placeholder-slate-800 outline-none resize-none p-5 leading-relaxed"
            />
          </div>
        )}

        {/* Preview pane */}
        {(view === "preview" || view === "split") && (
          <div className={`flex flex-col ${view === "split" ? "w-1/2" : "w-full"} overflow-hidden`}>
            <div className="px-4 py-2 border-b border-white/[0.06] flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-700">Preview</span>
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="flex-1 overflow-y-auto p-6 md-preview"
              dangerouslySetInnerHTML={{ __html: rendered }} />
          </div>
        )}
      </div>
    </main>
  );
}