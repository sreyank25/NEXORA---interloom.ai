import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles, CheckCircle2, SlidersHorizontal, Cpu, ShieldCheck, Users } from 'lucide-react';
import { ScoreCounter } from './ScoreCounter';
import { CandidateMatchResult, JobDescription } from '../types';

interface HeroSectionProps {
  onStartShortlisting: () => void;
  onSeeHowItWorks: () => void;
  candidateCount: number;
  topCandidate?: CandidateMatchResult | null;
  jobDescription?: JobDescription;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onStartShortlisting,
  onSeeHowItWorks,
  candidateCount,
  topCandidate,
  jobDescription,
}) => {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-32">
      {/* Subtle Apple-like ambient chromatic aura */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full opacity-40 blur-3xl"
        style={{
          background: 'radial-gradient(circle at center, rgba(0, 113, 227, 0.18), rgba(88, 86, 214, 0.12), transparent 70%)',
        }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        
        {/* Subtle Pill Tag */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] text-xs font-medium text-slate-700 dark:text-[#a1a1a6] mb-6 backdrop-blur-xs shadow-2xs"
        >
          <span className="w-2 h-2 rounded-full bg-[#0071e3] dark:bg-sky-400 animate-pulse" />
          <span>Next-Generation Campus Recruitment Engine</span>
        </motion.div>

        {/* Apple-style Monumental Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
          className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7] leading-[1.08]"
        >
          Find the right candidate.
          <br />
          <span className="bg-gradient-to-r from-[#1d1d1f] dark:from-white via-slate-700 dark:via-slate-300 to-[#0071e3] dark:to-sky-400 bg-clip-text text-transparent">
            Not just the right keywords.
          </span>
        </motion.h1>

        {/* Clean Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          className="mt-6 text-base sm:text-xl text-slate-600 dark:text-[#a1a1a6] max-w-2xl mx-auto font-normal leading-relaxed"
        >
          InternLoom AI combines semantic understanding with explicit skill matching to intelligently rank candidates against any job description.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4"
        >
          <button
            onClick={onStartShortlisting}
            className="w-full sm:w-auto px-7 py-3.5 rounded-full text-sm font-semibold bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.99] cursor-pointer"
          >
            <span>Start Shortlisting</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onSeeHowItWorks}
            className="w-full sm:w-auto px-6 py-3.5 rounded-full text-sm font-medium bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.07] dark:hover:bg-white/[0.12] text-[#1d1d1f] dark:text-[#f5f5f7] transition-all duration-200 cursor-pointer"
          >
            See how it works
          </button>
        </motion.div>

        {/* Live Dynamic Dual-Engine Preview Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
          className="mt-14 max-w-2xl mx-auto rounded-3xl bg-white/85 dark:bg-[#181a20]/90 backdrop-blur-xl border border-black/[0.07] dark:border-white/[0.08] p-6 sm:p-7 text-left shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)] relative overflow-hidden group hover:border-black/[0.12] dark:hover:border-white/[0.16] transition-all"
        >
          {topCandidate ? (
            <>
              <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-[#0071e3] dark:text-sky-300 border border-sky-100 dark:border-sky-800/60 flex items-center justify-center font-bold text-sm">
                    #{topCandidate.rank}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                        {topCandidate.candidate.name}
                      </h3>
                      {topCandidate.finalScore >= 75 ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                          Strong Fit
                        </span>
                      ) : topCandidate.finalScore >= 50 ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                          Moderate Fit
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300">
                          Developing Fit
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 dark:text-[#86868b] font-medium hidden sm:inline">
                        • Ranked #1 for {jobDescription?.title || 'Active Role'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-[#a1a1a6] mt-0.5">
                      {topCandidate.candidate.education.degree} • {topCandidate.candidate.education.institution}
                    </p>
                  </div>
                </div>

                {/* Score animation */}
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-medium text-slate-500 dark:text-[#86868b] uppercase tracking-wider block">
                    Overall Match
                  </span>
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                    <ScoreCounter value={topCandidate.finalScore} decimals={1} suffix="%" />
                  </div>
                </div>
              </div>

              {/* Tri-metric breakdown */}
              <div className="grid grid-cols-3 gap-3 my-4 py-3 bg-black/[0.02] dark:bg-white/[0.04] rounded-2xl px-4 border border-black/[0.03] dark:border-white/[0.06]">
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-[#a1a1a6] block font-medium">Semantic Match</span>
                  <span className="text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">{Math.round(topCandidate.semanticScore)}%</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-[#a1a1a6] block font-medium">Keyword Match</span>
                  <span className="text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">{Math.round(topCandidate.keywordScore)}%</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-[#a1a1a6] block font-medium">Matched Skills</span>
                  <span className="text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">{topCandidate.matchedExplicitSkills.length} skills</span>
                </div>
              </div>

              {/* Matched tags */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[11px] text-slate-500 dark:text-[#a1a1a6] mr-1 font-medium">Verified Evidence:</span>
                {topCandidate.matchedExplicitSkills.slice(0, 4).map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium border border-emerald-100 dark:border-emerald-800/60"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> {skill}
                  </span>
                ))}
                {topCandidate.missingRequiredSkills.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px] font-medium border border-amber-200 dark:border-amber-800/60">
                    Missing: {topCandidate.missingRequiredSkills[0]}
                  </span>
                )}
              </div>

              {/* Footer note */}
              <div className="mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-[11px] text-slate-500 dark:text-[#a1a1a6]">
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Transparent mathematical scoring • Zero blind LLM guesswork
                </span>
                <span className="font-semibold text-[#0071e3] dark:text-sky-400 group-hover:underline cursor-pointer" onClick={onStartShortlisting}>
                  Evaluate {candidateCount} Resumes →
                </span>
              </div>
            </>
          ) : (
            <div className="py-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.06] text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                No Candidate Resumes in Pool
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#a1a1a6] mt-1 max-w-sm mx-auto">
                All resumes have been removed. Click below to add candidate resumes or select an active job role.
              </p>
              <button
                onClick={onStartShortlisting}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-[#0071e3] text-white hover:bg-[#0077ed] transition cursor-pointer shadow-2xs"
              >
                <span>Upload & Shortlist Resumes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </motion.div>

      </div>
    </section>
  );
};
