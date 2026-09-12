import React from 'react';
import { motion } from 'motion/react';
import { FileUp, Cpu, Award, Check, Sparkles, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { CandidateMatchResult } from '../types';

interface HowItWorksSectionProps {
  onStart: () => void;
  candidateCount?: number;
  topCandidates?: CandidateMatchResult[];
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({
  onStart,
  candidateCount = 0,
  topCandidates = [],
}) => {
  const steps = [
    {
      num: '01',
      tag: 'UPLOAD',
      title: 'Add your Job Description and candidate resumes.',
      description: 'Upload your campus job description and multiple student resumes. Our parser handles PDFs, Word documents, or raw text with zero formatting penalties.',
      icon: FileUp,
      accent: 'from-sky-50 to-blue-50 text-[#0071e3] border-sky-100',
      visual: (
        <div className="mt-4 p-3.5 bg-black/[0.02] dark:bg-white/[0.04] rounded-2xl border border-black/[0.04] dark:border-white/[0.06] text-left text-xs space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            <span>Job Description</span>
            <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800/60">✓ Parsed</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 dark:text-[#a1a1a6] text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"></span>
            <span>Key Requirements Extracted</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 dark:text-[#a1a1a6] text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"></span>
            <span>{candidateCount} Candidate Resumes in Pool</span>
          </div>
        </div>
      ),
    },
    {
      num: '02',
      tag: 'ANALYZE',
      title: 'InternLoom AI combines keyword and semantic understanding.',
      description: 'Unlike black-box LLMs, our dual-engine architecture computes deterministic BM25 lexical precision alongside domain-aware semantic embedding proximity.',
      icon: Cpu,
      accent: 'from-indigo-50 to-purple-50 text-indigo-600 border-indigo-100 dark:from-indigo-950/50 dark:to-purple-950/50 dark:text-indigo-400 dark:border-indigo-800/60',
      visual: (
        <div className="mt-4 p-3.5 bg-black/[0.02] dark:bg-white/[0.04] rounded-2xl border border-black/[0.04] dark:border-white/[0.06] text-left text-xs space-y-2.5">
          <div className="flex justify-between text-[11px]">
            <span className="font-medium text-slate-600 dark:text-[#a1a1a6]">BM25 Keyword Engine</span>
            <span className="font-semibold text-slate-900 dark:text-[#f5f5f7]">50% Weight</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-white/[0.1] h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#0071e3] dark:bg-sky-400 h-1.5 rounded-full w-[50%]" />
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="font-medium text-slate-600 dark:text-[#a1a1a6]">Semantic Domain Ontology</span>
            <span className="font-semibold text-slate-900 dark:text-[#f5f5f7]">50% Weight</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-white/[0.1] h-1.5 rounded-full overflow-hidden">
            <div className="bg-indigo-600 dark:bg-indigo-400 h-1.5 rounded-full w-[50%]" />
          </div>
        </div>
      ),
    },
    {
      num: '03',
      tag: 'RANK',
      title: 'Candidates are ranked with transparent, explainable scores.',
      description: 'Review an objectively ordered shortlist with deep evidence citations, gap analyses, and instant head-to-head comparative explanations.',
      icon: Award,
      accent: 'from-emerald-50 to-teal-50 text-[#0a664e] border-emerald-100 dark:from-emerald-950/50 dark:to-teal-950/50 dark:text-emerald-400 dark:border-emerald-800/60',
      visual: (
        <div className="mt-4 p-3.5 bg-black/[0.02] dark:bg-white/[0.04] rounded-2xl border border-black/[0.04] dark:border-white/[0.06] text-left text-xs space-y-2">
          {topCandidates.length > 0 ? (
            topCandidates.slice(0, 3).map((res, i) => (
              <div key={res.candidateId} className="flex items-center justify-between">
                <span className={`truncate mr-2 ${i === 0 ? 'font-bold text-slate-900 dark:text-[#f5f5f7]' : 'text-slate-500 dark:text-[#a1a1a6]'}`}>
                  #{i + 1} {res.candidate.name}
                </span>
                <span className={`font-semibold text-[11px] px-2 py-0.5 rounded-full ${
                  i === 0
                    ? 'text-[#0071e3] dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 font-bold'
                    : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {res.finalScore.toFixed(1)}%
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-2 text-slate-400 dark:text-slate-500 text-[11px]">
              No active candidates in pool
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="py-20 sm:py-28 border-t border-black/[0.05] dark:border-white/[0.06] bg-[#fbfbfd] dark:bg-[#15161a]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto mb-16"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-[#0071e3] dark:text-sky-400 mb-2 block">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
            Intelligent shortlisting, simplified.
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-[#a1a1a6]">
            Three intuitive steps from raw resumes to explainable hiring decisions.
          </p>
        </motion.div>

        {/* 3 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="bg-white dark:bg-[#181a20] rounded-3xl p-6 sm:p-7 border border-black/[0.06] dark:border-white/[0.08] shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between text-left group hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-mono font-bold tracking-widest text-slate-400 dark:text-[#86868b]">
                      {step.num}
                    </span>
                    <span className="text-[11px] font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-black/[0.03] dark:bg-white/[0.08] text-slate-700 dark:text-slate-300">
                      {step.tag}
                    </span>
                  </div>

                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${step.accent} flex items-center justify-center mb-5 border`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <h3 className="text-lg font-bold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight leading-snug mb-2">
                    {step.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-[#a1a1a6] leading-relaxed font-normal">
                    {step.description}
                  </p>
                </div>

                {step.visual}
              </motion.div>
            );
          })}
        </div>

        {/* Action button */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-14"
        >
          <button
            onClick={onStart}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-semibold bg-[#1d1d1f] dark:bg-white hover:bg-black dark:hover:bg-slate-100 text-white dark:text-[#121316] transition-all shadow-xs hover:shadow hover:scale-[1.02] cursor-pointer"
          >
            <span>Proceed to Step 01: Job Description</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>

      </div>
    </section>
  );
};
