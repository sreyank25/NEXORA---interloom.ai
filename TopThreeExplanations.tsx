import React from 'react';
import { motion } from 'motion/react';
import { Trophy, CheckCircle2, AlertCircle, ArrowUpRight, GitCompare, Sparkles } from 'lucide-react';
import { CandidateMatchResult } from '../types';

interface TopThreeExplanationsProps {
  topThree: CandidateMatchResult[];
  onSelectCandidate: (candidate: CandidateMatchResult) => void;
  onCompareWithNext: (candA: CandidateMatchResult, candB: CandidateMatchResult) => void;
}

export const TopThreeExplanations: React.FC<TopThreeExplanationsProps> = ({
  topThree,
  onSelectCandidate,
  onCompareWithNext,
}) => {
  if (!topThree || topThree.length === 0) return null;

  const podiumConfig = [
    {
      badge: 'bg-amber-500 text-white',
      border: 'border-amber-200/90 hover:border-amber-300',
      label: 'Rank #1',
      medal: '🥇',
    },
    {
      badge: 'bg-slate-700 text-white',
      border: 'border-slate-200 hover:border-slate-300',
      label: 'Rank #2',
      medal: '🥈',
    },
    {
      badge: 'bg-amber-800 text-white',
      border: 'border-amber-200/70 hover:border-amber-300',
      label: 'Rank #3',
      medal: '🥉',
    },
  ];

  return (
    <section id="top-3-explanations-section" className="mb-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#0a664e] border border-emerald-200 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-[#0a664e]" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Top Shortlisted Candidates
          </h2>
        </div>

        {topThree.length >= 2 && (
          <button
            onClick={() => onCompareWithNext(topThree[0], topThree[1])}
            className="text-xs font-medium flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors shadow-2xs"
          >
            <GitCompare className="w-3.5 h-3.5 text-indigo-600" />
            <span>Compare #1 vs #2</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topThree.map((item, index) => {
          const config = podiumConfig[index] || podiumConfig[2];

          return (
            <motion.div
              key={item.candidateId}
              id={`top-card-rank-${item.rank}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.05 }}
              whileHover={{ y: -2 }}
              className={`rounded-xl border ${config.border} bg-white flex flex-col justify-between shadow-xs transition-shadow hover:shadow-md p-4`}
            >
              <div>
                {/* Header row */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded-md font-bold flex items-center gap-1 ${config.badge}`}>
                    <span>{config.medal}</span>
                    <span>{config.label}</span>
                  </span>

                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-extrabold text-slate-900">{item.finalScore}%</span>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">Fit</span>
                  </div>
                </div>

                {/* Candidate Name & Info */}
                <div className="mb-3">
                  <button
                    onClick={() => onSelectCandidate(item)}
                    className="text-sm font-bold text-slate-900 hover:text-[#0a664e] transition-colors flex items-center gap-1 group text-left"
                  >
                    <span>{item.candidate.name}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0a664e] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </button>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {item.candidate.education.degree} • <span className="text-slate-700 font-medium">{item.candidate.education.institution}</span>
                  </p>
                </div>

                {/* Micro Scores */}
                <div className="space-y-1.5 mb-3 bg-slate-50/80 rounded-lg p-2.5 border border-slate-100">
                  <div>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="text-slate-500">Semantic</span>
                      <span className="font-semibold text-emerald-700">{item.semanticScore}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${item.semanticScore}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="text-slate-500">Keyword</span>
                      <span className="font-semibold text-indigo-700">{item.keywordScore}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${item.keywordScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Short Reason */}
                <div className="mb-3 text-xs text-slate-600 bg-slate-50/50 rounded-lg p-2 border border-slate-100/80 leading-relaxed">
                  <div className="flex items-center gap-1 text-slate-800 font-medium mb-1 text-[11px]">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Summary</span>
                  </div>
                  <p className="line-clamp-2">{item.explanation}</p>
                </div>

                {/* Skills tags */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {item.matchedExplicitSkills.slice(0, 4).map(skill => (
                    <span
                      key={skill}
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-100"
                    >
                      ✓ {skill}
                    </span>
                  ))}
                  {item.missingRequiredSkills.slice(0, 2).map(skill => (
                    <span
                      key={skill}
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-100"
                    >
                      − {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom inspect button */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => onSelectCandidate(item)}
                  className="text-xs text-[#0a664e] hover:text-emerald-700 font-semibold transition-colors flex items-center gap-1"
                >
                  <span>Profile details</span>
                  <span>→</span>
                </button>
                <span className="text-[10px] text-slate-400 capitalize">
                  {item.candidate.formatCharacteristics?.formatType.replace('-', ' ')}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
