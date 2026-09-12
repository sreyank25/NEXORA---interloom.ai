import React from 'react';
import { X, FileText, CheckCircle2, Star, ShieldAlert, Pencil } from 'lucide-react';
import { JobDescription } from '../types';

interface JDViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  jd: JobDescription;
  onOpenBiasScanner: () => void;
  onEditJD?: (jd: JobDescription) => void;
}

export const JDViewerModal: React.FC<JDViewerModalProps> = ({
  isOpen,
  onClose,
  jd,
  onOpenBiasScanner,
  onEditJD,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-[#181a20] border border-slate-200 dark:border-white/[0.1] rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl dark:shadow-[0_24px_64px_rgba(0,0,0,0.5)] overflow-hidden my-8">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between bg-slate-50/80 dark:bg-[#15161a]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#0a664e] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              <FileText className="w-5 h-5 text-[#0a664e] dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-[#f5f5f7] tracking-tight">
                {jd.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#a1a1a6]">
                {jd.company} • {jd.location} • {jd.employmentType || (jd as any).type}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEditJD && (
              <button
                onClick={() => {
                  onClose();
                  onEditJD(jd);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5 text-[#0071e3] dark:text-sky-400" />
                <span>Edit JD</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-600 dark:text-[#a1a1a6]">
          
          {/* Action prompt */}
          <div className="bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-medium">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Need to check if this JD contains exclusionary university or experience filters?</span>
            </div>
            <button
              onClick={() => {
                onOpenBiasScanner();
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-200/80 dark:bg-amber-900/60 hover:bg-amber-300 dark:hover:bg-amber-800/80 text-amber-950 dark:text-amber-200 font-bold transition text-xs whitespace-nowrap cursor-pointer"
            >
              Scan for Bias
            </button>
          </div>

          {/* Core Technical Requirements */}
          <div className="space-y-3">
            <div className="font-bold text-slate-900 dark:text-[#f5f5f7] text-sm flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Required Core Skills (Heavily Weighted in Matching)</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {jd.requiredSkills.map(skill => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-bold text-xs"
                >
                  ✓ {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Preferred / Bonus Skills */}
          <div className="space-y-3">
            <div className="font-bold text-slate-900 dark:text-[#f5f5f7] text-sm flex items-center gap-1.5">
              <Star className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Preferred / Bonus Skills</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {jd.preferredSkills.map(skill => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 font-semibold text-xs"
                >
                  ★ {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Full JD Text */}
          <div className="space-y-2">
            <div className="font-bold text-slate-900 dark:text-[#f5f5f7] text-sm">Full Job Description Text:</div>
            <div className="bg-slate-50 dark:bg-[#20232b] p-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 font-sans text-xs whitespace-pre-wrap leading-relaxed">
              {jd.rawText}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#15161a] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#0a664e] hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-xs cursor-pointer"
          >
            Close JD
          </button>
        </div>

      </div>
    </div>
  );
};
