"use client";

import { useState } from "react";
import { categories } from "./data/categories";


const colorMap: Record<
  string,
  {
    border: string;
    accent: string;
    iconBg: string;
    cardHover: string;
    tag: string;
  }
> = {
  green: {
    border: "hover:border-emerald-500/40",
    accent: "text-emerald-400",
    iconBg: "bg-emerald-500/10",
    cardHover: "hover:shadow-emerald-500/5",
    tag: "bg-emerald-500/10 text-emerald-400",
  },
  orange: {
    border: "hover:border-orange-500/40",
    accent: "text-orange-400",
    iconBg: "bg-orange-500/10",
    cardHover: "hover:shadow-orange-500/5",
    tag: "bg-orange-500/10 text-orange-400",
  },
  purple: {
    border: "hover:border-violet-500/40",
    accent: "text-violet-400",
    iconBg: "bg-violet-500/10",
    cardHover: "hover:shadow-violet-500/5",
    tag: "bg-violet-500/10 text-violet-400",
  },
  cyan: {
    border: "hover:border-cyan-500/40",
    accent: "text-cyan-400",
    iconBg: "bg-cyan-500/10",
    cardHover: "hover:shadow-cyan-500/5",
    tag: "bg-cyan-500/10 text-cyan-400",
  },
  yellow: {
    border: "hover:border-yellow-500/40",
    accent: "text-yellow-400",
    iconBg: "bg-yellow-500/10",
    cardHover: "hover:shadow-yellow-500/5",
    tag: "bg-yellow-500/10 text-yellow-400",
  },
};

export default function Home() {
  const [query, setQuery] = useState("");

  const filtered = categories
    .map((cat) => ({
      ...cat,
      tools: cat.tools.filter(
        (t) =>
          query === "" ||
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.desc.toLowerCase().includes(query.toLowerCase()),
      ),
    }))
    .filter((cat) => cat.tools.length > 0);

  const totalTools = categories.reduce((a, c) => a + c.tools.length, 0);

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,255,136,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.025) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      {/* Glow blobs */}
      <div className="fixed -top-48 -left-48 w-[600px] h-[600px] rounded-full bg-emerald-500/[0.06] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -right-48 w-[700px] h-[700px] rounded-full bg-violet-500/[0.06] blur-3xl pointer-events-none" />

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#09090f]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="font-mono text-base font-bold text-emerald-400 tracking-tight">
            use2<span className="text-slate-500">coding</span>tools
          </a>
          <div className="hidden md:flex items-center gap-7">
            {["Tools", "GitHub"].map((l) => (
              <a
                key={l}
                href={l === "Tools" ? "#tools" : l === "GitHub" ? "https://github.com" : "#"}
                className="font-mono text-[11px] uppercase tracking-widest text-slate-500 hover:text-emerald-400 transition-colors"
              >
                {l}
              </a>
            ))}
          </div>
          <div className="font-mono text-[11px] px-3 py-1.5 border border-emerald-500/50 text-emerald-400 rounded-sm hover:bg-emerald-500 hover:text-[#09090f] transition-all cursor-pointer">
            {totalTools}+ Tools
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      {/* ── HERO ── */}
<section className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-20">
  <div className="grid lg:grid-cols-2 gap-16 items-center">
    
    {/* LEFT CONTENT */}
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px w-6 bg-emerald-400" />
        <span className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-400">
          Developer Toolkit
        </span>
      </div>

      <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.0] tracking-[-3px] mb-6">
        All the tools
        <br />
        <span className="text-emerald-400">you actually need</span>
        <br />
        <span className="text-slate-600 font-normal">in one place.</span>
      </h1>

      <p className="text-slate-500 text-base md:text-lg max-w-lg leading-relaxed mb-10">
        Free, fast, and privacy-first developer tools. No login. No ads. No
        BS. Everything runs client-side — your data never leaves the browser.
      </p>

      <div className="flex flex-wrap gap-3 mb-12">
        <a
          href="#tools"
          className="font-mono text-sm px-6 py-3 bg-emerald-400 text-[#09090f] font-bold rounded-sm hover:bg-emerald-300 transition-all hover:-translate-y-0.5"
        >
          Explore Tools →
        </a>
        <a
          href="https://github.com"
          className="font-mono text-sm px-6 py-3 border border-white/10 text-slate-500 rounded-sm hover:border-slate-500 hover:text-slate-300 transition-all"
        >
          Star on GitHub
        </a>
      </div>
    </div>

    {/* RIGHT SIDE VISUAL */}
    <div className="relative hidden lg:block">
      
      {/* Glow background */}
      <div className="absolute -top-10 -left-10 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl opacity-40" />
      <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl opacity-40" />

      {/* Floating Code Window */}
      <div className="relative bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl rounded-xl shadow-2xl shadow-emerald-500/10 p-6 animate-[float_6s_ease-in-out_infinite]">
        
        {/* Top bar */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>

        {/* Code content */}
        <pre className="text-sm font-mono text-slate-300 leading-relaxed">
{`{
  "tool": "JSON Formatter",
  "speed": "instant",
  "privacy": "100% client-side",
  "ads": false,
  "loginRequired": false
}`}
        </pre>

        {/* Blinking cursor */}
        <div className="mt-2 h-4 w-2 bg-emerald-400 animate-pulse" />
      </div>
    </div>
  </div>
</section>




























































      {/* ── SEARCH ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 mb-14">
        <div className="relative max-w-lg">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-lg select-none">
            ⌕
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools... (e.g. JSON, Base64, UUID)"
            className="w-full font-mono text-sm pl-11 pr-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-md text-slate-300 placeholder-slate-600 outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
      </section>

      {/* ── TOOLS ── */}
      <section
        id="tools"
        className="relative z-10 max-w-7xl mx-auto px-6 pb-24"
      >
        <div className="flex items-center gap-4 mb-12">
          <span className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-400">
            All Tools
          </span>
          <div className="flex-1 max-w-xs h-px bg-white/[0.06]" />
        </div>

        {filtered.length === 0 && (
          <div className="text-slate-600 font-mono text-sm py-16 text-center">
            No tools found for &quot;{query}&quot; 🔍
          </div>
        )}

        <div className="space-y-14">
          {filtered.map((cat) => {
            const c = colorMap[cat.color];
            return (
              <div key={cat.id}>
                {/* Category header */}
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className={`w-9 h-9 rounded-md ${c.iconBg} flex items-center justify-center text-base`}
                  >
                    {cat.icon}
                  </div>
                  <span className="font-semibold text-slate-200 text-base tracking-tight">
                    {cat.name}
                  </span>
                  <span
                    className={`font-mono text-[11px] px-2 py-0.5 rounded ${c.tag} ml-auto`}
                  >
                    {cat.tools.length} tools
                  </span>
                </div>

                {/* Tool cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {cat.tools.map((tool) => (
                    <a
                      key={tool.name}
                      href={tool.href}
                      className={`group relative bg-white/[0.03] border border-white/[0.07] ${c.border} rounded-md px-4 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${c.cardHover} overflow-hidden`}
                    >
                      {/* Left accent bar */}
                      <div
                        className={`absolute left-0 top-0 w-0.5 h-full ${c.accent.replace("text-", "bg-")} opacity-0 group-hover:opacity-100 transition-opacity`}
                      />

                      <div className="font-semibold text-slate-200 text-sm mb-1 group-hover:text-white transition-colors">
                        {tool.name}
                      </div>
                      <div className="text-slate-600 text-xs leading-relaxed">
                        {tool.desc}
                      </div>

                      <span
                        className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm ${c.accent} opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all`}
                      >
                        →
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/[0.06] max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-2">
        <p className="font-mono text-[11px] text-slate-600">
          use2<span className="text-emerald-400">coding</span>tools — built for
          developers, by developers
        </p>
        <p className="font-mono text-[11px] text-slate-600">
          All tools run <span className="text-emerald-400">client-side</span>.
          Your data never leaves the browser.
        </p>
      </footer>
    </main>
  );
}
