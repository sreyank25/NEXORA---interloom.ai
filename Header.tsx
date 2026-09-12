import React from 'react';
import { Cpu, ShieldAlert, GitCompare, MessageSquare, Download, FileText } from 'lucide-react';

interface HeaderProps {
  onOpenAlgorithm: () => void;
  onOpenBiasScanner: () => void;
  onOpenCompare: () => void;
  onToggleChat: () => void;
  onOpenJD: () => void;
  onExport: () => void;
  isChatOpen: boolean;
  totalCandidates: number;
  biasCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAlgorithm,
  onOpenBiasScanner,
  onOpenCompare,
  onToggleChat,
  onOpenJD,
  onExport,
  isChatOpen,
  totalCandidates,
  biasCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-4">
        
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50 border border-emerald-100 p-1">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path d="M7 29C13 26 18 27.5 20 30C22 27.5 27 26 33 29V32C27 29 22 30.5 20 33C18 30.5 13 29 7 32V29Z" fill="#0d9488" />
              <path d="M20 23V30" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
              <path d="M20 18V23M20 20L15 16M20 19L25 15M20 15L17 12M20 14L23 11" stroke="#854d0e" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="20" cy="9" r="3.2" fill="#059669" />
              <circle cx="14" cy="13" r="2.8" fill="#10b981" />
              <circle cx="26" cy="12" r="2.8" fill="#047857" />
              <circle cx="11" cy="18" r="2.2" fill="#f59e0b" />
              <circle cx="29" cy="17" r="2.2" fill="#14b8a6" />
              <circle cx="17" cy="7" r="2" fill="#34d399" />
              <circle cx="23" cy="7" r="2" fill="#f97316" />
            </svg>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold tracking-tight text-[#0a664e]">
              INTERNLOOM
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 hidden sm:inline-block">
              {totalCandidates} Applicants
            </span>
          </div>
        </div>

        {/* Streamlined Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          <button
            onClick={onOpenAlgorithm}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-700 hover:text-[#0a664e] hover:bg-emerald-50/60 transition-colors"
            title="Inspect dual-engine scoring formula"
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">Formula</span>
          </button>

          <button
            onClick={onOpenBiasScanner}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-amber-800 hover:bg-amber-50 transition-colors"
            title="Scan Job Description for bias"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden md:inline">Bias Check</span>
            <span className="w-4 h-4 flex items-center justify-center bg-amber-100 text-amber-900 rounded-full text-[10px] font-bold">
              {biasCount}
            </span>
          </button>

          <button
            onClick={onOpenCompare}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/60 transition-colors"
            title="Compare candidates side-by-side"
          >
            <GitCompare className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Compare</span>
          </button>

          <button
            onClick={onOpenJD}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
            title="View Job Description"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden lg:inline">JD</span>
          </button>

          <button
            onClick={onExport}
            className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium rounded-lg text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            title="Export shortlist"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={onToggleChat}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-xs ${
              isChatOpen
                ? 'bg-emerald-800 text-white'
                : 'bg-[#0a664e] hover:bg-emerald-700 text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Assistant</span>
          </button>

        </div>

      </div>
    </header>
  );
};
