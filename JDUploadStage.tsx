import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Upload, CheckCircle2, X, Sparkles, ArrowRight, 
  Pencil, Eye, AlertCircle, Building2, MapPin,
  Layers, Code, GraduationCap, Clock, RotateCcw,
  FileSpreadsheet, Trash2, Plus, Check, Loader2,
  FolderSync
} from 'lucide-react';
import { JobDescription } from '../types';

interface JDUploadStageProps {
  jobDescription: JobDescription;
  allJobDescriptions: JobDescription[];
  onSelectJD: (jd: JobDescription) => void;
  onEditJD: (jd: JobDescription) => void;
  onSaveJD?: (jd: JobDescription) => void;
  onAddMultipleJDs?: (jds: JobDescription[]) => void;
  onDeleteJD?: (id: string) => void;
  onClearAllJDs?: () => void;
  onRestoreDefaultJDs?: () => void;
  onProceed: () => void;
  onOpenBiasScanner: () => void;
}

interface BatchFileProgress {
  id: string;
  fileName: string;
  fileSize: string;
  status: 'waiting' | 'analyzing' | 'done' | 'error';
  extractedTitle?: string;
  error?: string;
}

export const JDUploadStage: React.FC<JDUploadStageProps> = ({
  jobDescription,
  allJobDescriptions,
  onSelectJD,
  onEditJD,
  onSaveJD,
  onAddMultipleJDs,
  onDeleteJD,
  onClearAllJDs,
  onRestoreDefaultJDs,
  onProceed,
  onOpenBiasScanner,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [batchQueue, setBatchQueue] = useState<BatchFileProgress[]>([]);
  const [completedBatchCount, setCompletedBatchCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Show/hide upload box when user already has roles
  const [showUploadBox, setShowUploadBox] = useState(true);

  // Paste text input state
  const [pastedTitle, setPastedTitle] = useState('');
  const [pastedText, setPastedText] = useState('');
  
  // Raw text inspector state
  const [showRawInspector, setShowRawInspector] = useState(false);

  // Parse single file helper
  const parseSingleFile = async (
    file: File, 
    progressId: string
  ): Promise<JobDescription | null> => {
    const isPDF = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');
    const isText = file.type.includes('text') || file.name.toLowerCase().endsWith('.txt') || file.name.toLowerCase().endsWith('.md');

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
    } else if (isText) {
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
    } else {
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || '');
        reader.onerror = reject;
        reader.readAsText(file);
      });
      payload = {
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        rawText: content,
      };
    }

    // Update status to analyzing
    setBatchQueue(prev => prev.map(item => 
      item.id === progressId ? { ...item, status: 'analyzing' } : item
    ));

    const response = await fetch('/api/parse-jd-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to parse ${file.name}`);
    }

    const result = await response.json();
    if (result.success && result.data) {
      const parsed = result.data;
      const newJD: JobDescription = {
        id: `role-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: parsed.title || file.name.replace(/\.[^.]+$/, '').replace(/[_\-]+/g, ' '),
        company: parsed.company || 'Hiring Organization',
        location: parsed.location || 'Hybrid / Remote',
        department: parsed.department || 'Engineering',
        employmentType: parsed.employmentType || 'Full-time Internship (6 Months)',
        experienceLevel: parsed.experienceLevel || 'Student / Recent Graduate',
        summary: parsed.summary || 'Extracted job description requirements.',
        requiredSkills: Array.isArray(parsed.requiredSkills) && parsed.requiredSkills.length > 0 
          ? parsed.requiredSkills 
          : ['TypeScript', 'React'],
        preferredSkills: Array.isArray(parsed.preferredSkills) ? parsed.preferredSkills : ['Docker'],
        responsibilities: Array.isArray(parsed.responsibilities) ? parsed.responsibilities : [],
        qualifications: Array.isArray(parsed.qualifications) ? parsed.qualifications : [],
        rawText: parsed.extractedText || payload.rawText || '',
        analysisSummary: parsed.analysisSummary,
        competencyBreakdown: parsed.competencyBreakdown,
        sourceFileName: file.name,
        analyzedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setBatchQueue(prev => prev.map(item => 
        item.id === progressId ? { ...item, status: 'done', extractedTitle: newJD.title } : item
      ));

      return newJD;
    } else {
      throw new Error(result.error || `Could not parse requirements from ${file.name}`);
    }
  };

  // Handle batch file upload (1 or multiple files)
  const handleMultipleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f => f.size > 0);
    if (fileArray.length === 0) return;

    setIsAnalyzing(true);
    setErrorMessage(null);
    setCompletedBatchCount(0);

    // Build batch queue entries
    const initialQueue: BatchFileProgress[] = fileArray.map((f, idx) => ({
      id: `queue-${Date.now()}-${idx}`,
      fileName: f.name,
      fileSize: `${(f.size / 1024).toFixed(1)} KB`,
      status: 'waiting',
    }));

    setBatchQueue(initialQueue);

    const successfullyParsedJDs: JobDescription[] = [];

    // Process files in sequence or small concurrent batches
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const progressItem = initialQueue[i];

      try {
        const parsedJD = await parseSingleFile(file, progressItem.id);
        if (parsedJD) {
          successfullyParsedJDs.push(parsedJD);
        }
      } catch (err: any) {
        console.error(`Error parsing file ${file.name}:`, err);
        setBatchQueue(prev => prev.map(item => 
          item.id === progressItem.id ? { ...item, status: 'error', error: err.message } : item
        ));
      }

      setCompletedBatchCount(i + 1);
    }

    if (successfullyParsedJDs.length > 0) {
      if (onAddMultipleJDs) {
        onAddMultipleJDs(successfullyParsedJDs);
      } else if (onSaveJD) {
        successfullyParsedJDs.forEach(jd => onSaveJD(jd));
      } else {
        onSelectJD(successfullyParsedJDs[0]);
      }
    } else {
      setErrorMessage('None of the uploaded files could be successfully parsed. Please check file formatting.');
    }

    setIsAnalyzing(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleMultipleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleMultipleFiles(e.target.files);
    }
  };

  // Handle analyze pasted text as a new role
  const handleAnalyzePastedText = async () => {
    if (!pastedText.trim()) return;

    setIsAnalyzing(true);
    setErrorMessage(null);

    const syntheticFileName = pastedTitle.trim() 
      ? `${pastedTitle.trim().replace(/\s+/g, '_')}_JD.txt`
      : 'Custom_Job_Role_JD.txt';

    try {
      const response = await fetch('/api/parse-jd-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: syntheticFileName,
          fileType: 'text/plain',
          rawText: pastedText,
        }),
      });

      const result = await response.json();
      if (result.success && result.data) {
        const parsed = result.data;
        const newJD: JobDescription = {
          id: `role-${Date.now()}`,
          title: pastedTitle.trim() || parsed.title || 'New Job Role',
          company: parsed.company || 'Hiring Organization',
          location: parsed.location || 'Hybrid / Remote',
          department: parsed.department || 'Engineering',
          employmentType: parsed.employmentType || 'Full-time Internship (6 Months)',
          experienceLevel: parsed.experienceLevel || 'Student / Recent Graduate',
          summary: parsed.summary || 'Extracted job description requirements.',
          requiredSkills: Array.isArray(parsed.requiredSkills) && parsed.requiredSkills.length > 0 
            ? parsed.requiredSkills 
            : ['TypeScript', 'React'],
          preferredSkills: Array.isArray(parsed.preferredSkills) ? parsed.preferredSkills : ['Docker'],
          responsibilities: Array.isArray(parsed.responsibilities) ? parsed.responsibilities : [],
          qualifications: Array.isArray(parsed.qualifications) ? parsed.qualifications : [],
          rawText: parsed.extractedText || pastedText,
          analysisSummary: parsed.analysisSummary,
          competencyBreakdown: parsed.competencyBreakdown,
          sourceFileName: syntheticFileName,
          analyzedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        if (onAddMultipleJDs) {
          onAddMultipleJDs([newJD]);
        } else if (onSaveJD) {
          onSaveJD(newJD);
        } else {
          onSelectJD(newJD);
        }

        setPastedText('');
        setPastedTitle('');
      } else {
        throw new Error(result.error || 'Failed to parse requirements.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to analyze text.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <section className="py-10 sm:py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Stage Header */}
      <div className="text-center mb-8 sm:mb-10">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#0071e3] dark:text-sky-400 mb-2 block">
          Multi-Role Requirement Architecture
        </span>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
          Upload Job Descriptions for Different Roles
        </h2>
        <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-[#a1a1a6] max-w-2xl mx-auto">
          Upload one or multiple Job Description PDFs at once. InternLoom AI extracts the unique requirements for each role, allowing you to instantly switch benchmarks and evaluate candidate resumes.
        </p>
      </div>

      {/* MULTI-ROLE SWITCHER BAR (Available Roles) */}
      <div className="mb-8 bg-white dark:bg-[#181a20] rounded-3xl border border-black/[0.08] dark:border-white/[0.1] p-5 sm:p-6 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-[#0071e3] dark:text-sky-400">
              <FolderSync className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-[#f5f5f7]">
                Configured Job Roles ({allJobDescriptions.length})
              </span>
              <p className="text-[11px] text-slate-500 dark:text-[#86868b]">
                Click any role to benchmark candidates against its specific requirements
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowUploadBox(!showUploadBox)}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#0071e3] hover:bg-[#0077ed] text-white transition shadow-2xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showUploadBox ? 'Upload JDs' : '+ Upload More Roles'}</span>
          </button>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {allJobDescriptions.map((jd) => {
            const isActive = jobDescription.id === jd.id;
            return (
              <div
                key={jd.id}
                onClick={() => onSelectJD(jd)}
                className={`group relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between text-left ${
                  isActive
                    ? 'bg-sky-50/70 dark:bg-sky-950/40 border-[#0071e3] dark:border-sky-500 shadow-sm ring-2 ring-[#0071e3]/20 dark:ring-sky-500/20'
                    : 'bg-slate-50/70 dark:bg-[#20232b]/80 border-slate-200/80 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.15] hover:bg-slate-100/60 dark:hover:bg-[#252833]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1.5 mb-1.5">
                    <span className="font-bold text-xs text-slate-900 dark:text-[#f5f5f7] line-clamp-1">
                      {jd.title}
                    </span>
                    {isActive ? (
                      <span className="shrink-0 p-0.5 rounded-full bg-[#0071e3] text-white">
                        <Check className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="shrink-0 text-[10px] text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">
                        Switch
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-[#86868b] line-clamp-1 mb-2">
                    {jd.company} • {jd.location}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {jd.requiredSkills.slice(0, 3).map(s => (
                      <span key={s} className="px-1.5 py-0.5 rounded bg-white dark:bg-black/30 border border-black/[0.04] dark:border-white/[0.06] text-[10px] text-slate-700 dark:text-slate-300 font-medium">
                        {s}
                      </span>
                    ))}
                    {jd.requiredSkills.length > 3 && (
                      <span className="px-1.5 py-0.5 rounded bg-white dark:bg-black/30 border border-black/[0.04] dark:border-white/[0.06] text-[10px] text-slate-500">
                        +{jd.requiredSkills.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-black/[0.04] dark:border-white/[0.06] text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className={`font-semibold ${isActive ? 'text-[#0071e3] dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}`}>
                      {isActive ? 'Active Benchmark' : 'Click to Set Active'}
                    </span>
                    {jd.sourceFileName && (
                      <span className="text-[9px] text-slate-400 truncate max-w-[90px]" title={jd.sourceFileName}>
                        • {jd.sourceFileName}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onEditJD(jd)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/[0.1] transition cursor-pointer"
                      title="Edit requirements for this role"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    {onDeleteJD && allJobDescriptions.length > 1 && (
                      <button
                        onClick={() => onDeleteJD(jd.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="Delete this role"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MULTI-FILE UPLOAD CARD */}
      <AnimatePresence>
        {showUploadBox && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-[#181a20] rounded-3xl border border-black/[0.08] dark:border-white/[0.1] shadow-xs p-6 sm:p-8 transition-colors mb-8"
          >
            {/* Ingestion Mode Tabs */}
            <div className="flex items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                    activeTab === 'upload'
                      ? 'bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload JD Files (Batch Supported)</span>
                </button>

                <button
                  onClick={() => setActiveTab('paste')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                    activeTab === 'paste'
                      ? 'bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Paste Role Text</span>
                </button>
              </div>

              <span className="text-[11px] text-slate-500 dark:text-[#86868b] hidden sm:block">
                Select one or multiple PDF files at once
              </span>
            </div>

            {/* Error Notice */}
            {errorMessage && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-rose-800 dark:text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold">Analysis Notice:</span> {errorMessage}
                </div>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="text-rose-600 hover:text-rose-900 dark:text-rose-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Batch Processing Queue View */}
            {isAnalyzing ? (
              <div className="py-8 px-4 text-center space-y-5">
                <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-[#0071e3] dark:text-sky-300 border border-sky-100 dark:border-sky-800/80 flex items-center justify-center mx-auto shadow-sm animate-pulse">
                  <Sparkles className="w-7 h-7 animate-spin" style={{ animationDuration: '3s' }} />
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">
                    Analyzing {batchQueue.length} Job Description {batchQueue.length === 1 ? 'File' : 'Files'} with AI
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#a1a1a6]">
                    Processed {completedBatchCount} of {batchQueue.length} roles...
                  </p>
                </div>

                {/* Queue Progress List */}
                <div className="max-w-lg mx-auto bg-slate-50 dark:bg-[#20232b] rounded-2xl p-4 border border-black/[0.06] dark:border-white/[0.08] text-left space-y-2.5 divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {batchQueue.map((item) => (
                    <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.status === 'analyzing' && (
                          <Loader2 className="w-4 h-4 text-[#0071e3] animate-spin shrink-0" />
                        )}
                        {item.status === 'done' && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                        {item.status === 'error' && (
                          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        )}
                        {item.status === 'waiting' && (
                          <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {item.fileName}
                          </p>
                          {item.extractedTitle && (
                            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium truncate">
                              → Identified: {item.extractedTitle}
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="text-[10px] text-slate-400 shrink-0">
                        {item.status === 'analyzing' && 'Analyzing...'}
                        {item.status === 'done' && 'Extracted ✓'}
                        {item.status === 'waiting' && 'Queued'}
                        {item.status === 'error' && 'Failed'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* TAB 1: BATCH FILE DROPZONE */}
                {activeTab === 'upload' && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
                      isDragging
                        ? 'border-[#0071e3] dark:border-sky-400 bg-sky-50/50 dark:bg-sky-950/30 scale-[0.99]'
                        : 'border-slate-200 dark:border-white/[0.1] hover:border-slate-300 dark:hover:border-white/[0.2] hover:bg-slate-50/40 dark:hover:bg-white/[0.02]'
                    }`}
                  >
                    <input
                      type="file"
                      id="multi-jd-upload-input"
                      className="hidden"
                      multiple
                      accept=".pdf,.docx,.txt,.md,.rtf,.doc"
                      onChange={handleFileInputChange}
                    />
                    <label htmlFor="multi-jd-upload-input" className="cursor-pointer">
                      <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-[#0071e3] dark:text-sky-300 flex items-center justify-center mx-auto mb-4 border border-sky-100 dark:border-sky-800/60 shadow-2xs">
                        <Upload className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                        Upload Job Description Files (PDFs)
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-[#a1a1a6] max-w-md mx-auto">
                        Drag & drop one or multiple JD files here, or browse. You can upload files for different positions (e.g. Frontend, Backend, Data, QA) all at once.
                      </p>
                      
                      <div className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-[#0071e3] hover:bg-[#0077ed] text-white transition shadow-2xs">
                        <span>Select One or Multiple Files</span>
                      </div>

                      <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                        <span>Supported formats:</span>
                        <span className="font-mono bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded font-semibold">.PDF (Multiple)</span>
                        <span className="font-mono bg-slate-100 dark:bg-white/[0.06] px-1.5 py-0.5 rounded">.DOCX</span>
                        <span className="font-mono bg-slate-100 dark:bg-white/[0.06] px-1.5 py-0.5 rounded">.TXT</span>
                      </div>
                    </label>
                  </div>
                )}

                {/* TAB 2: PASTE TEXT AS NEW ROLE */}
                {activeTab === 'paste' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                        Role Title (Optional)
                      </label>
                      <input
                        type="text"
                        value={pastedTitle}
                        onChange={(e) => setPastedTitle(e.target.value)}
                        placeholder="e.g. AI / Machine Learning Engineer Intern"
                        className="w-full text-xs p-3 bg-slate-50 dark:bg-[#20232b] border border-slate-200 dark:border-white/[0.1] rounded-xl focus:outline-none focus:border-[#0071e3] transition text-slate-800 dark:text-[#f5f5f7]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                        Job Posting Content
                      </label>
                      <textarea
                        rows={7}
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                        placeholder="Paste the job requirements, mandatory skills, qualifications, and responsibilities..."
                        className="w-full text-xs font-mono p-4 bg-slate-50 dark:bg-[#20232b] border border-slate-200 dark:border-white/[0.1] rounded-2xl focus:outline-none focus:border-[#0071e3] transition text-slate-800 dark:text-[#f5f5f7] leading-relaxed"
                      />
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                        <span>{pastedText.length} characters</span>
                        <span>Will be added as a separate job role</span>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={handleAnalyzePastedText}
                        disabled={!pastedText.trim()}
                        className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[#0071e3] hover:bg-[#0077ed] text-white transition-all shadow-2xs flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Add Role & Analyze Requirements</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ACTIVE ROLE REQUIREMENTS DETAIL (Currently Selected Role) */}
      <div className="space-y-6">
        
        {/* Specification Header & Source Badge */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#181a20] border border-black/[0.08] dark:border-white/[0.1] shadow-xs text-left">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-white/[0.06]">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800/60">
                  <CheckCircle2 className="w-3 h-3" />
                  Active Benchmark Role
                </span>
                {jobDescription.sourceFileName && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-white/[0.06] px-2 py-0.5 rounded-md flex items-center gap-1">
                    <FileSpreadsheet className="w-3 h-3 text-[#0071e3] dark:text-sky-400" />
                    {jobDescription.sourceFileName}
                  </span>
                )}
                {jobDescription.analyzedAt && (
                  <span className="text-[11px] text-slate-400">
                    Parsed at {jobDescription.analyzedAt}
                  </span>
                )}
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight mt-1">
                {jobDescription.title}
              </h3>

              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-[#a1a1a6]">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {jobDescription.company}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {jobDescription.location}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {jobDescription.employmentType}
                </span>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={onOpenBiasScanner}
                className="px-3.5 py-2 rounded-full text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/60 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Scan for Bias</span>
              </button>

              <button
                onClick={() => onEditJD(jobDescription)}
                className="px-3.5 py-2 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.12] transition flex items-center gap-1.5 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Requirements</span>
              </button>
            </div>
          </div>

          {/* Recruiter Requirement Analysis Insights */}
          <div className="mt-5 p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-[#0071e3] dark:text-sky-300 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-sky-900 dark:text-sky-300 uppercase tracking-wider">
                  Recruitment Engine Evaluation Rubric
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {jobDescription.analysisSummary || jobDescription.summary}
                </p>
              </div>
            </div>
          </div>

          {/* Section: Known Requirements (Explicit Skills & Bonus) */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* Mandatory Required Skills */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#20232b] border border-black/[0.04] dark:border-white/[0.06]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Mandatory Required Skills ({jobDescription.requiredSkills.length})
                  </span>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Strict BM25 weight (1.0x)
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {jobDescription.requiredSkills.map(skill => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-800/60"
                  >
                    ✓ {skill}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2.5">
                Candidates evaluated against this role receive penalty flags if missing any of these core skills.
              </p>
            </div>

            {/* Preferred / Bonus Skills */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#20232b] border border-black/[0.04] dark:border-white/[0.06]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Preferred & Bonus Qualifications ({jobDescription.preferredSkills?.length || 0})
                  </span>
                </div>
                <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold">
                  Bonus weight (0.4x)
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(jobDescription.preferredSkills && jobDescription.preferredSkills.length > 0) ? (
                  jobDescription.preferredSkills.map(skill => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-300 border border-sky-100 dark:border-sky-800/60"
                    >
                      ★ {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No secondary bonus skills specified.</span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2.5">
                Boosts candidate rank when core requirements are already satisfied.
              </p>
            </div>

          </div>

          {/* Competency Matrix (Categorized by Domain) */}
          {jobDescription.competencyBreakdown && Object.values(jobDescription.competencyBreakdown as Record<string, string[]>).some((arr: string[]) => Array.isArray(arr) && arr.length > 0) && (
            <div className="mt-5 p-4 rounded-2xl bg-slate-50/80 dark:bg-[#20232b] border border-black/[0.04] dark:border-white/[0.06]">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-3.5 h-3.5 text-[#0071e3] dark:text-sky-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Extracted Competency Matrix
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {jobDescription.competencyBreakdown.frontend && jobDescription.competencyBreakdown.frontend.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#181a20] border border-slate-200/80 dark:border-white/[0.06]">
                    <span className="font-bold text-[11px] text-slate-500 dark:text-[#86868b] block mb-1">Frontend UI</span>
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">{jobDescription.competencyBreakdown.frontend.join(', ')}</span>
                  </div>
                )}
                {jobDescription.competencyBreakdown.backend && jobDescription.competencyBreakdown.backend.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#181a20] border border-slate-200/80 dark:border-white/[0.06]">
                    <span className="font-bold text-[11px] text-slate-500 dark:text-[#86868b] block mb-1">Backend & APIs</span>
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">{jobDescription.competencyBreakdown.backend.join(', ')}</span>
                  </div>
                )}
                {jobDescription.competencyBreakdown.database && jobDescription.competencyBreakdown.database.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#181a20] border border-slate-200/80 dark:border-white/[0.06]">
                    <span className="font-bold text-[11px] text-slate-500 dark:text-[#86868b] block mb-1">Data Storage</span>
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">{jobDescription.competencyBreakdown.database.join(', ')}</span>
                  </div>
                )}
                {jobDescription.competencyBreakdown.devopsAndCloud && jobDescription.competencyBreakdown.devopsAndCloud.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#181a20] border border-slate-200/80 dark:border-white/[0.06]">
                    <span className="font-bold text-[11px] text-slate-500 dark:text-[#86868b] block mb-1">DevOps & Cloud</span>
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">{jobDescription.competencyBreakdown.devopsAndCloud.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section: Responsibilities & Qualifications */}
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* Responsibilities */}
            {jobDescription.responsibilities && jobDescription.responsibilities.length > 0 && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#20232b] border border-black/[0.04] dark:border-white/[0.06]">
                <div className="flex items-center gap-2 mb-2.5">
                  <Code className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Key Responsibilities ({jobDescription.responsibilities.length})
                  </span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  {jobDescription.responsibilities.map((resp, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#0071e3] font-bold shrink-0">•</span>
                      <span>{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Qualifications */}
            {jobDescription.qualifications && jobDescription.qualifications.length > 0 && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#20232b] border border-black/[0.04] dark:border-white/[0.06]">
                <div className="flex items-center gap-2 mb-2.5">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Eligibility & Qualifications ({jobDescription.qualifications.length})
                  </span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  {jobDescription.qualifications.map((qual, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold shrink-0">•</span>
                      <span>{qual}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>

          {/* Raw Text Inspector Toggle */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs">
            <button
              onClick={() => setShowRawInspector(!showRawInspector)}
              className="text-[#0071e3] dark:text-sky-400 font-semibold hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showRawInspector ? 'Hide Raw Document Text' : 'Inspect Raw Document Text'}</span>
            </button>

            <button
              onClick={() => setShowUploadBox(true)}
              className="text-slate-400 hover:text-[#0071e3] dark:hover:text-sky-400 transition flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Upload Additional JDs</span>
            </button>
          </div>

          {/* Expandable Raw Text Viewer */}
          <AnimatePresence>
            {showRawInspector && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.06]"
              >
                <pre className="p-4 bg-slate-50 dark:bg-[#12141a] rounded-2xl text-[11px] font-mono text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-64 border border-slate-200 dark:border-white/[0.06]">
                  {jobDescription.rawText || 'No raw text available.'}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

      {/* Action Footer */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500 dark:text-[#86868b] text-center sm:text-left">
          Currently evaluating candidates against: <span className="font-bold text-slate-900 dark:text-[#f5f5f7]">{jobDescription.title}</span> ({jobDescription.requiredSkills.length} required skills).
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onProceed}
            className="px-6 py-3 rounded-full text-xs sm:text-sm font-semibold bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-xs hover:shadow transition-all flex items-center gap-2 hover:scale-[1.02] cursor-pointer"
          >
            <span>Proceed to Candidate Resumes</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </section>
  );
};
