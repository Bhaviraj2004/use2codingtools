"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useRef } from "react";

type Mode = "encode" | "decode";
type InputType = "text" | "file";

export default function Base64Tool() {
  const [mode, setMode] = useState<Mode>("encode");
  const [inputType, setInputType] = useState<InputType>("text");
  const [textInput, setTextInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileMime, setFileMime] = useState("");
  const [urlSafe, setUrlSafe] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const toUrlSafe = (b64: string) =>
    b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  const fromUrlSafe = (b64: string) =>
    b64.replace(/-/g, "+").replace(/_/g, "/");

  const processText = (val: string, m: Mode = mode, safe: boolean = urlSafe) => {
    setTextInput(val);
    setError("");
    setOutput("");
    if (!val.trim()) return;

    try {
      if (m === "encode") {
        let encoded = btoa(unescape(encodeURIComponent(val)));
        if (safe) encoded = toUrlSafe(encoded);
        setOutput(encoded);
      } else {
        const decoded = decodeURIComponent(
          escape(atob(safe ? fromUrlSafe(val.trim()) : val.trim()))
        );
        setOutput(decoded);
      }
    } catch {
      setError(m === "decode" ? "Invalid Base64 string — check your input." : "Encoding failed.");
    }
  };

  const handleModeSwitch = (m: Mode) => {
    setMode(m);
    setError("");
    setOutput("");
    if (inputType === "text") processText(textInput, m, urlSafe);
  };

  const handleUrlSafe = (val: boolean) => {
    setUrlSafe(val);
    if (inputType === "text") processText(textInput, mode, val);
  };

  const handleSwap = () => {
    if (!output || inputType === "file") return;
    const newMode: Mode = mode === "encode" ? "decode" : "encode";
    setMode(newMode);
    setTextInput(output);
    setOutput("");
    processText(output, newMode, urlSafe);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setFileMime(file.type);
    setError("");
    setOutput("");
    setFilePreview(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      // result is like "data:image/png;base64,XXXX"
      const base64 = result.split(",")[1];
      let out = base64;
      if (urlSafe) out = toUrlSafe(base64);
      setOutput(out);
      if (file.type.startsWith("image/")) setFilePreview(result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDecodeToFile = () => {
    if (!output) return;
    try {
      const binary = atob(urlSafe ? fromUrlSafe(output) : output);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "decoded-file";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Could not decode as file.");
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleClear = () => {
    setTextInput("");
    setOutput("");
    setError("");
    setFileName("");
    setFilePreview(null);
    setFileMime("");
  };

  const stats = output
    ? {
        inputLen: inputType === "text" ? textInput.length : fileName,
        outputLen: output.length,
        ratio:
          inputType === "text" && textInput.length
            ? ((output.length / textInput.length) * 100).toFixed(0) + "%"
            : null,
      }
    : null;

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      {/* Grid bg */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,255,136,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.025) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="fixed -top-48 -left-48 w-[500px] h-[500px] rounded-full bg-violet-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -right-48 w-[400px] h-[400px] rounded-full bg-cyan-500/[0.04] blur-3xl pointer-events-none" />

      {/* NAV */}
      <ToolNavbar toolName="Base64 Encode" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-violet-500/10 flex items-center justify-center text-lg">🔄</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Base64 Encode / Decode</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded">client-side</span>
          </div>
          <p className="text-slate-500 text-sm">
            Encode text or files to Base64, or decode Base64 strings back. Supports URL-safe mode and file downloads.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">

          {/* Encode / Decode */}
          <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-md p-1 gap-1">
            {(["encode", "decode"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => handleModeSwitch(m)}
                className={`font-mono text-xs px-5 py-1.5 rounded capitalize transition-all ${
                  mode === m
                    ? "bg-violet-500 text-white font-bold"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Text / File */}
          <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-md p-1 gap-1">
            {(["text", "file"] as InputType[]).map((t) => (
              <button
                key={t}
                onClick={() => { setInputType(t); handleClear(); }}
                className={`font-mono text-xs px-4 py-1.5 rounded capitalize transition-all ${
                  inputType === t
                    ? "bg-white/10 text-slate-200"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {t === "text" ? "📝 Text" : "📁 File"}
              </button>
            ))}
          </div>

          {/* URL safe toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer group ml-1">
            <div
              onClick={() => handleUrlSafe(!urlSafe)}
              className={`w-9 h-5 rounded-full transition-all relative ${urlSafe ? "bg-violet-500" : "bg-white/10"}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${urlSafe ? "left-4" : "left-0.5"}`} />
            </div>
            <span className="font-mono text-xs text-slate-500 group-hover:text-slate-300 transition-colors">URL-safe</span>
          </label>

          <div className="ml-auto flex gap-2">
            {inputType === "text" && output && (
              <button
                onClick={handleSwap}
                title="Swap input/output and switch mode"
                className="font-mono text-xs px-3 py-1.5 border border-violet-500/30 text-violet-400 rounded-md hover:bg-violet-500/10 transition-all"
              >
                ⇄ Swap
              </button>
            )}
            <button
              onClick={handleClear}
              className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-red-400 hover:border-red-500/30 transition-all"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Main area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* INPUT */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">
                {mode === "encode" ? "Plain text / File" : "Base64 string"}
              </span>
              {inputType === "text" && (
                <span className="font-mono text-[10px] text-slate-700">{textInput.length} chars</span>
              )}
            </div>

            {inputType === "text" ? (
              <textarea
                value={textInput}
                onChange={(e) => processText(e.target.value)}
                placeholder={
                  mode === "encode"
                    ? "Type or paste your text here..."
                    : "Paste your Base64 string here..."
                }
                spellCheck={false}
                className="w-full h-[420px] font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-slate-300 placeholder-slate-700 outline-none focus:border-violet-500/40 resize-none transition-colors leading-relaxed"
              />
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                className="h-[420px] bg-white/[0.03] border border-dashed border-white/[0.12] rounded-lg flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-violet-500/40 hover:bg-violet-500/[0.03] transition-all group"
              >
                {filePreview ? (
                  <div className="flex flex-col items-center gap-3 px-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={filePreview} alt="preview" className="max-h-52 max-w-full rounded-md object-contain" />
                    <span className="font-mono text-xs text-slate-500">{fileName}</span>
                    <span className="font-mono text-[10px] text-slate-700">{fileMime}</span>
                  </div>
                ) : fileName ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-4xl">📄</div>
                    <span className="font-mono text-sm text-slate-400">{fileName}</span>
                    <span className="font-mono text-xs text-slate-600">{fileMime || "unknown type"}</span>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                      📁
                    </div>
                    <div className="text-center">
                      <p className="font-mono text-sm text-slate-500">Click to upload file</p>
                      <p className="font-mono text-xs text-slate-700 mt-1">Images, PDFs, any file type</p>
                    </div>
                  </>
                )}
                <input ref={fileRef} type="file" className="hidden" onChange={handleFileUpload} />
              </div>
            )}
          </div>

          {/* OUTPUT */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">
                {mode === "encode" ? "Base64 output" : "Decoded text"}
              </span>
              <div className="flex gap-2">
                {mode === "decode" && output && (
                  <button
                    onClick={handleDecodeToFile}
                    className="font-mono text-[11px] px-3 rounded border border-white/[0.08] text-slate-500 hover:text-slate-300 hover:border-white/20 transition-all"
                  >
                    ↓ Download
                  </button>
                )}
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  className={`font-mono text-[11px] px-3 rounded border transition-all ${
                    copied
                      ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                      : "border-white/[0.08] text-slate-500 hover:text-slate-300 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
                  }`}
                >
                  {copied ? "✓ Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div className="relative h-[420px] font-mono text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 overflow-auto transition-colors">
              {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2.5 mb-3">
                  <span className="text-red-400 text-xs mt-0.5 shrink-0">✕</span>
                  <span className="font-mono text-xs text-red-400 leading-relaxed">{error}</span>
                </div>
              )}
              {!output && !error && (
                <span className="text-slate-700 select-none">Output will appear here...</span>
              )}
              <pre className="whitespace-pre-wrap break-all text-slate-300 leading-relaxed">{output}</pre>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        {stats && !error && (
          <div className="mt-4 flex flex-wrap gap-6 px-4 py-3 bg-violet-500/[0.05] border border-violet-500/20 rounded-lg items-center">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-violet-400/60 mr-2">Input</span>
              <span className="font-mono text-sm text-violet-400">
                {typeof stats.inputLen === "number" ? `${stats.inputLen} chars` : stats.inputLen}
              </span>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-violet-400/60 mr-2">Output</span>
              <span className="font-mono text-sm text-violet-400">{stats.outputLen} chars</span>
            </div>
            {stats.ratio && (
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-violet-400/60 mr-2">Size ratio</span>
                <span className="font-mono text-sm text-violet-400">{stats.ratio}</span>
              </div>
            )}
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-violet-400/60 mr-2">Mode</span>
              <span className="font-mono text-sm text-violet-400 capitalize">{mode} {urlSafe ? "(URL-safe)" : ""}</span>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              <span className="font-mono text-[10px] text-violet-400/60">Success</span>
            </div>
          </div>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8">
          {[
            { icon: "📝", title: "Text Support", desc: "Encode any Unicode text — Hindi, emoji, special chars — all supported via UTF-8." },
            { icon: "📁", title: "File Support", desc: "Upload any file (image, PDF, binary) and get its Base64 representation instantly." },
            { icon: "🔗", title: "URL-Safe Mode", desc: "Replaces +, / with -, _ and removes = padding — safe for URLs and JWT tokens." },
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