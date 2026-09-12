import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal, Sliders, Sparkles, GitCompare, Download, RotateCcw, LayoutGrid, List, CheckCircle2, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { CandidateMatchResult, ScoringWeights, JobDescription } from '../types';
import { CandidateCard } from './CandidateCard';

interface ShortlistSectionProps {
  candidates: CandidateMatchResult[];
  jobDescription: JobDescription;
  weights: ScoringWeights;
  onWeightsChange: (weights: ScoringWeights) => void;
  onSelectCandidate: (candidate: CandidateMatchResult) => void;
  onCompareCandidate: (candidate: CandidateMatchResult) => void;
  onOpenFormula: () => void;
  onOpenChat: () => void;
  onRestart: () => void;
  onGoToResumes?: () => void;
  onRestoreDefaultCandidates?: () => void;
}

export const ShortlistSection: React.FC<ShortlistSectionProps> = ({
  candidates,
  jobDescription,
  weights,
  onWeightsChange,
  onSelectCandidate,
  onCompareCandidate,
  onOpenFormula,
  onOpenChat,
  onRestart,
  onGoToResumes,
  onRestoreDefaultCandidates,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<'all' | 'strong' | 'moderate' | 'developing'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filter candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      // Tier filter
      if (selectedTier === 'strong' && c.finalScore < 75) return false;
      if (selectedTier === 'moderate' && (c.finalScore < 50 || c.finalScore >= 75)) return false;
      if (selectedTier === 'developing' && c.finalScore >= 50) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.candidate.name.toLowerCase().includes(q);
        const matchesCollege = c.candidate.education.institution.toLowerCase().includes(q);
        const matchesSkills = c.matchedExplicitSkills.some(s => s.toLowerCase().includes(q));
        if (!matchesName && !matchesCollege && !matchesSkills) return false;
      }

      return true;
    });
  }, [candidates, selectedTier, searchQuery]);

  // Handle slider changes
  const handleWeightSlider = (val: number) => {
    const kwWeight = Number((val / 100).toFixed(2));
    const semWeight = Number((1 - kwWeight).toFixed(2));
    onWeightsChange({
      ...weights,
      keywordWeight: kwWeight,
      semanticWeight: semWeight,
    });
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Rank', 'Name', 'Email', 'Final Score', 'Keyword Score', 'Semantic Score', 'Matched Skills', 'Missing Skills'];
    const rows = candidates.map(c => [
      c.rank,
      `"${c.candidate.name}"`,
      `"${c.candidate.email}"`,
      c.finalScore,
      c.keywordScore,
      c.semanticScore,
      `"${c.matchedExplicitSkills.join(', ')}"`,
      `"${c.missingRequiredSkills.join(', ')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `InternLoom_Shortlist_${jobDescription.title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="py-10 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#0071e3] dark:text-sky-400 mb-1.5 block">
            Ranked Shortlist
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
            Your shortlist.
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-[#a1a1a6]">
            <span className="font-semibold text-slate-900 dark:text-[#f5f5f7]">{candidates.length} candidates</span> analyzed for{' '}
            <span className="font-medium text-slate-900 dark:text-[#f5f5f7]">{jobDescription.title}</span>. Ranked by overall fit.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={onOpenChat}
            className="px-3.5 py-2 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/50 text-[#0071e3] dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800/60 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask AI Recruiter</span>
          </button>
          
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-full text-xs font-medium text-slate-700 dark:text-[#ededf0] bg-white dark:bg-[#181a20] hover:bg-slate-50 dark:hover:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* MATCHING ENGINE BANNER (Hackathon Requirement) */}
      <div className="bg-white dark:bg-[#181a20] rounded-3xl p-5 sm:p-6 border border-black/[0.07] dark:border-white/[0.08] shadow-xs mb-8 overflow-hidden min-w-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 min-w-0">
          
          {/* Dual-Engine Description */}
          <div className="space-y-1 max-w-lg min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.08] text-slate-700 dark:text-slate-300">
                Matching Engine
              </span>
              <button
                onClick={onOpenFormula}
                className="text-xs font-semibold text-[#0071e3] dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Inspect Formula</span>
              </button>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">
              Dual-Engine Hybrid Intelligence
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#a1a1a6] leading-relaxed">
              Transparent deterministic scoring combining explicit lexical token relevance (BM25) with conceptual domain ontology embedding proximity.
            </p>
          </div>

          {/* Interactive Weight Balance Slider */}
          <div className="w-full lg:w-96 bg-black/[0.02] dark:bg-white/[0.04] p-4 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] space-y-3 min-w-0 shrink-0">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0071e3] dark:bg-sky-400" />
                <span className="font-semibold text-slate-800 dark:text-[#f5f5f7]">
                  Keyword ({Math.round(weights.keywordWeight * 100)}%)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                <span className="font-semibold text-slate-800 dark:text-[#f5f5f7]">
                  Semantic ({Math.round(weights.semanticWeight * 100)}%)
                </span>
              </div>
            </div>

            <input
              type="range"
              min="10"
              max="90"
              step="5"
              value={Math.round(weights.keywordWeight * 100)}
              onChange={(e) => handleWeightSlider(Number(e.target.value))}
              className="w-full accent-[#0071e3] dark:accent-sky-400 cursor-pointer"
            />

            <div className="flex justify-between items-center text-[11px] text-slate-400 dark:text-[#86868b]">
              <span>More exact keyword match</span>
              <span>More conceptual match</span>
            </div>
          </div>

        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 min-w-0">
        
        {/* Search Input */}
        <div className="relative w-full sm:w-80 min-w-0">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate, college, or skill..."
            className="w-full pl-9 pr-4 py-2 rounded-full text-xs bg-white dark:bg-[#181a20] text-slate-900 dark:text-[#f5f5f7] border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:border-[#0071e3] dark:focus:border-sky-400 shadow-2xs placeholder:text-slate-400 dark:placeholder:text-[#6e6e73]"
          />
        </div>

        {/* Tier Filter Pills & View Switcher */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap min-w-0">
          <div className="flex items-center bg-black/[0.03] dark:bg-white/[0.05] p-1 rounded-full border border-black/[0.04] dark:border-white/[0.08] text-xs max-w-full overflow-x-auto scrollbar-none">
            <button
              onClick={() => setSelectedTier('all')}
              className={`px-3 py-1 rounded-full transition whitespace-nowrap cursor-pointer ${
                selectedTier === 'all'
                  ? 'bg-white dark:bg-[#22252e] text-slate-900 dark:text-[#f5f5f7] font-semibold shadow-2xs'
                  : 'text-slate-600 dark:text-[#a1a1a6] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({candidates.length})
            </button>
            <button
              onClick={() => setSelectedTier('strong')}
              className={`px-3 py-1 rounded-full transition whitespace-nowrap cursor-pointer ${
                selectedTier === 'strong'
                  ? 'bg-white dark:bg-[#22252e] text-slate-900 dark:text-[#f5f5f7] font-semibold shadow-2xs'
                  : 'text-slate-600 dark:text-[#a1a1a6] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Strong (≥75%)
            </button>
            <button
              onClick={() => setSelectedTier('moderate')}
              className={`px-3 py-1 rounded-full transition whitespace-nowrap cursor-pointer ${
                selectedTier === 'moderate'
                  ? 'bg-white dark:bg-[#22252e] text-slate-900 dark:text-[#f5f5f7] font-semibold shadow-2xs'
                  : 'text-slate-600 dark:text-[#a1a1a6] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Moderate (50-74%)
            </button>
            <button
              onClick={() => setSelectedTier('developing')}
              className={`px-3 py-1 rounded-full transition whitespace-nowrap cursor-pointer ${
                selectedTier === 'developing'
                  ? 'bg-white dark:bg-[#22252e] text-slate-900 dark:text-[#f5f5f7] font-semibold shadow-2xs'
                  : 'text-slate-600 dark:text-[#a1a1a6] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Developing
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="hidden sm:flex items-center bg-black/[0.03] dark:bg-white/[0.05] p-1 rounded-full border border-black/[0.04] dark:border-white/[0.08] shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-full transition cursor-pointer ${viewMode === 'grid' ? 'bg-white dark:bg-[#22252e] text-slate-900 dark:text-[#f5f5f7] shadow-2xs' : 'text-slate-500 dark:text-[#86868b]'}`}
              title="Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-full transition cursor-pointer ${viewMode === 'table' ? 'bg-white dark:bg-[#22252e] text-slate-900 dark:text-[#f5f5f7] shadow-2xs' : 'text-slate-500 dark:text-[#86868b]'}`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Candidate Cards Grid with Framer Motion spring-based layout animation */}
      {viewMode === 'grid' ? (
        <motion.div
          layout
          transition={{
            layout: {
              type: 'spring',
              stiffness: 260,
              damping: 24,
              mass: 0.85,
            },
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 min-w-0"
        >
          <AnimatePresence mode="popLayout">
            {filteredCandidates.map((c, idx) => (
              <CandidateCard
                key={c.candidateId}
                candidate={c}
                onSelect={onSelectCandidate}
                onCompare={onCompareCandidate}
                index={idx}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        /* Alternative Compact List Table */
        <div className="bg-white dark:bg-[#181a20] rounded-3xl border border-black/[0.07] dark:border-white/[0.08] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-[#a1a1a6]">
              <thead className="bg-slate-50/80 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/[0.06] text-[11px] font-semibold text-slate-500 dark:text-[#86868b] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Rank</th>
                  <th className="py-3.5 px-4">Candidate</th>
                  <th className="py-3.5 px-4">Overall Fit</th>
                  <th className="py-3.5 px-4">Semantic</th>
                  <th className="py-3.5 px-4">Keyword</th>
                  <th className="py-3.5 px-4">Matched Core Skills</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                {filteredCandidates.map((c) => (
                  <tr
                    key={c.candidateId}
                    className="hover:bg-slate-50/60 dark:hover:bg-white/[0.04] transition cursor-pointer"
                    onClick={() => onSelectCandidate(c)}
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-[#f5f5f7]">#{c.rank}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-[#f5f5f7]">{c.candidate.name}</div>
                      <div className="text-[11px] text-slate-400 dark:text-[#86868b]">{c.candidate.education.institution}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-extrabold text-sm text-[#1d1d1f] dark:text-[#f5f5f7]">{c.finalScore}%</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-[#ededf0]">{c.semanticScore}%</td>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-[#ededf0]">{c.keywordScore}%</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {c.matchedExplicitSkills.slice(0, 3).map(s => (
                          <span key={s} className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/60 font-medium text-[10px]">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCandidate(c);
                        }}
                        className="px-3 py-1 rounded-full text-xs font-semibold bg-[#1d1d1f] dark:bg-white text-white dark:text-[#121316] hover:bg-black dark:hover:bg-slate-100 transition cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {candidates.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#181a20] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] my-8 shadow-2xs">
          <p className="text-base font-bold text-slate-800 dark:text-[#f5f5f7]">Your candidate pool is empty</p>
          <p className="text-xs text-slate-500 dark:text-[#a1a1a6] mt-1 max-w-sm mx-auto">
            All resumes have been removed. Upload candidate resumes or restore default sample candidates to generate ranked insights.
          </p>
          <div className="mt-5 flex items-center justify-center gap-2.5 flex-wrap">
            {onGoToResumes && (
              <button
                onClick={onGoToResumes}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-[#0071e3] hover:bg-[#0077ed] text-white transition shadow-2xs cursor-pointer"
              >
                Upload Resumes
              </button>
            )}
            {onRestoreDefaultCandidates && (
              <button
                onClick={onRestoreDefaultCandidates}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-black/[0.05] dark:bg-white/[0.08] text-slate-700 dark:text-slate-200 hover:bg-black/[0.08] dark:hover:bg-white/[0.12] transition cursor-pointer"
              >
                Restore Sample Candidates
              </button>
            )}
          </div>
        </div>
      ) : filteredCandidates.length === 0 && (
        <div className="p-12 text-center bg-white dark:bg-[#181a20] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] my-8">
          <p className="text-sm font-semibold text-slate-800 dark:text-[#f5f5f7]">No candidates match the active filter.</p>
          <p className="text-xs text-slate-500 dark:text-[#a1a1a6] mt-1">Try clearing your search query or selecting "All".</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedTier('all');
            }}
            className="mt-4 px-4 py-2 rounded-full text-xs font-semibold bg-black/[0.05] dark:bg-white/[0.08] text-slate-700 dark:text-slate-200 hover:bg-black/[0.08] dark:hover:bg-white/[0.12] transition cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-black/[0.05] dark:border-white/[0.06] text-center text-xs text-slate-400 dark:text-[#86868b]">
        <p>InternLoom AI • Intelligent Shortlisting Engine</p>
      </footer>

    </section>
  );
};
