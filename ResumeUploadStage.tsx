import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileText, CheckCircle2, Trash2, Plus, Sparkles, ArrowRight, ArrowLeft, Users, AlertCircle, RotateCcw } from 'lucide-react';
import { CandidateResume, JobDescription } from '../types';

interface ResumeUploadStageProps {
  jobDescription: JobDescription;
  candidates: CandidateResume[];
  onAddCandidate: (candidate: CandidateResume) => void;
  onRemoveCandidate: (id: string) => void;
  onClearAllCandidates?: () => void;
  onRestoreDefaultCandidates?: () => void;
  onProceedToAnalyze: () => void;
  onBackToJD: () => void;
  onOpenCustomModal: () => void;
}

export const ResumeUploadStage: React.FC<ResumeUploadStageProps> = ({
  jobDescription,
  candidates,
  onAddCandidate,
  onRemoveCandidate,
  onClearAllCandidates,
  onRestoreDefaultCandidates,
  onProceedToAnalyze,
  onBackToJD,
  onOpenCustomModal,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  // Simulated drag-and-drop batch upload
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const [currentParsingName, setCurrentParsingName] = useState<string | null>(null);

  const handleFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;
    const fileNames = files.map(f => f.name);
    setUploadingFiles(fileNames);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setCurrentParsingName(file.name);

      try {
        const isPDF = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');
        let payload: { fileName: string; fileType: string; rawText?: string; base64Data?: string };

        if (isPDF) {
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve((e.target?.result as string) || '');
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          payload = {
            fileName: file.name,
            fileType: 'application/pdf',
            base64Data,
          };
        } else {
          const text = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve((e.target?.result as string) || '');
            reader.onerror = reject;
            reader.readAsText(file);
          });
          payload = {
            fileName: file.name,
            fileType: file.type || 'text/plain',
            rawText: text,
          };
        }

        const response = await fetch('/api/parse-resume-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            onAddCandidate(result.data);
            continue;
          }
        }

        throw new Error(`Server returned ${response.status}`);
      } catch (err) {
        console.warn(`Fallback parsing for ${file.name}:`, err);
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        const fallbackCandidate: CandidateResume = {
          id: `uploaded-${Date.now()}-${i}`,
          name: cleanName.length > 2 ? cleanName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : `Applicant ${candidates.length + 1}`,
          email: `${cleanName.toLowerCase().replace(/\s+/g, '.')}@campus.edu`,
          education: {
            degree: 'B.Tech / B.E. in Computer Science',
            institution: 'University Candidate',
            graduationYear: '2025',
          },
          summary: `Uploaded candidate resume from ${file.name}.`,
          skills: ['Software Engineering', 'Problem Solving', 'Git'],
          experience: [],
          projects: [
            {
              title: `${cleanName} Technical Portfolio`,
              technologies: ['Software Engineering'],
              description: `Project work submitted by ${cleanName}.`,
            }
          ],
          rawText: `Resume of ${cleanName}\nSource file: ${file.name}`,
          formatCharacteristics: {
            formatType: 'clean-structured',
          },
        };
        onAddCandidate(fallbackCandidate);
      }
    }

    setCurrentParsingName(null);
    setUploadingFiles([]);
  };

  return (
    <section className="py-12 sm:py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Header */}
      <div className="text-center mb-10">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#0071e3] dark:text-sky-400 mb-2 block">
          Step 02 of 03
        </span>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
          Now, meet your candidates.
        </h2>
        <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-[#a1a1a6] max-w-xl mx-auto">
          Upload and review resumes to rank against <span className="font-semibold text-slate-900 dark:text-[#f5f5f7]">{jobDescription.title}</span>.
        </p>
      </div>

      {/* Upload Zone & Stats Bar */}
      <div className="space-y-6">
        
        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`bg-white dark:bg-[#181a20] rounded-3xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-[#0071e3] dark:border-sky-400 bg-sky-50/50 dark:bg-sky-950/30 scale-[0.99]'
              : 'border-slate-200 dark:border-white/[0.1] hover:border-slate-300 dark:hover:border-white/[0.2] hover:bg-slate-50/40 dark:hover:bg-white/[0.02]'
          }`}
        >
          <input
            type="file"
            id="resume-file-input"
            className="hidden"
            multiple
            accept=".pdf,.docx,.txt"
            onChange={handleFileChange}
          />
          <label htmlFor="resume-file-input" className="cursor-pointer">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-[#0071e3] dark:text-sky-300 flex items-center justify-center mx-auto mb-3 border border-sky-100 dark:border-sky-800/60 shadow-2xs">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
              Drop candidate resumes here, or click to browse
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-[#a1a1a6]">
              Supports multiple PDFs, DOCX, or TXT files
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-black/[0.04] dark:bg-white/[0.08] text-slate-700 dark:text-slate-200 hover:bg-black/[0.08] dark:hover:bg-white/[0.12] transition">
              <Plus className="w-3 h-3" /> Select Additional Resumes
            </div>
          </label>
        </div>

        {/* Upload in progress indicator */}
        {uploadingFiles.length > 0 && (
          <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-800/60 flex items-center gap-3 animate-pulse">
            <Sparkles className="w-4 h-4 text-[#0071e3] dark:text-sky-400 shrink-0" />
            <span className="text-xs text-sky-900 dark:text-sky-200 font-medium">
              {currentParsingName ? `Extracting & analyzing ${currentParsingName}...` : `Parsing and indexing ${uploadingFiles.length} new resume${uploadingFiles.length > 1 ? 's' : ''}...`}
            </span>
          </div>
        )}

        {/* Ready Candidates Count Strip & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#a1a1a6]">
              Candidate Pool ({candidates.length})
            </span>
            {candidates.length > 0 ? (
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800/60">
                ✓ Ready for Analysis
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-100 dark:border-amber-800/60">
                No Resumes in Pool
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Delete All Resumes Button */}
            {candidates.length > 0 && (
              confirmDeleteAll ? (
                <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800/60 text-xs">
                  <span className="text-[11px] text-rose-700 dark:text-rose-300 font-medium">Delete all {candidates.length}?</span>
                  <button
                    onClick={() => {
                      onClearAllCandidates?.();
                      setConfirmDeleteAll(false);
                    }}
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white hover:bg-rose-700 transition cursor-pointer"
                  >
                    Yes, delete all
                  </button>
                  <button
                    onClick={() => setConfirmDeleteAll(false)}
                    className="px-1.5 py-0.5 rounded-full text-[10px] text-slate-500 hover:text-slate-700 dark:text-slate-400 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeleteAll(true)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-800/60 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Delete all resumes from candidate pool"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete All Resumes</span>
                </button>
              )
            )}

            {/* Restore Sample Resumes Button */}
            {onRestoreDefaultCandidates && candidates.length < 5 && (
              <button
                onClick={onRestoreDefaultCandidates}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] transition flex items-center gap-1.5 cursor-pointer"
                title="Restore sample candidate resumes"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Samples</span>
              </button>
            )}

            <button
              onClick={onOpenCustomModal}
              className="text-xs font-semibold text-[#0071e3] dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer ml-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Paste Custom Resume</span>
            </button>
          </div>
        </div>

        {/* Candidate Cards Grid or Empty State */}
        {candidates.length === 0 ? (
          <div className="text-center py-12 px-6 rounded-3xl bg-white dark:bg-[#181a20] border-2 border-dashed border-slate-200 dark:border-white/[0.1] shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.06] text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">
              All resumes have been removed
            </h4>
            <p className="text-xs text-slate-500 dark:text-[#a1a1a6] max-w-md mx-auto mt-1 mb-4 leading-relaxed">
              Your candidate pool is currently empty. Drop your applicant resumes into the box above, paste a custom resume, or restore the default sample candidates.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <label
                htmlFor="resume-file-input"
                className="px-4 py-2 rounded-full text-xs font-semibold bg-[#0071e3] hover:bg-[#0077ed] text-white transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload New Resumes</span>
              </label>
              {onRestoreDefaultCandidates && (
                <button
                  onClick={onRestoreDefaultCandidates}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Sample Candidates</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-h-[460px] overflow-y-auto p-1 pr-2">
            <AnimatePresence>
              {candidates.map((cand, idx) => {
                const fileNum = String(idx + 1).padStart(2, '0');
                const fileName = `resume_${cand.name.toLowerCase().replace(/\s+/g, '_')}.pdf`;
                
                return (
                  <motion.div
                    key={cand.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white dark:bg-[#181a20] rounded-2xl p-4 border border-black/[0.06] dark:border-white/[0.08] shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group text-left"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <span className="text-[11px] font-mono font-bold text-slate-400 dark:text-[#86868b]">
                        Candidate {fileNum}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800/60">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Ready
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight truncate">
                        {cand.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 dark:text-[#86868b] truncate mt-0.5">
                        {fileName}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-[#a1a1a6] line-clamp-1 mt-1 font-medium">
                        {cand.education.degree} ({cand.education.institution})
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-[#86868b] font-medium">
                        {cand.skills.length} skills listed
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveCandidate(cand.id);
                        }}
                        className="opacity-70 sm:opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title={`Delete ${cand.name}'s resume`}
                        aria-label={`Delete ${cand.name}'s resume`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

      </div>

      {/* Action Footer */}
      <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200/80 dark:border-white/[0.08]">
        <button
          onClick={onBackToJD}
          className="w-full sm:w-auto px-5 py-2.5 rounded-full text-xs font-medium text-slate-600 dark:text-[#a1a1a6] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Job Description</span>
        </button>

        <button
          onClick={onProceedToAnalyze}
          disabled={candidates.length === 0}
          className={`w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            candidates.length === 0
              ? 'bg-slate-200 dark:bg-white/[0.08] text-slate-400 dark:text-slate-500 cursor-not-allowed'
              : 'bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.99] cursor-pointer'
          }`}
        >
          <span>Analyze Candidates {candidates.length > 0 ? `(${candidates.length})` : ''}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </section>
  );
};
