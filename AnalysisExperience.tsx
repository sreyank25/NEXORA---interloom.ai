import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, CheckCircle2, Cpu, ArrowRight } from 'lucide-react';

interface AnalysisExperienceProps {
  onComplete: () => void;
  candidateCount: number;
}

export const AnalysisExperience: React.FC<AnalysisExperienceProps> = ({
  onComplete,
  candidateCount,
}) => {
  const steps = [
    { num: '01', label: 'Reading the job description' },
    { num: '02', label: 'Extracting required skills' },
    { num: '03', label: `Analyzing candidate experience (${candidateCount} resumes)` },
    { num: '04', label: 'Performing semantic matching' },
    { num: '05', label: 'Comparing explicit skills' },
    { num: '06', label: 'Building candidate rankings' },
    { num: '07', label: 'Generating explanations' },
  ];

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isComplete, setIsComplete] = useState<boolean>(false);

  useEffect(() => {
    // Progress sequentially through all 7 stages
    const stepDuration = 550; // ms per step for a snappy, cinematic feel
    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(timer);
          setIsComplete(true);
          // Smooth transition after completion
          setTimeout(() => {
            onComplete();
          }, 850);
          return prev;
        }
      });
    }, stepDuration);

    return () => clearInterval(timer);
  }, [steps.length, onComplete]);

  const progressPercent = Math.min(Math.round(((currentStepIndex + (isComplete ? 1 : 0.5)) / steps.length) * 100), 100);

  return (
    <section className="min-h-[75vh] flex flex-col items-center justify-center py-16 px-4 sm:px-6 relative overflow-hidden">
      
      {/* Ambient glowing AI aura */}
      <div
        className="pointer-events-none absolute w-[500px] h-[500px] rounded-full opacity-35 blur-3xl"
        style={{
          background: 'radial-gradient(circle at center, rgba(0, 113, 227, 0.25), rgba(88, 86, 214, 0.15), transparent 70%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-xl w-full mx-auto bg-white/90 backdrop-blur-2xl rounded-3xl p-8 sm:p-10 border border-black/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.08)] text-center relative z-10"
      >
        {/* Top AI emblem */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0071e3] to-[#5856d6] flex items-center justify-center text-white mx-auto mb-6 shadow-md shadow-blue-500/20">
          <Sparkles className="w-7 h-7 animate-pulse" />
        </div>

        {/* Headline */}
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f]">
          {isComplete ? 'Analysis complete.' : 'Understanding your candidates...'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 font-normal">
          {isComplete
            ? 'Candidate rankings and explanations are ready.'
            : 'Applying hybrid BM25 and semantic domain intelligence.'}
        </p>

        {/* Cinematic Progress Bar */}
        <div className="mt-8 mb-8">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono mb-2">
            <span>Progress</span>
            <span className="font-semibold text-slate-800">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-[#0071e3] to-[#5856d6] h-2 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Step List Progression */}
        <div className="space-y-3 text-left max-w-md mx-auto">
          {steps.map((step, idx) => {
            const isFinished = idx < currentStepIndex || isComplete;
            const isCurrent = idx === currentStepIndex && !isComplete;

            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-sky-50/70 border-sky-200 text-[#0071e3] font-semibold'
                    : isFinished
                    ? 'bg-slate-50/60 border-slate-200/60 text-slate-700 font-medium'
                    : 'bg-transparent border-transparent text-slate-400 font-normal'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono tracking-wider opacity-70">
                    {step.num}
                  </span>
                  <span className="text-xs">{step.label}</span>
                </div>

                <div className="flex items-center">
                  {isFinished ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : isCurrent ? (
                    <div className="w-4 h-4 rounded-full border-2 border-[#0071e3] border-t-transparent animate-spin" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-300 mr-1" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Skip Animation button for speed */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex justify-center">
          <button
            onClick={onComplete}
            className="text-xs text-slate-500 hover:text-[#0071e3] font-medium transition flex items-center gap-1"
          >
            <span>Skip to results</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </motion.div>
    </section>
  );
};
