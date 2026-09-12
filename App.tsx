import React, { useState, useMemo, useEffect } from 'react';
import { sampleJobDescription, sampleCandidates, benchmarkJobDescriptions } from './data/sampleData';
import { evaluateCandidates } from './services/matchingEngine';
import { JobDescription, CandidateResume, CandidateMatchResult, ScoringWeights, CandidateDetailedAnalysis } from './types';
import { Navbar, AppStage } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { JDUploadStage } from './components/JDUploadStage';
import { ResumeUploadStage } from './components/ResumeUploadStage';
import { AnalysisExperience } from './components/AnalysisExperience';
import { ShortlistSection } from './components/ShortlistSection';
import { CandidateDetailModal } from './components/CandidateDetailModal';
import { CandidateComparisonModal } from './components/CandidateComparisonModal';
import { RecruiterChatDrawer } from './components/RecruiterChatDrawer';
import { AlgorithmInspectorModal } from './components/AlgorithmInspectorModal';
import { BiasScannerModal } from './components/BiasScannerModal';
import { ResumeUploadModal } from './components/ResumeUploadModal';
import { JDViewerModal } from './components/JDViewerModal';
import { JDEditModal } from './components/JDEditModal';
import { Check } from 'lucide-react';

export default function App() {
  // 1. Navigation & Stage State
  const [currentStage, setCurrentStage] = useState<AppStage>('landing');

  // 2. Core Model State (Preserving all logic & data, with multi-JD state & persistence)
  const [allJobDescriptions, setAllJobDescriptions] = useState<JobDescription[]>(() => {
    try {
      const saved = localStorage.getItem('internloom_job_descriptions');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading saved job descriptions', e);
    }
    return benchmarkJobDescriptions;
  });

  const [jobDescription, setJobDescription] = useState<JobDescription | null>(() => {
    return allJobDescriptions[0] || null;
  });

  // Sync allJobDescriptions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('internloom_job_descriptions', JSON.stringify(allJobDescriptions));
    } catch (e) {
      console.error('Error saving job descriptions', e);
    }
  }, [allJobDescriptions]);

  const [candidates, setCandidates] = useState<CandidateResume[]>(() => {
    try {
      const saved = localStorage.getItem('internloom_candidates');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Clean out any legacy mock placeholder resumes from before the real parser was wired
          const cleaned = parsed.filter(c => c.summary !== 'Newly uploaded candidate resume parsed via InternLoom ingestion layer.');
          return cleaned.length > 0 ? cleaned : sampleCandidates;
        }
      }
    } catch (e) {
      console.error('Error loading saved candidates', e);
    }
    return sampleCandidates;
  });

  // Sync candidates to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('internloom_candidates', JSON.stringify(candidates));
    } catch (e) {
      console.error('Error saving candidates', e);
    }
  }, [candidates]);

  const [weights, setWeights] = useState<ScoringWeights>({
    keywordWeight: 0.5,
    semanticWeight: 0.5,
    minScoreFilter: 0,
    mustHaveSkills: [],
  });

  // 3. UI, Modals & Drawers State
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateMatchResult | null>(null);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [compareCandAId, setCompareCandAId] = useState<string | undefined>();
  const [compareCandBId, setCompareCandBId] = useState<string | undefined>();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInitialQuery, setChatInitialQuery] = useState<string | undefined>();
  const [isAlgoModalOpen, setIsAlgoModalOpen] = useState(false);
  const [isBiasModalOpen, setIsBiasModalOpen] = useState(false);
  const [isJDModalOpen, setIsJDModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isJDEditModalOpen, setIsJDEditModalOpen] = useState(false);
  const [jdEditMode, setJdEditMode] = useState<'create' | 'edit'>('create');
  const [jdToEdit, setJdToEdit] = useState<JobDescription | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [customAnalyses, setCustomAnalyses] = useState<Record<string, CandidateDetailedAnalysis>>({});

  // 4. Source of Truth Scoring Calculation (Deterministic Hybrid Engine)
  const rankedResults = useMemo(() => {
    const results = evaluateCandidates(jobDescription, candidates, weights);
    if (Object.keys(customAnalyses).length > 0) {
      return results.map(r => {
        if (customAnalyses[r.candidateId]) {
          return {
            ...r,
            detailedAnalysis: customAnalyses[r.candidateId],
          };
        }
        return r;
      });
    }
    return results;
  }, [jobDescription, candidates, weights, customAnalyses]);

  const handleUpdateCandidateAnalysis = (candidateId: string, updatedAnalysis: CandidateDetailedAnalysis) => {
    setCustomAnalyses(prev => ({
      ...prev,
      [candidateId]: updatedAnalysis,
    }));
    setSelectedCandidate(prev => {
      if (prev && prev.candidateId === candidateId) {
        return {
          ...prev,
          detailedAnalysis: updatedAnalysis,
        };
      }
      return prev;
    });
    showToast('AI Deep Audit complete! Candidate analysis updated.');
  };

  // JD Handlers
  const handleSelectJD = (jd: JobDescription) => {
    setJobDescription(jd);
    showToast(`Active role switched to: ${jd.title}`);
  };

  const handleAddNewJD = () => {
    setJdEditMode('create');
    setJdToEdit(null);
    setIsJDEditModalOpen(true);
  };

  const handleEditJD = (jd: JobDescription) => {
    setJdEditMode('edit');
    setJdToEdit(jd);
    setIsJDEditModalOpen(true);
  };

  const handleSaveJD = (savedJD: JobDescription) => {
    setAllJobDescriptions(prev => {
      const exists = prev.some(item => item.id === savedJD.id);
      if (exists) {
        return prev.map(item => item.id === savedJD.id ? savedJD : item);
      }
      return [...prev, savedJD];
    });

    // If we're updating current JD or creating a new one, make it active
    setJobDescription(savedJD);
    showToast(jdEditMode === 'edit' ? `Updated "${savedJD.title}"` : `Added new role: "${savedJD.title}"`);
  };

  const handleAddMultipleJDs = (newJDs: JobDescription[]) => {
    if (!newJDs || newJDs.length === 0) return;
    setAllJobDescriptions(prev => {
      const existingIds = new Set(prev.map(item => item.id));
      const fresh = newJDs.filter(item => !existingIds.has(item.id));
      return [...fresh, ...prev];
    });
    setJobDescription(newJDs[0]);
    showToast(`Added ${newJDs.length} new job ${newJDs.length === 1 ? 'role' : 'roles'} to your active benchmarks.`);
  };

  const handleDeleteJD = (id: string) => {
    const remaining = allJobDescriptions.filter(jd => jd.id !== id);
    setAllJobDescriptions(remaining);
    if (jobDescription?.id === id) {
      setJobDescription(remaining[0] || null);
    }
    showToast('Job description removed.');
  };

  const handleClearAllJDs = () => {
    setAllJobDescriptions([]);
    setJobDescription(null);
    showToast('All job overviews and descriptions removed.');
  };

  const handleRestoreDefaultJDs = () => {
    setAllJobDescriptions(benchmarkJobDescriptions);
    setJobDescription(benchmarkJobDescriptions[0]);
    showToast('Restored benchmark job roles.');
  };

  // Candidate Handlers
  const handleAddCandidate = (newCand: CandidateResume) => {
    setCandidates(prev => [newCand, ...prev]);
    showToast(`Added ${newCand.name} to candidate pool.`);
  };

  const handleRemoveCandidate = (id: string) => {
    setCandidates(prev => prev.filter(c => c.id !== id));
    showToast('Candidate removed from pool.');
  };

  const handleClearAllCandidates = () => {
    setCandidates([]);
    showToast('All candidate resumes have been removed.');
  };

  const handleRestoreDefaultCandidates = () => {
    setCandidates(sampleCandidates);
    showToast('Restored sample candidate resumes.');
  };

  const handleOpenCompare = (candA?: CandidateMatchResult, candB?: CandidateMatchResult) => {
    if (candA) setCompareCandAId(candA.candidateId);
    if (candB) {
      setCompareCandBId(candB.candidateId);
    } else if (rankedResults.length > 1) {
      const other = rankedResults.find(r => r.candidateId !== candA?.candidateId) || rankedResults[1];
      setCompareCandBId(other.candidateId);
    }
    setIsCompareModalOpen(true);
  };

  const handleAskChatAboutPair = (candA: CandidateMatchResult, candB: CandidateMatchResult) => {
    setChatInitialQuery(`Why is ${candA.candidate.name} ranked higher than ${candB.candidate.name}?`);
    setIsChatOpen(true);
  };

  const handleApplyInclusiveJD = (newJD: JobDescription) => {
    handleSaveJD(newJD);
    showToast('Applied inclusive JD rephrasing! Candidates updated.');
  };

  return (
    <div className="min-h-screen bg-[#fbfbfd] dark:bg-[#121316] text-[#1d1d1f] dark:text-[#f5f5f7] font-sans antialiased selection:bg-[#0071e3] selection:text-white flex flex-col transition-colors duration-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-5 z-50 bg-[#1d1d1f] dark:bg-[#22252e] text-white dark:text-[#f5f5f7] px-4 py-2.5 rounded-full shadow-lg border border-transparent dark:border-white/[0.1] flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Apple-style Navigation Bar */}
      <Navbar
        currentStage={currentStage}
        onStageChange={setCurrentStage}
        candidateCount={candidates.length}
        onOpenChat={() => setIsChatOpen(!isChatOpen)}
        onOpenCompare={() => handleOpenCompare(rankedResults[0], rankedResults[1])}
        onOpenAlgo={() => setIsAlgoModalOpen(true)}
      />

      {/* Stage Views */}
      <main className="flex-1">
        
        {/* STAGE 1: LANDING OVERVIEW */}
        {currentStage === 'landing' && (
          <>
            <HeroSection
              onStartShortlisting={() => setCurrentStage('jd')}
              onSeeHowItWorks={() => {
                const el = document.getElementById('how-it-works');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              candidateCount={candidates.length}
              topCandidate={rankedResults[0] || null}
              jobDescription={jobDescription}
            />
            <HowItWorksSection
              onStart={() => setCurrentStage('jd')}
              candidateCount={candidates.length}
              topCandidates={rankedResults}
            />
          </>
        )}

        {/* STAGE 2: JOB DESCRIPTION UPLOAD & SPECIFICATION */}
        {currentStage === 'jd' && (
          <JDUploadStage
            jobDescription={jobDescription}
            allJobDescriptions={allJobDescriptions}
            onSelectJD={handleSelectJD}
            onEditJD={handleEditJD}
            onSaveJD={handleSaveJD}
            onAddMultipleJDs={handleAddMultipleJDs}
            onDeleteJD={handleDeleteJD}
            onClearAllJDs={handleClearAllJDs}
            onRestoreDefaultJDs={handleRestoreDefaultJDs}
            onProceed={() => setCurrentStage('resumes')}
            onOpenBiasScanner={() => setIsBiasModalOpen(true)}
          />
        )}

        {/* STAGE 3: RESUME UPLOAD */}
        {currentStage === 'resumes' && (
          <ResumeUploadStage
            jobDescription={jobDescription}
            candidates={candidates}
            onAddCandidate={handleAddCandidate}
            onRemoveCandidate={handleRemoveCandidate}
            onClearAllCandidates={handleClearAllCandidates}
            onRestoreDefaultCandidates={handleRestoreDefaultCandidates}
            onProceedToAnalyze={() => setCurrentStage('analyzing')}
            onBackToJD={() => setCurrentStage('jd')}
            onOpenCustomModal={() => setIsUploadModalOpen(true)}
          />
        )}

        {/* STAGE 4: CINEMATIC AI ANALYSIS EXPERIENCE */}
        {currentStage === 'analyzing' && (
          <AnalysisExperience
            candidateCount={candidates.length}
            onComplete={() => setCurrentStage('shortlist')}
          />
        )}

        {/* STAGE 5: SHORTLIST RESULTS & DUAL-ENGINE INTELLIGENCE */}
        {currentStage === 'shortlist' && (
          <ShortlistSection
            candidates={rankedResults}
            jobDescription={jobDescription}
            weights={weights}
            onWeightsChange={setWeights}
            onSelectCandidate={(c) => setSelectedCandidate(c)}
            onCompareCandidate={(c) => handleOpenCompare(c)}
            onOpenFormula={() => setIsAlgoModalOpen(true)}
            onOpenChat={() => setIsChatOpen(true)}
            onRestart={() => setCurrentStage('landing')}
            onGoToResumes={() => setCurrentStage('resumes')}
            onRestoreDefaultCandidates={handleRestoreDefaultCandidates}
          />
        )}

      </main>

      {/* Modals & Drawers */}

      {/* Candidate Detail Modal */}
      <CandidateDetailModal
        candidate={selectedCandidate}
        jobDescription={jobDescription}
        onClose={() => setSelectedCandidate(null)}
        onCompare={(c) => {
          setSelectedCandidate(null);
          handleOpenCompare(c);
        }}
        onUpdateAnalysis={handleUpdateCandidateAnalysis}
      />

      {/* Candidate Comparison Modal */}
      <CandidateComparisonModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        candidates={rankedResults}
        initialCandAId={compareCandAId}
        initialCandBId={compareCandBId}
        onAskChatAboutPair={handleAskChatAboutPair}
      />

      {/* AI Recruiter Assistant Drawer */}
      <RecruiterChatDrawer
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setChatInitialQuery(undefined);
        }}
        candidates={rankedResults}
        jd={jobDescription}
        initialQuery={chatInitialQuery}
      />

      {/* Algorithm Transparency Modal */}
      <AlgorithmInspectorModal
        isOpen={isAlgoModalOpen}
        onClose={() => setIsAlgoModalOpen(false)}
        keywordWeight={weights.keywordWeight}
        semanticWeight={weights.semanticWeight}
      />

      {/* JD Bias Scanner Modal */}
      <BiasScannerModal
        isOpen={isBiasModalOpen}
        onClose={() => setIsBiasModalOpen(false)}
        jd={jobDescription}
        onApplyInclusiveJD={handleApplyInclusiveJD}
      />

      {/* Custom Resume Upload Modal */}
      <ResumeUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onAddCandidate={handleAddCandidate}
      />

      {/* JD Viewer Modal */}
      <JDViewerModal
        isOpen={isJDModalOpen}
        onClose={() => setIsJDModalOpen(false)}
        jd={jobDescription}
        onOpenBiasScanner={() => {
          setIsJDModalOpen(false);
          setIsBiasModalOpen(true);
        }}
        onEditJD={handleEditJD}
      />

      {/* JD Create / Edit Modal */}
      <JDEditModal
        isOpen={isJDEditModalOpen}
        onClose={() => setIsJDEditModalOpen(false)}
        onSave={handleSaveJD}
        initialJD={jdToEdit}
        mode={jdEditMode}
      />

    </div>
  );
}
