"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useEffect, useCallback } from "react";

export default function UnixLiveClock() {
  const [unixTime, setUnixTime] = useState(0); // Client-side par hi initialize karenge to prevent hydration mismatch
  const [showSeconds, setShowSeconds] = useState(true);
  const [showCopied, setShowCopied] = useState(false);

  useEffect(() => {
    setUnixTime(Math.floor(Date.now() / 1000));
    const interval = setInterval(() => {
      setUnixTime(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(unixTime.toString());
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  }, [unixTime]);

  // Format options for consistent look
  const formatOptions = (isUTC: boolean): Intl.DateTimeFormatOptions => ({
    timeZone: isUTC ? "UTC" : undefined,
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: showSeconds ? "2-digit" : undefined,
    hour12: false,
    timeZoneName: "short",
  });

  return (
    <main className="min-h-screen bg-[#020205] text-slate-300 font-sans selection:bg-orange-500/30">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 opacity-[0.15]" 
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-orange-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <ToolNavbar toolName="Unix Live Clock" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 lg:py-24">
        
        {/* Header Section */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-widest animate-pulse">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            Live System Time
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white">
            Unix <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-200">Live Clock</span>
          </h1>
          <p className="max-w-xl mx-auto text-slate-400 text-lg">
            Precise Unix Epoch time tracker. Essential for developers managing timestamps across different timezones.
          </p>
        </div>

        {/* Main Clock Card */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
          
          <div className="relative bg-[#0d0d15]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-16 shadow-2xl overflow-hidden">
            
            {/* Unix Number Display */}
            <div className="relative flex flex-col items-center">
              <div 
                onClick={copyToClipboard}
                className="cursor-pointer text-6xl md:text-8xl font-mono font-black text-white tracking-tighter mb-8 hover:scale-[1.02] transition-transform active:scale-95 select-all"
              >
                {unixTime || ".........."}
              </div>

              {/* Copy Notification Overlay */}
              {showCopied && (
                <div className="absolute -top-12 bg-emerald-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg shadow-emerald-500/20 animate-bounce">
                  COPIED TO CLIPBOARD!
                </div>
              )}

              {/* Controls */}
              <div className="flex flex-wrap justify-center gap-4 mb-12">
                <button
                  onClick={copyToClipboard}
                  className="group flex items-center gap-2 px-8 py-3.5 bg-white text-black font-bold rounded-xl hover:bg-orange-400 transition-all shadow-lg hover:shadow-orange-500/20"
                >
                  <span className="group-hover:rotate-12 transition-transform">📋</span> Copy Timestamp
                </button>
                
                <label className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                  <input
                    type="checkbox"
                    checked={showSeconds}
                    onChange={() => setShowSeconds(!showSeconds)}
                    className="w-5 h-5 accent-orange-500 rounded"
                  />
                  <span className="text-sm font-medium text-slate-300">Detailed Time</span>
                </label>
              </div>
            </div>

            {/* Timezones Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-gradient-to-b from-white/[0.05] to-transparent border border-white/[0.05]">
                <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-3">Local Device Time</p>
                <p className="text-xl md:text-2xl font-mono text-slate-100">
                  {unixTime ? new Date(unixTime * 1000).toLocaleString("en-IN", formatOptions(false)) : "Loading..."}
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-b from-white/[0.05] to-transparent border border-white/[0.05]">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3">Coordinated Universal Time (UTC)</p>
                <p className="text-xl md:text-2xl font-mono text-slate-100">
                  {unixTime ? new Date(unixTime * 1000).toLocaleString("en-IN", formatOptions(true)) : "Loading..."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
          {[
            { icon: "⚡", title: "Real-time Sync", desc: "No manual refresh needed." },
            { icon: "🛡️", title: "Developer Friendly", desc: "Clean output, no extra fluff." },
            { icon: "🌍", title: "Universal Format", desc: "Standard ISO-8601 support." },
          ].map((item, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors">
              <span className="text-2xl block mb-2">{item.icon}</span>
              <h3 className="font-bold text-white mb-1">{item.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}