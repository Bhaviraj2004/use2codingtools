"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useMemo } from "react";

// ── Gitignore templates ───────────────────────────────────────
const TEMPLATES: Record<string, { icon: string; category: string; rules: string[] }> = {
  // ── Languages ──
  node: {
    icon: "🟢", category: "Language",
    rules: [
      "# Node.js",
      "node_modules/",
      "npm-debug.log*",
      "yarn-debug.log*",
      "yarn-error.log*",
      "pnpm-debug.log*",
      ".npm",
      ".yarn/cache",
      ".yarn/unplugged",
      ".yarn/build-state.yml",
      ".pnp.*",
      "package-lock.json",
    ],
  },
  python: {
    icon: "🐍", category: "Language",
    rules: [
      "# Python",
      "__pycache__/",
      "*.py[cod]",
      "*$py.class",
      "*.so",
      ".Python",
      "venv/",
      ".venv/",
      "env/",
      ".env/",
      "dist/",
      "build/",
      "*.egg-info/",
      ".eggs/",
      "pip-log.txt",
      ".pytest_cache/",
      ".mypy_cache/",
      ".ruff_cache/",
      "*.pyo",
    ],
  },
  java: {
    icon: "☕", category: "Language",
    rules: [
      "# Java",
      "*.class",
      "*.jar",
      "*.war",
      "*.ear",
      "*.nar",
      "target/",
      ".mvn/",
      "!**/src/main/**/target/",
      "!**/src/test/**/target/",
      "hs_err_pid*",
      "replay_pid*",
    ],
  },
  go: {
    icon: "🐹", category: "Language",
    rules: [
      "# Go",
      "*.exe",
      "*.exe~",
      "*.dll",
      "*.so",
      "*.dylib",
      "*.test",
      "*.out",
      "vendor/",
      "/go.sum",
    ],
  },
  rust: {
    icon: "🦀", category: "Language",
    rules: [
      "# Rust",
      "/target/",
      "Cargo.lock",
      "**/*.rs.bk",
      "*.pdb",
    ],
  },
  ruby: {
    icon: "💎", category: "Language",
    rules: [
      "# Ruby",
      "*.gem",
      "*.rbc",
      ".bundle/",
      ".config",
      "coverage/",
      "InstalledFiles",
      "pkg/",
      "spec/reports/",
      "Gemfile.lock",
      ".rvmrc",
      ".ruby-version",
    ],
  },
  php: {
    icon: "🐘", category: "Language",
    rules: [
      "# PHP",
      "vendor/",
      "composer.phar",
      ".phpunit.result.cache",
      ".phpunit.cache/",
      "*.cache",
      "phpunit.xml",
      ".php_cs.cache",
      ".php-cs-fixer.cache",
    ],
  },

  // ── Frameworks ──
  nextjs: {
    icon: "▲", category: "Framework",
    rules: [
      "# Next.js",
      ".next/",
      "out/",
      "build/",
      "dist/",
      ".vercel",
      "*.tsbuildinfo",
      "next-env.d.ts",
    ],
  },
  react: {
    icon: "⚛️", category: "Framework",
    rules: [
      "# React / CRA",
      "build/",
      ".env.local",
      ".env.development.local",
      ".env.test.local",
      ".env.production.local",
    ],
  },
  vue: {
    icon: "💚", category: "Framework",
    rules: [
      "# Vue",
      "dist/",
      ".nuxt/",
      ".output/",
      ".cache/",
      "*.local",
    ],
  },
  django: {
    icon: "🎸", category: "Framework",
    rules: [
      "# Django",
      "*.log",
      "*.pot",
      "*.pyc",
      "__pycache__/",
      "local_settings.py",
      "db.sqlite3",
      "db.sqlite3-journal",
      "media/",
      "staticfiles/",
    ],
  },
  laravel: {
    icon: "🔴", category: "Framework",
    rules: [
      "# Laravel",
      "/vendor/",
      "/node_modules/",
      "/.env",
      "/.env.backup",
      "/.phpunit.result.cache",
      "/public/hot",
      "/public/storage",
      "/storage/*.key",
      "/bootstrap/cache/",
      ".idea/",
      ".env.testing",
    ],
  },

  // ── Tools & Editors ──
  vscode: {
    icon: "💙", category: "Editor",
    rules: [
      "# VS Code",
      ".vscode/*",
      "!.vscode/settings.json",
      "!.vscode/tasks.json",
      "!.vscode/launch.json",
      "!.vscode/extensions.json",
      "*.code-workspace",
      ".history/",
    ],
  },
  jetbrains: {
    icon: "🟠", category: "Editor",
    rules: [
      "# JetBrains IDEs",
      ".idea/",
      "*.iws",
      "*.iml",
      "*.ipr",
      "out/",
      "!**/src/main/**/out/",
      "!**/src/test/**/out/",
    ],
  },
  vim: {
    icon: "🟩", category: "Editor",
    rules: [
      "# Vim",
      "[._]*.s[a-v][a-z]",
      "[._]*.sw[a-p]",
      "[._]s[a-rt-v][a-z]",
      "Session.vim",
      "Sessionx.vim",
      ".netrwhist",
      "*~",
      "tags",
    ],
  },

  // ── Environments ──
  dotenv: {
    icon: "🔑", category: "Environment",
    rules: [
      "# Environment variables",
      ".env",
      ".env.local",
      ".env.*.local",
      ".env.development",
      ".env.test",
      ".env.production",
      ".env.staging",
      "!.env.example",
    ],
  },
  docker: {
    icon: "🐳", category: "Environment",
    rules: [
      "# Docker",
      ".docker/",
      "docker-compose.override.yml",
      "*.env",
    ],
  },
  terraform: {
    icon: "🏗️", category: "Environment",
    rules: [
      "# Terraform",
      "**/.terraform/*",
      "*.tfstate",
      "*.tfstate.*",
      "crash.log",
      "crash.*.log",
      "*.tfvars",
      "*.tfvars.json",
      "override.tf",
      "override.tf.json",
      "*_override.tf",
      "*_override.tf.json",
      ".terraform.lock.hcl",
    ],
  },

  // ── OS ──
  macos: {
    icon: "🍎", category: "OS",
    rules: [
      "# macOS",
      ".DS_Store",
      ".AppleDouble",
      ".LSOverride",
      "Icon\\r",
      "._*",
      ".DocumentRevisions-V100",
      ".fseventsd",
      ".Spotlight-V100",
      ".TemporaryItems",
      ".Trashes",
      ".VolumeIcon.icns",
      ".com.apple.timemachine.donotpresent",
      ".AppleDB",
      ".AppleDesktop",
      "Network Trash Folder",
      "Temporary Items",
      ".apdisk",
    ],
  },
  windows: {
    icon: "🪟", category: "OS",
    rules: [
      "# Windows",
      "Thumbs.db",
      "Thumbs.db:encryptable",
      "ehthumbs.db",
      "ehthumbs_vista.db",
      "*.stackdump",
      "[Dd]esktop.ini",
      "$RECYCLE.BIN/",
      "*.cab",
      "*.msi",
      "*.msix",
      "*.msm",
      "*.msp",
      "*.lnk",
    ],
  },
  linux: {
    icon: "🐧", category: "OS",
    rules: [
      "# Linux",
      "*~",
      ".fuse_hidden*",
      ".directory",
      ".Trash-*",
      ".nfs*",
    ],
  },

  // ── Misc ──
  logs: {
    icon: "📋", category: "Misc",
    rules: [
      "# Logs & Debug",
      "logs/",
      "*.log",
      "npm-debug.log*",
      "yarn-debug.log*",
      "lerna-debug.log*",
      ".pnpm-debug.log*",
      "report.[0-9]*.[0-9]*.[0-9]*.[0-9]*.json",
    ],
  },
  coverage: {
    icon: "📊", category: "Misc",
    rules: [
      "# Test coverage",
      "coverage/",
      ".nyc_output/",
      ".coverage",
      "htmlcov/",
      "*.coveragerc",
      "lcov.info",
      "*.lcov",
    ],
  },
};

// Category order + colors
const CATEGORY_META: Record<string, { color: string; tag: string }> = {
  Language:    { color: "text-emerald-400", tag: "bg-emerald-500/10 border-emerald-500/20" },
  Framework:   { color: "text-blue-400",    tag: "bg-blue-500/10    border-blue-500/20"    },
  Editor:      { color: "text-violet-400",  tag: "bg-violet-500/10  border-violet-500/20"  },
  Environment: { color: "text-orange-400",  tag: "bg-orange-500/10  border-orange-500/20"  },
  OS:          { color: "text-cyan-400",    tag: "bg-cyan-500/10    border-cyan-500/20"     },
  Misc:        { color: "text-slate-400",   tag: "bg-slate-500/10   border-slate-500/20"    },
};

const CATEGORIES = Object.keys(CATEGORY_META);

// Preset stacks
const PRESETS: { label: string; icon: string; keys: string[] }[] = [
  { label: "Next.js + Node",   icon: "▲", keys: ["nextjs", "node", "dotenv", "vscode", "macos", "windows"] },
  { label: "React + Node",     icon: "⚛️", keys: ["react",  "node", "dotenv", "vscode", "macos", "windows"] },
  { label: "Python / Django",  icon: "🐍", keys: ["python", "django", "dotenv", "vscode", "macos"] },
  { label: "Go Backend",       icon: "🐹", keys: ["go", "dotenv", "docker", "vscode", "macos"] },
  { label: "Laravel / PHP",    icon: "🔴", keys: ["php", "laravel", "dotenv", "vscode", "macos"] },
  { label: "Java / Spring",    icon: "☕", keys: ["java", "dotenv", "jetbrains", "vscode", "macos", "windows"] },
  { label: "Full Stack",       icon: "🌐", keys: ["nextjs", "node", "python", "dotenv", "docker", "vscode", "macos", "windows"] },
];

export default function GitignoreGenerator() {
  const [selected, setSelected] = useState<Set<string>>(new Set(["nextjs", "node", "dotenv", "vscode", "macos"]));
  const [search, setSearch]     = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [copied, setCopied]     = useState(false);

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const applyPreset = (keys: string[]) => setSelected(new Set(keys));

  const output = useMemo(() => {
    if (selected.size === 0) return "";
    const lines: string[] = [
      "# Generated by use2codingtools.com/tools/gitignore-generator",
      "",
    ];
    for (const key of Object.keys(TEMPLATES)) {
      if (selected.has(key)) {
        lines.push(...TEMPLATES[key].rules);
        lines.push("");
      }
    }
    return lines.join("\n").trim();
  }, [selected]);

  const copy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = ".gitignore"; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = Object.entries(TEMPLATES).filter(([key, val]) => {
    const matchCat = activeCategory === "All" || val.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch = !q || key.includes(q) || val.category.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const lineCount = output.split("\n").length;

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-orange-500/[0.04] blur-3xl pointer-events-none" />

      {/* NAV */}

               <ToolNavbar toolName="Gitignore Generator" />


      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center text-lg">🚫</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Gitignore Generator</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">{Object.keys(TEMPLATES).length} templates</span>
          </div>
          <p className="text-slate-500 text-sm">
            Select languages, frameworks, editors, and OS — get a perfect <code className="text-emerald-400 font-mono">.gitignore</code> instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left — selector */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Presets */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">Quick Presets</div>
              <div className="flex flex-col gap-1.5">
                {PRESETS.map((p) => (
                  <button key={p.label} onClick={() => applyPreset(p.keys)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-white/[0.06] hover:border-emerald-500/30 hover:bg-emerald-500/[0.04] transition-all text-left group">
                    <span className="text-sm">{p.icon}</span>
                    <span className="font-mono text-xs text-slate-400 group-hover:text-emerald-400 transition-colors">{p.label}</span>
                    <span className="font-mono text-[10px] text-slate-700 ml-auto">{p.keys.length} items</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search + filter */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">Templates</div>

              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates..."
                className="w-full font-mono text-xs px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-slate-300 placeholder-slate-700 outline-none focus:border-emerald-500/30 transition-colors mb-3" />

              {/* Category filter */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {["All", ...CATEGORIES].map((cat) => (
                  <button key={cat} onClick={() => setActiveCategory(cat)}
                    className={`font-mono text-[10px] px-2.5 py-1 rounded border transition-all ${
                      activeCategory === cat
                        ? cat === "All" ? "bg-white/10 border-white/20 text-white" : `${CATEGORY_META[cat].tag} ${CATEGORY_META[cat].color}`
                        : "border-white/[0.06] text-slate-600 hover:text-slate-400"
                    }`}>
                    {cat}
                  </button>
                ))}
              </div>

              {/* Template chips */}
              <div className="flex flex-col gap-1 max-h-[340px] overflow-y-auto pr-1">
                {filtered.map(([key, val]) => {
                  const isSelected = selected.has(key);
                  const catMeta = CATEGORY_META[val.category];
                  return (
                    <button key={key} onClick={() => toggle(key)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-left ${
                        isSelected
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : "border-white/[0.06] hover:border-white/[0.14]"
                      }`}>
                      <span className="text-base shrink-0">{val.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className={`font-mono text-xs font-semibold ${isSelected ? "text-emerald-400" : "text-slate-300"}`}>
                          {key}
                        </div>
                        <div className={`font-mono text-[10px] ${catMeta.color} opacity-70`}>{val.category}</div>
                      </div>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                        isSelected ? "bg-emerald-500 border-emerald-500" : "border-white/20"
                      }`}>
                        {isSelected && <span className="text-black text-[10px] font-bold">✓</span>}
                      </div>
                    </button>
                  );
                })}
                {filtered.length === 0 && <div className="font-mono text-xs text-slate-600 text-center py-4">No templates found</div>}
              </div>
            </div>
          </div>

          {/* Right — output */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">.gitignore</span>
                {selected.size > 0 && (
                  <div className="flex gap-2">
                    <span className="font-mono text-[10px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded">
                      {selected.size} selected
                    </span>
                    <span className="font-mono text-[10px] px-2 py-0.5 bg-white/[0.04] border border-white/[0.08] text-slate-500 rounded">
                      {lineCount} lines
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSelected(new Set())}
                  className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-red-400 hover:border-red-500/30 transition-all">
                  Clear all
                </button>
                <button onClick={download} disabled={!output}
                  className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-emerald-400 hover:border-emerald-500/30 disabled:opacity-30 transition-all">
                  ↓ .gitignore
                </button>
                <button onClick={copy} disabled={!output}
                  className={`font-mono text-xs px-4 py-1.5 rounded border transition-all ${copied ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300 disabled:opacity-30"}`}>
                  {copied ? "✓ Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* Selected badges */}
            {selected.size > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {Array.from(selected).map((key) => {
                  const t = TEMPLATES[key];
                  const catMeta = CATEGORY_META[t?.category ?? "Misc"];
                  return (
                    <button key={key} onClick={() => toggle(key)}
                      className={`flex items-center gap-1.5 font-mono text-[11px] px-2.5 py-1 rounded border transition-all ${catMeta.tag} ${catMeta.color} hover:opacity-70`}>
                      {t?.icon} {key} ×
                    </button>
                  );
                })}
              </div>
            )}

            {/* Output */}
            <div className="flex-1 min-h-[580px] font-mono text-xs bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 overflow-auto leading-relaxed">
              {!output && (
                <div className="text-center py-16">
                  <div className="text-4xl mb-4">🚫</div>
                  <p className="font-mono text-sm text-slate-600">Select templates from the left to generate your .gitignore</p>
                </div>
              )}
              {output && output.split("\n").map((line, i) => {
                let cls = "text-slate-400";
                if (line.startsWith("#")) cls = "text-slate-600 italic";
                else if (line.startsWith("!")) cls = "text-emerald-400";
                else if (line === "") cls = "";
                else if (line.endsWith("/")) cls = "text-cyan-400";
                else if (line.startsWith("*.")) cls = "text-orange-400";
                else cls = "text-slate-300";
                return <div key={i} className={cls}>{line || "\u00A0"}</div>;
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}