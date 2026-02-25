"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useCallback, useRef, useEffect } from "react";

const EXAMPLE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Hello World</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f0f1a, #1a0f2e);
      font-family: 'Segoe UI', sans-serif;
      color: white;
    }
    .card {
      text-align: center;
      padding: 2rem 3rem;
      background: rgba(255,255,255,0.05);
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
    }
    h1 { font-size: 2.5rem; margin: 0 0 0.5rem; }
    p { color: rgba(255,255,255,0.6); margin: 0; }
    .dot { color: #ff6b35; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Hello, World<span class="dot">!</span></h1>
    <p>Edit the HTML on the left to see live preview →</p>
  </div>
</body>
</html>`;

type ViewMode = "split" | "preview" | "code";
type DeviceMode = "desktop" | "tablet" | "mobile";

const DEVICE_SIZES: Record<DeviceMode, { width: string; label: string; icon: string }> = {
  desktop: { width: "100%", label: "Desktop", icon: "🖥" },
  tablet:  { width: "768px",  label: "Tablet",  icon: "📱" },
  mobile:  { width: "375px",  label: "Mobile",  icon: "📲" },
};

export default function HtmlPreview() {
  const [code, setCode] = useState(EXAMPLE_HTML);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [copied, setCopied] = useState(false);
  const [lineCount, setLineCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<{ type: string; msg: string }[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Count lines
  useEffect(() => {
    setLineCount(code.split("\n").length);
  }, [code]);

  // Inject code into iframe
  const updatePreview = useCallback((html: string) => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 400);

    // Wrap with console interceptor
    const interceptor = `
      <script>
        (function() {
          var logs = [];
          var orig = { log: console.log, warn: console.warn, error: console.error };
          ['log','warn','error'].forEach(function(t) {
            console[t] = function() {
              var msg = Array.from(arguments).map(function(a) {
                try { return typeof a === 'object' ? JSON.stringify(a) : String(a); } catch(e) { return String(a); }
              }).join(' ');
              window.parent.postMessage({ type: 'console', level: t, msg: msg }, '*');
              orig[t].apply(console, arguments);
            };
          });
          window.onerror = function(msg, src, line) {
            window.parent.postMessage({ type: 'console', level: 'error', msg: msg + ' (line ' + line + ')' }, '*');
          };
        })();
      <\/script>
    `;

    // Inject interceptor after <head> or at start
    let injected = html;
    if (html.includes("<head>")) {
      injected = html.replace("<head>", "<head>" + interceptor);
    } else if (html.includes("<html")) {
      injected = html.replace(/<html[^>]*>/, (m) => m + interceptor);
    } else {
      injected = interceptor + html;
    }

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(injected);
      doc.close();
    }
  }, []);

  // Listen for console messages from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "console") {
        setConsoleLogs((prev) => [...prev.slice(-49), { type: e.data.level, msg: e.data.msg }]);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // Initial load
  useEffect(() => {
    updatePreview(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (val: string) => {
    setCode(val);
    updatePreview(val);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCode(text);
      updatePreview(text);
    };
    reader.readAsText(file);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "preview.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadExample = () => {
    setCode(EXAMPLE_HTML);
    updatePreview(EXAMPLE_HTML);
  };

  const handleClear = () => {
    setCode("");
    updatePreview("");
    setConsoleLogs([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = code.substring(0, start) + "  " + code.substring(end);
      setCode(newVal);
      updatePreview(newVal);
      setTimeout(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      }, 0);
    }
  };

  const showCode    = viewMode === "split" || viewMode === "code";
  const showPreview = viewMode === "split" || viewMode === "preview";

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      {/* Background effects */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-orange-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

      <ToolNavbar toolName="HTML Preview" />

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-orange-500/10 flex items-center justify-center font-mono font-bold text-orange-400 text-sm">
              &lt;/&gt;
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">HTML Preview</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded">
              live
            </span>
          </div>
          <p className="text-slate-500 text-sm">
            Write or paste HTML and see it render instantly — supports inline CSS, JS, and multi-device preview.
          </p>
        </div>

        {/* Options bar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">

          {/* View mode */}
          <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-md px-1.5 py-1.5">
            {(["split", "code", "preview"] as ViewMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`font-mono text-xs px-3 py-0.5 rounded transition-all capitalize ${
                  viewMode === m
                    ? "bg-orange-500/20 text-orange-400"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {m === "split" ? "⊞ Split" : m === "code" ? "✎ Code" : "◉ Preview"}
              </button>
            ))}
          </div>

          {/* Device size */}
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-1.5">
            <span className="font-mono text-[11px] text-slate-500 uppercase tracking-wide">Device</span>
            {(Object.entries(DEVICE_SIZES) as [DeviceMode, typeof DEVICE_SIZES[DeviceMode]][]).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setDevice(key)}
                title={val.label}
                className={`font-mono text-xs px-2.5 py-0.5 rounded transition-all ${
                  device === key
                    ? "bg-orange-500/20 text-orange-400"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {val.icon} {val.label}
              </button>
            ))}
          </div>

          {/* Console toggle */}
          <button
            onClick={() => setConsoleOpen((p) => !p)}
            className={`font-mono text-xs px-3 py-1.5 border rounded-md transition-all ${
              consoleLogs.some((l) => l.type === "error")
                ? "border-red-500/40 text-red-400 hover:bg-red-500/10"
                : consoleOpen
                ? "border-orange-500/30 text-orange-400 bg-orange-500/10"
                : "border-white/[0.08] text-slate-500 hover:text-slate-300 hover:border-white/20"
            }`}
          >
            ⬛ Console {consoleLogs.length > 0 && `(${consoleLogs.length})`}
          </button>

          <div className="ml-auto flex gap-2">
            <input
              type="file"
              accept=".html,.htm"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-slate-300 hover:border-white/20 transition-all"
            >
              Upload HTML
            </button>
            <button
              onClick={handleLoadExample}
              className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-slate-300 hover:border-white/20 transition-all"
            >
              Load Example
            </button>
            <button
              onClick={handleClear}
              className="font-mono text-xs px-3 py-1.5 border border-white/[0.08] text-slate-500 rounded-md hover:text-red-400 hover:border-red-500/30 transition-all"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Main editor / preview area */}
        <div
          className={`grid gap-4 mb-5 ${
            viewMode === "split" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
          }`}
        >
          {/* Code Editor */}
          {showCode && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">
                  HTML Editor
                </span>
                <div className="flex gap-2 items-center">
                  <span className="font-mono text-[10px] text-slate-700">{lineCount} lines · {code.length} chars</span>
                  <button
                    onClick={handleCopy}
                    className={`font-mono text-[11px] px-3 rounded border transition-all ${
                      copied
                        ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                        : "border-white/[0.08] text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {copied ? "✓ Copied!" : "Copy"}
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={!code}
                    className="font-mono text-[11px] px-3 rounded border border-white/[0.08] text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    ↓ .html
                  </button>
                </div>
              </div>

              {/* Line numbers + textarea */}
              <div className="relative flex h-[500px] bg-white/[0.03] border border-white/[0.08] rounded-lg overflow-hidden focus-within:border-orange-500/40 transition-colors">
                {/* Line numbers */}
                <div
                  className="select-none py-4 px-2 text-right font-mono text-xs text-slate-700 bg-white/[0.02] border-r border-white/[0.06] overflow-hidden"
                  style={{ minWidth: "3rem" }}
                  aria-hidden
                >
                  {Array.from({ length: lineCount }, (_, i) => (
                    <div key={i} className="leading-relaxed">{i + 1}</div>
                  ))}
                </div>
                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={(e) => handleChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="<html>...</html>"
                  spellCheck={false}
                  className="flex-1 h-full font-mono text-sm bg-transparent p-4 text-slate-300 placeholder-slate-700 outline-none resize-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Preview */}
          {showPreview && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">
                  Live Preview
                </span>
                <div className="flex items-center gap-2">
                  {isRefreshing && (
                    <span className="font-mono text-[10px] text-orange-400 animate-pulse">Rendering…</span>
                  )}
                  <span className="font-mono text-[10px] text-slate-700">
                    {DEVICE_SIZES[device].icon} {DEVICE_SIZES[device].label}
                  </span>
                </div>
              </div>

              {/* Preview frame container */}
              <div className="h-[500px] bg-white/[0.03] border border-white/[0.08] rounded-lg overflow-auto flex items-start justify-center p-3">
                <div
                  className="h-full transition-all duration-300 rounded overflow-hidden"
                  style={{ width: DEVICE_SIZES[device].width, maxWidth: "100%" }}
                >
                  <iframe
                    ref={iframeRef}
                    title="HTML Preview"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    className="w-full h-full bg-white rounded"
                    style={{ border: "none" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Console */}
        {consoleOpen && (
          <div className="mb-5 bg-[#0d0d17] border border-white/[0.08] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06]">
              <span className="font-mono text-[11px] uppercase tracking-widest text-slate-600">Console</span>
              <button
                onClick={() => setConsoleLogs([])}
                className="font-mono text-[10px] text-slate-600 hover:text-red-400 transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="h-36 overflow-y-auto p-3 space-y-1">
              {consoleLogs.length === 0 && (
                <span className="font-mono text-xs text-slate-700">No console output yet…</span>
              )}
              {consoleLogs.map((log, i) => (
                <div
                  key={i}
                  className={`font-mono text-xs flex gap-2 ${
                    log.type === "error"
                      ? "text-red-400"
                      : log.type === "warn"
                      ? "text-yellow-400"
                      : "text-slate-400"
                  }`}
                >
                  <span className="opacity-40">{log.type === "error" ? "✕" : log.type === "warn" ? "⚠" : "›"}</span>
                  <span>{log.msg}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats bar */}
        {code && (
          <div className="flex flex-wrap gap-6 px-4 py-3 bg-orange-500/[0.05] border border-orange-500/20 rounded-lg mb-5">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Lines</span>
              <span className="font-mono text-sm text-orange-400">{lineCount}</span>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Size</span>
              <span className="font-mono text-sm text-orange-400">
                {(new Blob([code]).size / 1024).toFixed(2)} KB
              </span>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Device</span>
              <span className="font-mono text-sm text-orange-400">{DEVICE_SIZES[device].label}</span>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Console</span>
              <span className={`font-mono text-sm ${consoleLogs.some(l => l.type === "error") ? "text-red-400" : "text-orange-400"}`}>
                {consoleLogs.filter(l => l.type === "error").length > 0
                  ? `${consoleLogs.filter(l => l.type === "error").length} error(s)`
                  : consoleLogs.length > 0
                  ? `${consoleLogs.length} log(s)`
                  : "Clean"}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              <span className="font-mono text-[10px] text-orange-500/60">Live</span>
            </div>
          </div>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              icon: "⚡",
              title: "Live Rendering",
              desc: "Preview updates instantly as you type — no save or refresh needed.",
            },
            {
              icon: "📱",
              title: "Multi-Device",
              desc: "Switch between Desktop, Tablet, and Mobile viewport widths on the fly.",
            },
            {
              icon: "🖥",
              title: "Console Panel",
              desc: "See console.log, warnings, and JS errors from your HTML without leaving the tool.",
            },
          ].map((c) => (
            <div
              key={c.title}
              className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-5 py-4"
            >
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