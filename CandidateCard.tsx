import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, AlertTriangle, ArrowUpRight, GitCompare, Sparkles, GraduationCap } from 'lucide-react';
import { CandidateMatchResult } from '../types';
import { ScoreCounter } from './ScoreCounter';

interface CandidateCardProps {
  candidate: CandidateMatchResult;
  onSelect: (candidate: CandidateMatchResult) => void;
  onCompare: (candidate: CandidateMatchResult) => void;
  index: number;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  onSelect,
  onCompare,
  index,
}) => {
  const isTopCandidate = candidate.rank === 1;
  const isTopThree = candidate.rank <= 3;
  const c = candidate.candidate;

  // Calculate required skills match percentage
  const totalRequired = candidate.matchedExplicitSkills.length + candidate.missingRequiredSkills.length;
  const requiredMatchPercent = totalRequired > 0
    ? Math.round((candidate.matchedExplicitSkills.length / totalRequired) * 100)
    : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{
        layout: {
          type: 'spring',
          stiffness: 260,
          damping: 24,
          mass: 0.85,
        },
        opacity: { duration: 0.22, ease: 'easeOut' },
        scale: { duration: 0.22, ease: 'easeOut' },
      }}
      className={`rounded-3xl p-5 sm:p-6 border transition-all duration-300 flex flex-col justify-between text-left group relative overflow-hidden w-full min-w-0 ${
        isTopCandidate
          ? 'bg-white dark:bg-[#181a20] border-[#0071e3]/30 dark:border-[#0071e3]/50 shadow-[0_12px_36px_rgba(0,113,227,0.08)] dark:shadow-[0_12px_36px_rgba(0,113,227,0.15)] ring-1 ring-[#0071e3]/20 dark:ring-[#0071e3]/30'
          : 'bg-white dark:bg-[#181a20] border-black/[0.07] dark:border-white/[0.08] shadow-xs hover:shadow-md hover:border-black/[0.12] dark:hover:border-white/[0.16]'
      }`}
    >
      {/* Top Banner & Header */}
      <div className="min-w-0 w-full">
        <div className="flex items-start justify-between gap-2.5 mb-3.5">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-sm tracking-tight shrink-0 ${
                isTopCandidate
                  ? 'bg-[#0071e3] text-white shadow-xs'
                  : isTopThree
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'bg-black/[0.04] dark:bg-white/[0.08] text-slate-700 dark:text-slate-200'
              }`}
            >
              #{candidate.rank}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight group-hover:text-[#0071e3] dark:group-hover:text-sky-400 transition-colors truncate">
                  {c.name}
                </h3>
                {candidate.detailedAnalysis?.recommendedVerdict && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    candidate.detailedAnalysis.recommendedVerdict === 'Strong Hire'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : candidate.detailedAnalysis.recommendedVerdict === 'High Potential'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}>
                    {candidate.detailedAnalysis.recommendedVerdict}
                  </span>
                )}
                {isTopCandidate && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#0071e3] dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800/60 shrink-0">
                    <Sparkles className="w-2.5 h-2.5" /> Top Ranked
                  </span>
                )}
              </div>
              <p
                className="text-xs text-slate-500 dark:text-[#a1a1a6] truncate mt-0.5"
                title={`${c.education.degree} • ${c.education.institution}`}
              >
                {c.education.degree} • {c.education.institution}
              </p>
            </div>
          </div>

          {/* Overall Match Score (Animated) */}
          <div className="text-right shrink-0 pl-2">
            <span className="text-[10px] font-semibold text-slate-400 dark:text-[#86868b] uppercase tracking-wider block">
              Overall Match
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">
              <ScoreCounter value={candidate.finalScore} decimals={1} suffix="%" />
            </div>
          </div>
        </div>

        {/* Tri-Metric Match Breakdown */}
        <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-black/[0.02] dark:bg-white/[0.04] rounded-2xl border border-black/[0.03] dark:border-white/[0.06] my-3.5 overflow-hidden">
          <div className="min-w-0">
            <div className="flex justify-between items-center text-[10px] sm:text-[11px] gap-1 mb-1">
              <span className="text-slate-500 dark:text-[#a1a1a6] font-medium truncate" title="Semantic">Semantic</span>
              <span className="font-bold text-slate-800 dark:text-[#f5f5f7] shrink-0">{candidate.semanticScore}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700/60 h-1 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 dark:bg-indigo-400 h-1 rounded-full"
                style={{ width: `${candidate.semanticScore}%` }}
              />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex justify-between items-center text-[10px] sm:text-[11px] gap-1 mb-1">
              <span className="text-slate-500 dark:text-[#a1a1a6] font-medium truncate" title="Keyword">Keyword</span>
              <span className="font-bold text-slate-800 dark:text-[#f5f5f7] shrink-0">{candidate.keywordScore}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700/60 h-1 rounded-full overflow-hidden">
              <div
                className="bg-[#0071e3] dark:bg-sky-400 h-1 rounded-full"
                style={{ width: `${candidate.keywordScore}%` }}
              />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex justify-between items-center text-[10px] sm:text-[11px] gap-1 mb-1">
              <span className="text-slate-500 dark:text-[#a1a1a6] font-medium truncate" title="Required">Required</span>
              <span className="font-bold text-slate-800 dark:text-[#f5f5f7] shrink-0">{requiredMatchPercent}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700/60 h-1 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 dark:bg-emerald-400 h-1 rounded-full"
                style={{ width: `${requiredMatchPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Matched Skills */}
        <div className="space-y-2 mt-3.5 min-w-0">
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-[#86868b] block mb-1.5">
              Matched Skills ({candidate.matchedExplicitSkills.length})
            </span>
            <div className="flex flex-wrap gap-1.5 min-w-0">
              {candidate.matchedExplicitSkills.slice(0, 5).map((skill) => (
                <span
                  key={skill}
                  title={skill}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium border border-emerald-100 dark:border-emerald-800/60 max-w-full"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate max-w-[180px] sm:max-w-[210px]">{skill}</span>
                </span>
              ))}
              {candidate.matchedExplicitSkills.length > 5 && (
                <span className="text-[10px] text-slate-400 dark:text-[#86868b] font-medium self-center shrink-0">
                  +{candidate.matchedExplicitSkills.length - 5} more
                </span>
              )}
            </div>
          </div>

          {/* Missing / Gaps */}
          {candidate.missingRequiredSkills.length > 0 && (
            <div className="pt-1 min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-[#86868b] block mb-1.5">
                Missing / Unclear ({candidate.missingRequiredSkills.length})
              </span>
              <div className="flex flex-wrap gap-1.5 min-w-0">
                {candidate.missingRequiredSkills.slice(0, 3).map((skill) => (
                  <span
                    key={skill}
                    title={skill}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-[11px] font-medium border border-slate-200/60 dark:border-slate-700/60 max-w-full"
                  >
                    <AlertTriangle className="w-3 h-3 text-amber-500 dark:text-amber-400 shrink-0" />
                    <span className="truncate max-w-[180px] sm:max-w-[210px]">{skill}</span>
                  </span>
                ))}
                {candidate.missingRequiredSkills.length > 3 && (
                  <span className="text-[10px] text-slate-400 dark:text-[#86868b] font-medium self-center shrink-0">
                    +{candidate.missingRequiredSkills.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pros & Cons Quick Peek */}
        {candidate.detailedAnalysis && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/[0.06] space-y-1.5 min-w-0">
            {candidate.detailedAnalysis.pros?.[0] && (
              <div className="flex items-start gap-1.5 text-[11px] text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span className="line-clamp-1 font-medium">{candidate.detailedAnalysis.pros[0]}</span>
              </div>
            )}
            {candidate.detailedAnalysis.cons?.[0] && (
              <div className="flex items-start gap-1.5 text-[11px] text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span className="line-clamp-1 font-medium">{candidate.detailedAnalysis.cons[0]}</span>
              </div>
            )}
          </div>
        )}

        {/* Why this candidate explanation snippet */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/[0.06] min-w-0">
          <p className="text-xs text-slate-600 dark:text-[#a1a1a6] leading-relaxed line-clamp-2 break-words">
            "{candidate.detailedAnalysis?.whyRecruiterShouldTakeThem || candidate.explanation}"
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 pt-3.5 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-2 flex-wrap">
        <button
          onClick={() => onCompare(candidate)}
          className="px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 dark:text-[#a1a1a6] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <GitCompare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Compare</span>
        </button>

        <button
          onClick={() => onSelect(candidate)}
          className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#1d1d1f] dark:bg-white dark:text-[#121316] hover:bg-black dark:hover:bg-slate-100 text-white transition flex items-center gap-1 group-hover:bg-[#0071e3] dark:group-hover:bg-[#0071e3] dark:group-hover:text-white shrink-0 cursor-pointer"
        >
          <span>Detailed Analysis</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </motion.div>
  );
};
