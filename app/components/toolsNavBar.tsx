"use client";

import Link from "next/link";

interface Props {
  toolName: string;
}

export default function ToolNavbar({ toolName }: Props) {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#09090f]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
        <Link
          href="/"
          className="font-mono text-sm font-bold text-emerald-400 tracking-tight"
        >
          use2<span className="text-slate-500">coding</span>tools
        </Link>

        <span className="text-white/10">/</span>

        <span className="font-mono text-sm text-slate-400">
          {toolName}
        </span>
      </div>
    </nav>
  );
}