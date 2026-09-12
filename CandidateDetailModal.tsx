import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  GitCompare,
  GraduationCap,
  Sparkles,
  MapPin,
  Mail,
  FileText,
  Copy,
  Check,
  Briefcase,
  Clock,
  Target,
  HelpCircle,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Code2,
} from 'lucide-react';
import { CandidateMatchResult, JobDescription, CandidateDetailedAnalysis } from '../types';

interface CandidateDetailModalProps {
  candidate: CandidateMatchResult | null;
  jobDescription?: JobDescription | null;
  onClose: () => void;
  onCompare: (candidate: CandidateMatchResult) => void;
  onUpdateAnalysis?: (candidateId: string, updatedAnalysis: CandidateDetailedAnalysis) => void;
}

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  candidate,
  jobDescription,
  onClose,
  onCompare,
  onUpdateAnalysis,
}) => {
  if (!candidate) return null;

  const [activeTab, setActiveTab] = useState<'analysis' | 'breakdown' | 'projects' | 'evidence'>('analysis');
  const [copied, setCopied] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [liveAnalysis, setLiveAnalysis] = useState<CandidateDetailedAnalysis | undefined>(
    candidate.detailedAnalysis
  );

  const c = candidate.candidate;
  const analysis = liveAnalysis || candidate.detailedAnalysis;

  // Calculate experience relevance score
  const totalRequired = candidate.matchedExplicitSkills.length + candidate.missingRequiredSkills.length;
  const requiredMatchPercent = totalRequired > 0
    ? Math.round((candidate.matchedExplicitSkills.length / totalRequired) * 100)
    : 0;

  const experienceRelevance = Math.round(
    (candidate.semanticScore * 0.5) + (candidate.keywordScore * 0.3) + (requiredMatchPercent * 0.2)
  );

  const targetRole = jobDescription?.title || 'Full Stack Developer Intern';
  const targetCompany = jobDescription?.company || 'TechNova Solutions';

  // Copy candidate brief to clipboard
  const handleCopyBrief = () => {
    if (!analysis) return;
    const briefText = `### Candidate Brief: ${c.name} (Rank #${candidate.rank} • Fit: ${candidate.finalScore}%)
Target Role: ${targetRole} at ${targetCompany}
Verdict: ${analysis.recommendedVerdict}

Overview:
${analysis.overview}

Why Recruiter Should Take Them:
${analysis.whyRecruiterShouldTakeThem}

Key Differentiator:
${analysis.keyDifferentiator}

Ramp-Up Velocity:
${analysis.rampUpReadiness}

Pros (Key Strengths):
${analysis.pros.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Cons (Gaps & Watchouts):
${analysis.cons.map((co, i) => `${i + 1}. ${co}`).join('\n')}

Interview Questions to Probe:
${analysis.interviewProbeQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}
`;
    navigator.clipboard.writeText(briefText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  };

  // Run live Gemini Deep Audit
  const handleRunAiAudit = async () => {
    if (!jobDescription) return;
    setIsAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/analyze-candidate-deep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate: c,
          jobDescription,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const enriched: CandidateDetailedAnalysis = {
          ...data.data,
          source: data.source === 'gemini' ? 'gemini' : 'engine',
        };
        setLiveAnalysis(enriched);
        if (onUpdateAnalysis) {
          onUpdateAnalysis(candidate.candidateId, enriched);
        }
      } else {
        setAiError(data.error || 'Could not complete AI audit.');
      }
    } catch (err: any) {
      setAiError(err.message || 'Network error executing AI audit.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Verdict styling helper
  const getVerdictBadge = (verdict?: string) => {
    switch (verdict) {
      case 'Strong Hire':
        return {
          label: 'Strong Hire',
          badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/60',
          dotClass: 'bg-emerald-500',
        };
      case 'High Potential':
        return {
          label: 'High Potential',
          badgeClass: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700/60',
          dotClass: 'bg-indigo-500',
        };
      case 'Viable Contender':
        return {
          label: 'Viable Contender',
          badgeClass: 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-700/60',
          dotClass: 'bg-sky-500',
        };
      case 'Skill Gap Watch':
        return {
          label: 'Skill Gap Watch',
          badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700/60',
          dotClass: 'bg-amber-500',
        };
      default:
        return {
          label: verdict || 'Under Evaluation',
          badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          dotClass: 'bg-slate-400',
        };
    }
  };

  const verdictConfig = getVerdictBadge(analysis?.recommendedVerdict);

  return (
    <div
      id="candidate-detail-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        id="candidate-detail-modal-container"
        className="bg-white dark:bg-[#181a20] rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-[0_24px_64px_rgba(0,0,0,0.2)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.6)] border border-black/[0.08] dark:border-white/[0.1] overflow-hidden my-6"
      >
        {/* Header */}
        <div className="p-6 sm:p-7 border-b border-black/[0.06] dark:border-white/[0.08] flex items-start justify-between gap-4 bg-[#fbfbfd] dark:bg-[#15161a]">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-black/[0.04] dark:bg-white/[0.08] flex items-center justify-center font-extrabold text-lg text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight shrink-0 border border-black/[0.04] dark:border-white/[0.06]">
              #{candidate.rank}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">
                  {c.name}
                </h2>
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${verdictConfig.badgeClass}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${verdictConfig.dotClass}`} />
                  <span>{verdictConfig.label}</span>
                </div>
                {candidate.rank === 1 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                    🏆 Top Ranked
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-[#a1a1a6] mt-1 flex items-center gap-1.5 flex-wrap">
                <span className="font-medium text-slate-700 dark:text-slate-300">{c.education.degree}</span>
                <span>•</span>
                <span>{c.education.institution}</span>
                {c.education.graduationYear && <span>(Class of {c.education.graduationYear})</span>}
                {c.education.gpa && (
                  <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-white/[0.08] rounded text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                    GPA {c.education.gpa}
                  </span>
                )}
              </p>

              <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-[#86868b] mt-1 flex-wrap">
                {c.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {c.email}
                  </span>
                )}
                {c.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {c.location}
                  </span>
                )}
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  Applying for: {targetRole}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#86868b] block">
                Overall Match
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">
                {candidate.finalScore}%
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Header Bar (AI Refresh & Copy Brief) */}
        <div className="px-6 py-2.5 bg-slate-50/80 dark:bg-[#121316] border-b border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-[#0071e3] dark:text-sky-400" />
              JD Analysis Calibration:
            </span>
            <span className="text-xs text-slate-700 dark:text-slate-200 font-medium bg-white dark:bg-[#181a20] px-2.5 py-0.5 rounded-md border border-black/[0.06] dark:border-white/[0.08]">
              {targetRole} @ {targetCompany}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-[#86868b]">
              {analysis?.source === 'gemini' ? (
                <span className="text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Gemini AI Deep Audit
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Dual-Engine Resume Audit
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunAiAudit}
              disabled={isAiLoading}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-[#181a20] hover:bg-slate-50 dark:hover:bg-white/[0.05] text-[#0071e3] dark:text-sky-400 border border-[#0071e3]/30 dark:border-sky-400/40 shadow-2xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              title="Run or refresh comprehensive Gemini AI evaluation against the raw resume and JD"
            >
              <RefreshCw className={`w-3 h-3 ${isAiLoading ? 'animate-spin' : ''}`} />
              <span>{isAiLoading ? 'Analyzing Resume...' : '✨ Run AI Deep Audit'}</span>
            </button>

            <button
              onClick={handleCopyBrief}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-[#181a20] hover:bg-slate-50 dark:hover:bg-white/[0.05] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/[0.1] shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
              title="Copy complete structured recruiter evaluation to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied Brief!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Recruiter Brief</span>
                </>
              )}
            </button>
          </div>
        </div>

        {aiError && (
          <div className="px-6 py-2 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
            {aiError}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-6 border-b border-black/[0.06] dark:border-white/[0.08] bg-[#fbfbfd] dark:bg-[#15161a] flex items-center gap-1 sm:gap-2 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`py-3 px-2 border-b-2 font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'analysis'
                ? 'border-[#0071e3] dark:border-sky-400 text-[#0071e3] dark:text-sky-400'
                : 'border-transparent text-slate-500 dark:text-[#a1a1a6] hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Recruiter Analysis & Verdict</span>
          </button>

          <button
            onClick={() => setActiveTab('breakdown')}
            className={`py-3 px-2 border-b-2 font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'breakdown'
                ? 'border-[#0071e3] dark:border-sky-400 text-[#0071e3] dark:text-sky-400'
                : 'border-transparent text-slate-500 dark:text-[#a1a1a6] hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Match Breakdown & Scores</span>
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            className={`py-3 px-2 border-b-2 font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'projects'
                ? 'border-[#0071e3] dark:border-sky-400 text-[#0071e3] dark:text-sky-400'
                : 'border-transparent text-slate-500 dark:text-[#a1a1a6] hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Projects & Experience ({c.projects?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('evidence')}
            className={`py-3 px-2 border-b-2 font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'evidence'
                ? 'border-[#0071e3] dark:border-sky-400 text-[#0071e3] dark:text-sky-400'
                : 'border-transparent text-slate-500 dark:text-[#a1a1a6] hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Resume Evidence & Logs ({candidate.evidenceSnippets?.length || 0})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-6 text-xs text-slate-600 dark:text-[#a1a1a6] flex-1">
          {/* TAB 1: RECRUITER ANALYSIS & VERDICT */}
          {activeTab === 'analysis' && analysis && (
            <div className="space-y-6">
              {/* 1. WHY THE RECRUITER SHOULD TAKE THEM FOR THIS JD (FEATURED CALLOUT) */}
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-indigo-50/70 via-sky-50/50 to-white dark:from-indigo-950/40 dark:via-slate-900 dark:to-[#181a20] border border-indigo-100 dark:border-indigo-800/60 shadow-xs relative overflow-hidden">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block">
                      Recruiter Decision & Hiring Pitch
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">
                      Why take {c.name} for {targetRole}?
                    </h3>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium pl-10">
                  {analysis.whyRecruiterShouldTakeThem}
                </p>

                <div className="mt-4 pt-3.5 border-t border-indigo-100/80 dark:border-indigo-800/40 flex items-center justify-between gap-4 flex-wrap text-xs pl-10">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Hiring Recommendation:</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-xs border ${verdictConfig.badgeClass}`}>
                      {analysis.recommendedVerdict}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Ramp-up velocity:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {analysis.rampUpReadiness.split(';')[0]}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. CANDIDATE BRIEF OVERVIEW */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#fbfbfd] dark:bg-[#20232b] border border-black/[0.05] dark:border-white/[0.06]">
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="w-4 h-4 text-[#0071e3] dark:text-sky-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f] dark:text-[#f5f5f7]">
                    Candidate Profile Overview
                  </h4>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {analysis.overview}
                </p>
              </div>

              {/* 3. KEY DIFFERENTIATOR & RAMP-UP READINESS BENTO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-[#181a20] border border-black/[0.06] dark:border-white/[0.08] shadow-2xs">
                  <div className="flex items-center gap-2 text-[#0071e3] dark:text-sky-400 font-bold text-xs mb-1.5">
                    <Target className="w-4 h-4" />
                    <span>Key Differentiator</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {analysis.keyDifferentiator}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-[#181a20] border border-black/[0.06] dark:border-white/[0.08] shadow-2xs">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs mb-1.5">
                    <Clock className="w-4 h-4" />
                    <span>Ramp-Up Readiness</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {analysis.rampUpReadiness}
                  </p>
                </div>
              </div>

              {/* 4. PROS AND CONS SIDE-BY-SIDE BENTO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* PROS CARD */}
                <div className="p-5 rounded-3xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-emerald-200/60 dark:border-emerald-800/40">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </div>
                        <h4 className="font-extrabold text-sm text-emerald-950 dark:text-emerald-200 tracking-tight">
                          Pros & Demonstrated Strengths
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                        {analysis.pros.length} Strengths
                      </span>
                    </div>

                    <ul className="space-y-2.5">
                      {analysis.pros.map((pro, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-emerald-950 dark:text-emerald-200/90 leading-relaxed">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/40 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                    ✓ Backed by verified projects and stated technical competencies
                  </div>
                </div>

                {/* CONS CARD */}
                <div className="p-5 rounded-3xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-amber-200/60 dark:border-amber-800/40">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center">
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </div>
                        <h4 className="font-extrabold text-sm text-amber-950 dark:text-amber-200 tracking-tight">
                          Cons & Gaps to Watch
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                        {analysis.cons.length} Watchouts
                      </span>
                    </div>

                    <ul className="space-y-2.5">
                      {analysis.cons.map((con, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-amber-950 dark:text-amber-200/90 leading-relaxed">
                          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 pt-3 border-t border-amber-200/60 dark:border-amber-800/40 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                    ⚠ Recommended focus areas for the interviewer during screening
                  </div>
                </div>
              </div>

              {/* 5. INTERVIEWER CHEAT SHEET (PROBE QUESTIONS) */}
              <div className="p-5 rounded-3xl bg-white dark:bg-[#181a20] border border-black/[0.08] dark:border-white/[0.08] shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-sky-600 text-white flex items-center justify-center">
                    <HelpCircle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-[#f5f5f7]">
                      Recruiter Interview Cheat Sheet: Questions to Probe
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-[#a1a1a6]">
                      Ask these targeted questions to test their claimed strengths and evaluate their gap areas:
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  {analysis.interviewProbeQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-[#fbfbfd] dark:bg-[#20232b] border border-black/[0.04] dark:border-white/[0.06] flex items-start gap-3"
                    >
                      <span className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                        "{q}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MATCH BREAKDOWN & SCORES */}
          {activeTab === 'breakdown' && (
            <div className="space-y-6">
              {/* Score Cards */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-[#86868b] block mb-3">
                  Score Dimensions
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-[#fbfbfd] dark:bg-[#20232b] p-3.5 rounded-2xl border border-black/[0.05] dark:border-white/[0.06]">
                    <span className="text-[11px] text-slate-500 dark:text-[#a1a1a6] block font-medium mb-1">
                      Semantic Fit
                    </span>
                    <span className="text-xl font-bold text-[#1d1d1f] dark:text-[#f5f5f7] block">
                      {candidate.semanticScore}%
                    </span>
                    <div className="w-full bg-slate-200 dark:bg-white/[0.1] h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-indigo-600 dark:bg-indigo-400 h-full rounded-full" style={{ width: `${candidate.semanticScore}%` }} />
                    </div>
                  </div>

                  <div className="bg-[#fbfbfd] dark:bg-[#20232b] p-3.5 rounded-2xl border border-black/[0.05] dark:border-white/[0.06]">
                    <span className="text-[11px] text-slate-500 dark:text-[#a1a1a6] block font-medium mb-1">
                      Keyword Match
                    </span>
                    <span className="text-xl font-bold text-[#1d1d1f] dark:text-[#f5f5f7] block">
                      {candidate.keywordScore}%
                    </span>
                    <div className="w-full bg-slate-200 dark:bg-white/[0.1] h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-[#0071e3] dark:bg-sky-400 h-full rounded-full" style={{ width: `${candidate.keywordScore}%` }} />
                    </div>
                  </div>

                  <div className="bg-[#fbfbfd] dark:bg-[#20232b] p-3.5 rounded-2xl border border-black/[0.05] dark:border-white/[0.06]">
                    <span className="text-[11px] text-slate-500 dark:text-[#a1a1a6] block font-medium mb-1">
                      Required Skills
                    </span>
                    <span className="text-xl font-bold text-[#1d1d1f] dark:text-[#f5f5f7] block">
                      {requiredMatchPercent}%
                    </span>
                    <div className="w-full bg-slate-200 dark:bg-white/[0.1] h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-emerald-600 dark:bg-emerald-400 h-full rounded-full" style={{ width: `${requiredMatchPercent}%` }} />
                    </div>
                  </div>

                  <div className="bg-[#fbfbfd] dark:bg-[#20232b] p-3.5 rounded-2xl border border-black/[0.05] dark:border-white/[0.06]">
                    <span className="text-[11px] text-slate-500 dark:text-[#a1a1a6] block font-medium mb-1">
                      Experience Relevance
                    </span>
                    <span className="text-xl font-bold text-[#1d1d1f] dark:text-[#f5f5f7] block">
                      {experienceRelevance}%
                    </span>
                    <div className="w-full bg-slate-200 dark:bg-white/[0.1] h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-slate-800 dark:bg-slate-300 h-full rounded-full" style={{ width: `${experienceRelevance}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Domain Breakdown */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#fbfbfd] dark:bg-[#20232b] border border-black/[0.05] dark:border-white/[0.06]">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-[#86868b] block mb-3">
                  Domain Competency Coverage
                </span>
                <div className="space-y-3">
                  {Object.entries(candidate.domainScores).map(([domain, score]) => {
                    const pct = Math.round((score as number) * 100);
                    return (
                      <div key={domain}>
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{domain}</span>
                          <span className="font-bold text-slate-900 dark:text-white">{pct}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-white/[0.1] h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 dark:bg-indigo-400 h-full rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Explicit Matched Skills & Potential Gaps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/60">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-900 dark:text-emerald-300 mb-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Matched Required Skills ({candidate.matchedExplicitSkills.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.matchedExplicitSkills.map(s => (
                      <span
                        key={s}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#181a20] text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold border border-emerald-200/80 dark:border-emerald-700/60 shadow-2xs"
                      >
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800/60">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900 dark:text-amber-300 mb-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Missing Required Skills ({candidate.missingRequiredSkills.length})</span>
                  </div>
                  {candidate.missingRequiredSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.missingRequiredSkills.map(s => (
                        <span
                          key={s}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#181a20] text-amber-800 dark:text-amber-300 text-[11px] font-semibold border border-amber-200/80 dark:border-amber-700/60 shadow-2xs"
                        >
                          ⚠ {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 dark:text-[#a1a1a6] italic">No missing required skills detected.</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PROJECTS & EXPERIENCE */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              {/* Projects */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-[#86868b] block mb-3">
                  Demonstrated Projects ({c.projects?.length || 0})
                </span>
                {c.projects && c.projects.length > 0 ? (
                  <div className="space-y-3">
                    {c.projects.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-[#fbfbfd] dark:bg-[#20232b] border border-black/[0.05] dark:border-white/[0.06]"
                      >
                        <div className="flex justify-between items-center mb-1.5 flex-wrap gap-2">
                          <h4 className="font-bold text-slate-900 dark:text-[#f5f5f7] text-sm">
                            {p.title}
                          </h4>
                          {p.link && (
                            <span className="text-[11px] text-[#0071e3] dark:text-sky-400 font-mono flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" /> {p.link}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1 mb-2.5">
                          {p.technologies.map(t => (
                            <span
                              key={t}
                              className="px-2 py-0.5 rounded-md bg-white dark:bg-[#181a20] text-[10px] font-semibold text-slate-700 dark:text-[#a1a1a6] border border-slate-200 dark:border-white/[0.1]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>

                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {p.description}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No structured projects extracted.</p>
                )}
              </div>

              {/* Work Experience */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-[#86868b] block mb-3">
                  Professional Experience ({c.experience?.length || 0})
                </span>
                {c.experience && c.experience.length > 0 ? (
                  <div className="space-y-3">
                    {c.experience.map((exp, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-[#fbfbfd] dark:bg-[#20232b] border border-black/[0.05] dark:border-white/[0.06]"
                      >
                        <div className="flex justify-between items-start mb-1 flex-wrap gap-2">
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-[#f5f5f7] text-sm">
                              {exp.title}
                            </h4>
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                              {exp.company}
                            </p>
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-[#86868b] bg-white dark:bg-[#181a20] px-2 py-0.5 rounded border border-slate-200 dark:border-white/[0.08]">
                            {exp.period}
                          </span>
                        </div>

                        {(exp as any).technologies && (exp as any).technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1 my-2">
                            {((exp as any).technologies as string[]).map(t => (
                              <span
                                key={t}
                                className="px-2 py-0.5 rounded-md bg-white dark:bg-[#181a20] text-[10px] font-semibold text-slate-600 dark:text-[#a1a1a6] border border-slate-200 dark:border-white/[0.1]"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}

                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {exp.description}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06] text-xs text-slate-500 italic">
                    Candidate has not completed prior commercial internships; background is based on personal & academic software portfolios.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: RESUME EVIDENCE & INGESTION LOGS */}
          {activeTab === 'evidence' && (
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-[#f5f5f7] block">
                  Direct Resume Textual Citations
                </span>
                <p className="text-xs text-slate-500 dark:text-[#a1a1a6] mt-0.5">
                  Verbatim snippets extracted from the candidate's resume confirming skills:
                </p>

                <div className="space-y-2.5 pt-2">
                  {candidate.evidenceSnippets?.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-[#fbfbfd] dark:bg-[#20232b] border border-black/[0.05] dark:border-white/[0.06]"
                    >
                      <span className="font-bold text-[#0071e3] dark:text-sky-400 text-xs block mb-1">
                        Skill Verified: {item.skill}
                      </span>
                      <blockquote className="text-[11px] text-slate-700 dark:text-slate-300 font-mono bg-white dark:bg-[#181a20] p-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] leading-relaxed">
                        "{item.snippet}"
                      </blockquote>
                    </div>
                  ))}
                </div>
              </div>

              {candidate.formattingLogs && candidate.formattingLogs.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-800/60">
                  <span className="font-bold text-sky-900 dark:text-sky-200 text-xs block mb-1">
                    Resilient Ingestion & Normalization Logs:
                  </span>
                  <ul className="list-disc list-inside text-[11px] text-sky-800 dark:text-sky-300 space-y-0.5">
                    {candidate.formattingLogs.map((l, i) => (
                      <li key={i}>{l.detail}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <span className="font-bold text-slate-900 dark:text-[#f5f5f7] text-xs block mb-1.5">
                  Full Raw Resume Text:
                </span>
                <pre className="p-4 rounded-2xl bg-[#fbfbfd] dark:bg-[#20232b] border border-slate-200 dark:border-white/[0.08] font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                  {c.rawText}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-black/[0.06] dark:border-white/[0.08] bg-[#fbfbfd] dark:bg-[#15161a] flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              onCompare(candidate);
            }}
            className="px-4 py-2 rounded-full text-xs font-semibold text-slate-700 dark:text-[#ededf0] bg-white dark:bg-[#181a20] hover:bg-slate-50 dark:hover:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <GitCompare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Compare Head-to-Head</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full text-xs font-semibold bg-[#1d1d1f] dark:bg-white hover:bg-black dark:hover:bg-slate-100 text-white dark:text-[#121316] transition cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
