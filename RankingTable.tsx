import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Sparkles, GitCompare, FileText, Check, AlertTriangle } from 'lucide-react';
import { CandidateMatchResult } from '../types';

interface RankingTableProps {
  candidates: CandidateMatchResult[];
  onSelectCandidate: (candidate: CandidateMatchResult) => void;
  onCompareCandidate: (candidate: CandidateMatchResult) => void;
}

export const RankingTable: React.FC<RankingTableProps> = ({
  candidates,
  onSelectCandidate,
  onCompareCandidate,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'text-emerald-800 bg-emerald-50 border-emerald-200';
    if (score >= 65) return 'text-teal-800 bg-teal-50 border-teal-200';
    if (score >= 50) return 'text-amber-800 bg-amber-50 border-amber-200';
    return 'text-rose-800 bg-rose-50 border-rose-200';
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shadow-2xs">1</span>;
    if (rank === 2) return <span className="w-6 h-6 rounded-full bg-slate-700 text-white text-xs font-bold flex items-center justify-center shadow-2xs">2</span>;
    if (rank === 3) return <span className="w-6 h-6 rounded-full bg-amber-800 text-white text-xs font-bold flex items-center justify-center shadow-2xs">3</span>;
    return <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold flex items-center justify-center border border-slate-200">{rank}</span>;
  };

  return (
    <div id="candidates-ranking-section" className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
      
      {/* Section Header */}
      <div className="px-4 py-3.5 border-b border-slate-200/80 flex items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            All Candidates
          </h2>
          <span className="text-xs font-semibold px-2 py-0.2 rounded-full bg-slate-200/70 text-slate-700">
            {candidates.length}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Strong (&ge;75%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Medium
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Weak
          </span>
        </div>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-slate-100">
        {candidates.map((result) => {
          const isExpanded = expandedId === result.candidateId;
          const isTopThree = result.rank <= 3;

          return (
            <div
              key={result.candidateId}
              id={`candidate-row-${result.candidateId}`}
              className={`transition-colors duration-150 ${
                isTopThree ? 'bg-emerald-50/15 hover:bg-emerald-50/30' : 'hover:bg-slate-50/70'
              }`}
            >
              {/* Primary Row Summary */}
              <div className="p-3.5 sm:px-4 sm:py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                
                {/* Rank & Candidate Identity */}
                <div className="flex items-center gap-3 min-w-[240px]">
                  {getRankBadge(result.rank)}
                  <div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectCandidate(result)}
                        className="text-sm font-bold text-slate-900 hover:text-[#0a664e] transition-colors text-left"
                      >
                        {result.candidate.name}
                      </button>
                      {isTopThree && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
                          Top {result.rank}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 truncate max-w-xs mt-0.5">
                      {result.candidate.education.degree} • <span className="text-slate-700 font-medium">{result.candidate.education.institution}</span>
                    </div>
                  </div>
                </div>

                {/* Score Pills & Dual Engine Breakdown */}
                <div className="flex items-center gap-4 flex-wrap">
                  
                  {/* Final Score Pill */}
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 shadow-2xs ${getScoreBadge(
                      result.finalScore
                    )}`}
                  >
                    <span>{result.finalScore}%</span>
                    <span className="text-[9px] uppercase tracking-wide opacity-80">fit</span>
                  </span>

                  {/* Micro Breakdown Bars */}
                  <div className="flex flex-col gap-1 w-28 sm:w-32">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400">Keyword</span>
                      <span className="text-indigo-700 font-medium">{result.keywordScore}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${result.keywordScore}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400">Semantic</span>
                      <span className="text-emerald-700 font-medium">{result.semanticScore}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${result.semanticScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Skills Snapshot */}
                  <div className="hidden lg:flex flex-col max-w-[200px]">
                    <div className="text-[10px] text-slate-500 mb-0.5 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>{result.matchedExplicitSkills.length} matched / {result.missingRequiredSkills.length} missing</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {result.matchedExplicitSkills.slice(0, 2).map((s) => (
                        <span key={s} className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-100">
                          {s}
                        </span>
                      ))}
                      {result.matchedExplicitSkills.length > 2 && (
                        <span className="text-[9px] font-medium px-1 py-0.2 rounded bg-slate-100 text-slate-600">
                          +{result.matchedExplicitSkills.length - 2}
                        </span>
                      )}
                    </div>
                  </div>

                </div>

                {/* Row Actions */}
                <div className="flex items-center gap-1.5 self-end md:self-center">
                  <button
                    onClick={() => onCompareCandidate(result)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-lg transition-colors"
                    title="Compare candidate"
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onSelectCandidate(result)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title="View resume profile"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => toggleExpand(result.candidateId)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#0a664e] hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200/80"
                  >
                    <span>{isExpanded ? 'Less' : 'Details'}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

              </div>

              {/* Smooth Expandable Deep-Dive Drawer with AnimatePresence */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 py-4 bg-slate-50/80 border-t border-slate-200/80 space-y-3 text-xs">
                      
                      {/* Short explanation summary */}
                      <div className="bg-white rounded-lg p-3 border border-slate-200/80 shadow-2xs">
                        <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5 text-[11px]">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>Evaluation Summary:</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed text-xs">
                          {result.explanation}
                        </p>
                      </div>

                      {/* Side-by-side: Matched vs Missing */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        
                        {/* Matched */}
                        <div className="bg-white rounded-lg p-3 border border-slate-200/80 shadow-2xs">
                          <div className="font-semibold text-emerald-800 mb-1.5 flex items-center gap-1.5 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Matched Skills ({result.matchedExplicitSkills.length})</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {result.matchedExplicitSkills.map((s) => (
                              <span
                                key={s}
                                className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-100"
                              >
                                ✓ {s}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Missing */}
                        <div className="bg-white rounded-lg p-3 border border-slate-200/80 shadow-2xs">
                          <div className="font-semibold text-amber-800 mb-1.5 flex items-center gap-1.5 text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Missing Skills ({result.missingRequiredSkills.length})</span>
                          </div>
                          {result.missingRequiredSkills.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {result.missingRequiredSkills.map((s) => (
                                <span
                                  key={s}
                                  className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-100"
                                >
                                  ✗ {s}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-emerald-700 text-xs italic">All required skills present.</p>
                          )}
                        </div>

                      </div>

                      {/* Formatting Resilience Note if any */}
                      {result.formattingLogs && result.formattingLogs.length > 0 && (
                        <div className="bg-blue-50/70 border border-blue-200/70 rounded-lg p-2.5 flex items-center gap-2 text-xs text-blue-900">
                          <AlertTriangle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>
                            <strong>Parser resilience:</strong> {result.formattingLogs.map(l => l.detail).join('; ')}
                          </span>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => onCompareCandidate(result)}
                          className="px-3 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-medium transition-colors text-xs border border-slate-200 flex items-center gap-1.5"
                        >
                          <GitCompare className="w-3 h-3 text-indigo-600" />
                          <span>Compare</span>
                        </button>
                        <button
                          onClick={() => onSelectCandidate(result)}
                          className="px-3 py-1 rounded-lg bg-[#0a664e] hover:bg-emerald-700 text-white font-medium transition-colors text-xs flex items-center gap-1.5 shadow-2xs"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Full Profile</span>
                        </button>
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          );
        })}
      </div>

    </div>
  );
};
