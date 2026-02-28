"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useRef, useCallback, useEffect } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
type Theme = {
  name: string;
  bg: string;
  text: string;
  keyword: string;
  string: string;
  comment: string;
  number: string;
  function: string;
  operator: string;
  lineNum: string;
  windowBg: string;
  windowBorder: string;
};

type Language = "javascript" | "typescript" | "python" | "rust" | "go" | "css" | "html" | "bash" | "json" | "jsx";

type BgStyle = "gradient" | "solid" | "mesh" | "none";

type WindowStyle = "mac" | "windows" | "none";

// ── Themes ─────────────────────────────────────────────────────────────────
const THEMES: Record<string, Theme> = {
  "Night Owl": {
    name: "Night Owl", bg: "#011627", text: "#d6deeb", keyword: "#c792ea",
    string: "#addb67", comment: "#637777", number: "#f78c6c",
    function: "#82aaff", operator: "#c792ea", lineNum: "#3d5a6d",
    windowBg: "#011627", windowBorder: "#1d3b53",
  },
  "Dracula": {
    name: "Dracula", bg: "#282a36", text: "#f8f8f2", keyword: "#ff79c6",
    string: "#f1fa8c", comment: "#6272a4", number: "#bd93f9",
    function: "#50fa7b", operator: "#ff79c6", lineNum: "#44475a",
    windowBg: "#282a36", windowBorder: "#44475a",
  },
  "One Dark": {
    name: "One Dark", bg: "#282c34", text: "#abb2bf", keyword: "#c678dd",
    string: "#98c379", comment: "#5c6370", number: "#d19a66",
    function: "#61afef", operator: "#56b6c2", lineNum: "#495162",
    windowBg: "#21252b", windowBorder: "#181a1f",
  },
  "Monokai": {
    name: "Monokai", bg: "#272822", text: "#f8f8f2", keyword: "#f92672",
    string: "#e6db74", comment: "#75715e", number: "#ae81ff",
    function: "#a6e22e", operator: "#f92672", lineNum: "#49483e",
    windowBg: "#1e1f1c", windowBorder: "#3e3d32",
  },
  "GitHub Dark": {
    name: "GitHub Dark", bg: "#0d1117", text: "#e6edf3", keyword: "#ff7b72",
    string: "#a5d6ff", comment: "#8b949e", number: "#79c0ff",
    function: "#d2a8ff", operator: "#ff7b72", lineNum: "#30363d",
    windowBg: "#161b22", windowBorder: "#30363d",
  },
  "Solarized": {
    name: "Solarized", bg: "#002b36", text: "#839496", keyword: "#859900",
    string: "#2aa198", comment: "#586e75", number: "#d33682",
    function: "#268bd2", operator: "#cb4b16", lineNum: "#073642",
    windowBg: "#073642", windowBorder: "#094c5a",
  },
  "Nord": {
    name: "Nord", bg: "#2e3440", text: "#d8dee9", keyword: "#81a1c1",
    string: "#a3be8c", comment: "#4c566a", number: "#b48ead",
    function: "#88c0d0", operator: "#81a1c1", lineNum: "#434c5e",
    windowBg: "#3b4252", windowBorder: "#434c5e",
  },
  "Light": {
    name: "Light", bg: "#fafafa", text: "#383a42", keyword: "#a626a4",
    string: "#50a14f", comment: "#a0a1a7", number: "#986801",
    function: "#4078f2", operator: "#0184bc", lineNum: "#c8c8c8",
    windowBg: "#f0f0f0", windowBorder: "#ddd",
  },
};

const BG_GRADIENTS = [
  { label: "Sunset",    value: "linear-gradient(135deg, #ff6b35 0%, #f7c59f 50%, #efefd0 100%)" },
  { label: "Ocean",     value: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)" },
  { label: "Aurora",    value: "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, #533483 100%)" },
  { label: "Neon",      value: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)" },
  { label: "Candy",     value: "linear-gradient(135deg, #f953c6 0%, #b91d73 100%)" },
  { label: "Forest",    value: "linear-gradient(135deg, #1d4350 0%, #a43931 100%)" },
  { label: "Gold",      value: "linear-gradient(135deg, #f7971e 0%, #ffd200 100%)" },
  { label: "Mint",      value: "linear-gradient(135deg, #0cebeb 0%, #20e3b2 50%, #29ffc6 100%)" },
  { label: "Night",     value: "linear-gradient(135deg, #0f0c29 0%, #1a1a2e 100%)" },
  { label: "Mesh",      value: "radial-gradient(at 40% 20%, #ff6b35 0, transparent 50%), radial-gradient(at 80% 0%, #004e89 0, transparent 50%), radial-gradient(at 0% 50%, #1a936f 0, transparent 50%), radial-gradient(at 60% 100%, #f7c59f 0, transparent 50%)" },
];

// ── Syntax highlighter ─────────────────────────────────────────────────────
function highlight(code: string, lang: Language, theme: Theme): string {
  let s = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const slot = (slots: string[], val: string) => { const id = `\x00${slots.length}\x00`; slots.push(val); return id; };
  const slots: string[] = [];

  // Comments
  if (lang === "html" || lang === "css") {
    s = s.replace(/(\/\*[\s\S]*?\*\/)/g, m => slot(slots, `<span style="color:${theme.comment};font-style:italic">${m}</span>`));
  } else {
    s = s.replace(/(\/\/[^\n]*)/g, m => slot(slots, `<span style="color:${theme.comment};font-style:italic">${m}</span>`));
    s = s.replace(/(\/\*[\s\S]*?\*\/)/g, m => slot(slots, `<span style="color:${theme.comment};font-style:italic">${m}</span>`));
    s = s.replace(/(#[^\n]*)/g, (m, _, offset) => {
      if (lang === "python" || lang === "bash") return slot(slots, `<span style="color:${theme.comment};font-style:italic">${m}</span>`);
      return m;
    });
  }

  // Strings
  s = s.replace(/("""[\s\S]*?"""|'''[\s\S]*?'''|`[\s\S]*?`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,
    m => slot(slots, `<span style="color:${theme.string}">${m}</span>`));

  // Keywords
  const kwMap: Record<Language, string[]> = {
    javascript: ["const","let","var","function","return","if","else","for","while","do","switch","case","break","continue","new","this","typeof","instanceof","class","extends","import","export","default","async","await","try","catch","finally","throw","null","undefined","true","false","void","delete","in","of","yield","static","get","set","from","as"],
    typescript: ["const","let","var","function","return","if","else","for","while","do","switch","case","break","continue","new","this","typeof","instanceof","class","extends","import","export","default","async","await","try","catch","finally","throw","null","undefined","true","false","void","delete","in","of","yield","static","get","set","from","as","interface","type","enum","namespace","declare","abstract","implements","readonly","public","private","protected","any","string","number","boolean","never","unknown","keyof","infer"],
    jsx: ["const","let","var","function","return","if","else","for","while","new","this","class","extends","import","export","default","async","await","null","undefined","true","false"],
    python: ["def","class","return","if","elif","else","for","while","in","not","and","or","is","import","from","as","try","except","finally","raise","with","yield","lambda","pass","break","continue","True","False","None","async","await","global","nonlocal","del","assert"],
    rust: ["fn","let","mut","const","if","else","for","while","loop","match","return","pub","use","mod","struct","enum","impl","trait","type","where","move","ref","in","break","continue","true","false","self","Self","super","crate","async","await","dyn","Box","Option","Some","None","Result","Ok","Err","Vec","String"],
    go: ["func","var","const","type","struct","interface","map","chan","if","else","for","range","switch","case","default","return","break","continue","goto","fallthrough","defer","go","select","package","import","nil","true","false","make","new","len","cap","append","copy","delete","panic","recover","error","string","int","bool","byte","rune","float64","float32"],
    css: ["important","px","em","rem","vh","vw","%","auto","none","flex","grid","block","inline","absolute","relative","fixed","sticky","center","bold","normal","solid","dashed","dotted","transparent","inherit","initial","unset"],
    html: ["html","head","body","div","span","p","h1","h2","h3","a","img","input","button","form","script","style","link","meta","nav","header","footer","main","section","article","ul","ol","li","table","tr","td","th"],
    bash: ["echo","cd","ls","mkdir","rm","cp","mv","cat","grep","find","sed","awk","chmod","chown","sudo","apt","npm","yarn","git","docker","export","source","if","then","else","fi","for","while","do","done","function","return","exit","true","false"],
    json: [],
  };

  const kws = kwMap[lang] ?? [];
  if (kws.length > 0) {
    const kwRegex = new RegExp(`\\b(${kws.join("|")})\\b`, "g");
    s = s.replace(kwRegex, m => slot(slots, `<span style="color:${theme.keyword};font-weight:600">${m}</span>`));
  }

  // Numbers
  s = s.replace(/\b(\d+\.?\d*)\b/g, m => slot(slots, `<span style="color:${theme.number}">${m}</span>`));

  // Functions
  s = s.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\s*\()/g, m => slot(slots, `<span style="color:${theme.function}">${m}</span>`));

  // HTML tags
  if (lang === "html") {
    s = s.replace(/(&lt;\/?[a-z][a-z0-9]*)/gi, m => slot(slots, `<span style="color:${theme.keyword}">${m}</span>`));
    s = s.replace(/([a-z-]+=)/gi, m => slot(slots, `<span style="color:${theme.function}">${m}</span>`));
    s = s.replace(/(&gt;)/g, m => slot(slots, `<span style="color:${theme.keyword}">${m}</span>`));
  }

  // Restore slots
  return s.replace(/\x00(\d+)\x00/g, (_, i) => slots[+i]);
}

// ── Examples ───────────────────────────────────────────────────────────────
const EXAMPLES: Record<Language, string> = {
  javascript: `async function fetchUser(id) {
  try {
    const res = await fetch(\`/api/users/\${id}\`);
    if (!res.ok) throw new Error("Not found");
    
    const user = await res.json();
    return { success: true, data: user };
  } catch (err) {
    console.error("Failed:", err.message);
    return { success: false, error: err };
  }
}

// Call it
const result = await fetchUser(42);
console.log(result.data?.name ?? "Unknown");`,
  typescript: `interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
}

async function getUser(id: number): Promise<User | null> {
  const res = await fetch(\`/api/users/\${id}\`);
  if (!res.ok) return null;
  return res.json() as Promise<User>;
}

const user = await getUser(1);
console.log(user?.name ?? "Not found");`,
  python: `from typing import Optional
import asyncio

class UserService:
    def __init__(self, db_url: str):
        self.db_url = db_url
        self._cache: dict = {}

    async def get_user(self, user_id: int) -> Optional[dict]:
        if user_id in self._cache:
            return self._cache[user_id]
        
        user = await self._fetch_from_db(user_id)
        if user:
            self._cache[user_id] = user
        return user

    async def _fetch_from_db(self, user_id: int):
        # Simulate DB query
        await asyncio.sleep(0.1)
        return {"id": user_id, "name": "Alice"}`,
  rust: `use std::collections::HashMap;

#[derive(Debug, Clone)]
struct User {
    id: u32,
    name: String,
    email: String,
}

fn find_user(
    users: &HashMap<u32, User>,
    id: u32,
) -> Option<&User> {
    users.get(&id)
}

fn main() {
    let mut users = HashMap::new();
    users.insert(1, User {
        id: 1,
        name: String::from("Alice"),
        email: String::from("alice@example.com"),
    });

    match find_user(&users, 1) {
        Some(user) => println!("Found: {}", user.name),
        None => println!("Not found"),
    }
}`,
  go: `package main

import (
    "fmt"
    "errors"
)

type User struct {
    ID    int
    Name  string
    Email string
}

func getUser(id int) (*User, error) {
    if id <= 0 {
        return nil, errors.New("invalid id")
    }
    return &User{
        ID:    id,
        Name:  "Alice",
        Email: "alice@example.com",
    }, nil
}

func main() {
    user, err := getUser(1)
    if err != nil {
        fmt.Printf("Error: %v\\n", err)
        return
    }
    fmt.Printf("Hello, %s!\\n", user.Name)
}`,
  jsx: `import { useState, useEffect } from "react";

export default function UserCard({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(\`/api/users/\${userId}\`)
      .then(r => r.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <div className="spinner" />;

  return (
    <div className="card">
      <img src={user.avatar} alt={user.name} />
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}`,
  css: `.card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  transition: transform 0.2s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.card h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #ff6b35;
}`,
  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width" />
  <title>My App</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <header class="navbar">
    <a href="/" class="logo">MyApp</a>
    <nav>
      <a href="/about">About</a>
      <a href="/contact">Contact</a>
    </nav>
  </header>

  <main class="container">
    <h1>Hello, World!</h1>
    <p>Welcome to my app.</p>
    <button onclick="handleClick()">Click me</button>
  </main>

  <script src="app.js"></script>
</body>
</html>`,
  bash: `#!/bin/bash
set -e

APP_NAME="my-app"
DEPLOY_DIR="/var/www/$APP_NAME"

echo "🚀 Deploying $APP_NAME..."

# Pull latest code
git pull origin main

# Install dependencies
npm ci --production

# Build
npm run build

# Restart service
pm2 restart $APP_NAME || pm2 start dist/index.js --name $APP_NAME

echo "✅ Deploy complete!"`,
  json: `{
  "name": "my-project",
  "version": "1.0.0",
  "description": "A cool project",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint ."
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "18.2.0",
    "react-dom": "18.2.0"
  },
  "devDependencies": {
    "typescript": "5.0.0",
    "@types/react": "18.2.0",
    "eslint": "8.0.0"
  }
}`,
};

const LANGUAGES: { key: Language; label: string }[] = [
  { key: "javascript", label: "JS"  },
  { key: "typescript", label: "TS"  },
  { key: "jsx",        label: "JSX" },
  { key: "python",     label: "PY"  },
  { key: "rust",       label: "RS"  },
  { key: "go",         label: "GO"  },
  { key: "css",        label: "CSS" },
  { key: "html",       label: "HTML"},
  { key: "bash",       label: "SH"  },
  { key: "json",       label: "JSON"},
];

// ── Window chrome ──────────────────────────────────────────────────────────
function MacButtons() {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <div className="w-3 h-3 rounded-full bg-[#ff5f57] shadow-sm" />
      <div className="w-3 h-3 rounded-full bg-[#febc2e] shadow-sm" />
      <div className="w-3 h-3 rounded-full bg-[#28c840] shadow-sm" />
    </div>
  );
}

function WinButtons() {
  return (
    <div className="flex items-center gap-1 shrink-0">
      {["─", "□", "✕"].map((s, i) => (
        <div key={i} className="w-6 h-5 flex items-center justify-center text-[10px] text-slate-500 bg-white/[0.04] hover:bg-white/10 rounded-sm font-mono">
          {s}
        </div>
      ))}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function CodeScreenshot() {
  const [code, setCode]           = useState(EXAMPLES.javascript);
  const [lang, setLang]           = useState<Language>("javascript");
  const [themeName, setThemeName] = useState("Night Owl");
  const [bgIdx, setBgIdx]         = useState(0);
  const [bgStyle, setBgStyle]     = useState<BgStyle>("gradient");
  const [windowStyle, setWindowStyle] = useState<WindowStyle>("mac");
  const [showLineNums, setShowLineNums] = useState(true);
  const [fileName, setFileName]   = useState("index.js");
  const [padding, setPadding]     = useState(48);
  const [fontSize, setFontSize]   = useState(14);
  const [lineHeight, setLineHeight] = useState(1.7);
  const [borderRadius, setBorderRadius] = useState(12);
  const [shadow, setShadow]       = useState(true);
  const [copied, setCopied]       = useState(false);
  const [exporting, setExporting] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const theme = THEMES[themeName];

  // Sync filename extension with language
  useEffect(() => {
    const extMap: Record<Language, string> = {
      javascript: "js", typescript: "ts", jsx: "jsx", python: "py",
      rust: "rs", go: "go", css: "css", html: "html", bash: "sh", json: "json",
    };
    setFileName(prev => prev.replace(/\.[^.]+$/, "") + "." + extMap[lang]);
  }, [lang]);

  const highlighted = highlight(code, lang, theme);
  const lines = code.split("\n");

  const bgValue = bgStyle === "gradient"
    ? BG_GRADIENTS[bgIdx].value
    : bgStyle === "solid"
    ? "#1a1a2e"
    : bgStyle === "mesh"
    ? BG_GRADIENTS[9].value
    : "transparent";

  // Export via html2canvas (loaded dynamically)
  const handleExport = useCallback(async () => {
    if (!previewRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName.replace(/\.[^.]+$/, "")}_screenshot.png`;
      a.click();
    } catch (e) {
      console.error(e);
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  }, [fileName]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const handleLoadExample = (l: Language) => {
    setLang(l);
    setCode(EXAMPLES[l]);
  };

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      {/* BG */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-orange-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

      <ToolNavbar toolName="Code Screenshot" />

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-orange-500/10 flex items-center justify-center text-orange-400 text-lg">📸</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Code Screenshot</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded">export PNG</span>
          </div>
          <p className="text-slate-500 text-sm">Create beautiful code screenshots — themes, backgrounds, window styles, and more. Export as PNG.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-6">

          {/* ── LEFT: Controls ── */}
          <div className="flex flex-col gap-4 xl:max-h-[calc(100vh-200px)] xl:overflow-y-auto xl:pr-1 scrollbar-thin">

            {/* Language */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
              <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-3">Language</p>
              <div className="flex flex-wrap gap-1.5">
                {LANGUAGES.map(l => (
                  <button key={l.key} onClick={() => handleLoadExample(l.key)}
                    className={`font-mono text-xs px-3 py-1 rounded border transition-all
                      ${lang === l.key ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
              <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-3">Theme</p>
              <div className="flex flex-col gap-1.5">
                {Object.keys(THEMES).map(t => (
                  <button key={t} onClick={() => setThemeName(t)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all text-left
                      ${themeName === t ? "bg-orange-500/10 border-orange-500/30" : "border-white/[0.06] hover:border-white/20"}`}>
                    {/* Mini color preview */}
                    <div className="flex gap-1 shrink-0">
                      {[THEMES[t].keyword, THEMES[t].string, THEMES[t].function].map((c, i) => (
                        <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                      ))}
                    </div>
                    <span className={`font-mono text-xs ${themeName === t ? "text-orange-400" : "text-slate-400"}`}>{t}</span>
                    {/* BG swatch */}
                    <div className="ml-auto w-5 h-5 rounded border border-white/10" style={{ background: THEMES[t].bg }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Background */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
              <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-3">Background</p>
              <div className="flex gap-1 mb-3">
                {(["gradient","solid","mesh","none"] as BgStyle[]).map(s => (
                  <button key={s} onClick={() => setBgStyle(s)}
                    className={`flex-1 font-mono text-[11px] py-1 rounded border transition-all capitalize
                      ${bgStyle === s ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                    {s}
                  </button>
                ))}
              </div>
              {(bgStyle === "gradient" || bgStyle === "mesh") && (
                <div className="flex flex-wrap gap-1.5">
                  {BG_GRADIENTS.slice(0, bgStyle === "mesh" ? 1 : 9).map((g, i) => (
                    <button key={i} onClick={() => setBgIdx(i)}
                      className={`w-8 h-8 rounded-lg border transition-all hover:scale-110 ${bgIdx === i ? "border-orange-500/60 scale-110" : "border-white/10"}`}
                      style={{ background: g.value }}
                      title={g.label} />
                  ))}
                </div>
              )}
              {bgStyle === "solid" && (
                <div className="flex flex-wrap gap-1.5">
                  {["#1a1a2e","#0d1117","#000000","#282c34","#1e1e2e","#ffffff","#f8f8f2"].map(c => (
                    <button key={c} onClick={() => {}}
                      className="w-8 h-8 rounded-lg border border-white/10 hover:scale-110 transition-all"
                      style={{ background: c }} title={c} />
                  ))}
                </div>
              )}
            </div>

            {/* Window style */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
              <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-3">Window Style</p>
              <div className="flex gap-2">
                {(["mac","windows","none"] as WindowStyle[]).map(w => (
                  <button key={w} onClick={() => setWindowStyle(w)}
                    className={`flex-1 font-mono text-xs py-1.5 rounded border transition-all capitalize
                      ${windowStyle === w ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                    {w === "mac" ? "🍎 Mac" : w === "windows" ? "🪟 Win" : "⬜ None"}
                  </button>
                ))}
              </div>
            </div>

            {/* File name */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
              <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-3">File Name</p>
              <input value={fileName} onChange={e => setFileName(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] font-mono text-sm text-slate-300 rounded-lg px-3 py-2 outline-none focus:border-orange-500/40 transition-colors" />
            </div>

            {/* Appearance */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4 space-y-4">
              <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600">Appearance</p>

              {[
                { label: "Padding",      min: 16, max: 96, step: 8,  val: padding,     set: setPadding     },
                { label: "Font Size",    min: 10, max: 22, step: 1,  val: fontSize,    set: setFontSize    },
                { label: "Line Height", min: 1.2, max: 2.2, step: 0.1, val: lineHeight, set: setLineHeight  },
                { label: "Radius",       min: 0,  max: 24, step: 2,  val: borderRadius, set: setBorderRadius },
              ].map(({ label, min, max, step, val, set }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-slate-600 w-24 shrink-0">{label}</span>
                  <input type="range" min={min} max={max} step={step} value={val}
                    onChange={e => set(+e.target.value as never)}
                    className="flex-1 accent-orange-500" />
                  <span className="font-mono text-xs text-orange-400 w-8 text-right shrink-0">{val}</span>
                </div>
              ))}

              {/* Toggles */}
              <div className="flex flex-col gap-2 pt-1">
                {[
                  { label: "Line Numbers", val: showLineNums, set: setShowLineNums },
                  { label: "Box Shadow",   val: shadow,       set: setShadow       },
                ].map(({ label, val, set }) => (
                  <label key={label} onClick={() => set(p => !p)}
                    className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-8 h-4 rounded-full transition-all relative ${val ? "bg-orange-500" : "bg-white/10"}`}>
                      <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${val ? "left-4" : "left-0.5"}`} />
                    </div>
                    <span className="font-mono text-xs text-slate-500 group-hover:text-slate-300 transition-colors">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Preview + Editor ── */}
          <div className="flex flex-col gap-4">

            {/* Preview */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-6 overflow-auto">
              <p className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-4">Preview</p>

              {/* The screenshot canvas */}
              <div ref={previewRef} className="inline-block min-w-full"
                style={{
                  background: bgStyle === "none" ? "transparent" : bgValue,
                  padding: `${padding}px`,
                  borderRadius: bgStyle === "none" ? 0 : 16,
                }}>
                {/* Window frame */}
                <div style={{
                  background: theme.windowBg,
                  borderRadius: borderRadius,
                  border: `1px solid ${theme.windowBorder}`,
                  boxShadow: shadow ? "0 32px 64px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.4)" : "none",
                  overflow: "hidden",
                  minWidth: 400,
                }}>
                  {/* Title bar */}
                  {windowStyle !== "none" && (
                    <div style={{
                      background: theme.windowBg,
                      borderBottom: `1px solid ${theme.windowBorder}`,
                      padding: "12px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}>
                      {windowStyle === "mac" && <MacButtons />}
                      <span style={{
                        fontFamily: "monospace",
                        fontSize: 12,
                        color: theme.lineNum,
                        flex: 1,
                        textAlign: windowStyle === "mac" ? "center" : "left",
                        marginLeft: windowStyle === "mac" ? -60 : 0,
                      }}>{fileName}</span>
                      {windowStyle === "windows" && <WinButtons />}
                    </div>
                  )}

                  {/* Code */}
                  <div style={{ padding: "20px 0", overflowX: "auto" }}>
                    <table style={{ borderCollapse: "collapse", width: "100%" }}>
                      <tbody>
                        {lines.map((line, i) => (
                          <tr key={i}>
                            {showLineNums && (
                              <td style={{
                                fontFamily: '"Fira Code", "JetBrains Mono", "Cascadia Code", monospace',
                                fontSize: fontSize,
                                lineHeight: lineHeight,
                                color: theme.lineNum,
                                paddingLeft: 20,
                                paddingRight: 16,
                                textAlign: "right",
                                userSelect: "none",
                                minWidth: 48,
                                verticalAlign: "top",
                              }}>{i + 1}</td>
                            )}
                            <td style={{
                              fontFamily: '"Fira Code", "JetBrains Mono", "Cascadia Code", monospace',
                              fontSize: fontSize,
                              lineHeight: lineHeight,
                              color: theme.text,
                              paddingLeft: showLineNums ? 0 : 24,
                              paddingRight: 32,
                              whiteSpace: "pre",
                              verticalAlign: "top",
                            }}
                              dangerouslySetInnerHTML={{ __html: highlight(line, lang, theme) || " " }}
                            />
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Code editor */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06]">
                <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Code Editor</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-slate-700">{lines.length} lines</span>
                  <button onClick={handleCopyCode}
                    className={`font-mono text-[11px] px-3 py-1 rounded border transition-all
                      ${copied ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                    {copied ? "✓ Copied!" : "Copy Code"}
                  </button>
                </div>
              </div>
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                spellCheck={false}
                className="w-full h-52 font-mono text-sm bg-transparent p-4 text-slate-300 outline-none resize-none leading-relaxed"
                placeholder="Paste your code here…"
              />
            </div>

            {/* Export bar */}
            <div className="flex flex-wrap gap-3 items-center px-4 py-3 bg-orange-500/[0.05] border border-orange-500/20 rounded-lg">
              <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Theme</span><span className="font-mono text-sm text-orange-400">{themeName}</span></div>
              <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Lang</span><span className="font-mono text-sm text-orange-400">{LANGUAGES.find(l => l.key === lang)?.label}</span></div>
              <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Lines</span><span className="font-mono text-sm text-orange-400">{lines.length}</span></div>
              <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Font</span><span className="font-mono text-sm text-orange-400">{fontSize}px</span></div>
              <div className="ml-auto flex items-center gap-2">
                <button onClick={handleExport} disabled={exporting}
                  className="font-mono text-sm px-5 py-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-lg hover:bg-orange-500/20 hover:border-orange-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold flex items-center gap-2">
                  {exporting ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-orange-400/30 border-t-orange-400 animate-spin" />
                      Exporting…
                    </>
                  ) : "📸 Export PNG"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
          {[
            { icon: "🎨", title: "8 Themes",       desc: "Night Owl, Dracula, One Dark, Monokai, GitHub Dark, Solarized, Nord, Light — with live preview." },
            { icon: "✨", title: "Full Customization", desc: "Background gradients, window styles (Mac/Windows), padding, font size, line numbers, border radius." },
            { icon: "📸", title: "2x PNG Export",  desc: "Export at 2× retina resolution for crisp, shareable screenshots via html2canvas." },
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