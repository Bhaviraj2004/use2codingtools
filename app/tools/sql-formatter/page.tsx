"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useCallback, JSX } from "react";

// ── SQL Keywords ──────────────────────────────────────────────
const KEYWORDS_NEWLINE = [
  "SELECT", "FROM", "WHERE", "JOIN", "LEFT JOIN", "RIGHT JOIN", "INNER JOIN",
  "FULL JOIN", "FULL OUTER JOIN", "CROSS JOIN", "ON", "AND", "OR", "ORDER BY",
  "GROUP BY", "HAVING", "LIMIT", "OFFSET", "UNION", "UNION ALL", "EXCEPT",
  "INTERSECT", "INSERT INTO", "VALUES", "UPDATE", "SET", "DELETE FROM",
  "CREATE TABLE", "ALTER TABLE", "DROP TABLE", "TRUNCATE TABLE",
  "CREATE INDEX", "DROP INDEX", "WITH", "CASE", "WHEN", "THEN", "ELSE", "END",
];

const KEYWORDS_UPPER = [
  "SELECT", "FROM", "WHERE", "JOIN", "LEFT", "RIGHT", "INNER", "FULL", "OUTER",
  "CROSS", "ON", "AND", "OR", "NOT", "IN", "IS", "NULL", "LIKE", "BETWEEN",
  "EXISTS", "AS", "DISTINCT", "ALL", "ANY", "SOME", "ORDER", "BY", "GROUP",
  "HAVING", "LIMIT", "OFFSET", "UNION", "EXCEPT", "INTERSECT", "INSERT",
  "INTO", "VALUES", "UPDATE", "SET", "DELETE", "CREATE", "TABLE", "ALTER",
  "DROP", "TRUNCATE", "INDEX", "WITH", "CASE", "WHEN", "THEN", "ELSE", "END",
  "ASC", "DESC", "UNIQUE", "PRIMARY", "KEY", "FOREIGN", "REFERENCES",
  "DEFAULT", "NOT NULL", "AUTO_INCREMENT", "SERIAL", "RETURNING", "TOP",
  "COUNT", "SUM", "AVG", "MIN", "MAX", "COALESCE", "NULLIF", "CAST", "CONVERT",
  "IF", "IFNULL", "ISNULL", "CONCAT", "LENGTH", "UPPER", "LOWER", "TRIM",
  "SUBSTRING", "REPLACE", "NOW", "CURRENT_TIMESTAMP", "DATE", "YEAR",
  "MONTH", "DAY", "OVER", "PARTITION", "ROW_NUMBER", "RANK", "DENSE_RANK",
];

function formatSQL(sql: string, indentSize: number, uppercase: boolean): string {
  const indent = " ".repeat(indentSize);

  // Normalize whitespace
  let s = sql.trim().replace(/\s+/g, " ");

  // Uppercase keywords if needed
  if (uppercase) {
    for (const kw of KEYWORDS_UPPER) {
      const re = new RegExp(`\\b${kw}\\b`, "gi");
      s = s.replace(re, kw);
    }
  }

  // Add newlines before main clauses
  for (const kw of KEYWORDS_NEWLINE) {
    const re = new RegExp(`\\b${kw}\\b`, "gi");
    s = s.replace(re, `\n${uppercase ? kw : kw.toLowerCase()}`);
  }

  // Handle SELECT columns — put each on its own line
  s = s.replace(
    /\n(SELECT)\s+(.+?)\s*\n(FROM)/is,
    (_, sel, cols, from) => {
      const colList = cols
        .split(",")
        .map((c: string) => `${indent}${c.trim()}`)
        .join(",\n");
      return `\n${sel}\n${colList}\n${from}`;
    }
  );

  // Handle VALUES list
  s = s.replace(
    /\n(VALUES)\s*\((.+?)\)/is,
    (_, val, items) => {
      const itemList = items
        .split(",")
        .map((v: string) => `${indent}${v.trim()}`)
        .join(",\n");
      return `\n${val}\n(${itemList})`;
    }
  );

  // Handle SET clause
  s = s.replace(
    /\n(SET)\s+(.+?)(\n|$)/is,
    (_, set, assignments, end) => {
      const parts = assignments
        .split(",")
        .map((a: string) => `${indent}${a.trim()}`)
        .join(",\n");
      return `\n${set}\n${parts}${end}`;
    }
  );

  // Indent AND / OR inside WHERE
  s = s.replace(/\n(AND|OR)\b/gi, (_, kw) => `\n${indent}${uppercase ? kw.toUpperCase() : kw.toLowerCase()}`);

  // Indent JOIN ON
  s = s.replace(/\n(ON)\b/gi, (_, kw) => `\n${indent}${uppercase ? kw.toUpperCase() : kw.toLowerCase()}`);

  // Clean up extra blank lines
  s = s.replace(/\n{3,}/g, "\n\n").trim();

  return s;
}

function minifySQL(sql: string): string {
  return sql.replace(/\s+/g, " ").trim();
}

// ── Syntax highlighter ────────────────────────────────────────
function highlight(sql: string): JSX.Element[] {
  const keywords = new Set(KEYWORDS_UPPER);
  const lines = sql.split("\n");

  return lines.map((line, li) => {
    const tokens = line.split(/(\s+|[(),;*]|'[^']*'|"[^"]*"|`[^`]*`|--[^\n]*|\d+)/g).filter(Boolean);
    return (
      <div key={li}>
        {tokens.map((tok, ti) => {
          let cls = "text-slate-300";
          const up = tok.trim().toUpperCase();
          if (keywords.has(up)) cls = "text-cyan-400 font-semibold";
          else if (/^'[^']*'$/.test(tok) || /^"[^"]*"$/.test(tok)) cls = "text-orange-400";
          else if (/^`[^`]*`$/.test(tok)) cls = "text-yellow-400";
          else if (/^\d+(\.\d+)?$/.test(tok)) cls = "text-violet-400";
          else if (tok.startsWith("--")) cls = "text-slate-600 italic";
          else if (["(", ")", ",", ";", "*"].includes(tok)) cls = "text-slate-500";
          return <span key={ti} className={cls}>{tok}</span>;
        })}
      </div>
    );
  });
}

const EXAMPLES = [
  {
    label: "SELECT query",
    sql: `select u.id, u.name, u.email, count(o.id) as total_orders, sum(o.amount) as total_spent from users u left join orders o on u.id = o.user_id where u.active = 1 and u.created_at >= '2024-01-01' group by u.id, u.name, u.email having count(o.id) > 0 order by total_spent desc limit 50;`,
  },
  {
    label: "INSERT",
    sql: `insert into users (name, email, age, active, created_at) values ('Rohan Sharma', 'rohan@example.com', 28, true, now());`,
  },
  {
    label: "UPDATE",
    sql: `update users set name = 'Rohan Kumar', email = 'rohan.kumar@example.com', updated_at = now() where id = 1 and active = true;`,
  },
  {
    label: "CREATE TABLE",
    sql: `create table users (id serial primary key, name varchar(255) not null, email varchar(255) unique not null, age integer, active boolean default true, created_at timestamp default current_timestamp);`,
  },
];

export default function SqlFormatter() {
  const [input, setInput]       = useState("");
  const [output, setOutput]     = useState("");
  const [mode, setMode]         = useState<"format" | "minify">("format");
  const [indent, setIndent]     = useState(2);
  const [uppercase, setUppercase] = useState(true);
  const [copied, setCopied]     = useState(false);
  const [activeExample, setActiveExample] = useState<string | null>(null);

  const process = useCallback((val: string, m: "format" | "minify", ind: number, up: boolean) => {
    setOutput("");
    if (!val.trim()) return;
    try {
      const result = m === "minify" ? minifySQL(val) : formatSQL(val, ind, up);
      setOutput(result);
    } catch { setOutput(""); }
  }, []);

  const handleInput   = (v: string)              => { setInput(v);  process(v, mode, indent, uppercase); };
  const handleMode    = (m: "format" | "minify") => { setMode(m);   process(input, m, indent, uppercase); };
  const handleIndent  = (n: number)              => { setIndent(n); process(input, mode, n, uppercase); };
  const handleCase    = (v: boolean)             => { setUppercase(v); process(input, mode, indent, v); };

  const loadExample = (ex: typeof EXAMPLES[0]) => {
    setInput(ex.sql);
    setActiveExample(ex.label);
    process(ex.sql, mode, indent, uppercase);
  };

  const copy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "query.sql"; a.click();
    URL.revokeObjectURL(url);
  };

  const lineCount = output.split("\n").length;

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-cyan-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-violet-500/[0.04] blur-3xl pointer-events-none" />

      {/* NAV */}

         <ToolNavbar toolName="SQL Formatter & Minifier" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-cyan-500/10 flex items-center justify-center font-mono font-bold text-cyan-400 text-sm">SQL</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">SQL Formatter</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded">+ minify</span>
          </div>
          <p className="text-slate-500 text-sm">Beautify messy SQL queries into clean, readable format with syntax highlighting. Supports SELECT, INSERT, UPDATE, CREATE and more.</p>
        </div>

        {/* Examples */}
        <div className="flex flex-wrap gap-2 mb-5">
          <span className="font-mono text-[11px] text-slate-600 self-center uppercase tracking-wider">Examples:</span>
          {EXAMPLES.map((ex) => (
            <button key={ex.label} onClick={() => loadExample(ex)}
              className={`font-mono text-[11px] px-3 py-1.5 border rounded transition-all ${activeExample === ex.label ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400" : "border-white/[0.08] text-slate-500 hover:text-cyan-400 hover:border-cyan-500/30"}`}>
              {ex.label}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {/* Mode */}
          <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-lg p-1 gap-1">
            {(["format", "minify"] as const).map((m) => (
              <button key={m} onClick={() => handleMode(m)}
                className={`font-mono text-xs px-5 py-2 rounded-md capitalize transition-all ${mode === m ? "bg-cyan-500/20 text-cyan-400" : "text-slate-500 hover:text-slate-300"}`}>
                {m === "format" ? "✨ Format" : "⚡ Minify"}
              </button>
            ))}
          </div>

          {/* Indent */}
          {mode === "format" && (
            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-1.5">
              <span className="font-mono text-[11px] text-slate-500">Indent</span>
              {[2, 4].map((n) => (
                <button key={n} onClick={() => handleIndent(n)}
                  className={`font-mono text-xs px-2 py-0.5 rounded transition-all ${indent === n ? "bg-cyan-500/20 text-cyan-400" : "text-slate-600 hover:text-slate-300"}`}>{n}</button>
              ))}
            </div>
          )}

          {/* Uppercase toggle */}
          {mode === "format" && (
            <label onClick={() => handleCase(!uppercase)} className="flex items-center gap-2 cursor-pointer bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-1.5">
              <div className={`w-8 h-4 rounded-full transition-all relative ${uppercase ? "bg-cyan-500" : "bg-white/10"}`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${uppercase ? "left-4" : "left-0.5"}`} />
              </div>
              <span className="font-mono text-xs text-slate-500">UPPERCASE keywords</span>
            </label>
          )}

          <div className="ml-auto flex gap-2">
            <button onClick={() => { setInput(""); setOutput(""); setActiveExample(null); }}
              className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-red-400 hover:border-red-500/30 transition-all">Clear</button>
          </div>
        </div>

        {/* Editors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">

          {/* Input */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">SQL Input</span>
              <span className="font-mono text-[10px] text-slate-700">{input.length} chars</span>
            </div>
            <textarea value={input} onChange={(e) => handleInput(e.target.value)}
              placeholder={"select * from users where active = 1 order by created_at desc limit 10;"}
              spellCheck={false}
              className="w-full h-[520px] font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-slate-300 placeholder-slate-700 outline-none focus:border-cyan-500/40 resize-none transition-colors leading-relaxed" />
          </div>

          {/* Output */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Formatted Output</span>
              <div className="flex items-center gap-2">
                {output && <span className="font-mono text-[10px] text-slate-600">{lineCount} lines</span>}
                <button onClick={download} disabled={!output}
                  className="font-mono text-[11px] px-2.5  rounded border border-white/[0.08] text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-all">
                  ↓ .sql
                </button>
                <button onClick={copy} disabled={!output}
                  className={`font-mono text-[11px] px-3 rounded border transition-all ${copied ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300 disabled:opacity-30"}`}>
                  {copied ? "✓ Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <div className="h-[520px] font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 overflow-auto leading-relaxed">
              {!output && <span className="text-slate-700">Formatted SQL will appear here...</span>}
              {output && <pre className="text-xs">{highlight(output)}</pre>}
            </div>
          </div>
        </div>

        {/* Highlight legend */}
        <div className="flex flex-wrap gap-4 px-4 py-3 bg-white/[0.02] border border-white/[0.06] rounded-lg mb-6">
          <span className="font-mono text-[10px] text-slate-700 self-center uppercase tracking-wider">Highlight:</span>
          {[
            { color: "text-cyan-400",   label: "Keywords"  },
            { color: "text-orange-400", label: "Strings"   },
            { color: "text-violet-400", label: "Numbers"   },
            { color: "text-yellow-400", label: "Identifiers" },
            { color: "text-slate-600",  label: "Comments"  },
          ].map((h) => (
            <div key={h.label} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-sm ${h.color.replace("text-", "bg-")}`} />
              <span className={`font-mono text-[11px] ${h.color}`}>{h.label}</span>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "✨", title: "Smart Formatting",   desc: "Each clause (SELECT, FROM, WHERE, JOIN) gets its own line with proper indentation." },
            { icon: "🎨", title: "Syntax Highlight",   desc: "Keywords, strings, numbers, and comments are color-coded for easy reading." },
            { icon: "⚡", title: "Minify",             desc: "Strip all whitespace for production use or minified query strings." },
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