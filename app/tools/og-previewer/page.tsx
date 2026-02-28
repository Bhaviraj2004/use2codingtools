"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useCallback, useRef } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
type OGData = {
  title: string;
  description: string;
  image: string;
  url: string;
  siteName: string;
  type: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  twitterSite: string;
  favicon: string;
  themeColor: string;
};

type PreviewPlatform = "facebook" | "twitter" | "linkedin" | "discord" | "slack" | "whatsapp" | "google";
type FetchStatus = "idle" | "fetching" | "done" | "error";

const EMPTY_OG: OGData = {
  title: "", description: "", image: "", url: "", siteName: "",
  type: "website", twitterCard: "summary_large_image",
  twitterTitle: "", twitterDescription: "", twitterImage: "",
  twitterSite: "", favicon: "", themeColor: "",
};

// ── Parser ─────────────────────────────────────────────────────────────────
function parseOGFromHtml(html: string, baseUrl: string): OGData {
  const data: OGData = { ...EMPTY_OG };

  const getMeta = (attr: string, val: string): string => {
    const re = new RegExp(`<meta[^>]+${attr}=["']${val}["'][^>]*content=["']([^"']+)["']`, "i");
    const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*${attr}=["']${val}["']`, "i");
    return (html.match(re) || html.match(re2))?.[1] ?? "";
  };

  const getTitle = () => html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "";
  const getFavicon = () => {
    const m = html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i)
           || html.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i);
    const href = m?.[1] ?? "";
    if (!href) return "";
    if (href.startsWith("http")) return href;
    try { return new URL(href, baseUrl).href; } catch { return href; }
  };

  data.title       = getMeta("property", "og:title") || getMeta("name", "og:title") || getTitle();
  data.description = getMeta("property", "og:description") || getMeta("name", "description") || getMeta("name", "og:description");
  data.image       = getMeta("property", "og:image") || getMeta("name", "og:image");
  data.url         = getMeta("property", "og:url") || baseUrl;
  data.siteName    = getMeta("property", "og:site_name");
  data.type        = getMeta("property", "og:type") || "website";
  data.themeColor  = getMeta("name", "theme-color");

  data.twitterCard        = getMeta("name", "twitter:card") || "summary_large_image";
  data.twitterTitle       = getMeta("name", "twitter:title") || data.title;
  data.twitterDescription = getMeta("name", "twitter:description") || data.description;
  data.twitterImage       = getMeta("name", "twitter:image") || data.image;
  data.twitterSite        = getMeta("name", "twitter:site");

  // Resolve relative image URLs
  const resolveImg = (src: string) => {
    if (!src) return "";
    if (src.startsWith("http")) return src;
    try { return new URL(src, baseUrl).href; } catch { return src; }
  };
  data.image        = resolveImg(data.image);
  data.twitterImage = resolveImg(data.twitterImage);
  data.favicon      = getFavicon();

  return data;
}

// ── Platform preview components ────────────────────────────────────────────
function truncate(s: string, n: number) { return s.length > n ? s.slice(0, n) + "…" : s; }

function FacebookCard({ og }: { og: OGData }) {
  const title = og.title || "Page Title";
  const desc  = og.description || "";
  const img   = og.image || "";
  const host  = (() => { try { return new URL(og.url || "https://example.com").hostname.toUpperCase(); } catch { return "EXAMPLE.COM"; } })();

  return (
    <div className="bg-[#1c1e21] rounded-lg overflow-hidden border border-[#3a3b3c] w-full max-w-[500px]">
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt="" className="w-full aspect-[1.91/1] object-cover" />
      ) : (
        <div className="w-full aspect-[1.91/1] bg-[#3a3b3c] flex items-center justify-center">
          <span className="text-[#606770] font-mono text-xs">No image</span>
        </div>
      )}
      <div className="px-3 py-2.5 bg-[#242526]">
        <p className="text-[11px] text-[#606770] uppercase tracking-wide mb-0.5">{host}</p>
        <p className="text-[#e4e6eb] text-sm font-semibold leading-tight">{truncate(title, 60)}</p>
        {desc && <p className="text-[#b0b3b8] text-xs mt-0.5 leading-relaxed">{truncate(desc, 100)}</p>}
      </div>
    </div>
  );
}

function TwitterCard({ og }: { og: OGData }) {
  const title = og.twitterTitle || og.title || "Page Title";
  const desc  = og.twitterDescription || og.description || "";
  const img   = og.twitterImage || og.image || "";
  const host  = (() => { try { return new URL(og.url || "https://example.com").hostname; } catch { return "example.com"; } })();
  const isLarge = og.twitterCard !== "summary";

  return (
    <div className="bg-black rounded-2xl overflow-hidden border border-[#2f3336] w-full max-w-[500px]">
      {isLarge ? (
        <>
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt="" className="w-full aspect-[1.91/1] object-cover" />
          ) : (
            <div className="w-full aspect-[1.91/1] bg-[#16181c] flex items-center justify-center">
              <span className="text-[#536471] font-mono text-xs">No image</span>
            </div>
          )}
          <div className="px-3 py-2.5">
            <p className="text-white text-sm font-bold leading-tight">{truncate(title, 70)}</p>
            {desc && <p className="text-[#71767b] text-xs mt-0.5">{truncate(desc, 120)}</p>}
            <p className="text-[#71767b] text-xs mt-1">🔗 {host}</p>
          </div>
        </>
      ) : (
        <div className="flex gap-3 p-3">
          {img && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt="" className="w-20 h-20 object-cover rounded-xl shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-bold leading-tight">{truncate(title, 70)}</p>
            {desc && <p className="text-[#71767b] text-xs mt-0.5">{truncate(desc, 100)}</p>}
            <p className="text-[#71767b] text-xs mt-1">🔗 {host}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function LinkedInCard({ og }: { og: OGData }) {
  const title = og.title || "Page Title";
  const host  = (() => { try { return new URL(og.url || "https://example.com").hostname; } catch { return "example.com"; } })();
  const img   = og.image || "";

  return (
    <div className="bg-[#1b1f23] rounded-lg overflow-hidden border border-[#38434f] w-full max-w-[500px]">
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt="" className="w-full aspect-[1.91/1] object-cover" />
      ) : (
        <div className="w-full aspect-[1.91/1] bg-[#283039] flex items-center justify-center">
          <span className="text-[#38434f] font-mono text-xs">No image</span>
        </div>
      )}
      <div className="px-4 py-3 bg-[#1d2226]">
        <p className="text-white text-sm font-semibold leading-tight">{truncate(title, 70)}</p>
        <p className="text-[#8b949e] text-xs mt-0.5">{host}</p>
      </div>
    </div>
  );
}

function DiscordCard({ og }: { og: OGData }) {
  const title = og.title || "Page Title";
  const desc  = og.description || "";
  const img   = og.image || "";
  const color = og.themeColor || "#5865f2";
  const host  = (() => { try { return new URL(og.url || "https://example.com").hostname; } catch { return "example.com"; } })();

  return (
    <div className="bg-[#2f3136] rounded-md overflow-hidden border-l-4 w-full max-w-[432px] p-3" style={{ borderLeftColor: color }}>
      <p className="text-[#00b0f4] text-xs font-semibold mb-1">{host}</p>
      <p className="text-white text-sm font-bold mb-1">{truncate(title, 80)}</p>
      {desc && <p className="text-[#dcddde] text-xs mb-2 leading-relaxed">{truncate(desc, 160)}</p>}
      {img && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt="" className="rounded-md max-w-full max-h-[300px] object-cover" />
      )}
    </div>
  );
}

function SlackCard({ og }: { og: OGData }) {
  const title = og.title || "Page Title";
  const desc  = og.description || "";
  const img   = og.image || "";
  const host  = (() => { try { return new URL(og.url || "https://example.com").hostname; } catch { return "example.com"; } })();

  return (
    <div className="bg-[#1a1d21] rounded-lg overflow-hidden border border-[#2c2e33] w-full max-w-[500px] p-3 flex gap-3">
      <div className="w-1 rounded-full bg-[#4a154b] shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[#d1d2d3] text-xs font-bold mb-0.5">{host}</p>
        <p className="text-[#1d9bd1] text-sm font-bold mb-1 hover:underline cursor-pointer">{truncate(title, 70)}</p>
        {desc && <p className="text-[#a8a8a8] text-xs mb-2">{truncate(desc, 120)}</p>}
        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" className="rounded max-w-[360px] max-h-[200px] object-cover" />
        )}
      </div>
    </div>
  );
}

function WhatsAppCard({ og }: { og: OGData }) {
  const title = og.title || "Page Title";
  const desc  = og.description || "";
  const img   = og.image || "";

  return (
    <div className="bg-[#1f2c34] rounded-lg overflow-hidden border border-[#2a3942] w-full max-w-[360px]">
      {img && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt="" className="w-full aspect-[1.91/1] object-cover" />
      )}
      <div className="px-3 py-2 bg-[#1f2c34] border-l-4 border-[#00a884]">
        <p className="text-[#e9edef] text-sm font-semibold leading-tight">{truncate(title, 60)}</p>
        {desc && <p className="text-[#8696a0] text-xs mt-0.5">{truncate(desc, 90)}</p>}
      </div>
    </div>
  );
}

function GoogleCard({ og }: { og: OGData }) {
  const title = og.title || "Page Title";
  const desc  = og.description || "";
  const host  = (() => { try { return new URL(og.url || "https://example.com").hostname; } catch { return "example.com"; } })();
  const favicon = og.favicon;

  return (
    <div className="bg-[#0f0f0f] rounded-lg p-4 w-full max-w-[600px]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-1">
        {favicon
          ? <img src={favicon} alt="" className="w-4 h-4 rounded-sm" /> // eslint-disable-line @next/next/no-img-element
          : <div className="w-4 h-4 rounded-sm bg-[#303134]" />
        }
        <span className="text-[#bdc1c6] text-sm">{host}</span>
      </div>
      {/* Title */}
      <p className="text-[#8ab4f8] text-xl hover:underline cursor-pointer mb-1 leading-tight">{truncate(title, 65)}</p>
      {/* Description */}
      {desc && <p className="text-[#bdc1c6] text-sm leading-relaxed">{truncate(desc, 160)}</p>}
    </div>
  );
}

// ── Platform config ────────────────────────────────────────────────────────
const PLATFORMS: { key: PreviewPlatform; label: string; icon: string }[] = [
  { key: "facebook",  label: "Facebook",  icon: "𝑓"  },
  { key: "twitter",   label: "Twitter/X", icon: "𝕏"  },
  { key: "linkedin",  label: "LinkedIn",  icon: "in" },
  { key: "discord",   label: "Discord",   icon: "🎮" },
  { key: "slack",     label: "Slack",     icon: "💬" },
  { key: "whatsapp",  label: "WhatsApp",  icon: "📱" },
  { key: "google",    label: "Google",    icon: "G"  },
];

// ── Main ───────────────────────────────────────────────────────────────────
export default function OGPreviewer() {
  const [url, setUrl]           = useState("");
  const [html, setHtml]         = useState("");
  const [og, setOg]             = useState<OGData | null>(null);
  const [status, setStatus]     = useState<FetchStatus>("idle");
  const [error, setError]       = useState("");
  const [platform, setPlatform] = useState<PreviewPlatform>("facebook");
  const [activeTab, setActiveTab] = useState<"url" | "html" | "manual">("url");
  const [copied, setCopied]     = useState<string | null>(null);
  const [manual, setManual]     = useState<OGData>({ ...EMPTY_OG });

  // Manual edit
  const handleManualChange = (key: keyof OGData, val: string) => {
    setManual(prev => ({ ...prev, [key]: val }));
    setOg({ ...manual, [key]: val });
  };

  // Parse from HTML
  const handleParseHtml = useCallback(() => {
    if (!html.trim()) return;
    const base = url || "https://example.com";
    const parsed = parseOGFromHtml(html, base);
    setOg(parsed);
    setStatus("done");
  }, [html, url]);

  // Fetch URL via CORS proxy
  const handleFetch = useCallback(async () => {
    if (!url.trim()) return;
    setStatus("fetching"); setError(""); setOg(null);

    // Try multiple CORS proxies
    const proxies = [
      `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
    ];

    let succeeded = false;
    for (const proxy of proxies) {
      try {
        const res = await fetch(proxy, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) continue;
        const data = await res.json().catch(() => null);
        const htmlText = data?.contents ?? await res.text();
        if (!htmlText) continue;
        const parsed = parseOGFromHtml(htmlText, url);
        setOg(parsed);
        setHtml(htmlText.slice(0, 50000)); // cap at 50k chars
        setStatus("done");
        succeeded = true;
        break;
      } catch { /* try next proxy */ }
    }

    if (!succeeded) {
      setStatus("error");
      setError("Could not fetch URL. Try pasting the page HTML directly in the 'HTML' tab, or use Manual mode.");
    }
  }, [url]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleFetch();
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1600);
  };

  const generateMetaTags = (d: OGData) => `<!-- Primary Meta -->
<title>${d.title}</title>
<meta name="description" content="${d.description}" />

<!-- Open Graph -->
<meta property="og:type" content="${d.type}" />
<meta property="og:url" content="${d.url}" />
<meta property="og:title" content="${d.title}" />
<meta property="og:description" content="${d.description}" />
<meta property="og:image" content="${d.image}" />
${d.siteName ? `<meta property="og:site_name" content="${d.siteName}" />` : ""}

<!-- Twitter -->
<meta name="twitter:card" content="${d.twitterCard}" />
<meta name="twitter:title" content="${d.twitterTitle || d.title}" />
<meta name="twitter:description" content="${d.twitterDescription || d.description}" />
<meta name="twitter:image" content="${d.twitterImage || d.image}" />
${d.twitterSite ? `<meta name="twitter:site" content="${d.twitterSite}" />` : ""}`;

  const activeOg = activeTab === "manual" ? manual : og;

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      {/* BG */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-orange-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

      <ToolNavbar toolName="OG Previewer" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-orange-500/10 flex items-center justify-center text-orange-400 text-lg">🔗</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">OG Previewer</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded">Open Graph</span>
          </div>
          <p className="text-slate-500 text-sm">
            Preview how your links look on Facebook, Twitter/X, LinkedIn, Discord, Slack, WhatsApp and Google.
          </p>
        </div>

        {/* Input section */}
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-5 mb-5">

          {/* Tabs */}
          <div className="flex gap-1 mb-4">
            {([
              { key: "url",    label: "🌐 Fetch URL"    },
              { key: "html",   label: "📄 Paste HTML"   },
              { key: "manual", label: "✏️ Manual"        },
            ] as { key: typeof activeTab; label: string }[]).map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`font-mono text-xs px-4 py-1.5 rounded-lg border transition-all
                  ${activeTab === t.key ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* URL tab */}
          {activeTab === "url" && (
            <div className="flex gap-2">
              <input
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="https://example.com"
                className="flex-1 font-mono text-sm bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-slate-200 outline-none focus:border-orange-500/40 transition-colors"
              />
              <button
                onClick={handleFetch}
                disabled={status === "fetching" || !url.trim()}
                className="font-mono text-sm px-5 py-2.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-lg hover:bg-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold flex items-center gap-2"
              >
                {status === "fetching"
                  ? <><div className="w-3.5 h-3.5 rounded-full border-2 border-orange-400/30 border-t-orange-400 animate-spin" />Fetching…</>
                  : "→ Fetch"}
              </button>
            </div>
          )}

          {/* HTML tab */}
          {activeTab === "html" && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 mb-1">
                <input value={url} onChange={e => setUrl(e.target.value)}
                  placeholder="https://your-site.com (optional, for resolving relative URLs)"
                  className="flex-1 font-mono text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-slate-400 outline-none focus:border-orange-500/30 transition-colors" />
              </div>
              <textarea
                value={html}
                onChange={e => setHtml(e.target.value)}
                placeholder={"Paste full HTML of a page here — the parser will extract all OG/Twitter meta tags.\n\nTip: In Chrome, right-click → View Page Source → Ctrl+A → Ctrl+C"}
                spellCheck={false}
                className="w-full h-36 font-mono text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg p-4 text-slate-400 placeholder-slate-700 outline-none resize-none transition-colors focus:border-orange-500/30"
              />
              <button onClick={handleParseHtml} disabled={!html.trim()}
                className="self-end font-mono text-sm px-5 py-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-lg hover:bg-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold">
                → Parse HTML
              </button>
            </div>
          )}

          {/* Manual tab */}
          {activeTab === "manual" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {([
                { key: "title",       label: "Title",             placeholder: "Page title"             },
                { key: "description", label: "Description",       placeholder: "Page description"       },
                { key: "image",       label: "OG Image URL",      placeholder: "https://…/image.jpg"    },
                { key: "url",         label: "Page URL",          placeholder: "https://example.com"    },
                { key: "siteName",    label: "Site Name",         placeholder: "My Site"                },
                { key: "twitterCard", label: "Twitter Card",      placeholder: "summary_large_image"    },
                { key: "twitterSite", label: "Twitter @handle",   placeholder: "@yoursite"              },
                { key: "themeColor",  label: "Theme Color",       placeholder: "#5865f2"                },
              ] as { key: keyof OGData; label: string; placeholder: string }[]).map(f => (
                <div key={f.key}>
                  <label className="font-mono text-[10px] uppercase tracking-widest text-slate-600 block mb-1">{f.label}</label>
                  <input
                    value={manual[f.key]}
                    onChange={e => handleManualChange(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full font-mono text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-slate-300 outline-none focus:border-orange-500/30 transition-colors"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {status === "error" && error && (
            <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
              <span className="text-red-400 text-xs mt-0.5 shrink-0">✕</span>
              <span className="font-mono text-xs text-red-400">{error}</span>
            </div>
          )}
        </div>

        {activeOg && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">

            {/* ── Left: Preview ── */}
            <div className="flex flex-col gap-4">

              {/* Platform tabs */}
              <div className="flex flex-wrap gap-1.5">
                {PLATFORMS.map(p => (
                  <button key={p.key} onClick={() => setPlatform(p.key)}
                    className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5
                      ${platform === p.key ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                    <span className="text-sm">{p.icon}</span>
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Platform preview */}
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-6 flex justify-center">
                <div className="w-full max-w-lg">
                  {platform === "facebook"  && <FacebookCard  og={activeOg} />}
                  {platform === "twitter"   && <TwitterCard   og={activeOg} />}
                  {platform === "linkedin"  && <LinkedInCard  og={activeOg} />}
                  {platform === "discord"   && <DiscordCard   og={activeOg} />}
                  {platform === "slack"     && <SlackCard     og={activeOg} />}
                  {platform === "whatsapp"  && <WhatsAppCard  og={activeOg} />}
                  {platform === "google"    && <GoogleCard    og={activeOg} />}
                </div>
              </div>

              {/* All platforms at once */}
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-5">
                <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-4">All Platforms</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {PLATFORMS.map(p => (
                    <div key={p.key} className="flex flex-col gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600">{p.label}</span>
                      <div className="scale-[0.75] origin-top-left" style={{ width: "133%" }}>
                        {p.key === "facebook"  && <FacebookCard  og={activeOg} />}
                        {p.key === "twitter"   && <TwitterCard   og={activeOg} />}
                        {p.key === "linkedin"  && <LinkedInCard  og={activeOg} />}
                        {p.key === "discord"   && <DiscordCard   og={activeOg} />}
                        {p.key === "slack"     && <SlackCard     og={activeOg} />}
                        {p.key === "whatsapp"  && <WhatsAppCard  og={activeOg} />}
                        {p.key === "google"    && <GoogleCard    og={activeOg} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Right: Data + meta tags ── */}
            <div className="flex flex-col gap-4">

              {/* Parsed fields */}
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
                <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-3">Extracted Tags</p>
                <div className="space-y-2">
                  {([
                    { key: "title",              label: "og:title"          },
                    { key: "description",        label: "og:description"    },
                    { key: "image",              label: "og:image"          },
                    { key: "url",                label: "og:url"            },
                    { key: "siteName",           label: "og:site_name"      },
                    { key: "type",               label: "og:type"           },
                    { key: "twitterCard",        label: "twitter:card"      },
                    { key: "twitterSite",        label: "twitter:site"      },
                    { key: "themeColor",         label: "theme-color"       },
                  ] as { key: keyof OGData; label: string }[]).map(f => {
                    const val = activeOg[f.key];
                    if (!val) return null;
                    return (
                      <div key={f.key} className="flex items-start gap-2 group">
                        <div className="flex-1 min-w-0">
                          <span className="font-mono text-[10px] text-slate-600 block">{f.label}</span>
                          <span className="font-mono text-xs text-slate-300 break-all leading-relaxed">{val}</span>
                        </div>
                        <button onClick={() => copy(val, f.key)}
                          className={`font-mono text-[10px] px-1.5 py-0.5 rounded border transition-all shrink-0 mt-3 opacity-0 group-hover:opacity-100
                            ${copied === f.key ? "text-emerald-400 border-emerald-500/30" : "border-white/[0.08] text-slate-600 hover:text-slate-300"}`}>
                          {copied === f.key ? "✓" : "copy"}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* OG image preview */}
                {activeOg.image && (
                  <div className="mt-3 pt-3 border-t border-white/[0.06]">
                    <p className="font-mono text-[10px] text-slate-600 mb-2">OG Image Preview</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={activeOg.image} alt="OG" className="w-full rounded-lg object-cover aspect-[1.91/1] border border-white/[0.06]" />
                  </div>
                )}
              </div>

              {/* Generated meta tags */}
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600">Generated Meta Tags</p>
                  <button onClick={() => copy(generateMetaTags(activeOg), "metatags")}
                    className={`font-mono text-[11px] px-3 py-1 rounded border transition-all
                      ${copied === "metatags" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                    {copied === "metatags" ? "✓ Copied!" : "Copy"}
                  </button>
                </div>
                <pre className="font-mono text-[10px] text-slate-400 whitespace-pre-wrap leading-relaxed overflow-auto max-h-64">
                  {generateMetaTags(activeOg)}
                </pre>
              </div>

              {/* Checklist */}
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
                <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 mb-3">OG Checklist</p>
                <div className="space-y-1.5">
                  {[
                    { label: "og:title",       pass: !!activeOg.title,             warn: false },
                    { label: "og:description", pass: !!activeOg.description,       warn: false },
                    { label: "og:image",       pass: !!activeOg.image,             warn: false },
                    { label: "og:url",         pass: !!activeOg.url,               warn: false },
                    { label: "og:site_name",   pass: !!activeOg.siteName,          warn: true  },
                    { label: "twitter:card",   pass: !!activeOg.twitterCard,       warn: false },
                    { label: "twitter:image",  pass: !!activeOg.twitterImage,      warn: true  },
                    { label: "twitter:site",   pass: !!activeOg.twitterSite,       warn: true  },
                    { label: "Title ≤ 60 chars",    pass: activeOg.title.length <= 60 && !!activeOg.title, warn: false },
                    { label: "Desc ≤ 160 chars",    pass: activeOg.description.length <= 160 && !!activeOg.description, warn: false },
                  ].map(({ label, pass, warn }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className={`text-xs shrink-0 ${pass ? "text-emerald-400" : warn ? "text-yellow-400" : "text-red-400"}`}>
                        {pass ? "✓" : warn ? "~" : "✕"}
                      </span>
                      <span className={`font-mono text-xs ${pass ? "text-slate-400" : warn ? "text-yellow-400/70" : "text-red-400/70"}`}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats bar */}
        {activeOg && (
          <div className="flex flex-wrap gap-6 px-4 py-3 bg-orange-500/[0.05] border border-orange-500/20 rounded-lg mt-5 mb-5">
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Title</span><span className={`font-mono text-sm ${activeOg.title.length > 60 ? "text-red-400" : "text-orange-400"}`}>{activeOg.title.length}/60</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Desc</span><span className={`font-mono text-sm ${activeOg.description.length > 160 ? "text-red-400" : "text-orange-400"}`}>{activeOg.description.length}/160</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Image</span><span className={`font-mono text-sm ${activeOg.image ? "text-emerald-400" : "text-red-400"}`}>{activeOg.image ? "✓ Set" : "✕ Missing"}</span></div>
            <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Twitter</span><span className={`font-mono text-sm ${activeOg.twitterCard ? "text-emerald-400" : "text-yellow-400"}`}>{activeOg.twitterCard || "Not set"}</span></div>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              <span className="font-mono text-[10px] text-orange-500/60">Live Preview</span>
            </div>
          </div>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "🔗", title: "7 Platforms",    desc: "Accurate previews for Facebook, Twitter/X, LinkedIn, Discord, Slack, WhatsApp and Google search." },
            { icon: "✅", title: "OG Checklist",   desc: "Instant pass/fail checklist — og:title, og:image, twitter:card, character limits and more." },
            { icon: "✏️", title: "3 Input Modes",  desc: "Fetch live URL, paste raw HTML, or manually enter OG tags to test before deploying." },
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