"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useMemo, useCallback } from "react";

type Align = "left" | "center" | "right" | "none";
interface Column { id: string; header: string; align: Align; }
interface Cell { value: string; }

function uid() { return Math.random().toString(36).slice(2, 8); }

function alignSep(a: Align): string {
  if (a === "left")   return ":---";
  if (a === "center") return ":---:";
  if (a === "right")  return "---:";
  return "---";
}

function esc(val: string): string { return val.replace(/\|/g, "\\|").replace(/\n/g, " "); }

function genMarkdown(cols: Column[], rows: Cell[][]): string {
  const widths = cols.map((col, ci) => {
    const max = rows.reduce((m, row) => Math.max(m, (row[ci]?.value ?? "").length), 0);
    return Math.max(col.header.length || 1, max, 3);
  });
  const pad = (s: string, n: number) => s + " ".repeat(Math.max(0, n - s.length));
  const hdr = "| " + cols.map((c, i) => pad(esc(c.header), widths[i])).join(" | ") + " |";
  const sep = "| " + cols.map((c, i) => pad(alignSep(c.align), widths[i])).join(" | ") + " |";
  const drs = rows.map((r) => "| " + cols.map((_, ci) => pad(esc(r[ci]?.value ?? ""), widths[ci])).join(" | ") + " |");
  return [hdr, sep, ...drs].join("\n");
}

function genHTML(cols: Column[], rows: Cell[][]): string {
  const th = cols.map((c) => {
    const s = c.align !== "none" ? ` style="text-align:${c.align}"` : "";
    return `    <th${s}>${c.header}</th>`;
  }).join("\n");
  const trs = rows.map((row) => {
    const tds = cols.map((c, ci) => {
      const s = c.align !== "none" ? ` style="text-align:${c.align}"` : "";
      return `      <td${s}>${row[ci]?.value ?? ""}</td>`;
    }).join("\n");
    return `    <tr>\n${tds}\n    </tr>`;
  }).join("\n");
  return `<table>\n  <thead>\n    <tr>\n${th}\n    </tr>\n  </thead>\n  <tbody>\n${trs}\n  </tbody>\n</table>`;
}

function genCSV(cols: Column[], rows: Cell[][]): string {
  const w = (v: string) => /[,"\n]/.test(v) ? `"${v.replace(/"/g,'""')}"` : v;
  return [cols.map((c) => w(c.header)).join(","), ...rows.map((r) => cols.map((_, ci) => w(r[ci]?.value ?? "")).join(","))].join("\n");
}

const PRESETS = [
  { label: "Comparison", icon: "⚖️",
    cols: ["Feature","Basic","Pro","Enterprise"],
    rows: [["Users","1","10","Unlimited"],["Storage","5 GB","50 GB","1 TB"],["Support","Email","Priority","Dedicated"],["Price","$0/mo","$9/mo","$49/mo"]] },
  { label: "API Docs", icon: "📡",
    cols: ["Parameter","Type","Required","Description"],
    rows: [["id","string","Yes","Unique identifier"],["name","string","Yes","Full name"],["email","string","Yes","Valid email"],["age","number","No","Age in years"],["active","boolean","No","Account status"]] },
  { label: "Changelog", icon: "📋",
    cols: ["Version","Date","Changes"],
    rows: [["v2.0.0","2024-01-15","Major redesign"],["v1.5.0","2023-11-01","Dark mode"],["v1.2.0","2023-08-20","Performance fix"],["v1.0.0","2023-06-01","Initial release"]] },
  { label: "Tech Stack", icon: "🛠️",
    cols: ["Layer","Technology","Version","Notes"],
    rows: [["Frontend","Next.js","14.0","App Router"],["Styling","Tailwind","3.4","Utility-first"],["Database","PostgreSQL","16.0","Primary DB"],["Cache","Redis","7.2","Sessions"],["Hosting","Vercel","-","Edge network"]] },
];

const ALIGN_OPTS: { val: Align; label: string; icon: string }[] = [
  { val: "none",   label: "Default", icon: "≡" },
  { val: "left",   label: "Left",    icon: "⟵" },
  { val: "center", label: "Center",  icon: "⟺" },
  { val: "right",  label: "Right",   icon: "⟶" },
];

type Fmt = "markdown" | "html" | "csv";
const FMT: Record<Fmt, { label: string; color: string; tag: string; ext: string }> = {
  markdown: { label: "Markdown", color: "text-emerald-400", tag: "bg-emerald-500/10 border-emerald-500/20", ext: "md"   },
  html:     { label: "HTML",     color: "text-orange-400",  tag: "bg-orange-500/10  border-orange-500/20",  ext: "html" },
  csv:      { label: "CSV",      color: "text-cyan-400",    tag: "bg-cyan-500/10    border-cyan-500/20",     ext: "csv"  },
};

export default function MarkdownTable() {
  const mk = (headers: string[]) => headers.map((h) => ({ id: uid(), header: h, align: "none" as Align }));
  const mr = (data: string[][]) => data.map((row) => row.map((v) => ({ value: v })));

  const [cols, setCols]     = useState<Column[]>(mk(["Name","Role","Status","Joined"]));
  const [rows, setRows]     = useState<Cell[][]>(mr([
    ["Rohan Sharma","Developer","Active","2023-01-15"],
    ["Priya Singh","Designer","Active","2023-03-22"],
    ["Amit Kumar","Manager","Away","2022-11-08"],
  ]));
  const [fmt, setFmt]       = useState<Fmt>("markdown");
  const [copied, setCopied] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const output = useMemo(() => {
    if (fmt === "html") return genHTML(cols, rows);
    if (fmt === "csv")  return genCSV(cols, rows);
    return genMarkdown(cols, rows);
  }, [cols, rows, fmt]);

  const updColHeader = (id: string, v: string) => setCols((p) => p.map((c) => c.id === id ? { ...c, header: v } : c));
  const updColAlign  = (id: string, a: Align)  => setCols((p) => p.map((c) => c.id === id ? { ...c, align: a } : c));

  const addCol = () => {
    const id = uid();
    setCols((p) => [...p, { id, header: `Col ${p.length + 1}`, align: "none" }]);
    setRows((p) => p.map((r) => [...r, { value: "" }]));
  };

  const removeCol = (idx: number) => {
    if (cols.length <= 1) return;
    setCols((p) => p.filter((_, i) => i !== idx));
    setRows((p) => p.map((r) => r.filter((_, i) => i !== idx)));
  };

  const addRow = () => setRows((p) => [...p, cols.map(() => ({ value: "" }))]);
  const removeRow = (idx: number) => { if (rows.length > 1) setRows((p) => p.filter((_, i) => i !== idx)); };

  const updCell = useCallback((ri: number, ci: number, v: string) => {
    setRows((p) => p.map((row, r) => r === ri ? row.map((cell, c) => c === ci ? { value: v } : cell) : row));
  }, []);

  const loadPreset = (p: typeof PRESETS[0]) => {
    setCols(mk(p.cols));
    setRows(mr(p.rows));
    setActivePreset(p.label);
  };

  const copy = () => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  const download = () => {
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `table.${FMT[fmt].ext}`; a.click();
    URL.revokeObjectURL(url);
  };

  const m = FMT[fmt];

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-cyan-500/[0.04] blur-3xl pointer-events-none" />

               <ToolNavbar toolName="Markdown Table Generator" />


      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center font-mono font-bold text-emerald-400 text-lg">⊞</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Markdown Table Generator</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">visual editor</span>
          </div>
          <p className="text-slate-500 text-sm">Build tables visually — add rows, columns, set alignment — then export as Markdown, HTML, or CSV.</p>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="font-mono text-[11px] text-slate-600 self-center uppercase tracking-wider">Presets:</span>
          {PRESETS.map((p) => (
            <button key={p.label} onClick={() => loadPreset(p)}
              className={`flex items-center gap-2 font-mono text-xs px-3 py-1.5 border rounded transition-all ${
                activePreset === p.label ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-emerald-400 hover:border-emerald-500/30"
              }`}>
              {p.icon} {p.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

          {/* Editor */}
          <div className="xl:col-span-3 flex flex-col gap-4">
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <div className="min-w-max">

                  {/* Header row */}
                  <div className="flex items-stretch border-b border-white/[0.08] bg-white/[0.02]">
                    <div className="w-10 shrink-0" />
                    {cols.map((col, ci) => (
                      <div key={col.id} className="border-r border-white/[0.06] group" style={{ minWidth: 150, width: 150 }}>
                        <div className="flex items-center px-2 py-2 gap-1">
                          <input value={col.header} onChange={(e) => updColHeader(col.id, e.target.value)}
                            placeholder={`Col ${ci + 1}`}
                            className="font-mono text-xs font-semibold text-slate-200 bg-transparent outline-none flex-1 min-w-0 placeholder-slate-700" />
                          <button onClick={() => removeCol(ci)}
                            className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all text-sm leading-none">×</button>
                        </div>
                        <div className="flex border-t border-white/[0.04]">
                          {ALIGN_OPTS.map((a) => (
                            <button key={a.val} onClick={() => updColAlign(col.id, a.val)} title={a.label}
                              className={`flex-1 py-1 font-mono text-[11px] transition-all ${col.align === a.val ? "bg-emerald-500/15 text-emerald-400" : "text-slate-700 hover:text-slate-400"}`}>
                              {a.icon}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <button onClick={addCol}
                      className="w-10 shrink-0 flex items-center justify-center text-slate-600 hover:text-emerald-400 hover:bg-emerald-500/[0.05] transition-all font-bold text-lg">
                      +
                    </button>
                  </div>

                  {/* Data rows */}
                  {rows.map((row, ri) => (
                    <div key={ri} className="flex items-center group border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.015] transition-colors">
                      <div className="w-10 shrink-0 flex items-center justify-center">
                        <button onClick={() => removeRow(ri)}
                          className="font-mono text-[10px] text-slate-700 hover:text-red-400 transition-colors group-hover:text-slate-500">
                          {ri + 1}
                        </button>
                      </div>
                      {cols.map((col, ci) => (
                        <div key={col.id} style={{ minWidth: 150, width: 150 }} className="border-r border-white/[0.04] px-2 py-2.5">
                          <input value={row[ci]?.value ?? ""} onChange={(e) => updCell(ri, ci, e.target.value)}
                            placeholder="..."
                            className={`font-mono text-xs text-slate-300 bg-transparent outline-none w-full placeholder-slate-800 ${
                              col.align === "center" ? "text-center" : col.align === "right" ? "text-right" : ""
                            }`} />
                        </div>
                      ))}
                      <div className="w-10 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={addRow}
                className="w-full py-2.5 font-mono text-xs text-slate-600 hover:text-emerald-400 hover:bg-emerald-500/[0.04] border-t border-white/[0.06] transition-all">
                + Add row
              </button>
            </div>

            {/* Stats */}
            <div className="flex gap-3">
              {[{ label: "Columns", val: cols.length }, { label: "Rows", val: rows.length }, { label: "Cells", val: cols.length * rows.length }].map((s) => (
                <div key={s.label} className="flex-1 bg-white/[0.02] border border-white/[0.06] rounded-lg px-4 py-3 text-center">
                  <div className="font-mono text-2xl font-bold text-emerald-400">{s.val}</div>
                  <div className="font-mono text-[10px] text-slate-700 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Output */}
          <div className="xl:col-span-2 flex flex-col gap-4">

            {/* Format toggle */}
            <div className="flex gap-1 bg-white/[0.04] border border-white/[0.08] rounded-lg p-1">
              {(Object.keys(FMT) as Fmt[]).map((f) => (
                <button key={f} onClick={() => setFmt(f)}
                  className={`flex-1 font-mono text-xs py-2 rounded-md transition-all ${fmt === f ? `${FMT[f].tag} font-bold` : "text-slate-500 hover:text-slate-300"}`}>
                  {FMT[f].label}
                </button>
              ))}
            </div>

            {/* Output */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className={`font-mono text-[11px] uppercase tracking-[2px] ${m.color}`}>{m.label}</span>
                <div className="flex gap-2">
                  <button onClick={download} className="font-mono text-[11px] px-2.5 py-1 rounded border border-white/[0.08] text-slate-500 hover:text-slate-300 transition-all">↓ Download</button>
                  <button onClick={copy} className={`font-mono text-[11px] px-3 py-1 rounded border transition-all ${copied ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                    {copied ? "✓ Copied!" : "Copy"}
                  </button>
                </div>
              </div>
              <div className="min-h-[300px] font-mono text-xs bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 overflow-auto">
                <pre className={`whitespace-pre-wrap ${m.color}`}>{output}</pre>
              </div>
            </div>

            {/* Live preview (markdown only) */}
            {fmt === "markdown" && (
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
                <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">Live Preview</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr>
                        {cols.map((col) => (
                          <th key={col.id} className="font-mono text-xs font-semibold text-slate-300 border-b border-white/[0.1] px-3 py-2 whitespace-nowrap"
                            style={{ textAlign: col.align === "none" ? "left" : col.align }}>
                            {col.header || "—"}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, ri) => (
                        <tr key={ri} className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors">
                          {cols.map((col, ci) => (
                            <td key={col.id} className="font-mono text-xs text-slate-400 px-3 py-2 whitespace-nowrap"
                              style={{ textAlign: col.align === "none" ? "left" : col.align }}>
                              {row[ci]?.value || <span className="text-slate-700">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-6">
          {[
            { icon: "⊞", title: "Visual Editor",    desc: "Click cells to edit. Add/remove rows & columns freely." },
            { icon: "⟺", title: "Column Alignment", desc: "Set Left, Center, Right, or Default per column." },
            { icon: "📤", title: "3 Export Formats", desc: "Markdown, HTML table, and CSV — all from same data." },
            { icon: "👁️", title: "Live Preview",     desc: "See rendered table preview while editing in Markdown mode." },
          ].map((c) => (
            <div key={c.title} className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-4 py-4">
              <div className="font-mono text-xl font-bold text-emerald-400 mb-2">{c.icon}</div>
              <div className="font-semibold text-slate-300 text-sm mb-1">{c.title}</div>
              <div className="text-slate-600 text-xs leading-relaxed">{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}