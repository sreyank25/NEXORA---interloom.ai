import React, { useState } from 'react';
import { Sparkles, Sliders, ShieldCheck, GitCompare, MessageSquare, ArrowRight, Menu, X, RotateCcw, Cpu, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export type AppStage = 'landing' | 'jd' | 'resumes' | 'analyzing' | 'shortlist';

interface NavbarProps {
  currentStage: AppStage;
  onStageChange: (stage: AppStage) => void;
  candidateCount: number;
  onOpenChat: () => void;
  onOpenCompare: () => void;
  onOpenAlgo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentStage,
  onStageChange,
  candidateCount,
  onOpenChat,
  onOpenCompare,
  onOpenAlgo,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#fbfbfd]/85 dark:bg-[#16171b]/90 backdrop-blur-md border-b border-black/[0.06] dark:border-white/[0.08] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={() => onStageChange('landing')}
            className="flex items-center gap-2.5 group text-left focus:outline-none cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1d1d1f] to-[#3a3a3c] dark:from-[#2c2d33] dark:to-[#43454f] flex items-center justify-center text-white shadow-xs group-hover:scale-[1.03] transition-transform">
              <Sparkles className="w-4 h-4 text-sky-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                InternLoom <span className="font-normal text-slate-500 dark:text-[#86868b]">AI</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-[#86868b] font-medium tracking-wide">
                Smart Shortlisting Engine
              </span>
            </div>
          </button>

          {/* Flow Stepper Nav (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-black/[0.03] dark:bg-white/[0.05] p-1 rounded-full border border-black/[0.04] dark:border-white/[0.08]">
            <button
              onClick={() => onStageChange('landing')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                currentStage === 'landing'
                  ? 'bg-white dark:bg-[#22252e] text-[#1d1d1f] dark:text-[#f5f5f7] shadow-2xs dark:shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-[#a1a1a6] hover:text-[#1d1d1f] dark:hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => onStageChange('jd')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                currentStage === 'jd'
                  ? 'bg-white dark:bg-[#22252e] text-[#1d1d1f] dark:text-[#f5f5f7] shadow-2xs dark:shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-[#a1a1a6] hover:text-[#1d1d1f] dark:hover:text-white'
              }`}
            >
              Job Description
            </button>
            <button
              onClick={() => onStageChange('resumes')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                currentStage === 'resumes'
                  ? 'bg-white dark:bg-[#22252e] text-[#1d1d1f] dark:text-[#f5f5f7] shadow-2xs dark:shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-[#a1a1a6] hover:text-[#1d1d1f] dark:hover:text-white'
              }`}
            >
              Resumes
            </button>
            <button
              onClick={() => onStageChange('shortlist')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                currentStage === 'shortlist'
                  ? 'bg-white dark:bg-[#22252e] text-[#1d1d1f] dark:text-[#f5f5f7] shadow-2xs dark:shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-[#a1a1a6] hover:text-[#1d1d1f] dark:hover:text-white'
              }`}
            >
              Shortlist
            </button>
          </nav>
        </div>

        {/* Action Controls (Desktop) */}
        <div className="hidden lg:flex items-center gap-2">
          {/* Audit Algorithm Modal Button */}
          <button
            onClick={onOpenAlgo}
            className="px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 dark:text-[#a1a1a6] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Inspect Mathematical Hybrid Scoring Formula"
          >
            <Cpu className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Audit Engine</span>
          </button>

          {/* Head-to-Head Compare Button */}
          <button
            onClick={onOpenCompare}
            className="px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 dark:text-[#a1a1a6] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Compare two candidates side-by-side"
          >
            <GitCompare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Compare</span>
          </button>

          {/* AI Recruiter Assistant Trigger */}
          <button
            onClick={onOpenChat}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#0071e3] hover:bg-[#0077ed] text-white transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Recruiter</span>
          </button>

          {/* Dark / Light Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            className="p-2 rounded-full text-slate-600 dark:text-[#a1a1a6] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-all cursor-pointer border border-transparent hover:border-black/[0.06] dark:hover:border-white/[0.1] ml-1"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>
        </div>

        {/* Mobile / Tablet Quick Controls */}
        <div className="flex lg:hidden items-center gap-2">
          {/* Theme Toggle on mobile/tablet */}
          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            className="p-2 rounded-xl text-slate-600 dark:text-[#a1a1a6] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          <button
            onClick={onOpenChat}
            className="p-2 rounded-xl text-[#0071e3] bg-sky-50 dark:bg-sky-950/40 dark:text-sky-300"
            aria-label="Open AI Recruiter Assistant"
          >
            <Sparkles className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 dark:text-[#a1a1a6] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#16171b] p-4 space-y-2 transition-colors">
          <button
            onClick={() => {
              onStageChange('landing');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-800 dark:text-[#ededf0] hover:bg-slate-50 dark:hover:bg-white/[0.05]"
          >
            Overview
          </button>
          <button
            onClick={() => {
              onStageChange('jd');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-800 dark:text-[#ededf0] hover:bg-slate-50 dark:hover:bg-white/[0.05]"
          >
            Job Description
          </button>
          <button
            onClick={() => {
              onStageChange('resumes');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-800 dark:text-[#ededf0] hover:bg-slate-50 dark:hover:bg-white/[0.05]"
          >
            Resumes
          </button>
          <button
            onClick={() => {
              onStageChange('shortlist');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-800 dark:text-[#ededf0] hover:bg-slate-50 dark:hover:bg-white/[0.05]"
          >
            Shortlist
          </button>
          
          <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex gap-2">
            <button
              onClick={() => {
                onOpenAlgo();
                setMobileMenuOpen(false);
              }}
              className="flex-1 py-2 text-center rounded-xl bg-slate-100 dark:bg-white/[0.06] text-xs font-medium text-slate-700 dark:text-[#ededf0]"
            >
              Audit Engine
            </button>
            <button
              onClick={() => {
                onOpenCompare();
                setMobileMenuOpen(false);
              }}
              className="flex-1 py-2 text-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-xs font-medium text-indigo-700 dark:text-indigo-300"
            >
              Compare
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between px-3 py-2">
            <span className="text-xs text-slate-600 dark:text-[#a1a1a6]">Appearance</span>
            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 bg-black/[0.04] dark:bg-white/[0.08] text-slate-800 dark:text-[#f5f5f7]"
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Dark Theme</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600" />
                  <span>Light Theme</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

