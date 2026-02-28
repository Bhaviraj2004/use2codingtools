"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useCallback, useMemo } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
type TabId = "box" | "typography" | "flex" | "grid" | "effects" | "custom";
type CopyTarget = string | null;

// ── Tailwind class maps ────────────────────────────────────────────────────
const SPACING = ["0","px","0.5","1","1.5","2","2.5","3","3.5","4","5","6","7","8","9","10","11","12","14","16","20","24","28","32","36","40","44","48","52","56","60","64","72","80","96","auto"];
const COLORS  = ["slate","gray","zinc","neutral","stone","red","orange","amber","yellow","lime","green","emerald","teal","cyan","sky","blue","indigo","violet","purple","fuchsia","pink","rose"];
const SHADES  = ["50","100","200","300","400","500","600","700","800","900","950"];
const FONT_SIZES   = ["xs","sm","base","lg","xl","2xl","3xl","4xl","5xl","6xl","7xl","8xl","9xl"];
const FONT_WEIGHTS = ["thin","extralight","light","normal","medium","semibold","bold","extrabold","black"];
const LEADING      = ["none","tight","snug","normal","relaxed","loose","3","4","5","6","7","8","9","10"];
const TRACKING     = ["tighter","tight","normal","wide","wider","widest"];
const ROUNDED      = ["none","sm","","md","lg","xl","2xl","3xl","full"];
const SHADOWS      = ["none","sm","","md","lg","xl","2xl","inner"];
const BORDER_W     = ["0","","2","4","8"];
const OPACITY      = ["0","5","10","20","25","30","40","50","60","70","75","80","90","95","100"];
const TRANSITION   = ["none","all","colors","opacity","shadow","transform"];
const DURATION     = ["75","100","150","200","300","500","700","1000"];
const EASE         = ["linear","in","out","in-out"];
const BLUR         = ["none","sm","","md","lg","xl","2xl","3xl"];
const RING_W       = ["0","1","2","4","8","inset"];
const Z_INDEX      = ["0","10","20","30","40","50","auto"];
const CURSOR       = ["auto","default","pointer","wait","text","move","not-allowed","crosshair","grab"];
const OVERFLOW     = ["auto","hidden","clip","visible","scroll"];
const POSITION     = ["static","fixed","absolute","relative","sticky"];
const DISPLAY      = ["block","inline-block","inline","flex","inline-flex","grid","inline-grid","hidden","contents","flow-root","list-item"];
const FLEX_DIR     = ["row","row-reverse","col","col-reverse"];
const FLEX_WRAP    = ["nowrap","wrap","wrap-reverse"];
const JUSTIFY      = ["normal","start","end","center","between","around","evenly","stretch"];
const ALIGN_ITEMS  = ["start","end","center","baseline","stretch"];
const ALIGN_SELF   = ["auto","start","end","center","stretch","baseline"];
const GRID_COLS    = ["1","2","3","4","5","6","7","8","9","10","11","12","none","subgrid"];
const GRID_ROWS    = ["1","2","3","4","5","6","none","subgrid"];
const GAP_VALS     = ["0","px","0.5","1","1.5","2","2.5","3","3.5","4","5","6","7","8","9","10","11","12","14","16","20","24"];
const PLACE_ITEMS  = ["start","end","center","baseline","stretch"];
const PLACE_CONTENT= ["center","start","end","between","around","evenly","baseline","stretch"];

// ── Helpers ────────────────────────────────────────────────────────────────
function sel(label: string, options: string[], value: string, onChange: (v: string) => void, none = "—") {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-mono text-[10px] uppercase tracking-widest text-slate-600">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="font-mono text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-slate-300 outline-none focus:border-orange-500/30 transition-colors cursor-pointer">
        <option value="">{none}</option>
        {options.map(o => <option key={o} value={o}>{o || "default"}</option>)}
      </select>
    </div>
  );
}

function colorSel(label: string, value: string, onChange: (v: string) => void) {
  const [col, shade] = value.split("-") as [string, string | undefined];
  return (
    <div className="flex flex-col gap-1">
      <label className="font-mono text-[10px] uppercase tracking-widest text-slate-600">{label}</label>
      <div className="flex gap-1">
        <select value={col || ""} onChange={e => onChange(e.target.value ? `${e.target.value}-${shade || "500"}` : "")}
          className="flex-1 font-mono text-[11px] bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-slate-300 outline-none focus:border-orange-500/30 cursor-pointer">
          <option value="">—</option>
          {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={shade || "500"} onChange={e => onChange(col ? `${col}-${e.target.value}` : "")} disabled={!col}
          className="w-16 font-mono text-[11px] bg-white/[0.04] border border-white/[0.08] rounded-lg px-1 py-1.5 text-slate-300 outline-none focus:border-orange-500/30 cursor-pointer disabled:opacity-30">
          {SHADES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </div>
  );
}

function toggle(label: string, value: boolean, onChange: (v: boolean) => void) {
  return (
    <label onClick={() => onChange(!value)} className="flex items-center gap-2 cursor-pointer group">
      <div className={`w-8 h-4 rounded-full transition-all relative ${value ? "bg-orange-500" : "bg-white/10"}`}>
        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${value ? "left-4" : "left-0.5"}`} />
      </div>
      <span className="font-mono text-xs text-slate-500 group-hover:text-slate-300 transition-colors">{label}</span>
    </label>
  );
}

function cls(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ").trim();
}

// ── State types ────────────────────────────────────────────────────────────
type BoxState = {
  w: string; h: string; minW: string; maxW: string;
  pt: string; pr: string; pb: string; pl: string;
  mt: string; mr: string; mb: string; ml: string;
  bgColor: string; textColor: string; borderColor: string;
  rounded: string; shadow: string; border: string;
  opacity: string; ring: string; ringColor: string;
  overflow: string; overflowX: string; overflowY: string;
  position: string; zIndex: string; display: string; cursor: string;
  hover: boolean; focus: boolean;
};

type TypoState = {
  fontSize: string; fontWeight: string; leading: string; tracking: string;
  textColor: string; textAlign: string; textTransform: string; textDecoration: string;
  fontFamily: string; italic: boolean; truncate: boolean; breakWords: boolean;
  underlineColor: string; underlineOffset: string;
};

type FlexState = {
  direction: string; wrap: string; justify: string; items: string; self: string;
  grow: string; shrink: string; basis: string; gap: string; gapX: string; gapY: string;
  order: string;
};

type GridState = {
  cols: string; rows: string; gap: string; gapX: string; gapY: string;
  placeItems: string; placeContent: string; flow: string;
  colSpan: string; rowSpan: string; colStart: string; rowStart: string;
};

type EffectState = {
  transition: string; duration: string; ease: string;
  blur: string; brightness: string; contrast: string; grayscale: boolean;
  rotate: string; scale: string; translateX: string; translateY: string;
  hoverScale: string; hoverOpacity: string; hoverBg: string;
  animPulse: boolean; animBounce: boolean; animSpin: boolean; animPing: boolean;
};

// ── Class builders ─────────────────────────────────────────────────────────
function buildBoxClasses(s: BoxState): string[] {
  const c: string[] = [];
  if (s.display)   c.push(s.display);
  if (s.position)  c.push(s.position);
  if (s.w)         c.push(`w-${s.w}`);
  if (s.h)         c.push(`h-${s.h}`);
  if (s.minW)      c.push(`min-w-${s.minW}`);
  if (s.maxW)      c.push(`max-w-${s.maxW}`);
  if (s.pt)        c.push(`pt-${s.pt}`);
  if (s.pr)        c.push(`pr-${s.pr}`);
  if (s.pb)        c.push(`pb-${s.pb}`);
  if (s.pl)        c.push(`pl-${s.pl}`);
  if (s.mt)        c.push(`mt-${s.mt}`);
  if (s.mr)        c.push(`mr-${s.mr}`);
  if (s.mb)        c.push(`mb-${s.mb}`);
  if (s.ml)        c.push(`ml-${s.ml}`);
  if (s.bgColor)   c.push(`bg-${s.bgColor}`);
  if (s.textColor) c.push(`text-${s.textColor}`);
  if (s.border)    c.push(s.border === "" ? "border" : `border-${s.border}`);
  if (s.borderColor) c.push(`border-${s.borderColor}`);
  if (s.rounded)   c.push(s.rounded === "" ? "rounded" : `rounded-${s.rounded}`);
  if (s.shadow)    c.push(s.shadow === "" ? "shadow" : `shadow-${s.shadow}`);
  if (s.ring)      c.push(s.ring === "inset" ? "ring-inset" : `ring-${s.ring}`);
  if (s.ringColor) c.push(`ring-${s.ringColor}`);
  if (s.opacity)   c.push(`opacity-${s.opacity}`);
  if (s.overflow)  c.push(`overflow-${s.overflow}`);
  if (s.overflowX) c.push(`overflow-x-${s.overflowX}`);
  if (s.overflowY) c.push(`overflow-y-${s.overflowY}`);
  if (s.zIndex)    c.push(`z-${s.zIndex}`);
  if (s.cursor)    c.push(`cursor-${s.cursor}`);
  return c.filter(Boolean);
}

function buildTypoClasses(s: TypoState): string[] {
  const c: string[] = [];
  if (s.fontFamily === "sans")  c.push("font-sans");
  if (s.fontFamily === "serif") c.push("font-serif");
  if (s.fontFamily === "mono")  c.push("font-mono");
  if (s.fontSize)    c.push(`text-${s.fontSize}`);
  if (s.fontWeight)  c.push(`font-${s.fontWeight}`);
  if (s.leading)     c.push(`leading-${s.leading}`);
  if (s.tracking)    c.push(`tracking-${s.tracking}`);
  if (s.textColor)   c.push(`text-${s.textColor}`);
  if (s.textAlign)   c.push(`text-${s.textAlign}`);
  if (s.textTransform) c.push(s.textTransform);
  if (s.textDecoration) c.push(s.textDecoration);
  if (s.italic)      c.push("italic");
  if (s.truncate)    c.push("truncate");
  if (s.breakWords)  c.push("break-words");
  if (s.underlineColor) c.push(`decoration-${s.underlineColor}`);
  if (s.underlineOffset) c.push(`underline-offset-${s.underlineOffset}`);
  return c.filter(Boolean);
}

function buildFlexClasses(s: FlexState): string[] {
  const c: string[] = [];
  if (s.direction) c.push(`flex-${s.direction}`);
  if (s.wrap)      c.push(`flex-${s.wrap}`);
  if (s.justify)   c.push(`justify-${s.justify}`);
  if (s.items)     c.push(`items-${s.items}`);
  if (s.self)      c.push(`self-${s.self}`);
  if (s.grow)      c.push(s.grow === "0" ? "grow-0" : "grow");
  if (s.shrink)    c.push(s.shrink === "0" ? "shrink-0" : "shrink");
  if (s.basis)     c.push(`basis-${s.basis}`);
  if (s.gap)       c.push(`gap-${s.gap}`);
  if (s.gapX)      c.push(`gap-x-${s.gapX}`);
  if (s.gapY)      c.push(`gap-y-${s.gapY}`);
  if (s.order)     c.push(`order-${s.order}`);
  return c.filter(Boolean);
}

function buildGridClasses(s: GridState): string[] {
  const c: string[] = [];
  if (s.cols)        c.push(`grid-cols-${s.cols}`);
  if (s.rows)        c.push(`grid-rows-${s.rows}`);
  if (s.gap)         c.push(`gap-${s.gap}`);
  if (s.gapX)        c.push(`gap-x-${s.gapX}`);
  if (s.gapY)        c.push(`gap-y-${s.gapY}`);
  if (s.placeItems)  c.push(`place-items-${s.placeItems}`);
  if (s.placeContent)c.push(`place-content-${s.placeContent}`);
  if (s.flow)        c.push(`grid-flow-${s.flow}`);
  if (s.colSpan)     c.push(`col-span-${s.colSpan}`);
  if (s.rowSpan)     c.push(`row-span-${s.rowSpan}`);
  if (s.colStart)    c.push(`col-start-${s.colStart}`);
  if (s.rowStart)    c.push(`row-start-${s.rowStart}`);
  return c.filter(Boolean);
}

function buildEffectClasses(s: EffectState): string[] {
  const c: string[] = [];
  if (s.transition)    c.push(`transition-${s.transition}`);
  if (s.duration)      c.push(`duration-${s.duration}`);
  if (s.ease)          c.push(`ease-${s.ease}`);
  if (s.blur)          c.push(s.blur === "" ? "blur" : `blur-${s.blur}`);
  if (s.brightness)    c.push(`brightness-${s.brightness}`);
  if (s.contrast)      c.push(`contrast-${s.contrast}`);
  if (s.grayscale)     c.push("grayscale");
  if (s.rotate)        c.push(`rotate-${s.rotate}`);
  if (s.scale)         c.push(`scale-${s.scale}`);
  if (s.translateX)    c.push(`translate-x-${s.translateX}`);
  if (s.translateY)    c.push(`translate-y-${s.translateY}`);
  if (s.hoverScale)    c.push(`hover:scale-${s.hoverScale}`);
  if (s.hoverOpacity)  c.push(`hover:opacity-${s.hoverOpacity}`);
  if (s.hoverBg)       c.push(`hover:bg-${s.hoverBg}`);
  if (s.animPulse)     c.push("animate-pulse");
  if (s.animBounce)    c.push("animate-bounce");
  if (s.animSpin)      c.push("animate-spin");
  if (s.animPing)      c.push("animate-ping");
  return c.filter(Boolean);
}

// ── Section wrapper ────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-slate-600 mb-3">{title}</p>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function Wide({ children }: { children: React.ReactNode }) {
  return <div className="col-span-2">{children}</div>;
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function TailwindGenerator() {
  const [activeTab, setActiveTab] = useState<TabId>("box");
  const [copied, setCopied]       = useState<CopyTarget>(null);
  const [previewText, setPreviewText] = useState("Preview Element");
  const [customInput, setCustomInput] = useState("");

  // ── Box state ──
  const [box, setBox] = useState<BoxState>({
    w: "", h: "", minW: "", maxW: "",
    pt: "", pr: "", pb: "", pl: "",
    mt: "", mr: "", mb: "", ml: "",
    bgColor: "", textColor: "", borderColor: "",
    rounded: "", shadow: "", border: "",
    opacity: "", ring: "", ringColor: "",
    overflow: "", overflowX: "", overflowY: "",
    position: "", zIndex: "", display: "", cursor: "",
    hover: false, focus: false,
  });

  // ── Typography state ──
  const [typo, setTypo] = useState<TypoState>({
    fontSize: "", fontWeight: "", leading: "", tracking: "",
    textColor: "", textAlign: "", textTransform: "", textDecoration: "",
    fontFamily: "", italic: false, truncate: false, breakWords: false,
    underlineColor: "", underlineOffset: "",
  });

  // ── Flex state ──
  const [flex, setFlex] = useState<FlexState>({
    direction: "", wrap: "", justify: "", items: "", self: "",
    grow: "", shrink: "", basis: "", gap: "", gapX: "", gapY: "", order: "",
  });

  // ── Grid state ──
  const [grid, setGrid] = useState<GridState>({
    cols: "", rows: "", gap: "", gapX: "", gapY: "",
    placeItems: "", placeContent: "", flow: "",
    colSpan: "", rowSpan: "", colStart: "", rowStart: "",
  });

  // ── Effects state ──
  const [effects, setEffects] = useState<EffectState>({
    transition: "", duration: "", ease: "",
    blur: "", brightness: "", contrast: "", grayscale: false,
    rotate: "", scale: "", translateX: "", translateY: "",
    hoverScale: "", hoverOpacity: "", hoverBg: "",
    animPulse: false, animBounce: false, animSpin: false, animPing: false,
  });

  const b = useCallback(<K extends keyof BoxState>(k: K) => (v: BoxState[K]) => setBox(s => ({ ...s, [k]: v })), []);
  const t = useCallback(<K extends keyof TypoState>(k: K) => (v: TypoState[K]) => setTypo(s => ({ ...s, [k]: v })), []);
  const f = useCallback(<K extends keyof FlexState>(k: K) => (v: FlexState[K]) => setFlex(s => ({ ...s, [k]: v })), []);
  const g = useCallback(<K extends keyof GridState>(k: K) => (v: GridState[K]) => setGrid(s => ({ ...s, [k]: v })), []);
  const e = useCallback(<K extends keyof EffectState>(k: K) => (v: EffectState[K]) => setEffects(s => ({ ...s, [k]: v })), []);

  // Build all classes
  const boxClasses    = useMemo(() => buildBoxClasses(box),       [box]);
  const typoClasses   = useMemo(() => buildTypoClasses(typo),     [typo]);
  const flexClasses   = useMemo(() => buildFlexClasses(flex),     [flex]);
  const gridClasses   = useMemo(() => buildGridClasses(grid),     [grid]);
  const effectClasses = useMemo(() => buildEffectClasses(effects),[effects]);
  const customClasses = useMemo(() => customInput.trim().split(/\s+/).filter(Boolean), [customInput]);

  const allClasses = useMemo(() =>
    [...new Set([...boxClasses, ...typoClasses, ...flexClasses, ...gridClasses, ...effectClasses, ...customClasses])]
  , [boxClasses, typoClasses, flexClasses, gridClasses, effectClasses, customClasses]);

  const classString = allClasses.join(" ");

  // Group classes by category for display
  const activeClasses = useMemo(() => {
    const map: Record<string, string[]> = {
      "Box & Layout": boxClasses,
      "Typography": typoClasses,
      "Flexbox": flexClasses,
      "Grid": gridClasses,
      "Effects": effectClasses,
      "Custom": customClasses,
    };
    return Object.entries(map).filter(([, v]) => v.length > 0);
  }, [boxClasses, typoClasses, flexClasses, gridClasses, effectClasses, customClasses]);

  const copy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1600);
  }, []);

  const clearAll = () => {
    setBox({ w:"",h:"",minW:"",maxW:"",pt:"",pr:"",pb:"",pl:"",mt:"",mr:"",mb:"",ml:"",bgColor:"",textColor:"",borderColor:"",rounded:"",shadow:"",border:"",opacity:"",ring:"",ringColor:"",overflow:"",overflowX:"",overflowY:"",position:"",zIndex:"",display:"",cursor:"",hover:false,focus:false });
    setTypo({ fontSize:"",fontWeight:"",leading:"",tracking:"",textColor:"",textAlign:"",textTransform:"",textDecoration:"",fontFamily:"",italic:false,truncate:false,breakWords:false,underlineColor:"",underlineOffset:"" });
    setFlex({ direction:"",wrap:"",justify:"",items:"",self:"",grow:"",shrink:"",basis:"",gap:"",gapX:"",gapY:"",order:"" });
    setGrid({ cols:"",rows:"",gap:"",gapX:"",gapY:"",placeItems:"",placeContent:"",flow:"",colSpan:"",rowSpan:"",colStart:"",rowStart:"" });
    setEffects({ transition:"",duration:"",ease:"",blur:"",brightness:"",contrast:"",grayscale:false,rotate:"",scale:"",translateX:"",translateY:"",hoverScale:"",hoverOpacity:"",hoverBg:"",animPulse:false,animBounce:false,animSpin:false,animPing:false });
    setCustomInput("");
  };

  const TABS = [
    { id: "box" as TabId,        label: "□ Box"      },
    { id: "typography" as TabId, label: "Aa Type"    },
    { id: "flex" as TabId,       label: "⇔ Flex"     },
    { id: "grid" as TabId,       label: "⊞ Grid"     },
    { id: "effects" as TabId,    label: "✦ Effects"  },
    { id: "custom" as TabId,     label: "+ Custom"   },
  ];

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-orange-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

      <ToolNavbar toolName="Tailwind Generator" />

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-orange-500/10 flex items-center justify-center font-mono font-bold text-orange-400 text-sm">TW</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Tailwind Class Generator</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded">v3 / v4</span>
          </div>
          <p className="text-slate-500 text-sm">
            Visually build Tailwind CSS class strings — box model, typography, flexbox, grid, transitions, animations. Live preview included.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">

          {/* ── LEFT: Controls ── */}
          <div className="flex flex-col gap-4 xl:max-h-[calc(100vh-200px)] xl:overflow-y-auto xl:pr-1">

            {/* Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition-all
                    ${activeTab === tab.id ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Box tab ── */}
            {activeTab === "box" && <>
              <Section title="Display & Position">
                {sel("Display",  DISPLAY,  box.display,  b("display"))}
                {sel("Position", POSITION, box.position, b("position"))}
                {sel("Z-Index",  Z_INDEX,  box.zIndex,   b("zIndex"))}
                {sel("Cursor",   CURSOR,   box.cursor,   b("cursor"))}
              </Section>

              <Section title="Sizing">
                {sel("Width",    SPACING,  box.w,    b("w"))}
                {sel("Height",   SPACING,  box.h,    b("h"))}
                {sel("Min Width",["0","full","min","max","fit","screen","none"], box.minW, b("minW"))}
                {sel("Max Width",["0","none","xs","sm","md","lg","xl","2xl","3xl","4xl","5xl","6xl","7xl","full","screen","min","max","fit","prose"], box.maxW, b("maxW"))}
              </Section>

              <Section title="Padding">
                {sel("Top",    SPACING, box.pt, b("pt"))}
                {sel("Right",  SPACING, box.pr, b("pr"))}
                {sel("Bottom", SPACING, box.pb, b("pb"))}
                {sel("Left",   SPACING, box.pl, b("pl"))}
              </Section>

              <Section title="Margin">
                {sel("Top",    SPACING, box.mt, b("mt"))}
                {sel("Right",  SPACING, box.mr, b("mr"))}
                {sel("Bottom", SPACING, box.mb, b("mb"))}
                {sel("Left",   SPACING, box.ml, b("ml"))}
              </Section>

              <Section title="Colors">
                <Wide>{colorSel("Background", box.bgColor,   b("bgColor"))}</Wide>
                <Wide>{colorSel("Text Color", box.textColor, b("textColor"))}</Wide>
              </Section>

              <Section title="Border & Ring">
                {sel("Border Width", BORDER_W, box.border,      b("border"))}
                {sel("Ring Width",   RING_W,   box.ring,        b("ring"))}
                <Wide>{colorSel("Border Color", box.borderColor, b("borderColor"))}</Wide>
                <Wide>{colorSel("Ring Color",   box.ringColor,   b("ringColor"))}</Wide>
              </Section>

              <Section title="Rounded & Shadow">
                {sel("Rounded", ROUNDED, box.rounded, b("rounded"))}
                {sel("Shadow",  SHADOWS, box.shadow,  b("shadow"))}
              </Section>

              <Section title="Opacity & Overflow">
                {sel("Opacity",    OPACITY,  box.opacity,   b("opacity"))}
                {sel("Overflow",   OVERFLOW, box.overflow,  b("overflow"))}
                {sel("Overflow X", OVERFLOW, box.overflowX, b("overflowX"))}
                {sel("Overflow Y", OVERFLOW, box.overflowY, b("overflowY"))}
              </Section>
            </>}

            {/* ── Typography tab ── */}
            {activeTab === "typography" && <>
              <Section title="Font">
                {sel("Family", ["sans","serif","mono"], typo.fontFamily, t("fontFamily"))}
                {sel("Size",   FONT_SIZES,   typo.fontSize,   t("fontSize"))}
                {sel("Weight", FONT_WEIGHTS, typo.fontWeight, t("fontWeight"))}
                <Wide>{colorSel("Color", typo.textColor, t("textColor"))}</Wide>
              </Section>

              <Section title="Spacing & Alignment">
                {sel("Line Height",     LEADING,  typo.leading,     t("leading"))}
                {sel("Letter Spacing",  TRACKING, typo.tracking,    t("tracking"))}
                {sel("Text Align",      ["left","center","right","justify","start","end"], typo.textAlign, t("textAlign"))}
                {sel("Transform",       ["uppercase","lowercase","capitalize","normal-case"], typo.textTransform, t("textTransform"))}
              </Section>

              <Section title="Decoration">
                {sel("Decoration",       ["underline","overline","line-through","no-underline"], typo.textDecoration, t("textDecoration"))}
                {sel("Underline Offset", ["1","2","4","8","auto"], typo.underlineOffset, t("underlineOffset"))}
                <Wide>{colorSel("Underline Color", typo.underlineColor, t("underlineColor"))}</Wide>
              </Section>

              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-slate-600 mb-3">Modifiers</p>
                <div className="flex flex-col gap-2">
                  {toggle("Italic",      typo.italic,      t("italic"))}
                  {toggle("Truncate",    typo.truncate,    t("truncate"))}
                  {toggle("Break Words", typo.breakWords,  t("breakWords"))}
                </div>
              </div>
            </>}

            {/* ── Flex tab ── */}
            {activeTab === "flex" && <>
              <Section title="Direction & Wrap">
                {sel("Direction", FLEX_DIR,  flex.direction, f("direction"))}
                {sel("Wrap",      FLEX_WRAP, flex.wrap,      f("wrap"))}
              </Section>

              <Section title="Alignment">
                {sel("Justify Content", JUSTIFY,     flex.justify, f("justify"))}
                {sel("Align Items",     ALIGN_ITEMS, flex.items,   f("items"))}
                {sel("Align Self",      ALIGN_SELF,  flex.self,    f("self"))}
              </Section>

              <Section title="Flex Sizing">
                {sel("Grow",   ["","0"], flex.grow,   f("grow"))}
                {sel("Shrink", ["","0"], flex.shrink, f("shrink"))}
                {sel("Basis",  [...SPACING,"1/2","1/3","2/3","1/4","3/4","full"], flex.basis, f("basis"))}
                {sel("Order",  ["1","2","3","4","5","6","7","8","9","10","11","12","first","last","none"], flex.order, f("order"))}
              </Section>

              <Section title="Gap">
                {sel("Gap",   GAP_VALS, flex.gap,  f("gap"))}
                {sel("Gap X", GAP_VALS, flex.gapX, f("gapX"))}
                {sel("Gap Y", GAP_VALS, flex.gapY, f("gapY"))}
              </Section>
            </>}

            {/* ── Grid tab ── */}
            {activeTab === "grid" && <>
              <Section title="Grid Template">
                {sel("Columns", GRID_COLS, grid.cols, g("cols"))}
                {sel("Rows",    GRID_ROWS, grid.rows, g("rows"))}
                {sel("Flow",    ["row","col","dense","row-dense","col-dense"], grid.flow, g("flow"))}
              </Section>

              <Section title="Placement">
                {sel("Col Span",  ["1","2","3","4","5","6","7","8","9","10","11","12","full"], grid.colSpan,  g("colSpan"))}
                {sel("Row Span",  ["1","2","3","4","5","6","full"], grid.rowSpan,  g("rowSpan"))}
                {sel("Col Start", ["1","2","3","4","5","6","7","8","9","10","11","12","13","auto"], grid.colStart, g("colStart"))}
                {sel("Row Start", ["1","2","3","4","5","6","7","auto"], grid.rowStart, g("rowStart"))}
              </Section>

              <Section title="Alignment">
                {sel("Place Items",   PLACE_ITEMS,   grid.placeItems,   g("placeItems"))}
                {sel("Place Content", PLACE_CONTENT, grid.placeContent, g("placeContent"))}
              </Section>

              <Section title="Gap">
                {sel("Gap",   GAP_VALS, grid.gap,  g("gap"))}
                {sel("Gap X", GAP_VALS, grid.gapX, g("gapX"))}
                {sel("Gap Y", GAP_VALS, grid.gapY, g("gapY"))}
              </Section>
            </>}

            {/* ── Effects tab ── */}
            {activeTab === "effects" && <>
              <Section title="Transition">
                {sel("Property", TRANSITION, effects.transition, e("transition"))}
                {sel("Duration", DURATION,   effects.duration,   e("duration"))}
                {sel("Easing",   EASE,       effects.ease,       e("ease"))}
              </Section>

              <Section title="Filters">
                {sel("Blur",       BLUR, effects.blur, e("blur"))}
                {sel("Brightness", ["0","50","75","90","95","100","105","110","125","150","200"], effects.brightness, e("brightness"))}
                {sel("Contrast",   ["0","50","75","100","125","150","200"], effects.contrast, e("contrast"))}
                <Wide>{toggle("Grayscale", effects.grayscale, e("grayscale"))}</Wide>
              </Section>

              <Section title="Transform">
                {sel("Rotate",      ["0","1","2","3","6","12","45","90","180"], effects.rotate,     e("rotate"))}
                {sel("Scale",       ["0","50","75","90","95","100","105","110","125","150"], effects.scale, e("scale"))}
                {sel("Translate X", SPACING, effects.translateX, e("translateX"))}
                {sel("Translate Y", SPACING, effects.translateY, e("translateY"))}
              </Section>

              <Section title="Hover Interactions">
                {sel("Hover Scale",   ["90","95","100","105","110","125","150"], effects.hoverScale,   e("hoverScale"))}
                {sel("Hover Opacity", OPACITY, effects.hoverOpacity, e("hoverOpacity"))}
                <Wide>{colorSel("Hover Background", effects.hoverBg, e("hoverBg"))}</Wide>
              </Section>

              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-slate-600 mb-3">Animations</p>
                <div className="grid grid-cols-2 gap-2">
                  {toggle("animate-pulse",  effects.animPulse,  e("animPulse"))}
                  {toggle("animate-bounce", effects.animBounce, e("animBounce"))}
                  {toggle("animate-spin",   effects.animSpin,   e("animSpin"))}
                  {toggle("animate-ping",   effects.animPing,   e("animPing"))}
                </div>
              </div>
            </>}

            {/* ── Custom tab ── */}
            {activeTab === "custom" && (
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-slate-600 mb-3">Custom Classes</p>
                <p className="font-mono text-[10px] text-slate-700 mb-2 leading-relaxed">
                  Add any Tailwind classes manually — arbitrary values, variants, plugins, etc.
                </p>
                <textarea
                  value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  placeholder={"md:flex-row lg:grid-cols-3\nhover:rotate-2 focus:ring-2\n[&>svg]:w-4 data-[active]:bg-blue-500"}
                  spellCheck={false}
                  className="w-full h-40 font-mono text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg p-3 text-orange-400 placeholder-slate-700 outline-none resize-none focus:border-orange-500/30 transition-colors leading-relaxed"
                />
                <p className="font-mono text-[10px] text-slate-700 mt-2">{customClasses.length} classes added</p>
              </div>
            )}
          </div>

          {/* ── RIGHT: Output ── */}
          <div className="flex flex-col gap-4">

            {/* Preview */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Live Preview</p>
                <input value={previewText} onChange={e => setPreviewText(e.target.value)}
                  placeholder="Preview text…"
                  className="font-mono text-xs bg-white/[0.04] border border-white/[0.08] rounded px-3 py-1 text-slate-400 outline-none focus:border-orange-500/30 transition-colors w-44 text-right" />
              </div>

              {/* Checkerboard bg to show transparency */}
              <div className="rounded-xl overflow-hidden min-h-32 flex items-center justify-center p-8"
                style={{ background: "repeating-conic-gradient(#1a1a2e 0% 25%, #0d0d1a 0% 50%) 0 0 / 20px 20px" }}>
                <div className={allClasses.join(" ")}>{previewText}</div>
              </div>
            </div>

            {/* Generated class string */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Generated Classes</p>
                <div className="flex gap-2">
                  <button onClick={clearAll}
                    className="font-mono text-[11px] px-3 py-1 rounded border border-white/[0.08] text-slate-500 hover:text-red-400 hover:border-red-500/30 transition-all">
                    Clear All
                  </button>
                  <button onClick={() => copy(classString, "classes")}
                    disabled={!classString}
                    className={`font-mono text-[11px] px-3 py-1 rounded border transition-all
                      ${copied === "classes" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300 disabled:opacity-20"}`}>
                    {copied === "classes" ? "✓ Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              {classString ? (
                <div className="font-mono text-sm text-orange-400 bg-[#0a0a14] rounded-lg p-4 leading-relaxed break-all border border-white/[0.06] select-all">
                  {classString}
                </div>
              ) : (
                <div className="font-mono text-sm text-slate-700 bg-[#0a0a14] rounded-lg p-4 border border-white/[0.06]">
                  No classes selected yet…
                </div>
              )}
            </div>

            {/* className= format */}
            {classString && (
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">React / HTML Output</p>
                  <div className="flex gap-2">
                    <button onClick={() => copy(`className="${classString}"`, "jsx")}
                      className={`font-mono text-[11px] px-3 py-1 rounded border transition-all
                        ${copied === "jsx" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                      {copied === "jsx" ? "✓" : "JSX"}
                    </button>
                    <button onClick={() => copy(`class="${classString}"`, "html")}
                      className={`font-mono text-[11px] px-3 py-1 rounded border transition-all
                        ${copied === "html" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                      {copied === "html" ? "✓" : "HTML"}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <pre className="font-mono text-[11px] text-slate-400 bg-[#0a0a14] rounded-lg p-3 overflow-x-auto border border-white/[0.06]">
                    <span className="text-blue-400">className</span>
                    <span className="text-slate-500">=</span>
                    <span className="text-emerald-400">"{classString}"</span>
                  </pre>
                </div>
              </div>
            )}

            {/* Class breakdown by group */}
            {activeClasses.length > 0 && (
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
                <p className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">Class Breakdown</p>
                <div className="space-y-2">
                  {activeClasses.map(([group, classes]) => (
                    <div key={group}>
                      <span className="font-mono text-[9px] uppercase tracking-widest text-slate-700 block mb-1">{group}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {classes.map(c => (
                          <button key={c} onClick={() => copy(c, `cls-${c}`)}
                            className={`font-mono text-[11px] px-2 py-0.5 rounded border transition-all
                              ${copied === `cls-${c}` ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-orange-500/[0.08] border-orange-500/20 text-orange-400 hover:bg-orange-500/20"}`}>
                            {copied === `cls-${c}` ? "✓" : c}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Responsive variants hint */}
            {classString && (
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
                <p className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">Responsive Variants</p>
                <p className="font-mono text-[10px] text-slate-700 mb-3">Add breakpoint prefixes to any class:</p>
                <div className="grid grid-cols-2 gap-2">
                  {["sm","md","lg","xl","2xl"].map(bp => {
                    const firstClass = allClasses.find(c => !c.includes(":"));
                    const example = firstClass ? `${bp}:${firstClass}` : `${bp}:flex`;
                    return (
                      <button key={bp} onClick={() => copy(example, `bp-${bp}`)}
                        className={`flex items-center justify-between px-3 py-1.5 rounded border transition-all
                          ${copied === `bp-${bp}` ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.06] hover:border-white/20 text-left"}`}>
                        <span className="font-mono text-[10px] text-slate-600">{bp}:</span>
                        <span className="font-mono text-[10px] text-orange-400">{example}</span>
                        <span className="font-mono text-[9px] text-slate-700">{copied === `bp-${bp}` ? "✓" : "⊕"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex flex-wrap gap-6 px-4 py-3 bg-orange-500/[0.05] border border-orange-500/20 rounded-lg mt-5 mb-5">
          <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Total Classes</span><span className="font-mono text-sm text-orange-400">{allClasses.length}</span></div>
          <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Box</span><span className="font-mono text-sm text-orange-400">{boxClasses.length}</span></div>
          <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Type</span><span className="font-mono text-sm text-orange-400">{typoClasses.length}</span></div>
          <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Flex</span><span className="font-mono text-sm text-orange-400">{flexClasses.length}</span></div>
          <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Grid</span><span className="font-mono text-sm text-orange-400">{gridClasses.length}</span></div>
          <div><span className="font-mono text-[10px] uppercase tracking-widest text-orange-500/60 mr-2">Effects</span><span className="font-mono text-sm text-orange-400">{effectClasses.length}</span></div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            <span className="font-mono text-[10px] text-orange-500/60">Live</span>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "🎨", title: "5 Category Tabs",   desc: "Box model, Typography, Flexbox, Grid, Effects + custom — each with full Tailwind class coverage." },
            { icon: "👁",  title: "Live Preview",     desc: "See the result instantly on a checkerboard background. Edit preview text to test typography." },
            { icon: "📋", title: "One-Click Copy",    desc: "Copy full class string, JSX className=, HTML class=, or individual classes with a single click." },
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