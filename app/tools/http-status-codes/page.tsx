"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useMemo } from "react";

type Category = "1xx" | "2xx" | "3xx" | "4xx" | "5xx";

interface StatusCode {
  code: number;
  phrase: string;
  description: string;
  category: Category;
  common: boolean;
}

const HTTP_CODES: StatusCode[] = [
  // 1xx Informational
  { code: 100, phrase: "Continue", description: "Client should continue with request", category: "1xx", common: false },
  { code: 101, phrase: "Switching Protocols", description: "Server is switching protocols as requested", category: "1xx", common: false },
  { code: 102, phrase: "Processing", description: "WebDAV - server has received request but not completed", category: "1xx", common: false },
  { code: 103, phrase: "Early Hints", description: "Used with Link header to allow preloading", category: "1xx", common: false },

  // 2xx Success
  { code: 200, phrase: "OK", description: "Request succeeded → standard success response", category: "2xx", common: true },
  { code: 201, phrase: "Created", description: "Resource was created (e.g. POST)", category: "2xx", common: true },
  { code: 202, phrase: "Accepted", description: "Request accepted for processing, but not completed", category: "2xx", common: true },
  { code: 204, phrase: "No Content", description: "Success but no response body (e.g. DELETE)", category: "2xx", common: true },
  { code: 206, phrase: "Partial Content", description: "Range request fulfilled", category: "2xx", common: false },

  // 3xx Redirection
  { code: 301, phrase: "Moved Permanently", description: "Resource moved permanently → use new URL", category: "3xx", common: true },
  { code: 302, phrase: "Found", description: "Temporary redirect", category: "3xx", common: true },
  { code: 304, phrase: "Not Modified", description: "Cached version is still valid (ETag/If-Modified-Since)", category: "3xx", common: true },
  { code: 307, phrase: "Temporary Redirect", description: "Temporary redirect, preserve method", category: "3xx", common: false },
  { code: 308, phrase: "Permanent Redirect", description: "Permanent redirect, preserve method", category: "3xx", common: false },

  // 4xx Client Error
  { code: 400, phrase: "Bad Request", description: "Invalid request syntax / parameters", category: "4xx", common: true },
  { code: 401, phrase: "Unauthorized", description: "Authentication required", category: "4xx", common: true },
  { code: 403, phrase: "Forbidden", description: "Authenticated but no permission", category: "4xx", common: true },
  { code: 404, phrase: "Not Found", description: "Resource does not exist", category: "4xx", common: true },
  { code: 405, phrase: "Method Not Allowed", description: "HTTP method not supported for this route", category: "4xx", common: true },
  { code: 409, phrase: "Conflict", description: "Request conflicts with current state (e.g. duplicate)", category: "4xx", common: true },
  { code: 429, phrase: "Too Many Requests", description: "Rate limiting hit", category: "4xx", common: true },

  // 5xx Server Error
  { code: 500, phrase: "Internal Server Error", description: "Generic server error", category: "5xx", common: true },
  { code: 501, phrase: "Not Implemented", description: "Server does not support requested functionality", category: "5xx", common: false },
  { code: 502, phrase: "Bad Gateway", description: "Invalid response from upstream server", category: "5xx", common: true },
  { code: 503, phrase: "Service Unavailable", description: "Server temporarily down (maintenance / overload)", category: "5xx", common: true },
  { code: 504, phrase: "Gateway Timeout", description: "Upstream server timed out", category: "5xx", common: true },
];

function genMarkdownTable(codes: StatusCode[]): string {
  const lines = [
    "| Code | Phrase | Description | Category |",
    "|------|--------|-------------|----------|",
  ];

  codes.forEach((c) => {
    const esc = (s: string) => s.replace(/\|/g, "\\|");
    lines.push(`| ${c.code} | ${esc(c.phrase)} | ${esc(c.description)} | ${c.category} |`);
  });

  return lines.join("\n");
}

function genJSON(codes: StatusCode[]): string {
  return JSON.stringify(
    codes.map((c) => ({
      code: c.code,
      phrase: c.phrase,
      description: c.description,
      category: c.category,
    })),
    null,
    2
  );
}

export default function HttpStatusCodes() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [format, setFormat] = useState<"markdown" | "json">("markdown");
  const [copied, setCopied] = useState(false);

  const filteredCodes = useMemo(() => {
    let result = HTTP_CODES;

    if (categoryFilter !== "all") {
      result = result.filter((c) => c.category === categoryFilter);
    }

    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.code.toString().includes(term) ||
          c.phrase.toLowerCase().includes(term) ||
          c.description.toLowerCase().includes(term)
      );
    }

    return result;
  }, [search, categoryFilter]);

  const output = useMemo(() => {
    return format === "markdown" ? genMarkdownTable(filteredCodes) : genJSON(filteredCodes);
  }, [filteredCodes, format]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-cyan-500/[0.04] blur-3xl pointer-events-none" />

      <ToolNavbar toolName="HTTP Status Codes Explorer" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center font-mono font-bold text-emerald-400 text-lg">⚡</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">HTTP Status Codes Explorer</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">search • copy • learn</span>
          </div>
          <p className="text-slate-500 text-sm">Explore all major HTTP status codes with descriptions. Filter, search, and export as Markdown table or JSON.</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search code, phrase or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-white/[0.04] border border-white/[0.12] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-emerald-500/50 text-slate-200"
          />

          <div className="relative w-full sm:w-64">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as Category | "all")}
              className="w-full bg-[#0f0f1a] border border-white/[0.12] rounded-lg px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-emerald-500/50 appearance-none cursor-pointer hover:border-white/[0.2] transition-colors pr-10"
            >
              <option value="all" className="bg-[#0f0f1a] text-slate-200">All Categories</option>
              <option value="1xx" className="bg-[#0f0f1a] text-slate-200">1xx Informational</option>
              <option value="2xx" className="bg-[#0f0f1a] text-slate-200">2xx Success</option>
              <option value="3xx" className="bg-[#0f0f1a] text-slate-200">3xx Redirection</option>
              <option value="4xx" className="bg-[#0f0f1a] text-slate-200">4xx Client Error</option>
              <option value="5xx" className="bg-[#0f0f1a] text-slate-200">5xx Server Error</option>
            </select>

            {/* Custom dropdown arrow */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Format toggle */}
        <div className="flex gap-1 bg-white/[0.04] border border-white/[0.08] rounded-lg p-1 mb-6 max-w-xs">
          <button
            onClick={() => setFormat("markdown")}
            className={`flex-1 font-mono text-xs py-2 rounded-md transition-all ${format === "markdown" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300 font-bold" : "text-slate-400 hover:text-slate-200"}`}
          >
            Markdown Table
          </button>
          <button
            onClick={() => setFormat("json")}
            className={`flex-1 font-mono text-xs py-2 rounded-md transition-all ${format === "json" ? "bg-cyan-500/20 border-cyan-500/30 text-cyan-300 font-bold" : "text-slate-400 hover:text-slate-200"}`}
          >
            JSON
          </button>
        </div>

        {/* Table / Output */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Visual Table */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.04] border-b border-white/[0.08]">
                  <tr>
                    <th className="px-4 py-3 text-left font-mono text-xs text-emerald-400">Code</th>
                    <th className="px-4 py-3 text-left font-mono text-xs text-emerald-400">Phrase</th>
                    <th className="px-4 py-3 text-left font-mono text-xs text-emerald-400">Description</th>
                    <th className="px-4 py-3 text-left font-mono text-xs text-emerald-400">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCodes.map((c) => (
                    <tr key={c.code} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-mono text-emerald-300">{c.code}</td>
                      <td className="px-4 py-3 font-medium">{c.phrase}</td>
                      <td className="px-4 py-3 text-slate-300">{c.description}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{c.category}</td>
                    </tr>
                  ))}
                  {filteredCodes.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-600">
                        No matching status codes found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 text-xs text-slate-500 border-t border-white/[0.06]">
              Showing {filteredCodes.length} of {HTTP_CODES.length} codes
            </div>
          </div>

          {/* Output Box */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-emerald-400">
                {format === "markdown" ? "Markdown Table" : "JSON Array"}
              </span>
              <button
                onClick={copyToClipboard}
                className={`font-mono text-xs px-4 py-2 rounded border transition-all ${
                  copied ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" : "border-white/[0.1] text-slate-400 hover:text-emerald-300 hover:border-emerald-500/30"
                }`}
              >
                {copied ? "✓ Copied!" : "Copy to Clipboard"}
              </button>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 font-mono text-xs overflow-auto max-h-[500px] whitespace-pre-wrap">
              {output}
            </div>
          </div>
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-10">
          {[
            { label: "1xx", desc: "Informational", color: "text-slate-400" },
            { label: "2xx", desc: "Success", color: "text-emerald-400" },
            { label: "3xx", desc: "Redirection", color: "text-yellow-400" },
            { label: "4xx", desc: "Client Error", color: "text-orange-400" },
            { label: "5xx", desc: "Server Error", color: "text-red-400" },
          ].map((item) => (
            <div key={item.label} className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 text-center">
              <div className={`text-2xl font-bold font-mono ${item.color}`}>{item.label}</div>
              <div className="text-xs text-slate-500 mt-1">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}