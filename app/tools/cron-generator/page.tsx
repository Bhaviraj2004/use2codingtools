"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useMemo } from "react";

// ── Types ─────────────────────────────────────────────────────
interface CronPart {
  minute: string;
  hour: string;
  day: string;
  month: string;
  weekday: string;
}

// ── Helpers ───────────────────────────────────────────────────
const MONTHS = [
  { val: "1", label: "January" }, { val: "2", label: "February" },
  { val: "3", label: "March" },   { val: "4", label: "April" },
  { val: "5", label: "May" },     { val: "6", label: "June" },
  { val: "7", label: "July" },    { val: "8", label: "August" },
  { val: "9", label: "September"},{ val: "10",label: "October" },
  { val: "11",label: "November" },{ val: "12",label: "December" },
];

const WEEKDAYS = [
  { val: "0", label: "Sunday" },  { val: "1", label: "Monday" },
  { val: "2", label: "Tuesday" }, { val: "3", label: "Wednesday" },
  { val: "4", label: "Thursday"},  { val: "5", label: "Friday" },
  { val: "6", label: "Saturday" },
];

const HOURS   = Array.from({ length: 24 }, (_, i) => ({ val: String(i), label: i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM` }));
const MINUTES = Array.from({ length: 60 }, (_, i) => ({ val: String(i), label: String(i).padStart(2, "0") }));

const PRESETS = [
  { label: "Every minute",        expr: "* * * * *",       desc: "Runs every minute" },
  { label: "Every 5 minutes",     expr: "*/5 * * * *",     desc: "Runs every 5 minutes" },
  { label: "Every 15 minutes",    expr: "*/15 * * * *",    desc: "Runs every 15 min" },
  { label: "Every 30 minutes",    expr: "*/30 * * * *",    desc: "Runs every 30 min" },
  { label: "Every hour",          expr: "0 * * * *",       desc: "At minute 0 of every hour" },
  { label: "Every 6 hours",       expr: "0 */6 * * *",     desc: "Every 6 hours" },
  { label: "Every 12 hours",      expr: "0 */12 * * *",    desc: "At midnight and noon" },
  { label: "Every day midnight",  expr: "0 0 * * *",       desc: "Daily at 12:00 AM" },
  { label: "Every day at 9 AM",   expr: "0 9 * * *",       desc: "Daily at 9:00 AM" },
  { label: "Every weekday 9 AM",  expr: "0 9 * * 1-5",     desc: "Mon–Fri at 9:00 AM" },
  { label: "Every Monday",        expr: "0 0 * * 1",       desc: "Every Monday midnight" },
  { label: "Every Sunday",        expr: "0 0 * * 0",       desc: "Every Sunday midnight" },
  { label: "1st of every month",  expr: "0 0 1 * *",       desc: "Monthly on the 1st" },
  { label: "Every quarter",       expr: "0 0 1 */3 *",     desc: "Jan, Apr, Jul, Oct" },
  { label: "Every year",          expr: "0 0 1 1 *",       desc: "Jan 1st at midnight" },
  { label: "Every weekday",       expr: "0 0 * * 1-5",     desc: "Mon–Fri at midnight" },
  { label: "Every weekend",       expr: "0 0 * * 0,6",     desc: "Sat & Sun at midnight" },
  { label: "Twice a day",         expr: "0 0,12 * * *",    desc: "At midnight and noon" },
];

function parseCronToHuman(expr: string): string {
  if (!expr.trim()) return "";
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return "Invalid cron expression";

  const [min, hr, dom, mon, dow] = parts;

  // Special cases
  if (expr === "* * * * *") return "Every minute";
  if (expr === "0 * * * *") return "Every hour, at minute 0";
  if (expr === "0 0 * * *") return "Every day at midnight (12:00 AM)";
  if (expr === "0 0 * * 0") return "Every Sunday at midnight";
  if (expr === "0 0 * * 1") return "Every Monday at midnight";
  if (expr === "0 0 1 * *") return "On the 1st of every month at midnight";
  if (expr === "0 0 1 1 *") return "Every year on January 1st at midnight";
  if (expr === "0 9 * * 1-5") return "Weekdays (Mon–Fri) at 9:00 AM";
  if (expr === "0 0 * * 1-5") return "Weekdays (Mon–Fri) at midnight";
  if (expr === "0 0 * * 0,6") return "Weekends (Sat & Sun) at midnight";

  const parts2: string[] = [];

  // Minute
  if (min === "*") parts2.push("every minute");
  else if (min.startsWith("*/")) parts2.push(`every ${min.slice(2)} minutes`);
  else if (min.includes(",")) parts2.push(`at minutes ${min}`);
  else parts2.push(`at minute ${min}`);

  // Hour
  if (hr === "*") { /* skip */ }
  else if (hr.startsWith("*/")) parts2.push(`every ${hr.slice(2)} hours`);
  else if (hr.includes(",")) {
    const labels = hr.split(",").map((h) => HOURS[parseInt(h)]?.label ?? h);
    parts2.push(`at ${labels.join(" and ")}`);
  } else if (hr.includes("-")) {
    const [s, e] = hr.split("-");
    parts2.push(`from ${HOURS[parseInt(s)]?.label} to ${HOURS[parseInt(e)]?.label}`);
  } else {
    parts2.push(`at ${HOURS[parseInt(hr)]?.label ?? hr}`);
  }

  // Day of month
  if (dom !== "*") {
    if (dom.startsWith("*/")) parts2.push(`every ${dom.slice(2)} days`);
    else parts2.push(`on day ${dom} of the month`);
  }

  // Month
  if (mon !== "*") {
    if (mon.startsWith("*/")) parts2.push(`every ${mon.slice(2)} months`);
    else if (mon.includes(",")) {
      const labels = mon.split(",").map((m) => MONTHS[parseInt(m) - 1]?.label ?? m);
      parts2.push(`in ${labels.join(", ")}`);
    } else {
      parts2.push(`in ${MONTHS[parseInt(mon) - 1]?.label ?? mon}`);
    }
  }

  // Day of week
  if (dow !== "*") {
    if (dow === "1-5") parts2.push("on weekdays");
    else if (dow === "0,6" || dow === "6,0") parts2.push("on weekends");
    else if (dow.includes("-")) {
      const [s, e] = dow.split("-");
      parts2.push(`${WEEKDAYS[parseInt(s)]?.label}–${WEEKDAYS[parseInt(e)]?.label}`);
    } else if (dow.includes(",")) {
      const labels = dow.split(",").map((d) => WEEKDAYS[parseInt(d)]?.label ?? d);
      parts2.push(`on ${labels.join(", ")}`);
    } else {
      parts2.push(`on ${WEEKDAYS[parseInt(dow)]?.label ?? "day " + dow}`);
    }
  }

  return parts2.length ? parts2.map((p, i) => i === 0 ? p.charAt(0).toUpperCase() + p.slice(1) : p).join(", ") : "Custom schedule";
}

function getNextRuns(expr: string, count = 5): Date[] {
  try {
    const parts = expr.trim().split(/\s+/);
    if (parts.length !== 5) return [];
    const [minP, hrP, domP, monP, dowP] = parts;

    const matchPart = (val: number, part: string, max: number): boolean => {
      if (part === "*") return true;
      if (part.startsWith("*/")) {
        const step = parseInt(part.slice(2));
        return val % step === 0;
      }
      if (part.includes(",")) return part.split(",").some((p) => matchPart(val, p.trim(), max));
      if (part.includes("-")) {
        const [s, e] = part.split("-").map(Number);
        return val >= s && val <= e;
      }
      return parseInt(part) === val;
    };

    const results: Date[] = [];
    let d = new Date();
    d.setSeconds(0, 0);
    d.setMinutes(d.getMinutes() + 1);

    for (let i = 0; i < 100000 && results.length < count; i++) {
      const min = d.getMinutes();
      const hr  = d.getHours();
      const dom = d.getDate();
      const mon = d.getMonth() + 1;
      const dow = d.getDay();

      if (
        matchPart(min, minP, 59) &&
        matchPart(hr,  hrP,  23) &&
        matchPart(dom, domP, 31) &&
        matchPart(mon, monP, 12) &&
        matchPart(dow, dowP, 6)
      ) {
        results.push(new Date(d));
      }
      d = new Date(d.getTime() + 60000);
    }
    return results;
  } catch { return []; }
}

function validateCron(expr: string): string | null {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return "Must have exactly 5 fields: minute hour day month weekday";
  const [min, hr, dom, mon, dow] = parts;
  const checks = [
    { val: min, min: 0, max: 59, name: "Minute" },
    { val: hr,  min: 0, max: 23, name: "Hour"   },
    { val: dom, min: 1, max: 31, name: "Day"     },
    { val: mon, min: 1, max: 12, name: "Month"   },
    { val: dow, min: 0, max: 6,  name: "Weekday" },
  ];
  for (const c of checks) {
    if (c.val === "*" || c.val.startsWith("*/")) continue;
    const nums = c.val.replace(/-/g, ",").split(",");
    for (const n of nums) {
      const num = parseInt(n);
      if (isNaN(num) || num < c.min || num > c.max)
        return `${c.name}: "${c.val}" is out of range (${c.min}–${c.max})`;
    }
  }
  return null;
}

type BuilderTab = "simple" | "advanced";

export default function CronGenerator() {
  const [expr, setExpr]           = useState("0 9 * * 1-5");
  const [tab, setTab]             = useState<BuilderTab>("simple");
  const [copied, setCopied]       = useState(false);

  // Simple builder state
  const [scheduleType, setScheduleType] = useState("daily");
  const [simpleHour, setSimpleHour]     = useState("9");
  const [simpleMin, setSimpleMin]       = useState("0");
  const [simpleInterval, setSimpleInterval] = useState("5");
  const [simpleWeekdays, setSimpleWeekdays] = useState<string[]>(["1","2","3","4","5"]);
  const [simpleMonthDay, setSimpleMonthDay] = useState("1");

  // Advanced builder
  const [adv, setAdv] = useState<CronPart>({
    minute: "*", hour: "*", day: "*", month: "*", weekday: "*"
  });

  const human     = useMemo(() => parseCronToHuman(expr), [expr]);
  const error     = useMemo(() => validateCron(expr),     [expr]);
  const nextRuns  = useMemo(() => !error ? getNextRuns(expr, 6) : [], [expr, error]);

  // Build expr from simple builder
  const buildSimple = (type: string, h: string, m: string, interval: string, wds: string[], md: string) => {
    let e = "";
    switch (type) {
      case "every-minute":  e = "* * * * *"; break;
      case "every-n-min":   e = `*/${interval} * * * *`; break;
      case "hourly":        e = `${m} * * * *`; break;
      case "daily":         e = `${m} ${h} * * *`; break;
      case "weekdays":      e = `${m} ${h} * * 1-5`; break;
      case "weekends":      e = `${m} ${h} * * 0,6`; break;
      case "custom-days":   e = `${m} ${h} * * ${wds.sort().join(",") || "*"}`; break;
      case "weekly":        e = `${m} ${h} * * ${wds[0] ?? "1"}`; break;
      case "monthly":       e = `${m} ${h} ${md} * *`; break;
      case "yearly":        e = `${m} ${h} 1 1 *`; break;
      default:              e = "0 0 * * *";
    }
    return e;
  };

  const updateSimple = (
    type = scheduleType, h = simpleHour, m = simpleMin,
    interval = simpleInterval, wds = simpleWeekdays, md = simpleMonthDay
  ) => {
    const e = buildSimple(type, h, m, interval, wds, md);
    setExpr(e);
  };

  const toggleWeekday = (d: string) => {
    const next = simpleWeekdays.includes(d)
      ? simpleWeekdays.filter((x) => x !== d)
      : [...simpleWeekdays, d];
    setSimpleWeekdays(next);
    updateSimple(scheduleType, simpleHour, simpleMin, simpleInterval, next, simpleMonthDay);
  };

  // Build expr from advanced builder
  const buildAdv = (a: CronPart) => `${a.minute} ${a.hour} ${a.day} ${a.month} ${a.weekday}`;

  const updateAdv = (field: keyof CronPart, val: string) => {
    const next = { ...adv, [field]: val };
    setAdv(next);
    setExpr(buildAdv(next));
  };

  const copy = () => {
    navigator.clipboard.writeText(expr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const loadPreset = (e: string) => {
    setExpr(e);
    const parts = e.split(" ");
    if (parts.length === 5) {
      setAdv({ minute: parts[0], hour: parts[1], day: parts[2], month: parts[3], weekday: parts[4] });
    }
  };

  const FIELD_HINTS: Record<keyof CronPart, string> = {
    minute:  "0–59",
    hour:    "0–23",
    day:     "1–31",
    month:   "1–12",
    weekday: "0–6 (Sun=0)",
  };

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-orange-500/[0.04] blur-3xl pointer-events-none" />

      {/* NAV */}
      <ToolNavbar toolName="Cron Generator" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center text-lg">⏱</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Cron Expression Generator</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">5-field</span>
          </div>
          <p className="text-slate-500 text-sm">Build, validate, and understand cron expressions. Visual builder + manual editor with next run preview.</p>
        </div>

        {/* Expression display */}
        <div className={`bg-white/[0.03] border rounded-xl p-5 mb-5 ${error ? "border-red-500/30" : "border-emerald-500/20"}`}>
          <div className="flex items-center gap-3 mb-3">
            <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Cron Expression</span>
            {!error && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
          </div>

          {/* Editable expression */}
          <div className="flex items-center gap-3 mb-4">
            <input
              value={expr} onChange={(e) => setExpr(e.target.value)}
              spellCheck={false}
              className={`flex-1 font-mono text-2xl font-bold tracking-[0.2em] bg-transparent outline-none transition-colors ${error ? "text-red-400" : "text-emerald-400"}`}
            />
            <button onClick={copy}
              className={`font-mono text-sm px-4 py-2 rounded-md border transition-all shrink-0 ${copied ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-500 hover:text-slate-200 hover:border-white/20"}`}>
              {copied ? "✓ Copied!" : "Copy"}
            </button>
          </div>

          {/* Field labels */}
          <div className="grid grid-cols-5 gap-1 mb-3">
            {(["Minute","Hour","Day","Month","Weekday"]).map((f) => (
              <div key={f} className="text-center font-mono text-[10px] text-slate-700 uppercase tracking-wider">{f}</div>
            ))}
          </div>

          {/* Human readable */}
          {error ? (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
              <span className="text-red-400 text-sm">✕</span>
              <span className="font-mono text-sm text-red-400">{error}</span>
            </div>
          ) : (
            <div className="bg-emerald-500/[0.06] border border-emerald-500/15 rounded-lg px-4 py-3">
              <span className="font-mono text-[11px] text-emerald-500/60 mr-2">Means:</span>
              <span className="font-mono text-sm text-emerald-300">{human}</span>
            </div>
          )}
        </div>

        {/* Builder tabs */}
        <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-lg p-1 gap-1 mb-5 w-fit">
          {(["simple", "advanced"] as BuilderTab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`font-mono text-xs px-5 py-2 rounded-md capitalize transition-all ${tab === t ? "bg-emerald-500/20 text-emerald-400" : "text-slate-500 hover:text-slate-300"}`}>
              {t === "simple" ? "🪄 Simple Builder" : "⚙️ Advanced Builder"}
            </button>
          ))}
        </div>

        {/* ── Simple Builder ── */}
        {tab === "simple" && (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 mb-5">

            {/* Schedule type */}
            <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">Schedule Type</div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
              {[
                { key: "every-minute",  label: "Every Min" },
                { key: "every-n-min",   label: "Every N Mins" },
                { key: "hourly",        label: "Hourly" },
                { key: "daily",         label: "Daily" },
                { key: "weekdays",      label: "Weekdays" },
                { key: "weekends",      label: "Weekends" },
                { key: "custom-days",   label: "Custom Days" },
                { key: "weekly",        label: "Weekly" },
                { key: "monthly",       label: "Monthly" },
                { key: "yearly",        label: "Yearly" },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => {
                  setScheduleType(key);
                  updateSimple(key, simpleHour, simpleMin, simpleInterval, simpleWeekdays, simpleMonthDay);
                }}
                  className={`font-mono text-xs py-2 px-3 rounded-md border transition-all ${scheduleType === key ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-600 hover:text-slate-300"}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Interval (for every-n-min) */}
            {scheduleType === "every-n-min" && (
              <div className="mb-5">
                <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-2">Every N minutes</div>
                <div className="flex gap-2 flex-wrap">
                  {["2","3","5","10","15","20","30"].map((n) => (
                    <button key={n} onClick={() => { setSimpleInterval(n); updateSimple(scheduleType, simpleHour, simpleMin, n, simpleWeekdays, simpleMonthDay); }}
                      className={`font-mono text-xs px-3 py-1.5 rounded border transition-all ${simpleInterval === n ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-600 hover:text-slate-300"}`}>
                      {n}
                    </button>
                  ))}
                  <input type="number" min={1} max={59} value={simpleInterval}
                    onChange={(e) => { setSimpleInterval(e.target.value); updateSimple(scheduleType, simpleHour, simpleMin, e.target.value, simpleWeekdays, simpleMonthDay); }}
                    className="font-mono text-xs w-16 px-2 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded text-slate-300 outline-none focus:border-emerald-500/30" />
                </div>
              </div>
            )}

            {/* Hour + Minute pickers */}
            {!["every-minute","every-n-min"].includes(scheduleType) && (
              <div className="grid grid-cols-2 gap-4 mb-5">
                {scheduleType !== "hourly" && (
                  <div>
                    <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-2">Hour</div>
                    <select value={simpleHour} onChange={(e) => { setSimpleHour(e.target.value); updateSimple(scheduleType, e.target.value, simpleMin, simpleInterval, simpleWeekdays, simpleMonthDay); }}
                      className="w-full font-mono text-sm bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-slate-300 outline-none focus:border-emerald-500/30 transition-colors">
                      {HOURS.map((h) => <option key={h.val} value={h.val}>{h.label}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-2">Minute</div>
                  <select value={simpleMin} onChange={(e) => { setSimpleMin(e.target.value); updateSimple(scheduleType, simpleHour, e.target.value, simpleInterval, simpleWeekdays, simpleMonthDay); }}
                    className="w-full font-mono text-sm bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-slate-300 outline-none focus:border-emerald-500/30 transition-colors">
                    {MINUTES.filter((_, i) => i % 5 === 0 || i === parseInt(simpleMin)).map((m) => (
                      <option key={m.val} value={m.val}>:{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Day pickers */}
            {["custom-days", "weekly"].includes(scheduleType) && (
              <div className="mb-5">
                <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-2">
                  {scheduleType === "weekly" ? "Day of week" : "Select days"}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {WEEKDAYS.map((d) => (
                    <button key={d.val} onClick={() => toggleWeekday(d.val)}
                      className={`font-mono text-xs px-3 py-1.5 rounded border transition-all ${simpleWeekdays.includes(d.val) ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-600 hover:text-slate-300"}`}>
                      {d.label.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {scheduleType === "monthly" && (
              <div className="mb-5">
                <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-2">Day of month</div>
                <div className="flex gap-1.5 flex-wrap">
                  {Array.from({ length: 28 }, (_, i) => String(i + 1)).map((d) => (
                    <button key={d} onClick={() => { setSimpleMonthDay(d); updateSimple(scheduleType, simpleHour, simpleMin, simpleInterval, simpleWeekdays, d); }}
                      className={`font-mono text-xs w-9 h-8 rounded border transition-all ${simpleMonthDay === d ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "border-white/[0.08] text-slate-600 hover:text-slate-300"}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Advanced Builder ── */}
        {tab === "advanced" && (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 mb-5">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              {(Object.keys(adv) as (keyof CronPart)[]).map((field) => (
                <div key={field}>
                  <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-1">{field}</div>
                  <div className="font-mono text-[10px] text-slate-700 mb-2">{FIELD_HINTS[field]}</div>
                  <input value={adv[field]} onChange={(e) => updateAdv(field, e.target.value)}
                    spellCheck={false}
                    className="w-full font-mono text-sm px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-slate-300 outline-none focus:border-emerald-500/30 transition-colors" />
                </div>
              ))}
            </div>
            <div className="mt-4 bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
              <div className="font-mono text-[11px] text-slate-600 mb-3">Syntax Reference</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  ["*",       "Any value"],
                  ["*/n",     "Every n units"],
                  ["a,b",     "a or b"],
                  ["a-b",     "Range a to b"],
                  ["a-b/n",   "Range, step n"],
                  ["5",       "Exact value 5"],
                ].map(([sym, desc]) => (
                  <div key={sym} className="flex items-center gap-2 bg-white/[0.02] rounded px-3 py-2">
                    <code className="font-mono text-xs text-emerald-400 w-14 shrink-0">{sym}</code>
                    <span className="font-mono text-[10px] text-slate-600">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Presets */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 mb-5">
          <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-4">Common Presets</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PRESETS.map((p) => (
              <button key={p.expr} onClick={() => loadPreset(p.expr)}
                className={`text-left px-4 py-3 rounded-lg border transition-all group ${expr === p.expr ? "bg-emerald-500/10 border-emerald-500/25" : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.14] hover:bg-white/[0.04]"}`}>
                <div className={`font-mono text-xs font-bold mb-1 ${expr === p.expr ? "text-emerald-400" : "text-slate-300 group-hover:text-white"}`}>{p.label}</div>
                <div className={`font-mono text-[10px] ${expr === p.expr ? "text-emerald-500/70" : "text-slate-700"}`}>{p.expr}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Next runs */}
        {nextRuns.length > 0 && (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden mb-6">
            <div className="px-5 py-3 border-b border-white/[0.06]">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Next {nextRuns.length} Scheduled Runs</span>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {nextRuns.map((d, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3">
                  <span className={`font-mono text-xs w-5 h-5 rounded flex items-center justify-center shrink-0 ${i === 0 ? "bg-emerald-500/20 text-emerald-400" : "text-slate-700"}`}>{i + 1}</span>
                  <span className="font-mono text-sm text-slate-300 tabular-nums">
                    {d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <span className="font-mono text-sm text-emerald-400 tabular-nums ml-auto">
                    {d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                  {i === 0 && (
                    <span className="font-mono text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">next</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "🪄", title: "Simple Builder",   desc: "Pick a schedule type and time — no cron syntax knowledge needed." },
            { icon: "⚙️", title: "Advanced Builder", desc: "Full control over each field with syntax reference. Supports */n, ranges, lists." },
            { icon: "🔮", title: "Next Run Preview",  desc: "See the next 6 scheduled execution times for your expression." },
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