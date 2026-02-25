"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useMemo } from "react";

// ── Helpers ───────────────────────────────────────────────────
function getDayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

function getZodiac(month: number, day: number): { sign: string; emoji: string } {
  const signs = [
    { sign: "Capricorn",   emoji: "♑", from: [12,22], to: [1,19]  },
    { sign: "Aquarius",    emoji: "♒", from: [1,20],  to: [2,18]  },
    { sign: "Pisces",      emoji: "♓", from: [2,19],  to: [3,20]  },
    { sign: "Aries",       emoji: "♈", from: [3,21],  to: [4,19]  },
    { sign: "Taurus",      emoji: "♉", from: [4,20],  to: [5,20]  },
    { sign: "Gemini",      emoji: "♊", from: [5,21],  to: [6,20]  },
    { sign: "Cancer",      emoji: "♋", from: [6,21],  to: [7,22]  },
    { sign: "Leo",         emoji: "♌", from: [7,23],  to: [8,22]  },
    { sign: "Virgo",       emoji: "♍", from: [8,23],  to: [9,22]  },
    { sign: "Libra",       emoji: "♎", from: [9,23],  to: [10,22] },
    { sign: "Scorpio",     emoji: "♏", from: [10,23], to: [11,21] },
    { sign: "Sagittarius", emoji: "♐", from: [11,22], to: [12,21] },
  ];
  for (const s of signs) {
    const [fm, fd] = s.from;
    const [tm, td] = s.to;
    if (fm === 12) {
      if ((month === 12 && day >= fd) || (month === 1 && day <= td))
        return { sign: s.sign, emoji: s.emoji };
    } else {
      if ((month === fm && day >= fd) || (month === tm && day <= td))
        return { sign: s.sign, emoji: s.emoji };
    }
  }
  return { sign: "Capricorn", emoji: "♑" };
}

function getChineseZodiac(year: number): { animal: string; emoji: string } {
  const animals = [
    { animal: "Rat",     emoji: "🐭" },
    { animal: "Ox",      emoji: "🐂" },
    { animal: "Tiger",   emoji: "🐯" },
    { animal: "Rabbit",  emoji: "🐰" },
    { animal: "Dragon",  emoji: "🐲" },
    { animal: "Snake",   emoji: "🐍" },
    { animal: "Horse",   emoji: "🐴" },
    { animal: "Goat",    emoji: "🐐" },
    { animal: "Monkey",  emoji: "🐵" },
    { animal: "Rooster", emoji: "🐓" },
    { animal: "Dog",     emoji: "🐶" },
    { animal: "Pig",     emoji: "🐷" },
  ];
  return animals[(year - 1900) % 12];
}

function getDayName(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function calcAge(dob: Date, to: Date) {
  let years   = to.getFullYear() - dob.getFullYear();
  let months  = to.getMonth()    - dob.getMonth();
  let days    = to.getDate()     - dob.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(to.getFullYear(), to.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) { years--; months += 12; }

  const totalDays    = Math.floor((to.getTime() - dob.getTime()) / 86400000);
  const totalWeeks   = Math.floor(totalDays / 7);
  const totalMonths  = years * 12 + months;
  const totalHours   = totalDays * 24;
  const totalMinutes = totalHours * 60;
  const totalSeconds = totalMinutes * 60;

  return { years, months, days, totalDays, totalWeeks, totalMonths, totalHours, totalMinutes, totalSeconds };
}

function getNextBirthday(dob: Date, from: Date): { date: Date; daysLeft: number } {
  const next = new Date(from.getFullYear(), dob.getMonth(), dob.getDate());
  if (next <= from) next.setFullYear(next.getFullYear() + 1);
  const daysLeft = Math.ceil((next.getTime() - from.getTime()) / 86400000);
  return { date: next, daysLeft };
}

const FAMOUS_BIRTHDAYS: Record<string, string> = {
  "01-01": "New Year's Day 🎆",
  "02-14": "Valentine's Day ❤️",
  "03-14": "Pi Day 🥧",
  "04-01": "April Fools' Day 🤡",
  "06-21": "World Music Day 🎵",
  "07-04": "US Independence Day 🇺🇸",
  "10-31": "Halloween 🎃",
  "12-25": "Christmas 🎄",
};

const MILESTONES = [1000, 5000, 10000, 15000, 20000, 25000];

export default function AgeCalculator() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [dob, setDob]     = useState("1995-08-15");
  const [toDate, setToDate] = useState(today.toISOString().split("T")[0]);
  const [useToday, setUseToday] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const result = useMemo(() => {
    if (!dob) return null;
    try {
      const dobDate  = new Date(dob + "T00:00:00");
      const toD      = useToday ? today : new Date(toDate + "T00:00:00");
      if (isNaN(dobDate.getTime()) || isNaN(toD.getTime())) return null;
      if (dobDate > toD) return null;

      const age         = calcAge(dobDate, toD);
      const zodiac      = getZodiac(dobDate.getMonth() + 1, dobDate.getDate());
      const chinese     = getChineseZodiac(dobDate.getFullYear());
      const dayBorn     = getDayName(dobDate);
      const dayOfYear   = getDayOfYear(dobDate);
      const leap        = isLeapYear(dobDate.getFullYear());
      const nextBday    = getNextBirthday(dobDate, toD);
      const mmdd        = `${String(dobDate.getMonth() + 1).padStart(2, "0")}-${String(dobDate.getDate()).padStart(2, "0")}`;
      const famousDay   = FAMOUS_BIRTHDAYS[mmdd] ?? null;

      // Upcoming day milestones
      const upcoming = MILESTONES.map((m) => {
        const ms = dobDate.getTime() + m * 86400000;
        const d  = new Date(ms);
        const daysLeft = Math.ceil((ms - toD.getTime()) / 86400000);
        return { days: m, date: d, daysLeft, passed: daysLeft <= 0 };
      });

      return { age, zodiac, chinese, dayBorn, dayOfYear, leap, nextBday, famousDay, dobDate, upcoming };
    } catch { return null; }
  }, [dob, toDate, useToday]);

  const copy = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const fmt = (n: number) => n.toLocaleString();

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-pink-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-orange-500/[0.04] blur-3xl pointer-events-none" />

      {/* NAV */}

      <ToolNavbar toolName="Age Calculator" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-pink-500/10 flex items-center justify-center text-lg">🎂</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Age Calculator</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-pink-500/10 text-pink-400 rounded">with milestones</span>
          </div>
          <p className="text-slate-500 text-sm">Calculate exact age in years, months, days — and discover zodiac sign, next birthday, day milestones, and more.</p>
        </div>

        {/* Input card */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* DOB */}
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-2">Date of Birth</div>
              <input type="date" value={dob}
                max={today.toISOString().split("T")[0]}
                onChange={(e) => setDob(e.target.value)}
                className="w-full font-mono text-sm px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-slate-200 outline-none focus:border-pink-500/40 transition-colors"
              />
            </div>

            {/* To date */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Calculate To</div>
                <label onClick={() => setUseToday(!useToday)} className="flex items-center gap-2 cursor-pointer">
                  <div className={`w-8 h-4 rounded-full transition-all relative ${useToday ? "bg-pink-500" : "bg-white/10"}`}>
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${useToday ? "left-4" : "left-0.5"}`} />
                  </div>
                  <span className="font-mono text-xs text-slate-500">Today</span>
                </label>
              </div>
              <input type="date" value={useToday ? today.toISOString().split("T")[0] : toDate}
                disabled={useToday}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full font-mono text-sm px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-slate-200 outline-none focus:border-pink-500/40 disabled:opacity-40 transition-colors"
              />
            </div>
          </div>
        </div>

        {result ? (
          <>
            {/* Main age display */}
            <div className="bg-white/[0.03] border border-pink-500/20 rounded-xl p-6 mb-5">
              <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-5">Exact Age</div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { val: result.age.years,  label: "Years"  },
                  { val: result.age.months, label: "Months" },
                  { val: result.age.days,   label: "Days"   },
                ].map((item) => (
                  <div key={item.label} className="text-center bg-white/[0.03] border border-white/[0.06] rounded-xl py-5">
                    <div className="font-mono text-4xl font-extrabold text-pink-400 tracking-tight">{item.val}</div>
                    <div className="font-mono text-xs text-slate-600 mt-1 uppercase tracking-wider">{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Total stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { val: fmt(result.age.totalDays),    label: "Total Days",    key: "days",    color: "text-orange-400" },
                  { val: fmt(result.age.totalWeeks),   label: "Total Weeks",   key: "weeks",   color: "text-yellow-400" },
                  { val: fmt(result.age.totalMonths),  label: "Total Months",  key: "months",  color: "text-emerald-400" },
                  { val: fmt(result.age.totalHours),   label: "Total Hours",   key: "hours",   color: "text-cyan-400"   },
                  { val: fmt(result.age.totalMinutes), label: "Total Minutes", key: "minutes", color: "text-violet-400" },
                  { val: fmt(result.age.totalSeconds), label: "Total Seconds", key: "seconds", color: "text-pink-400"   },
                ].map((item) => (
                  <button key={item.key}
                    onClick={() => copy(item.key, item.val.replace(/,/g, ""))}
                    className="flex items-center justify-between bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.14] rounded-lg px-4 py-3 transition-all group text-left">
                    <div>
                      <div className={`font-mono text-sm font-bold ${item.color}`}>{item.val}</div>
                      <div className="font-mono text-[10px] text-slate-700">{item.label}</div>
                    </div>
                    <span className={`font-mono text-[10px] transition-all ${copiedKey === item.key ? "text-emerald-400" : "text-slate-700 opacity-0 group-hover:opacity-100"}`}>
                      {copiedKey === item.key ? "✓" : "copy"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Fun facts row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">

              {/* Birthday info */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
                <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-4">Birthday Info</div>
                <div className="space-y-3">
                  {[
                    { label: "Day Born",       val: result.dayBorn,        icon: "📅" },
                    { label: "Zodiac Sign",    val: `${result.zodiac.emoji} ${result.zodiac.sign}`, icon: "⭐" },
                    { label: "Chinese Zodiac", val: `${result.chinese.emoji} ${result.chinese.animal}`, icon: "🐾" },
                    { label: "Day of Year",    val: `#${result.dayOfYear}`, icon: "📆" },
                    { label: "Leap Year",      val: result.leap ? "Yes 🎉" : "No",     icon: "🗓" },
                    ...(result.famousDay ? [{ label: "Shares with",  val: result.famousDay, icon: "🌟" }] : []),
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{row.icon}</span>
                        <span className="font-mono text-xs text-slate-500">{row.label}</span>
                      </div>
                      <span className="font-mono text-xs text-slate-300">{row.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next birthday */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
                <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-4">Next Birthday 🎂</div>
                <div className="text-center py-4">
                  {result.nextBday.daysLeft === 0 ? (
                    <>
                      <div className="text-5xl mb-3">🎉</div>
                      <div className="font-mono text-xl font-bold text-pink-400">Happy Birthday!</div>
                      <div className="font-mono text-xs text-slate-500 mt-2">Today is your birthday!</div>
                    </>
                  ) : (
                    <>
                      <div className="font-mono text-5xl font-extrabold text-pink-400 mb-2">
                        {result.nextBday.daysLeft}
                      </div>
                      <div className="font-mono text-sm text-slate-500 mb-3">days until next birthday</div>
                      <div className="font-mono text-xs text-slate-400 bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-2">
                        {result.nextBday.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                      </div>
                      <div className="font-mono text-xs text-slate-600 mt-3">
                        Turning {result.age.years + 1} years old
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Day milestones */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden mb-6">
              <div className="px-5 py-3 border-b border-white/[0.06]">
                <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Day Milestones 🏆</span>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {result.upcoming.map((m) => (
                  <div key={m.days}
                    className={`flex items-center gap-4 px-5 py-3.5 ${m.passed ? "opacity-40" : "hover:bg-white/[0.02]"} transition-colors`}>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${m.passed ? "bg-slate-700" : m.daysLeft <= 30 ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
                    <div className="flex-1">
                      <span className="font-mono text-sm font-bold text-slate-300">{fmt(m.days)}</span>
                      <span className="font-mono text-xs text-slate-600 ml-2">days old</span>
                    </div>
                    <span className="font-mono text-xs text-slate-500">
                      {m.date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <span className={`font-mono text-xs px-2.5 py-1 rounded-md shrink-0 ${
                      m.passed ? "bg-white/[0.04] text-slate-600" :
                      m.daysLeft <= 30 ? "bg-emerald-500/20 text-emerald-400" :
                      "bg-white/[0.04] text-slate-500"
                    }`}>
                      {m.passed ? "✓ Passed" : m.daysLeft === 0 ? "Today! 🎉" : `in ${m.daysLeft} days`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-16 border border-dashed border-white/[0.06] rounded-xl mb-6">
            <div className="text-4xl mb-4">🎂</div>
            <p className="font-mono text-sm text-slate-600">
              {dob ? "Invalid date — check your input" : "Enter your date of birth to calculate age"}
            </p>
          </div>
        )}

        {/* Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "📊", title: "Full Breakdown",  desc: "Age in years, months, days + total in weeks, hours, minutes, seconds." },
            { icon: "🌟", title: "Zodiac & Chinese", desc: "Western zodiac sign and Chinese zodiac animal based on your birth year." },
            { icon: "🏆", title: "Day Milestones",  desc: "See when you hit 1,000 / 5,000 / 10,000 / 25,000 days old." },
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