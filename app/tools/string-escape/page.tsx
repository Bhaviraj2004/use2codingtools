"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useMemo } from "react";

type Language = "javascript" | "json" | "python" | "html" | "url" | "regex" | "sql" | "csv";
type EscapeMode = "escape" | "unescape";

const LANG_META: Record<Language, { label: string; color: string; tag: string }> = {
  javascript: { label: "JavaScript", color: "text-yellow-400",  tag: "bg-yellow-500/10  border-yellow-500/20"  },
  json:       { label: "JSON",       color: "text-emerald-400", tag: "bg-emerald-500/10 border-emerald-500/20" },
  python:     { label: "Python",     color: "text-blue-400",    tag: "bg-blue-500/10    border-blue-500/20"    },
  html:       { label: "HTML",       color: "text-orange-400",  tag: "bg-orange-500/10  border-orange-500/20"  },
  url:        { label: "URL",        color: "text-cyan-400",    tag: "bg-cyan-500/10    border-cyan-500/20"    },
  regex:      { label: "Regex",      color: "text-pink-400",    tag: "bg-pink-500/10    border-pink-500/20"    },
  sql:        { label: "SQL",        color: "text-violet-400",  tag: "bg-violet-500/10  border-violet-500/20"  },
  csv:        { label: "CSV",        color: "text-teal-400",    tag: "bg-teal-500/10    border-teal-500/20"    },
};

// ── Escape/Unescape functions ─────────────────────────────────
const ESCAPE: Record<Language, (s: string) => string> = {
  javascript: (s) => s.replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/'/g,"\\'").replace(/\n/g,"\\n").replace(/\r/g,"\\r").replace(/\t/g,"\\t").replace(/\0/g,"\\0").replace(/[\u0080-\uFFFF]/g,(c)=>`\\u${c.charCodeAt(0).toString(16).padStart(4,"0")}`),
  json:       (s) => { try { return JSON.stringify(s); } catch { return s; } },
  python:     (s) => s.replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/"/g,'\\"').replace(/\n/g,"\\n").replace(/\r/g,"\\r").replace(/\t/g,"\\t"),
  html:       (s) => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),
  url:        (s) => { try { return encodeURIComponent(s); } catch { return s; } },
  regex:      (s) => s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),
  sql:        (s) => s.replace(/'/g,"''").replace(/\\/g,"\\\\").replace(/\0/g,"\\0"),
  csv:        (s) => /[,"\n\r]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s,
};

const UNESCAPE: Record<Language, (s: string) => string> = {
  javascript: (s) => s.replace(/\\u([0-9a-fA-F]{4})/g,(_,h)=>String.fromCharCode(parseInt(h,16))).replace(/\\x([0-9a-fA-F]{2})/g,(_,h)=>String.fromCharCode(parseInt(h,16))).replace(/\\n/g,"\n").replace(/\\r/g,"\r").replace(/\\t/g,"\t").replace(/\\'/g,"'").replace(/\\"/g,'"').replace(/\\\\/g,"\\"),
  json:       (s) => { try { const t=s.trim(); return JSON.parse(t.startsWith('"')?t:`"${t}"`); } catch { return s; } },
  python:     (s) => s.replace(/\\x([0-9a-fA-F]{2})/g,(_,h)=>String.fromCharCode(parseInt(h,16))).replace(/\\n/g,"\n").replace(/\\r/g,"\r").replace(/\\t/g,"\t").replace(/\\'/g,"'").replace(/\\"/g,'"').replace(/\\\\/g,"\\"),
  html:       (s) => s.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,"\u00A0").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(parseInt(n))).replace(/&#x([0-9a-f]+);/gi,(_,h)=>String.fromCodePoint(parseInt(h,16))),
  url:        (s) => { try { return decodeURIComponent(s.replace(/\+/g," ")); } catch { return s; } },
  regex:      (s) => s.replace(/\\([.*+?^${}()|[\]\\])/g,"$1"),
  sql:        (s) => s.replace(/''/g,"'").replace(/\\\\/g,"\\").replace(/\\0/g,"\0"),
  csv:        (s) => s.startsWith('"')&&s.endsWith('"') ? s.slice(1,-1).replace(/""/g,'"') : s,
};

const EXAMPLES: Record<Language, string> = {
  javascript: `Hello "World"\nNew line here\tTabbed\nPath: C:\\Users\\rohan`,
  json:       `{"name":"Rohan","message":"He said \"hello\"\nNew line"}`,
  python:     `print('It\'s a "test"\nNew line\tTabbed')`,
  html:       `<div class="hello">5 > 3 & 2 < 4 © 2024</div>`,
  url:        `https://example.com/search?q=hello world&name=Rohan Sharma`,
  regex:      `Match price: $10.99 (or $20+)`,
  sql:        `It's a test with O'Brien's "quotes"`,
  csv:        `John "Johnny" Doe,Engineer,"Mumbai, India",28`,
};

const REFERENCE: Record<Language, { raw: string; escaped: string; desc: string }[]> = {
  javascript: [
    { raw: "newline",    escaped: "\\n",     desc: "Newline"        },
    { raw: "tab",        escaped: "\\t",     desc: "Tab"            },
    { raw: "\\r",        escaped: "\\r",     desc: "Carriage return"},
    { raw: '"',          escaped: '\\"',     desc: "Double quote"   },
    { raw: "'",          escaped: "\\'",     desc: "Single quote"   },
    { raw: "\\",         escaped: "\\\\",    desc: "Backslash"      },
    { raw: "null",       escaped: "\\0",     desc: "Null char"      },
    { raw: "ñ",          escaped: "\\u00F1", desc: "Unicode char"   },
  ],
  json: [
    { raw: '"',     escaped: '\\"',  desc: "Double quote"    },
    { raw: "\\",    escaped: "\\\\", desc: "Backslash"       },
    { raw: "newline",escaped: "\\n", desc: "Newline"         },
    { raw: "tab",   escaped: "\\t",  desc: "Tab"             },
    { raw: "\\r",   escaped: "\\r",  desc: "Carriage return" },
  ],
  python: [
    { raw: "'",  escaped: "\\'",  desc: "Single quote" },
    { raw: '"',  escaped: '\\"',  desc: "Double quote" },
    { raw: "newline", escaped: "\\n", desc: "Newline"  },
    { raw: "tab",     escaped: "\\t", desc: "Tab"      },
    { raw: "\\", escaped: "\\\\", desc: "Backslash"    },
  ],
  html: [
    { raw: "&", escaped: "&amp;",  desc: "Ampersand"    },
    { raw: "<", escaped: "&lt;",   desc: "Less than"    },
    { raw: ">", escaped: "&gt;",   desc: "Greater than" },
    { raw: '"', escaped: "&quot;", desc: "Double quote" },
    { raw: "'", escaped: "&#39;",  desc: "Single quote" },
  ],
  url: [
    { raw: " ",  escaped: "%20", desc: "Space"         },
    { raw: "&",  escaped: "%26", desc: "Ampersand"     },
    { raw: "=",  escaped: "%3D", desc: "Equals"        },
    { raw: "+",  escaped: "%2B", desc: "Plus"          },
    { raw: "#",  escaped: "%23", desc: "Hash"          },
    { raw: "?",  escaped: "%3F", desc: "Question mark" },
    { raw: "/",  escaped: "%2F", desc: "Slash"         },
  ],
  regex: [
    { raw: ".", escaped: "\\.",  desc: "Dot (any char)"   },
    { raw: "*", escaped: "\\*",  desc: "Asterisk"         },
    { raw: "+", escaped: "\\+",  desc: "Plus"             },
    { raw: "?", escaped: "\\?",  desc: "Question mark"    },
    { raw: "(", escaped: "\\(",  desc: "Open paren"       },
    { raw: ")", escaped: "\\)",  desc: "Close paren"      },
    { raw: "[", escaped: "\\[",  desc: "Open bracket"     },
    { raw: "$", escaped: "\\$",  desc: "Dollar / end"     },
    { raw: "^", escaped: "\\^",  desc: "Caret / start"    },
    { raw: "|", escaped: "\\|",  desc: "Pipe / alternation"},
  ],
  sql: [
    { raw: "'",  escaped: "''",   desc: "Single quote (ANSI)" },
    { raw: "\\", escaped: "\\\\", desc: "Backslash (MySQL)"   },
    { raw: "\0", escaped: "\\0",  desc: "Null byte"           },
  ],
  csv: [
    { raw: '"',    escaped: '""',        desc: "Double quote"      },
    { raw: ",",    escaped: '"value,"',  desc: "Comma → wrap field"},
    { raw: "newline", escaped: '"val\\n"', desc: "Newline → wrap field" },
  ],
};

export default function StringEscape() {
  const [lang, setLang]     = useState<Language>("javascript");
  const [mode, setMode]     = useState<EscapeMode>("escape");
  const [input, setInput]   = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const output = useMemo(() => {
    if (!input) return "";
    try { return mode === "escape" ? ESCAPE[lang](input) : UNESCAPE[lang](input); }
    catch { return "Error processing input"; }
  }, [input, lang, mode]);

  const copy = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const swap = () => {
    if (!output) return;
    setInput(output);
    setMode(mode === "escape" ? "unescape" : "escape");
  };

  const meta = LANG_META[lang];

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-yellow-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-violet-500/[0.04] blur-3xl pointer-events-none" />

      {/* NAV */}
               <ToolNavbar toolName="String Escape" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-yellow-500/10 flex items-center justify-center font-mono font-bold text-yellow-400 text-xl">\</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">String Escape / Unescape</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded">8 languages</span>
          </div>
          <p className="text-slate-500 text-sm">Escape or unescape strings for JavaScript, JSON, Python, HTML, URL, Regex, SQL, and CSV.</p>
        </div>

        {/* Language selector */}
        <div className="flex flex-wrap gap-2 mb-5">
          <span className="font-mono text-[11px] text-slate-600 self-center uppercase tracking-wider">Language:</span>
          {(Object.keys(LANG_META) as Language[]).map((l) => (
            <button key={l} onClick={() => { setLang(l); setInput(""); }}
              className={`font-mono text-xs px-3 py-1.5 rounded border transition-all ${lang === l ? `${LANG_META[l].tag} font-bold` : "border-white/[0.08] text-slate-600 hover:text-slate-300"}`}>
              {LANG_META[l].label}
            </button>
          ))}
        </div>

        {/* Mode + actions */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-lg p-1 gap-1">
            {(["escape","unescape"] as EscapeMode[]).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`font-mono text-xs px-6 py-2 rounded-md transition-all ${mode === m ? `${meta.tag} font-bold` : "text-slate-500 hover:text-slate-300"}`}>
                {m === "escape" ? "⬆ Escape" : "⬇ Unescape"}
              </button>
            ))}
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={() => setInput(EXAMPLES[lang])}
              className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-slate-300 transition-all">
              Load Example
            </button>
            <button onClick={() => setInput("")}
              className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-red-400 transition-all">
              Clear
            </button>
          </div>
        </div>

        {/* Editors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">
                {mode === "escape" ? "Raw Input" : "Escaped Input"}
              </span>
              <span className="font-mono text-[10px] text-slate-700">{input.length} chars</span>
            </div>
            <textarea value={input} onChange={(e) => setInput(e.target.value)}
              placeholder={mode === "escape" ? "Type or paste raw string..." : "Paste escaped string..."}
              spellCheck={false} rows={13}
              className="w-full font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 text-slate-300 placeholder-slate-700 outline-none focus:border-yellow-500/30 resize-none transition-colors leading-relaxed" />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">
                {mode === "escape" ? "Escaped Output" : "Unescaped Output"}
              </span>
              <div className="flex gap-2">
                <button onClick={swap} disabled={!output}
                  className="font-mono text-[11px] px-2.5 rounded border border-white/[0.08] text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-all">
                  ⇄ Swap
                </button>
                <button onClick={() => copy("out", output)} disabled={!output}
                  className={`font-mono text-[11px] px-3 rounded border transition-all ${copied === "out" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300 disabled:opacity-30"}`}>
                  {copied === "out" ? "✓ Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <div className="h-[330px] font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 overflow-auto leading-relaxed">
              {!output && <span className="text-slate-700">Output appears here as you type...</span>}
              {output && <pre className={`text-xs whitespace-pre-wrap break-all ${meta.color}`}>{output}</pre>}
            </div>
          </div>
        </div>

        {/* Stats */}
        {output && (
          <div className={`flex flex-wrap gap-6 px-4 py-3 border rounded-lg mb-5 ${meta.tag}`}>
            {[
              { label: "Input",  val: `${input.length} chars`  },
              { label: "Output", val: `${output.length} chars` },
              { label: "Delta",  val: `${output.length > input.length ? "+" : ""}${output.length - input.length} chars` },
              { label: "Language", val: meta.label },
            ].map((s) => (
              <div key={s.label}>
                <span className={`font-mono text-[10px] uppercase tracking-widest opacity-60 mr-2 ${meta.color}`}>{s.label}</span>
                <span className={`font-mono text-sm ${meta.color}`}>{s.val}</span>
              </div>
            ))}
          </div>
        )}

        {/* Reference */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 mb-6">
          <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-4">
            {meta.label} — Escape Reference
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {REFERENCE[lang].map((item) => (
              <button key={item.escaped} onClick={() => copy(item.escaped, item.escaped)}
                className={`flex items-center gap-2 bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.14] rounded-lg px-3 py-2.5 text-left transition-all group`}>
                <code className={`font-mono text-xs shrink-0 ${meta.color} ${copied === item.escaped ? "opacity-50" : ""}`}>
                  {copied === item.escaped ? "✓" : item.escaped}
                </code>
                <span className="font-mono text-[10px] text-slate-600 truncate">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: "⬆", title: "Escape",    desc: "Make strings safe for code, SQL, URLs, and markup." },
            { icon: "⬇", title: "Unescape",  desc: "Reverse any escaped string to original form." },
            { icon: "⇄", title: "Swap",      desc: "Flip output as input for chained operations." },
            { icon: "8",  title: "Languages", desc: "JS, JSON, Python, HTML, URL, Regex, SQL, CSV." },
          ].map((c) => (
            <div key={c.title} className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-4 py-4">
              <div className={`text-xl mb-2 font-mono font-bold ${meta.color}`}>{c.icon}</div>
              <div className="font-semibold text-slate-300 text-sm mb-1">{c.title}</div>
              <div className="text-slate-600 text-xs leading-relaxed">{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}