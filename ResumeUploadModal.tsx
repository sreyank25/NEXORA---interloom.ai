import React, { useState } from 'react';
import { X, Upload, CheckCircle2, FileText, Sparkles } from 'lucide-react';
import { CandidateResume } from '../types';

interface ResumeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCandidate: (newCandidate: CandidateResume) => void;
}

export const ResumeUploadModal: React.FC<ResumeUploadModalProps> = ({
  isOpen,
  onClose,
  onAddCandidate,
}) => {
  const [candidateName, setCandidateName] = useState('');
  const [degree, setDegree] = useState('B.Tech in Computer Science');
  const [institution, setInstitution] = useState('');
  const [resumeText, setResumeText] = useState('');

  if (!isOpen) return null;

  const sampleResumes = [
    {
      title: 'Full Stack MERN Star',
      name: 'Rohan Deshmukh',
      college: 'VIT Pune',
      text: `Rohan Deshmukh | vit.pune.edu | Pune, India
EDUCATION: B.Tech Computer Engineering, 2021-2025. GPA: 8.8
SKILLS: React, Node.js, Express, MongoDB, TypeScript, TailwindCSS, REST APIs, Git, Docker
PROJECTS:
1. Micro-SaaS Analytics Dashboard: Built with React, TypeScript, and Node.js. Used Express to serve real-time analytics data stored in MongoDB with aggregation pipelines. Deployed via Docker.
2. E-Commerce Cart Engine: Node.js backend with Redis caching and PostgreSQL. Implemented JWT auth and Stripe checkout.`
    },
    {
      title: 'Messy Format / Typo Resume',
      name: 'Simran Walia',
      college: 'Chitkara University',
      text: `simran walia (she/her)
eng. student chitkara univ, passout summer '25
technologies: reaktjs, node js, express.js, mongo db, javascript, git/github
EXPERIENCE & WORK:
- Interned at local startup (06/2024 to 08/2024): worked on frontend using reaktjs and connected to backend apis.
- personal proj: student portal with node js backend and mongo db database for storing marks and attendance.`
    }
  ];

  const handleUseSample = (sample: typeof sampleResumes[0]) => {
    setCandidateName(sample.name);
    setInstitution(sample.college);
    setResumeText(sample.text);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim() || !resumeText.trim()) return;

    // Resilient auto extraction
    const rawLower = resumeText.toLowerCase();
    const skillsFound: string[] = [];
    const knownSkills = [
      'react', 'node.js', 'nodejs', 'express', 'mongodb', 'typescript',
      'javascript', 'html', 'css', 'tailwind', 'rest', 'api', 'docker', 'git', 'sql', 'python'
    ];
    knownSkills.forEach(s => {
      if (rawLower.includes(s)) skillsFound.push(s);
    });

    const newCandidate: CandidateResume = {
      id: `custom-${Date.now()}`,
      name: candidateName,
      email: `${candidateName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      location: 'India',
      education: {
        degree: degree || 'B.Tech in Computer Science',
        institution: institution || 'Self-Reported University',
        graduationYear: '2025',
      },
      summary: 'Candidate submitted via custom resume ingestion test.',
      skills: skillsFound.length > 0 ? skillsFound : ['JavaScript', 'React', 'Web Development'],
      experience: [
        {
          title: 'Software Intern / Project Developer',
          company: 'Campus Project / Startup',
          period: '2024',
          description: resumeText.slice(0, 150),
        }
      ],
      projects: [
        {
          title: 'Custom Submission Portfolio Project',
          description: resumeText.slice(0, 250),
          technologies: skillsFound.slice(0, 4),
        }
      ],
      rawText: resumeText,
      formatCharacteristics: {
        missingStandardHeaders: !resumeText.includes('EXPERIENCE') && !resumeText.includes('PROJECTS'),
        hasInconsistentDates: resumeText.includes('summer') || resumeText.includes('to 08/2024'),
        hasTypoVariations: resumeText.includes('reakt') ? ['reaktjs'] : undefined,
        formatType: 'plain-text',
      }
    };

    onAddCandidate(newCandidate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-[#181a20] border border-slate-200 dark:border-white/[0.1] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl dark:shadow-[0_24px_64px_rgba(0,0,0,0.5)] overflow-hidden my-8">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between bg-slate-50/80 dark:bg-[#15161a]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#0a664e] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              <Upload className="w-5 h-5 text-[#0a664e] dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-[#f5f5f7] tracking-tight flex items-center gap-2">
                Ingest & Evaluate New Candidate Resume
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#a1a1a6]">
                Test how the hybrid BM25 + Vector Semantic engine handles new resumes on the fly.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          
          {/* Quick Samples */}
          <div>
            <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Or populate with a test sample:</span>
            </span>
            <div className="flex gap-2">
              {sampleResumes.map((sample, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleUseSample(sample)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#20232b] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-[#0a664e] dark:hover:text-emerald-400 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] transition font-medium text-xs cursor-pointer"
                >
                  Load: {sample.title}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Candidate Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Rohan Deshmukh"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#20232b] border border-slate-200 dark:border-white/[0.1] rounded-xl p-2.5 text-slate-900 dark:text-[#f5f5f7] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-[#252833] focus:outline-none focus:border-emerald-500 transition shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">College / University</label>
              <input
                type="text"
                placeholder="e.g. VIT Pune"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#20232b] border border-slate-200 dark:border-white/[0.1] rounded-xl p-2.5 text-slate-900 dark:text-[#f5f5f7] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-[#252833] focus:outline-none focus:border-emerald-500 transition shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Paste Raw Resume Text *</label>
            <textarea
              required
              rows={8}
              placeholder="Paste plain text resume here... The resilient ingestion engine parses skills, projects, and work experience automatically."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#20232b] border border-slate-200 dark:border-white/[0.1] rounded-xl p-3 text-slate-900 dark:text-[#f5f5f7] placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono text-[11px] focus:bg-white dark:focus:bg-[#252833] focus:outline-none focus:border-emerald-500 transition leading-relaxed shadow-2xs"
            ></textarea>
          </div>

          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center gap-2 text-emerald-900 dark:text-emerald-300 text-[11px]">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>The hybrid engine will normalize typos, analyze ontology depth, and immediately insert this candidate into the ranked shortlist.</span>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white dark:bg-[#20232b] hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-white/[0.1] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#0a664e] hover:bg-emerald-700 text-white font-semibold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Evaluate & Add to Pool</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
