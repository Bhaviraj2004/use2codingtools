"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useMemo } from "react";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";

interface KeyValue {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

function uid() {
  return Math.random().toString(36).slice(2, 8);
}

export default function ApiRequestBuilder() {
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [url, setUrl] = useState("https://api.example.com/users");
  const [headers, setHeaders] = useState<KeyValue[]>([
    { id: uid(), key: "Content-Type", value: "application/json", enabled: true },
    { id: uid(), key: "Authorization", value: "Bearer YOUR_TOKEN", enabled: false },
  ]);
  const [params, setParams] = useState<KeyValue[]>([
    { id: uid(), key: "page", value: "1", enabled: true },
    { id: uid(), key: "limit", value: "20", enabled: true },
  ]);
  const [body, setBody] = useState('{\n  "name": "John Doe",\n  "email": "john@example.com"\n}');
  const [outputFormat, setOutputFormat] = useState<"curl" | "fetch" | "axios" | "python">("curl");
  const [copied, setCopied] = useState(false);

  const addHeader = () => {
    setHeaders([...headers, { id: uid(), key: "", value: "", enabled: true }]);
  };

  const addParam = () => {
    setParams([...params, { id: uid(), key: "", value: "", enabled: true }]);
  };

  const updateHeader = (id: string, field: "key" | "value" | "enabled", val: string | boolean) => {
    setHeaders(headers.map(h => h.id === id ? { ...h, [field]: val } : h));
  };

  const removeHeader = (id: string) => {
    setHeaders(headers.filter(h => h.id !== id));
  };

  const updateParam = (id: string, field: "key" | "value" | "enabled", val: string | boolean) => {
    setParams(params.map(p => p.id === id ? { ...p, [field]: val } : p));
  };

  const removeParam = (id: string) => {
    setParams(params.filter(p => p.id !== id));
  };

  const generateCode = useMemo(() => {
    const enabledHeaders = headers.filter(h => h.enabled && h.key.trim());
    const enabledParams = params.filter(p => p.enabled && p.key.trim());

    const queryString = enabledParams.length
      ? "?" + enabledParams.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join("&")
      : "";

    const fullUrl = url + queryString;

    const headerObj = enabledHeaders.reduce((acc, h) => {
      acc[h.key] = h.value;
      return acc;
    }, {} as Record<string, string>);

    if (outputFormat === "curl") {
      let cmd = `curl -X ${method} "${fullUrl}"`;
      enabledHeaders.forEach(h => {
        cmd += ` \\\n  -H "${h.key}: ${h.value.replace(/"/g, '\\"')}"`;
      });
      if (["POST", "PUT", "PATCH"].includes(method) && body.trim()) {
        cmd += ` \\\n  -d '${body.replace(/'/g, "'\\''")}'`;
      }
      return cmd;
    }

    if (outputFormat === "fetch") {
      let js = `fetch("${fullUrl}", {\n  method: "${method}",`;
      if (enabledHeaders.length || (["POST", "PUT", "PATCH"].includes(method) && body.trim())) {
        js += `\n  headers: ${JSON.stringify(headerObj, null, 2).replace(/^/gm, "    ")},`;
      }
      if (["POST", "PUT", "PATCH"].includes(method) && body.trim()) {
        js += `\n  body: JSON.stringify(${body}),`;
      }
      js += `\n})\n  .then(res => res.json())\n  .then(data => console.log(data))\n  .catch(err => console.error(err));`;
      return js;
    }

    if (outputFormat === "axios") {
      let axiosCode = `axios.${method.toLowerCase()}("${fullUrl}"`;
      if (enabledHeaders.length || body.trim()) {
        axiosCode += `, {\n`;
        if (enabledHeaders.length) axiosCode += `  headers: ${JSON.stringify(headerObj, null, 2).replace(/^/gm, "    ")},\n`;
        if (body.trim() && ["POST", "PUT", "PATCH"].includes(method)) {
          axiosCode += `  data: ${body},\n`;
        }
        axiosCode += `})`;
      } else {
        axiosCode += `)`;
      }
      axiosCode += `\n  .then(res => console.log(res.data))\n  .catch(err => console.error(err));`;
      return axiosCode;
    }

    if (outputFormat === "python") {
      let py = `import requests\n\n`;
      py += `headers = ${JSON.stringify(headerObj, null, 2)}\n\n`;
      if (["POST", "PUT", "PATCH"].includes(method) && body.trim()) {
        py += `data = ${body}\n\n`;
        py += `response = requests.${method.toLowerCase()}("${fullUrl}", headers=headers, json=data)`;
      } else {
        py += `response = requests.${method.toLowerCase()}("${fullUrl}", headers=headers)`;
      }
      py += `\n\nprint(response.status_code)\nprint(response.json())`;
      return py;
    }

    return "# Select a format";
  }, [method, url, headers, params, body, outputFormat]);

  const copy = () => {
    navigator.clipboard.writeText(generateCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const methods: HttpMethod[] = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-cyan-500/[0.04] blur-3xl pointer-events-none" />

      <ToolNavbar toolName="API Request Builder" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center font-mono font-bold text-emerald-400 text-lg">API</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">API Request Builder</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">cURL • Fetch • Axios • Python</span>
          </div>
          <p className="text-slate-500 text-sm">Build HTTP requests visually — add headers, params, body — then copy as code in your favorite format.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Builder */}
          <div className="flex flex-col gap-4">
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <select
                  value={method}
                  onChange={e => setMethod(e.target.value as HttpMethod)}
                  className="bg-[#0f0f1a] border border-white/[0.12] rounded-lg px-4 py-2.5 text-sm font-mono min-w-[100px] text-emerald-300"
                >
                  {methods.map(m => (
                    <option key={m} value={m} className="bg-[#0f0f1a] text-slate-200">{m}</option>
                  ))}
                </select>

                <input
                  type="text"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://api.example.com/endpoint"
                  className="flex-1 bg-white/[0.04] border border-white/[0.12] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-emerald-500/50 font-mono text-slate-200"
                />
              </div>

              {/* Tabs (visual only for now - can make functional later) */}
              <div className="flex border-b border-white/[0.08] mb-4">
                <button className="px-4 py-2 text-xs font-mono border-b-2 border-emerald-500 text-emerald-400">Query Params</button>
                <button className="px-4 py-2 text-xs font-mono text-slate-500 hover:text-slate-300">Headers</button>
                <button className="px-4 py-2 text-xs font-mono text-slate-500 hover:text-slate-300">Body</button>
              </div>

              {/* Query Params */}
              <div className="space-y-3 mb-6">
                {params.map(p => (
                  <div key={p.id} className="flex gap-2 items-center group">
                    <input
                      type="checkbox"
                      checked={p.enabled}
                      onChange={e => updateParam(p.id, "enabled", e.target.checked)}
                      className="h-4 w-4 bg-transparent border-white/[0.3] rounded text-emerald-500 focus:ring-emerald-500"
                    />
                    <input
                      value={p.key}
                      onChange={e => updateParam(p.id, "key", e.target.value)}
                      placeholder="key"
                      className="flex-1 bg-white/[0.04] border border-white/[0.12] rounded px-3 py-1.5 text-xs font-mono outline-none"
                    />
                    <span className="text-slate-500">=</span>
                    <input
                      value={p.value}
                      onChange={e => updateParam(p.id, "value", e.target.value)}
                      placeholder="value"
                      className="flex-1 bg-white/[0.04] border border-white/[0.12] rounded px-3 py-1.5 text-xs font-mono outline-none"
                    />
                    <button onClick={() => removeParam(p.id)} className="opacity-0 group-hover:opacity-100 text-red-400 text-lg leading-none">×</button>
                  </div>
                ))}
                <button onClick={addParam} className="text-xs text-emerald-400 hover:text-emerald-300 font-mono mt-2">+ Add param</button>
              </div>

              {/* Headers (similar, can toggle visibility) */}
              <div className="space-y-3 mb-6 hidden"> {/* hidden for now, can show on tab click */}
                {headers.map(h => (
                  <div key={h.id} className="flex gap-2 items-center group">
                    <input
                      type="checkbox"
                      checked={h.enabled}
                      onChange={e => updateHeader(h.id, "enabled", e.target.checked)}
                      className="h-4 w-4 bg-transparent border-white/[0.3] rounded text-emerald-500 focus:ring-emerald-500"
                    />
                    <input
                      value={h.key}
                      onChange={e => updateHeader(h.id, "key", e.target.value)}
                      placeholder="Header name"
                      className="flex-1 bg-white/[0.04] border border-white/[0.12] rounded px-3 py-1.5 text-xs font-mono outline-none"
                    />
                    <input
                      value={h.value}
                      onChange={e => updateHeader(h.id, "value", e.target.value)}
                      placeholder="Value"
                      className="flex-1 bg-white/[0.04] border border-white/[0.12] rounded px-3 py-1.5 text-xs font-mono outline-none"
                    />
                    <button onClick={() => removeHeader(h.id)} className="opacity-0 group-hover:opacity-100 text-red-400 text-lg leading-none">×</button>
                  </div>
                ))}
                <button onClick={addHeader} className="text-xs text-emerald-400 hover:text-emerald-300 font-mono mt-2">+ Add header</button>
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Request Body (JSON / raw)</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={8}
                  className="w-full bg-white/[0.04] border border-white/[0.12] rounded-lg p-3 text-xs font-mono outline-none focus:border-emerald-500/50 text-slate-200 resize-y"
                  placeholder='{"key": "value"}'
                />
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="flex flex-col gap-4">
            <div className="flex gap-1 bg-white/[0.04] border border-white/[0.08] rounded-lg p-1">
              {["curl", "fetch", "axios", "python"].map(f => (
                <button
                  key={f}
                  onClick={() => setOutputFormat(f as any)}
                  className={`flex-1 font-mono text-xs py-2 rounded transition-all ${outputFormat === f ? "bg-emerald-500/20 text-emerald-300 font-bold" : "text-slate-400 hover:text-slate-200"}`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] border-b border-white/[0.08]">
                <span className="font-mono text-xs uppercase tracking-wider text-emerald-400">
                  {outputFormat.toUpperCase()} Code
                </span>
                <button
                  onClick={copy}
                  className={`text-xs px-3 py-1 rounded border transition-all ${copied ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" : "border-white/[0.1] text-slate-400 hover:text-emerald-300 hover:border-emerald-500/30"}`}
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
              <pre className="p-4 font-mono text-xs overflow-auto max-h-[500px] whitespace-pre-wrap text-slate-300">
                {generateCode}
              </pre>
            </div>

            <div className="text-xs text-slate-500 space-y-1 bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
              <p>• Use <span className="text-emerald-400 font-mono">{"{variable}"}</span> in URL/headers/body for templating</p>
              <p>• Body treated as JSON for POST/PUT/PATCH automatically</p>
              <p>• Headers & Params can be toggled on/off</p>
            </div>
          </div>
        </div>

        {/* Info Cards - Footer style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
          {[
            { icon: "🔗", title: "Visual Builder", desc: "Add/remove params, headers, body with live preview" },
            { icon: "📄", title: "Multiple Formats", desc: "Export as cURL, Fetch, Axios, Python requests" },
            { icon: "⚡", title: "Quick Copy", desc: "One-click copy with success feedback" },
            { icon: "🛠️", title: "Developer Friendly", desc: "Mono font, dark theme, easy to paste in terminal/code" },
          ].map((c) => (
            <div key={c.title} className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-5 py-5 text-center">
              <div className="text-3xl font-bold text-emerald-400 mb-3">{c.icon}</div>
              <div className="font-semibold text-slate-300 mb-1">{c.title}</div>
              <div className="text-slate-600 text-xs leading-relaxed">{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}