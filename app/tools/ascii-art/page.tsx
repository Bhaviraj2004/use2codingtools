"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useRef, useCallback, useEffect } from "react";

type AsciiMode = "text" | "image";
type FontStyle = keyof typeof FONTS;
type CharSet  = keyof typeof CHAR_SETS;
type ColorMode = "none" | "orange" | "matrix" | "rainbow" | "cyan";

const FONTS = {
  "Big": {
    height: 6,
    chars: {
      A: ["  /\\  "," /  \\ "," /----\\"," /    \\","/      \\",""],
      B: ["|----\\ ","|    / ","|---/  ","|    \\ ","|-----/",""],
      C: [" /----","| ","| ","| ","  \\----",""],
      D: ["|----\\ ","|     \\","|      |","|     /","|----/ ",""],
      E: ["|------","|      ","|----  ","|      ","|------",""],
      F: ["|------","|      ","|----  ","|      ","|      ",""],
      G: [" /----","| ","| ","| ","\\----",""],
      H: ["|      |","|      |","|------|","|      |","|      |",""],
      I: ["|","|","|","|","|",""],
      J: ["    |","    |","    |","|   |"," \\-/ ",""],
      K: ["|  /","|/ ","|\\ ","|  \\","|   \\",""],
      L: ["|","|","|","|","|------",""],
      M: ["|\\    /|","| \\  / |","| \\/ / |","|      |","|      |",""],
      N: ["|\\  |","| \\ |","|  \\|","|   |","|   |",""],
      O: [" /----","|      |","|      |","|      |"," \\----",""],
      P: ["|----\\ ","|    / ","|---/  ","|      ","|      ",""],
      Q: [" /----","|      |","|      |","|      |"," \\---\\ ","      \\"],
      R: ["|----\\ ","|    / ","|---\\  ","|    \\ ","|     \\",""],
      S: [" /----","| "," \\----","     |","\\----/",""],
      T: ["|------|","   |   ","   |   ","   |   ","   |   ",""],
      U: ["|      |","|      |","|      |","|      |"," \\----/",""],
      V: ["\\      /","\\ "," / "," \\    / ","  \\  /  ","   \\/   ",""],
      W: ["|      |","|  /\\  |","| /  \\ |","|/    \\|","       ",""],
      X: ["\\    /","\\ / ","  \\/  ","  /\\  "," /  \\ ",""],
      Y: ["\\    /","\\ / ","  \\/  ","   |  ","   |  ",""],
      Z: ["|------","   /  ","  /   "," /    ","|------",""],
      " ": ["   ","   ","   ","   ","   ",""],
      "0": [" /--\\ ","/    \\","|    |","\\    /"," \\--/ ",""],
      "1": ["  /|","   |","   |","   |","   |",""],
      "2": [" /--\\ ","    / "," /--  ","/     ","------",""],
      "3": [" /--\\ ","    / "," /--  ","    \\ "," \\--/ ",""],
      "4": ["/  \\ ","/    \\","------","     |","     |",""],
      "5": ["------","/     "," \\--\\ ","     |"," \\--/ ",""],
      "6": [" /--\\ ","/     ","\\--\\ ","\\    |"," \\--/ ",""],
      "7": ["------","    / ","   /  ","  /   "," /    ",""],
      "8": [" /--\\ ","\\    /","  --  ","/    \\"," \\--/ ",""],
      "9": [" /--\\ ","/    \\"," \\--/ ","     |"," \\--/ ",""],
      "!": [" | "," | "," | ","   "," . ",""],
      "?": [" /--\\ ","    / ","   /  ","      ","  .   ",""],
      ".": ["  ","  ","  ","  ",". ",""],
      ",": ["  ","  ","  ","  ",", ",""],
    } as Record<string, string[]>,
  },

  "Block": {
    height: 5,
    chars: {
      A: ["█████","█   █","█████","█   █","█   █"],
      B: ["████ ","█   █","████ ","█   █","████ "],
      C: ["█████","█    ","█    ","█    ","█████"],
      D: ["████ ","█   █","█   █","█   █","████ "],
      E: ["█████","█    ","███  ","█    ","█████"],
      F: ["█████","█    ","███  ","█    ","█    "],
      G: ["█████","█    ","█  ██","█   █","█████"],
      H: ["█   █","█   █","█████","█   █","█   █"],
      I: ["█████","  █  ","  █  ","  █  ","█████"],
      J: ["█████","   █ ","   █ ","█  █ "," ██  "],
      K: ["█   █","█  █ ","███  ","█  █ ","█   █"],
      L: ["█    ","█    ","█    ","█    ","█████"],
      M: ["█   █","██ ██","█ █ █","█   █","█   █"],
      N: ["█   █","██  █","█ █ █","█  ██","█   █"],
      O: ["█████","█   █","█   █","█   █","█████"],
      P: ["████ ","█   █","████ ","█    ","█    "],
      Q: ["█████","█   █","█ █ █","█  ██","█████"],
      R: ["████ ","█   █","████ ","█  █ ","█   █"],
      S: ["█████","█    ","█████","    █","█████"],
      T: ["█████","  █  ","  █  ","  █  ","  █  "],
      U: ["█   █","█   █","█   █","█   █","█████"],
      V: ["█   █","█   █","█   █"," █ █ ","  █  "],
      W: ["█   █","█   █","█ █ █","██ ██","█   █"],
      X: ["█   █"," █ █ ","  █  "," █ █ ","█   █"],
      Y: ["█   █"," █ █ ","  █  ","  █  ","  █  "],
      Z: ["█████","   █ ","  █  "," █   ","█████"],
      " ": ["     ","     ","     ","     ","     "],
      "0": ["█████","█   █","█   █","█   █","█████"],
      "1": ["  █  "," ██  ","  █  ","  █  ","█████"],
      "2": ["█████","    █","█████","█    ","█████"],
      "3": ["█████","    █","█████","    █","█████"],
      "4": ["█   █","█   █","█████","    █","    █"],
      "5": ["█████","█    ","█████","    █","█████"],
      "6": ["█████","█    ","█████","█   █","█████"],
      "7": ["█████","    █","   █ ","  █  ","  █  "],
      "8": ["█████","█   █","█████","█   █","█████"],
      "9": ["█████","█   █","█████","    █","█████"],
      "!": ["  █  ","  █  ","  █  ","     ","  █  "],
      "?": ["█████","    █","  ██ ","     ","  █  "],
      ".": ["     ","     ","     ","     ","  █  "],
      ",": ["     ","     ","     ","  █  "," █   "],
    } as Record<string, string[]>,
  },

  "Slim": {
    height: 5,
    chars: {
      A: [" /\\ "," /  \\","/----\\","     ","     "],
      B: ["|-- \\","|   /","|--< ","    \\","--/ "],
      C: [" /--","| ","| "," \\--","    "],
      D: ["|-- \\","|   |","|   |","|   /","--/ "],
      E: ["|---","| --","|   ","    ","|---"],
      F: ["|---","| --","|   ","    ","|   "],
      G: [" /--","| ","| --","   |"," \\--"],
      H: ["|  |","|  |","|--|","|  |","|  |"],
      I: ["-|-"," | "," | "," | ","-|-"],
      J: ["  |","  |","  |",". |"," \\  "],
      K: ["| /","|-< ","|\\ ","   \\","    \\"],
      L: ["|   ","|   ","|   ","|   ","|---"],
      M: ["|\\  /|","| \\/ |","|    |","|    |","|    |"],
      N: ["|\\  |","| \\ |","|  \\|","|   |","|   |"],
      O: [" /--","| ","| ","   |"," \\--"],
      P: ["|-- \\","|  / ","|--< ","|    ","|    "],
      Q: [" /--","| ","| ","   |"," \\--\\"],
      R: ["|-- \\","|  / ","|--< ","| \\ ","    \\"],
      S: [" /--","| "," \\--","   |","\\---"],
      T: ["---","  |","  |","  |","  |"],
      U: ["|  |","|  |","|  |","|  |"," \\/ "],
      V: ["\\  /","\\  /","\\ / "," \\/  ","    "],
      W: ["|  |"," \\/ ","  /\\","    |","    |"],
      X: ["\\  /","\\ / "," /\\ ","/  \\","    "],
      Y: ["\\  /","\\ / "," |  ","  |  ","  |  "],
      Z: ["---","  /","/  "," /  ","---"],
      " ": ["   ","   ","   ","   ","   "],
      "0": [" -- ","|  |","|  |","|  |"," -- "],
      "1": [" | "," | "," | "," | "," | "],
      "2": [" -- ","   |"," --","|   "," ---"],
      "3": [" -- ","   |"," --","   |"," -- "],
      "4": ["|  |","|  |"," --|","   |","   |"],
      "5": [" ---","|   "," -- ","   |"," -- "],
      "6": [" -- ","| ","| --","|  |"," -- "],
      "7": [" ---","   |","  /","  | ","  | "],
      "8": [" -- ","|  |"," -- ","|  |"," -- "],
      "9": [" -- ","|  |"," --|","   |"," -- "],
      "!": [" | "," | "," | ","   "," . "],
      "?": [" -- ","   |","  / ","    ","  . "],
      ".": ["   ","   ","   ","   "," . "],
      ",": ["   ","   ","   ","  ","  ,"],
    } as Record<string, string[]>,
  },
} as const;

const CHAR_SETS = {
  "Standard":  " .:-=+*#%@",
  "Dense":     " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
  "Binary":    " 01",
  "Blocks":    " ░▒▓█",
  "Dots":      " ·•●",
  "Minimal":   " .+#",
  "Symbols":   " .-~:=+*#@$",
} as const;

function renderTextAscii(text: string, fontName: FontStyle): string {
  const font = FONTS[fontName];
  const upper = text.toUpperCase();
  const chars = upper.split("");
  if (chars.length === 0) return "";
  const rows: string[][] = Array.from({ length: font.height }, () => []);
  chars.forEach(ch => {
    const glyph = font.chars[ch] ?? font.chars[" "] ?? Array(font.height).fill("  ");
    for (let r = 0; r < font.height; r++) {
      rows[r].push(glyph[r] ?? "  ");
    }
  });
  return rows.map(r => r.join(" ")).join("\n");
}

async function imageToAscii(file: File, width: number, charSet: string, invert: boolean): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const aspect = img.naturalHeight / img.naturalWidth;
      const cols = width;
      const rows = Math.round(cols * aspect * 0.45);
      const canvas = document.createElement("canvas");
      canvas.width = cols; canvas.height = rows;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, cols, rows);
      const data = ctx.getImageData(0, 0, cols, rows).data;
      const chars = charSet.split("");
      const last  = chars.length - 1;
      let result = "";
      for (let r = 0; r < rows; r++) {
        let line = "";
        for (let c = 0; c < cols; c++) {
          const idx = (r * cols + c) * 4;
          const lum = (data[idx] * 0.299 + data[idx+1] * 0.587 + data[idx+2] * 0.114) / 255;
          const t   = invert ? 1 - lum : lum;
          line += chars[Math.round(t * last)];
        }
        result += line + "\n";
      }
      resolve(result);
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

function addBorder(art: string, style: string): string {
  if (style === "none") return art;
  const lines  = art.split("\n");
  const width  = Math.max(...lines.map(l => l.length));
  const padded = lines.map(l => l.padEnd(width));
  const borders: Record<string, { tl:string; tr:string; bl:string; br:string; h:string; v:string }> = {
    "single":  { tl:"┌", tr:"┐", bl:"└", br:"┘", h:"─", v:"│" },
    "double":  { tl:"╔", tr:"╗", bl:"╚", br:"╝", h:"═", v:"║" },
    "rounded": { tl:"╭", tr:"╮", bl:"╰", br:"╯", h:"─", v:"│" },
    "hash":    { tl:"#", tr:"#", bl:"#", br:"#", h:"#", v:"#" },
    "star":    { tl:"*", tr:"*", bl:"*", br:"*", h:"*", v:"*" },
    "dots":    { tl:"·", tr:"·", bl:"·", br:"·", h:"·", v:"·" },
  };
  const b = borders[style];
  if (!b) return art;
  const top = b.tl + b.h.repeat(width + 2) + b.tr;
  const bot = b.bl + b.h.repeat(width + 2) + b.br;
  const mid = padded.map(l => b.v + " " + l + " " + b.v);
  return [top, ...mid, bot].join("\n");
}

function flipH(art: string): string {
  return art.split("\n").map(l => l.split("").reverse().join("")).join("\n");
}
function flipV(art: string): string {
  return art.split("\n").reverse().join("\n");
}

const COLOR_CLASSES: Record<ColorMode, string> = {
  none:    "text-slate-300",
  orange:  "text-orange-400",
  matrix:  "text-emerald-400",
  rainbow: "",
  cyan:    "text-cyan-400",
};

const EXAMPLES = [
  { label: "Hello", text: "HELLO" },
  { label: "ASCII", text: "ASCII" },
  { label: "Code",  text: "CODE"  },
  { label: "Love",  text: "LOVE"  },
];

const PRESET_ART = [
`  /\\_/\\  
 ( o.o ) 
  > ^ <  
 (_____)  `,
`    ___
   /   \\
  | o_o |
  |  ^  |
  |_____|`,
`  * * *
* * * *
  * * *
   ***`,
`  (\\(\\
 ( -.-)
 o_(")(")`,
];

export default function AsciiArt() {
  const [mode, setMode]           = useState<AsciiMode>("text");
  const [inputText, setInputText] = useState("HELLO");
  const [font, setFont]           = useState<FontStyle>("Block");
  const [colorMode, setColorMode] = useState<ColorMode>("orange");
  const [border, setBorder]       = useState("none");
  const [artOutput, setArtOutput] = useState("");
  const [manualArt, setManualArt] = useState("");
  const [copied, setCopied]       = useState(false);
  const [activeTab, setActiveTab] = useState<"generate"|"draw"|"presets">("generate");

  const [imgFile, setImgFile]       = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState("");
  const [charSet, setCharSet]       = useState<CharSet>("Standard");
  const [imgWidth, setImgWidth]     = useState(80);
  const [invert, setInvert]         = useState(false);
  const [rendering, setRendering]   = useState(false);
  const [flippedH, setFlippedH]     = useState(false);
  const [flippedV, setFlippedV]     = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateText = useCallback(() => {
    if (!inputText.trim()) return;
    let art = renderTextAscii(inputText, font);
    if (flippedH) art = flipH(art);
    if (flippedV) art = flipV(art);
    art = addBorder(art, border);
    setArtOutput(art);
  }, [inputText, font, border, flippedH, flippedV]);

  useEffect(() => {
    if (mode === "text" && activeTab === "generate") generateText();
  }, [inputText, font, border, flippedH, flippedV, mode, activeTab, generateText]);

  const generateImage = useCallback(async () => {
    if (!imgFile) return;
    setRendering(true);
    try {
      let art = await imageToAscii(imgFile, imgWidth, CHAR_SETS[charSet], invert);
      art = addBorder(art, border);
      setArtOutput(art);
    } catch { /* silent */ } finally { setRendering(false); }
  }, [imgFile, imgWidth, charSet, invert, border]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const copy = () => {
    const art = activeTab === "draw" ? manualArt : artOutput;
    navigator.clipboard.writeText(art);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const downloadTxt = () => {
    const art = activeTab === "draw" ? manualArt : artOutput;
    const blob = new Blob([art], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ascii-art.txt";
    a.click();
  };

  const renderColored = (art: string) => {
    if (colorMode !== "rainbow") {
      return <pre className={`font-mono text-xs leading-tight whitespace-pre select-all ${COLOR_CLASSES[colorMode]}`}>{art}</pre>;
    }
    const rc = ["text-red-400","text-orange-400","text-yellow-400","text-emerald-400","text-cyan-400","text-blue-400","text-purple-400","text-pink-400"];
    return (
      <pre className="font-mono text-xs leading-tight whitespace-pre select-all">
        {art.split("\n").map((line, i) => <span key={i} className={rc[i % rc.length]}>{line}{"\n"}</span>)}
      </pre>
    );
  };

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-orange-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

            <ToolNavbar toolName="ASCII Art Generator" />


      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-orange-500/10 flex items-center justify-center font-mono font-bold text-orange-400 text-sm">▓</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">ASCII Art Generator</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded">client-side</span>
          </div>
          <p className="text-slate-500 text-sm">Convert text or images to ASCII art — multiple fonts, borders, colors, and transforms. Draw freehand or pick presets.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5">
          {([
            { key: "generate", label: "✦ Generate" },
            { key: "draw",     label: "✏ Draw"     },
            { key: "presets",  label: "⊞ Presets"  },
          ] as { key: typeof activeTab; label: string }[]).map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`font-mono text-xs px-4 py-2 rounded-lg border transition-all ${activeTab === t.key ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">

          {/* Controls */}
          <div className="flex flex-col gap-4">

            {activeTab === "generate" && (
              <>
                {/* Source */}
                <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-3">Source</p>
                  <div className="flex gap-2 mb-4">
                    {(["text","image"] as AsciiMode[]).map(m => (
                      <button key={m} onClick={() => setMode(m)}
                        className={`flex-1 font-mono text-xs py-1.5 rounded border transition-all ${mode === m ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                        {m === "text" ? "Aa Text" : "🖼 Image"}
                      </button>
                    ))}
                  </div>

                  {mode === "text" ? (
                    <div className="space-y-3">
                      <input value={inputText} onChange={e => setInputText(e.target.value.slice(0, 12))}
                        placeholder="Type text…"
                        className="w-full font-mono text-lg bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-orange-500/40 transition-colors uppercase tracking-widest" />
                      <div className="flex flex-wrap gap-1.5">
                        {EXAMPLES.map(ex => (
                          <button key={ex.text} onClick={() => setInputText(ex.text)}
                            className="font-mono text-[10px] px-2 py-0.5 rounded border border-white/[0.08] text-slate-600 hover:text-slate-300 hover:border-white/20 transition-all">{ex.label}</button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                      <button onClick={() => fileInputRef.current?.click()}
                        className="w-full font-mono text-xs py-3 border-2 border-dashed border-white/[0.12] rounded-lg text-slate-600 hover:text-slate-400 hover:border-white/20 transition-all">
                        {imgPreview ? "↺ Change Image" : "⬆ Upload Image"}
                      </button>
                      {imgPreview && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imgPreview} alt="preview" className="w-full rounded-lg border border-white/[0.08] object-cover max-h-32" />
                      )}
                    </div>
                  )}
                </div>

                {/* Font */}
                {mode === "text" && (
                  <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
                    <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-3">Font Style</p>
                    <div className="flex flex-col gap-1.5">
                      {(Object.keys(FONTS) as FontStyle[]).map(f => (
                        <button key={f} onClick={() => setFont(f)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all text-left ${font === f ? "bg-orange-500/10 border-orange-500/30 text-orange-400" : "border-white/[0.06] text-slate-500 hover:border-white/20 hover:text-slate-300"}`}>
                          <span className="font-mono text-xs font-semibold w-12 shrink-0">{f}</span>
                          <span className="font-mono text-[9px] text-slate-700">{f === "Big" ? "Slanted lines" : f === "Block" ? "█ Filled blocks" : "Minimal lines"}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Image settings */}
                {mode === "image" && (
                  <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4 space-y-3">
                    <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600">Image Settings</p>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="font-mono text-[11px] text-slate-600">Width (cols)</span>
                        <span className="font-mono text-xs text-orange-400">{imgWidth}</span>
                      </div>
                      <input type="range" min={20} max={200} step={5} value={imgWidth} onChange={e => setImgWidth(+e.target.value)} className="w-full accent-orange-500" />
                    </div>
                    <div>
                      <p className="font-mono text-[11px] text-slate-600 mb-1.5">Char Set</p>
                      <div className="flex flex-col gap-1">
                        {(Object.keys(CHAR_SETS) as CharSet[]).map(cs => (
                          <button key={cs} onClick={() => setCharSet(cs)}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded border text-left transition-all ${charSet === cs ? "bg-orange-500/10 border-orange-500/30 text-orange-400" : "border-white/[0.06] text-slate-500 hover:border-white/20 hover:text-slate-300"}`}>
                            <span className="font-mono text-[10px] w-16 shrink-0">{cs}</span>
                            <span className="font-mono text-[9px] text-slate-700 truncate">{CHAR_SETS[cs].slice(0, 16)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <label onClick={() => setInvert(p => !p)} className="flex items-center gap-2 cursor-pointer">
                      <div className={`w-8 h-4 rounded-full relative transition-all ${invert ? "bg-orange-500" : "bg-white/10"}`}>
                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${invert ? "left-4" : "left-0.5"}`} />
                      </div>
                      <span className="font-mono text-xs text-slate-500">Invert</span>
                    </label>
                    <button onClick={generateImage} disabled={!imgFile || rendering}
                      className="w-full font-mono text-sm py-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-lg hover:bg-orange-500/20 disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                      {rendering ? <><div className="w-3.5 h-3.5 rounded-full border-2 border-orange-400/30 border-t-orange-400 animate-spin" />Rendering…</> : "⇄ Render ASCII"}
                    </button>
                  </div>
                )}

                {/* Border */}
                <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-3">Border</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {["none","single","double","rounded","hash","star","dots"].map(b => (
                      <button key={b} onClick={() => setBorder(b)}
                        className={`font-mono text-[10px] py-1.5 rounded border transition-all capitalize ${border === b ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "border-white/[0.08] text-slate-600 hover:text-slate-300"}`}>
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-3">Color</p>
                  <div className="flex flex-col gap-1.5">
                    {([
                      { key: "none",    label: "Default",      cls: "text-slate-400" },
                      { key: "orange",  label: "Orange",       cls: "text-orange-400" },
                      { key: "matrix",  label: "Matrix Green", cls: "text-emerald-400" },
                      { key: "cyan",    label: "Cyan",         cls: "text-cyan-400" },
                      { key: "rainbow", label: "Rainbow",      cls: "bg-gradient-to-r from-red-400 via-yellow-400 to-blue-400 bg-clip-text text-transparent" },
                    ] as { key: ColorMode; label: string; cls: string }[]).map(c => (
                      <button key={c.key} onClick={() => setColorMode(c.key)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded border transition-all text-left ${colorMode === c.key ? "bg-orange-500/10 border-orange-500/30" : "border-white/[0.06] hover:border-white/20"}`}>
                        <span className={`font-mono text-xs font-semibold ${c.cls}`}>{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transform */}
                <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-3">Transform</p>
                  <div className="flex gap-2">
                    <button onClick={() => setFlippedH(p => !p)}
                      className={`flex-1 font-mono text-xs py-1.5 rounded border transition-all ${flippedH ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                      ⇆ Flip H
                    </button>
                    <button onClick={() => setFlippedV(p => !p)}
                      className={`flex-1 font-mono text-xs py-1.5 rounded border transition-all ${flippedV ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                      ⇅ Flip V
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === "draw" && (
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
                <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-3">Freehand Canvas</p>
                <p className="font-mono text-[10px] text-slate-700 mb-3 leading-relaxed">Use monospace symbols: / \ | - _ . , ; : ( ) [ ] * # @ %</p>
                <div className="space-y-2">
                  <button onClick={() => setManualArt("")}
                    className="w-full font-mono text-xs py-1.5 rounded border border-white/[0.08] text-slate-600 hover:text-red-400 hover:border-red-500/30 transition-all">
                    Clear Canvas
                  </button>
                  {[
                    ["Box",   "┌─────────┐\n│         │\n│         │\n└─────────┘"],
                    ["Arrow", "  ──────►"],
                    ["House", "    /\\\n   /  \\\n  /    \\\n /      \\\n/________\\"],
                    ["Star",  "   *\n  ***\n *****\n  ***\n   *"],
                    ["Heart", " ♥ ♥\n♥   ♥\n ♥ ♥\n  ♥  "],
                  ].map(([label, art]) => (
                    <button key={label} onClick={() => setManualArt(prev => prev + (prev ? "\n\n" : "") + art)}
                      className="w-full font-mono text-[10px] px-3 py-1.5 rounded border border-white/[0.06] text-slate-600 hover:text-slate-300 hover:border-white/20 transition-all text-left">
                      + Insert {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "presets" && (
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
                <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-3">Preset Gallery</p>
                <p className="font-mono text-[10px] text-slate-700">Click any preset to use it.</p>
              </div>
            )}
          </div>

          {/* Output */}
          <div className="flex flex-col gap-4">

            {activeTab === "generate" && (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">ASCII Output</span>
                  <div className="flex items-center gap-2">
                    {artOutput && <span className="font-mono text-[10px] text-slate-700">{artOutput.split("\n").length} lines · {artOutput.length} chars</span>}
                    <button onClick={copy} disabled={!artOutput}
                      className={`font-mono text-[11px] px-3 py-1 rounded border transition-all ${copied ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300 disabled:opacity-20"}`}>
                      {copied ? "✓ Copied!" : "Copy"}
                    </button>
                    <button onClick={downloadTxt} disabled={!artOutput}
                      className="font-mono text-[11px] px-3 py-1 rounded border border-white/[0.08] text-slate-500 hover:text-slate-300 disabled:opacity-20 transition-all">
                      ↓ .txt
                    </button>
                  </div>
                </div>

                <div className="min-h-64 bg-[#0a0a14] border border-white/[0.08] rounded-xl p-5 overflow-auto">
                  {artOutput ? renderColored(artOutput) : (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-700">
                      <span className="text-3xl mb-2">▓</span>
                      <span className="font-mono text-sm">ASCII art will appear here</span>
                    </div>
                  )}
                </div>

                {mode === "text" && inputText && (
                  <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
                    <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-3">All Fonts Preview</p>
                    <div className="space-y-4">
                      {(Object.keys(FONTS) as FontStyle[]).map(f => (
                        <div key={f} className="cursor-pointer group" onClick={() => setFont(f)}>
                          <span className={`font-mono text-[9px] uppercase tracking-widest block mb-1 ${font === f ? "text-orange-400" : "text-slate-700 group-hover:text-slate-500"}`}>{f}</span>
                          <pre className={`font-mono text-[10px] leading-tight ${font === f ? "text-orange-400" : "text-slate-600 group-hover:text-slate-400"} transition-colors`}>
                            {renderTextAscii(inputText.slice(0, 5), f)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === "draw" && (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">ASCII Canvas</span>
                  <button onClick={copy}
                    className={`font-mono text-[11px] px-3 py-1 rounded border transition-all ${copied ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                    {copied ? "✓ Copied!" : "Copy"}
                  </button>
                </div>
                <textarea value={manualArt} onChange={e => setManualArt(e.target.value)}
                  placeholder={"Draw your ASCII art here...\n\n    /\\\n   /  \\\n  / ☆  \\\n /      \\\n/--------\\"}
                  spellCheck={false}
                  className="flex-1 min-h-[520px] font-mono text-sm bg-[#0a0a14] border border-white/[0.08] rounded-xl p-5 text-orange-400 placeholder-slate-700 outline-none resize-none leading-tight focus:border-orange-500/30 transition-colors" />
              </>
            )}

            {activeTab === "presets" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRESET_ART.map((art, i) => (
                  <div key={i} className="bg-[#0a0a14] border border-white/[0.08] rounded-xl p-4 cursor-pointer hover:border-orange-500/30 transition-all group"
                    onClick={() => { setArtOutput(art); setActiveTab("generate"); }}>
                    <pre className="font-mono text-xs text-emerald-400/70 group-hover:text-emerald-400 leading-tight transition-colors overflow-hidden">{art}</pre>
                  </div>
                ))}
                {["HELLO","WORLD","ASCII","CODE","LOVE","2025"].map(word => (
                  <div key={word} className="bg-[#0a0a14] border border-white/[0.08] rounded-xl p-4 cursor-pointer hover:border-orange-500/30 transition-all group"
                    onClick={() => { setInputText(word); setFont("Block"); setActiveTab("generate"); }}>
                    <pre className="font-mono text-[9px] text-orange-400/60 group-hover:text-orange-400 leading-tight transition-colors overflow-hidden">
                      {renderTextAscii(word, "Block")}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {artOutput && activeTab === "generate" && (
          <div className="flex flex-wrap gap-6 px-4 py-3 bg-orange-500/[0.05] border border-orange-500/20 rounded-lg mt-5 mb-5">
            {[
              { label: "Mode",   val: mode },
              ...(mode === "text"  ? [{ label: "Font",  val: font }] : []),
              ...(mode === "image" ? [{ label: "Chars", val: charSet }] : []),
              { label: "Border", val: border },
              { label: "Lines",  val: String(artOutput.split("\n").length) },
              { label: "Chars",  val: String(artOutput.length) },
            ].map(s => (
              <div key={s.label}>
                <span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">{s.label}</span>
                <span className="font-mono text-sm text-orange-400 capitalize">{s.val}</span>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "🔤", title: "3 Fonts",        desc: "Big (slanted), Block (filled █), and Slim (minimal) — live preview of all three." },
            { icon: "🖼",  title: "Image → ASCII",  desc: "Upload any image and convert with 7 character sets, adjustable width, and invert." },
            { icon: "✏️", title: "Draw + Presets",  desc: "Freehand ASCII canvas with shape snippets, or pick from the preset gallery." },
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