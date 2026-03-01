"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useMemo, useEffect } from "react";

// ── Types ─────────────────────────────────────────────────────
interface ParsedUA {
  raw: string;
  browser: { name: string; version: string; engine: string; engineVersion: string };
  os: { name: string; version: string; platform: string };
  device: { type: string; vendor: string; model: string };
  bot: { isBot: boolean; name: string };
  features: { mobile: boolean; tablet: boolean; desktop: boolean; touch: boolean; crawler: boolean };
}

// ── UA Parser (pure client-side, no lib) ─────────────────────
function parseUA(ua: string): ParsedUA {
  const empty: ParsedUA = {
    raw: ua,
    browser:  { name: "Unknown", version: "", engine: "Unknown", engineVersion: "" },
    os:       { name: "Unknown", version: "", platform: "" },
    device:   { type: "Desktop", vendor: "", model: "" },
    bot:      { isBot: false, name: "" },
    features: { mobile: false, tablet: false, desktop: true, touch: false, crawler: false },
  };
  if (!ua.trim()) return empty;

  const u = ua;
  const ul = ua.toLowerCase();

  // ── Bot / Crawler detection ──
  const botPatterns: [RegExp, string][] = [
    [/googlebot/i,        "Googlebot"],
    [/bingbot/i,          "Bingbot"],
    [/slurp/i,            "Yahoo Slurp"],
    [/duckduckbot/i,      "DuckDuckBot"],
    [/baiduspider/i,      "Baiduspider"],
    [/yandexbot/i,        "YandexBot"],
    [/sogou/i,            "Sogou"],
    [/facebookexternalhit/i, "Facebook"],
    [/twitterbot/i,       "Twitterbot"],
    [/linkedinbot/i,      "LinkedInBot"],
    [/applebot/i,         "Applebot"],
    [/semrushbot/i,       "SEMrushBot"],
    [/ahrefsbot/i,        "AhrefsBot"],
    [/mj12bot/i,          "MJ12bot"],
    [/crawler|spider|bot|scraper|archiver|slurp/i, "Generic Bot"],
  ];
  let botName = "";
  for (const [re, name] of botPatterns) {
    if (re.test(u)) { botName = name; break; }
  }

  // ── OS detection ──
  let osName = "Unknown", osVersion = "", osPlatform = "";

  if (/windows nt 10/i.test(u))       { osName = "Windows"; osVersion = "10/11"; osPlatform = "Windows"; }
  else if (/windows nt 6\.3/i.test(u)) { osName = "Windows"; osVersion = "8.1"; osPlatform = "Windows"; }
  else if (/windows nt 6\.2/i.test(u)) { osName = "Windows"; osVersion = "8"; osPlatform = "Windows"; }
  else if (/windows nt 6\.1/i.test(u)) { osName = "Windows"; osVersion = "7"; osPlatform = "Windows"; }
  else if (/windows nt 6\.0/i.test(u)) { osName = "Windows"; osVersion = "Vista"; osPlatform = "Windows"; }
  else if (/windows nt 5/i.test(u))   { osName = "Windows"; osVersion = "XP"; osPlatform = "Windows"; }
  else if (/windows phone/i.test(u))  { osName = "Windows Phone"; osPlatform = "Mobile"; const m = u.match(/windows phone (?:os )?(\d+[\d.]*)/i); if (m) osVersion = m[1]; }
  else if (/windows/i.test(u))        { osName = "Windows"; osPlatform = "Windows"; }
  else if (/iphone os/i.test(u))      { osName = "iOS"; osPlatform = "Mobile"; const m = u.match(/iphone os (\d+[_\d]*)/i); if (m) osVersion = m[1].replace(/_/g, "."); }
  else if (/ipad/i.test(u))           { osName = "iPadOS"; osPlatform = "Tablet"; const m = u.match(/os (\d+[_\d]*)/i); if (m) osVersion = m[1].replace(/_/g, "."); }
  else if (/ipod/i.test(u))           { osName = "iOS"; osPlatform = "Mobile"; }
  else if (/android/i.test(u))        { osName = "Android"; osPlatform = "Mobile"; const m = u.match(/android (\d+[\d.]*)/i); if (m) osVersion = m[1]; }
  else if (/mac os x/i.test(u))       { osName = "macOS"; osPlatform = "macOS"; const m = u.match(/mac os x (\d+[_\d.]*)/i); if (m) osVersion = m[1].replace(/_/g, "."); }
  else if (/cros/i.test(u))           { osName = "ChromeOS"; osPlatform = "ChromeOS"; }
  else if (/linux/i.test(u))          { osName = "Linux"; osPlatform = "Linux"; }
  else if (/freebsd/i.test(u))        { osName = "FreeBSD"; osPlatform = "Unix"; }

  // ── Browser detection ──
  let bName = "Unknown", bVersion = "", engine = "Unknown", engineVersion = "";

  // Engine
  const webkitM  = u.match(/applewebkit\/([\d.]+)/i);
  const geckoM   = u.match(/gecko\/([\d.]+)/i);
  const tridentM = u.match(/trident\/([\d.]+)/i);
  const blinkM   = u.match(/(?:chrome|chromium)\/([\d.]+)/i);

  if (blinkM && /webkit/i.test(u)) { engine = "Blink"; engineVersion = blinkM[1]; }
  else if (webkitM) { engine = "WebKit"; engineVersion = webkitM[1]; }
  else if (tridentM) { engine = "Trident"; engineVersion = tridentM[1]; }
  else if (geckoM) { engine = "Gecko"; engineVersion = geckoM[1]; }

  // Browser — order matters
  if (/edg\//i.test(u)) {
    bName = "Microsoft Edge"; const m = u.match(/edg\/([\d.]+)/i); if (m) bVersion = m[1];
  } else if (/edghtml/i.test(u) || /edge\//i.test(u)) {
    bName = "Microsoft Edge (Legacy)"; const m = u.match(/edge\/([\d.]+)/i); if (m) bVersion = m[1];
  } else if (/opr\//i.test(u) || /opera\//i.test(u)) {
    bName = "Opera"; const m = u.match(/(?:opr|opera)\/([\d.]+)/i); if (m) bVersion = m[1];
  } else if (/yabrowser/i.test(u)) {
    bName = "Yandex Browser"; const m = u.match(/yabrowser\/([\d.]+)/i); if (m) bVersion = m[1];
  } else if (/ucbrowser/i.test(u)) {
    bName = "UC Browser"; const m = u.match(/ucbrowser\/([\d.]+)/i); if (m) bVersion = m[1];
  } else if (/samsungbrowser/i.test(u)) {
    bName = "Samsung Browser"; const m = u.match(/samsungbrowser\/([\d.]+)/i); if (m) bVersion = m[1];
  } else if (/brave/i.test(u)) {
    bName = "Brave"; const m = u.match(/brave\/([\d.]+)/i); if (m) bVersion = m[1];
    if (!bVersion) { const c = u.match(/chrome\/([\d.]+)/i); if (c) bVersion = c[1]; }
  } else if (/vivaldi/i.test(u)) {
    bName = "Vivaldi"; const m = u.match(/vivaldi\/([\d.]+)/i); if (m) bVersion = m[1];
  } else if (/chromium/i.test(u)) {
    bName = "Chromium"; const m = u.match(/chromium\/([\d.]+)/i); if (m) bVersion = m[1];
  } else if (/crios/i.test(u)) {
    bName = "Chrome (iOS)"; const m = u.match(/crios\/([\d.]+)/i); if (m) bVersion = m[1];
  } else if (/fxios/i.test(u)) {
    bName = "Firefox (iOS)"; const m = u.match(/fxios\/([\d.]+)/i); if (m) bVersion = m[1];
  } else if (/chrome\//i.test(u) && !/chromium/i.test(u)) {
    bName = "Google Chrome"; const m = u.match(/chrome\/([\d.]+)/i); if (m) bVersion = m[1];
  } else if (/safari\//i.test(u) && /version\//i.test(u)) {
    bName = "Safari"; const m = u.match(/version\/([\d.]+)/i); if (m) bVersion = m[1];
  } else if (/firefox\//i.test(u)) {
    bName = "Firefox"; const m = u.match(/firefox\/([\d.]+)/i); if (m) bVersion = m[1];
  } else if (/msie/i.test(u) || /trident/i.test(u)) {
    bName = "Internet Explorer"; const m = u.match(/(?:msie |rv:)(\d+[\d.]*)/i); if (m) bVersion = m[1];
  } else if (botName) {
    bName = botName;
  }

  // ── Device ──
  let deviceType = "Desktop", vendor = "", model = "";
  const isTablet   = /ipad|tablet|kindle|silk|playbook|(android(?!.*mobile))/i.test(u);
  const isMobile   = /mobile|iphone|ipod|android.*mobile|windows phone|bb\d+|meego|palm|symbian|webos/i.test(u) && !isTablet;
  const isTV       = /smart.?tv|smarttv|hbbtv|appletv|googletv|crkey|chromecast|roku|webos.*(tv|iptv)/i.test(u);
  const isWearable = /glass|watch|wear/i.test(u);

  if      (isWearable) deviceType = "Wearable";
  else if (isTV)       deviceType = "Smart TV";
  else if (isTablet)   deviceType = "Tablet";
  else if (isMobile)   deviceType = "Mobile";
  else                 deviceType = "Desktop";

  // Vendor detection
  if      (/samsung/i.test(u))      vendor = "Samsung";
  else if (/iphone|ipad|ipod|mac/i.test(u)) vendor = "Apple";
  else if (/huawei/i.test(u))       vendor = "Huawei";
  else if (/xiaomi|mi\s|redmi/i.test(u)) vendor = "Xiaomi";
  else if (/oppo/i.test(u))         vendor = "OPPO";
  else if (/vivo/i.test(u))         vendor = "vivo";
  else if (/pixel/i.test(u))        vendor = "Google";
  else if (/nexus/i.test(u))        vendor = "Google";
  else if (/oneplus/i.test(u))      vendor = "OnePlus";
  else if (/motorola|moto/i.test(u)) vendor = "Motorola";
  else if (/lg/i.test(u))           vendor = "LG";
  else if (/nokia/i.test(u))        vendor = "Nokia";
  else if (/sony/i.test(u))         vendor = "Sony";

  // Model detection
  const iphoneM = u.match(/iphone/i);
  const ipadM   = u.match(/ipad/i);
  const pixelM  = u.match(/pixel\s?(\d+)/i);
  const samsungM = u.match(/sm-([a-z0-9]+)/i);
  if (iphoneM)  model = "iPhone";
  else if (ipadM) model = "iPad";
  else if (pixelM) model = "Pixel " + pixelM[1];
  else if (samsungM) model = "SM-" + samsungM[1].toUpperCase();

  return {
    raw: ua,
    browser:  { name: bName, version: bVersion, engine, engineVersion },
    os:       { name: osName, version: osVersion, platform: osPlatform },
    device:   { type: deviceType, vendor, model },
    bot:      { isBot: !!botName, name: botName },
    features: {
      mobile:   isMobile || deviceType === "Mobile",
      tablet:   isTablet || deviceType === "Tablet",
      desktop:  deviceType === "Desktop",
      touch:    isMobile || isTablet,
      crawler:  !!botName,
    },
  };
}

// ── Icons ─────────────────────────────────────────────────────
function browserIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("chrome"))   return "🟡";
  if (n.includes("firefox"))  return "🦊";
  if (n.includes("safari"))   return "🧭";
  if (n.includes("edge"))     return "🔵";
  if (n.includes("opera"))    return "🔴";
  if (n.includes("brave"))    return "🦁";
  if (n.includes("samsung"))  return "📱";
  if (n.includes("vivaldi"))  return "🎹";
  return "🌐";
}

function osIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("windows"))  return "🪟";
  if (n.includes("mac") || n.includes("ios") || n.includes("ipad")) return "🍎";
  if (n.includes("android"))  return "🤖";
  if (n.includes("linux"))    return "🐧";
  if (n.includes("chromeos")) return "🟢";
  return "💻";
}

function deviceIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes("mobile"))   return "📱";
  if (t.includes("tablet"))   return "📟";
  if (t.includes("tv"))       return "📺";
  if (t.includes("wearable")) return "⌚";
  return "🖥️";
}

// ── Example UAs ───────────────────────────────────────────────
const EXAMPLES = [
  { label: "Chrome / Win",   ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
  { label: "Safari / Mac",   ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15" },
  { label: "Firefox / Linux",ua: "Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0" },
  { label: "iPhone / Safari",ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1" },
  { label: "Android / Chrome",ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36" },
  { label: "Edge / Win",     ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0" },
  { label: "Googlebot",      ua: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" },
  { label: "iPad / Safari",  ua: "Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1" },
  { label: "Samsung Browser",ua: "Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36" },
  { label: "IE 11",          ua: "Mozilla/5.0 (Windows NT 10.0; Trident/7.0; rv:11.0) like Gecko" },
];

export default function UserAgentParser() {
  const [input, setInput]     = useState("");
  const [copied, setCopied]   = useState<string | null>(null);
  const [myUA, setMyUA]       = useState("");

  useEffect(() => {
    const ua = navigator.userAgent;
    setMyUA(ua);
    setInput(ua);
  }, []);

  const parsed = useMemo(() => parseUA(input), [input]);

  const copy = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const Chip = ({ label, value, color = "text-slate-400", icon = "" }: { label: string; value: string; color?: string; icon?: string }) => (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3">
      <div className="flex items-center gap-1.5 mb-1">
        {icon && <span className="text-base">{icon}</span>}
        <span className="font-mono text-[10px] text-slate-700 uppercase tracking-widest">{label}</span>
      </div>
      <div className={`font-mono text-sm font-bold ${color} truncate`}>{value || "—"}</div>
    </div>
  );

  const Row = ({ label, value, copyKey, color = "text-slate-300" }: { label: string; value: string; copyKey?: string; color?: string }) => {
    if (!value) return null;
    return (
      <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0 group">
        <span className="font-mono text-[10px] text-slate-600 w-32 shrink-0">{label}</span>
        <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
          <span className={`font-mono text-xs ${color} text-right`}>{value}</span>
          {copyKey && (
            <button onClick={() => copy(value, copyKey)}
              className={`font-mono text-[9px] px-1.5 py-0.5 rounded border transition-all shrink-0 opacity-0 group-hover:opacity-100 ${copied === copyKey ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-700 hover:text-slate-400"}`}>
              {copied === copyKey ? "✓" : "copy"}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-violet-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

      {/* NAV */}

      <ToolNavbar toolName="User Agent Parser" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-violet-500/10 flex items-center justify-center text-lg">🔍</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">User Agent Parser</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded">client-side</span>
          </div>
          <p className="text-slate-500 text-sm">Parse any user agent string — detect browser, OS, device type, rendering engine, and bots. No server needed.</p>
        </div>

        {/* Input */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">User Agent String</span>
            {myUA && (
              <button onClick={() => setInput(myUA)}
                className="font-mono text-[10px] px-2.5 py-1 border border-violet-500/30 text-violet-400 rounded hover:bg-violet-500/10 transition-all">
                📍 Use My UA
              </button>
            )}
          </div>
          <div className="flex gap-2 mb-3">
            <textarea value={input} onChange={e => setInput(e.target.value)}
              rows={3} spellCheck={false}
              placeholder="Paste any user agent string here…"
              className="flex-1 font-mono text-xs px-4 py-3 bg-black/40 border border-white/[0.08] rounded-xl text-slate-300 placeholder-slate-700 outline-none focus:border-violet-500/30 resize-none transition-colors leading-relaxed" />
            <div className="flex flex-col gap-2">
              <button onClick={() => copy(input, "raw-ua")}
                className={`font-mono text-xs px-3 py-2 border rounded-xl transition-all ${copied === "raw-ua" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                {copied === "raw-ua" ? "✓" : "Copy"}
              </button>
              <button onClick={() => setInput("")}
                className="font-mono text-xs px-3 py-2 border border-white/[0.08] text-slate-600 rounded-xl hover:text-red-400 hover:border-red-500/30 transition-all">
                Clear
              </button>
            </div>
          </div>

          {/* Examples */}
          <div className="flex flex-wrap gap-1.5">
            <span className="font-mono text-[10px] text-slate-700 self-center">Examples:</span>
            {EXAMPLES.map(ex => (
              <button key={ex.label} onClick={() => setInput(ex.ua)}
                className="font-mono text-[10px] px-2.5 py-1 border border-white/[0.08] text-slate-600 rounded hover:text-violet-400 hover:border-violet-500/30 transition-all">
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        {input.trim() && (
          <>
            {/* ── Big summary chips ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <Chip label="Browser" value={parsed.browser.name} color="text-violet-400" icon={browserIcon(parsed.browser.name)} />
              <Chip label="OS"      value={parsed.os.name}      color="text-emerald-400" icon={osIcon(parsed.os.name)} />
              <Chip label="Device"  value={parsed.device.type}  color="text-cyan-400"   icon={deviceIcon(parsed.device.type)} />
              <Chip label="Engine"  value={parsed.browser.engine} color="text-orange-400" icon="⚙️" />
            </div>

            {/* ── Bot banner ── */}
            {parsed.bot.isBot && (
              <div className="flex items-center gap-3 px-4 py-3 mb-5 bg-yellow-500/[0.08] border border-yellow-500/25 rounded-xl">
                <span className="text-xl">🤖</span>
                <div>
                  <div className="font-mono text-sm font-bold text-yellow-400">Bot / Crawler Detected</div>
                  <div className="font-mono text-xs text-yellow-600">{parsed.bot.name}</div>
                </div>
              </div>
            )}

            {/* ── Feature flags ── */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { label: "Mobile",   active: parsed.features.mobile,   color: "text-pink-400   bg-pink-500/10   border-pink-500/20"   },
                { label: "Tablet",   active: parsed.features.tablet,   color: "text-cyan-400   bg-cyan-500/10   border-cyan-500/20"   },
                { label: "Desktop",  active: parsed.features.desktop,  color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
                { label: "Touch",    active: parsed.features.touch,    color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
                { label: "Crawler",  active: parsed.features.crawler,  color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
              ].map(f => (
                <span key={f.label}
                  className={`font-mono text-[11px] px-3 py-1.5 rounded-full border transition-all ${f.active ? f.color : "text-slate-700 bg-white/[0.02] border-white/[0.06]"}`}>
                  {f.active ? "✓" : "✗"} {f.label}
                </span>
              ))}
            </div>

            {/* ── Detail panels ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

              {/* Browser */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
                  <span className="text-base">{browserIcon(parsed.browser.name)}</span>
                  <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Browser</span>
                </div>
                <div className="p-4">
                  <Row label="Name"           value={parsed.browser.name}          color="text-violet-400"  copyKey="b-name" />
                  <Row label="Version"        value={parsed.browser.version}       color="text-slate-300"   copyKey="b-ver" />
                  <Row label="Engine"         value={parsed.browser.engine}        color="text-orange-400"  />
                  <Row label="Engine ver."    value={parsed.browser.engineVersion} color="text-slate-400"   />
                </div>
              </div>

              {/* OS */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
                  <span className="text-base">{osIcon(parsed.os.name)}</span>
                  <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Operating System</span>
                </div>
                <div className="p-4">
                  <Row label="Name"           value={parsed.os.name}     color="text-emerald-400" copyKey="os-name" />
                  <Row label="Version"        value={parsed.os.version}  color="text-slate-300"   copyKey="os-ver" />
                  <Row label="Platform"       value={parsed.os.platform} color="text-slate-400"   />
                </div>
              </div>

              {/* Device */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
                  <span className="text-base">{deviceIcon(parsed.device.type)}</span>
                  <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Device</span>
                </div>
                <div className="p-4">
                  <Row label="Type"   value={parsed.device.type}   color="text-cyan-400"    />
                  <Row label="Vendor" value={parsed.device.vendor} color="text-slate-300"   copyKey="d-vendor" />
                  <Row label="Model"  value={parsed.device.model}  color="text-slate-400"   copyKey="d-model" />
                </div>
              </div>
            </div>

            {/* ── Raw UA with highlighting ── */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Raw String</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-slate-700">{input.length} chars</span>
                  <button onClick={() => copy(input, "raw-full")}
                    className={`font-mono text-[11px] px-3 py-1 rounded border transition-all ${copied === "raw-full" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                    {copied === "raw-full" ? "✓ Copied!" : "Copy"}
                  </button>
                </div>
              </div>
              <div className="bg-black/40 border border-white/[0.06] rounded-lg p-4 font-mono text-xs text-slate-400 break-all leading-relaxed">
                {input}
              </div>
            </div>

            {/* ── JSON export ── */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">JSON Output</span>
                <button onClick={() => copy(JSON.stringify({ browser: parsed.browser, os: parsed.os, device: parsed.device, bot: parsed.bot, features: parsed.features }, null, 2), "json-out")}
                  className={`font-mono text-[11px] px-3 py-1 rounded border transition-all ${copied === "json-out" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                  {copied === "json-out" ? "✓ Copied!" : "Copy JSON"}
                </button>
              </div>
              <div className="bg-black/40 border border-white/[0.06] rounded-lg p-4 overflow-auto max-h-72">
                <pre className="font-mono text-xs text-emerald-400 leading-relaxed">
                  {JSON.stringify({ browser: parsed.browser, os: parsed.os, device: parsed.device, bot: parsed.bot, features: parsed.features }, null, 2)}
                </pre>
              </div>
            </div>
          </>
        )}

        {/* Empty state */}
        {!input.trim() && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <span className="text-5xl">🔍</span>
            <div className="font-mono text-sm text-slate-600 text-center">Paste a user agent string above or click an example</div>
          </div>
        )}

        {/* Info */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-6">
          {[
            { icon: "🌐", title: "30+ Browsers",  desc: "Chrome, Safari, Firefox, Edge, Opera, Brave, Samsung, UC and more." },
            { icon: "💻", title: "All Platforms",  desc: "Windows, macOS, iOS, Android, Linux, ChromeOS, FreeBSD." },
            { icon: "🤖", title: "Bot Detection",  desc: "Detects 15+ crawlers including Google, Bing, Facebook bots." },
            { icon: "📋", title: "JSON Export",    desc: "Copy parsed results as clean JSON for use in your code." },
          ].map(c => (
            <div key={c.title} className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-4 py-4">
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