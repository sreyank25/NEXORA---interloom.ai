import React, { useState, useEffect } from 'react';
import { X, Check, Briefcase, Building2, MapPin, Tag, FileText, Sparkles, Plus, Trash2 } from 'lucide-react';
import { JobDescription } from '../types';

interface JDEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (jd: JobDescription) => void;
  initialJD?: JobDescription | null;
  mode: 'create' | 'edit';
}

export const JDEditModal: React.FC<JDEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialJD,
  mode,
}) => {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [department, setDepartment] = useState('');
  const [employmentType, setEmploymentType] = useState('Full-time Internship (6 Months)');
  const [experienceLevel, setExperienceLevel] = useState('Student / Recent Graduate');
  const [summary, setSummary] = useState('');
  
  // Skills
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [newRequiredSkill, setNewRequiredSkill] = useState('');
  const [preferredSkills, setPreferredSkills] = useState<string[]>([]);
  const [newPreferredSkill, setNewPreferredSkill] = useState('');

  // Responsibilities & Qualifications
  const [responsibilitiesText, setResponsibilitiesText] = useState('');
  const [qualificationsText, setQualificationsText] = useState('');
  const [rawText, setRawText] = useState('');

  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setValidationError(null);
      if (mode === 'edit' && initialJD) {
        setTitle(initialJD.title);
        setCompany(initialJD.company);
        setLocation(initialJD.location);
        setDepartment(initialJD.department || 'Engineering');
        setEmploymentType(initialJD.employmentType || 'Full-time Internship (6 Months)');
        setExperienceLevel(initialJD.experienceLevel || 'Student / Recent Graduate');
        setSummary(initialJD.summary || '');
        setRequiredSkills([...initialJD.requiredSkills]);
        setPreferredSkills([...initialJD.preferredSkills]);
        setResponsibilitiesText((initialJD.responsibilities || []).join('\n'));
        setQualificationsText((initialJD.qualifications || []).join('\n'));
        setRawText(initialJD.rawText || '');
      } else {
        // Default blank form for new role
        setTitle('');
        setCompany('TechNova Solutions');
        setLocation('Bangalore, India (Hybrid)');
        setDepartment('Engineering');
        setEmploymentType('Full-time Internship (6 Months)');
        setExperienceLevel('Student / Recent Graduate');
        setSummary('');
        setRequiredSkills(['React', 'TypeScript', 'Node.js', 'REST APIs', 'Git']);
        setPreferredSkills(['Docker', 'TailwindCSS']);
        setResponsibilitiesText(
          'Develop reusable user interfaces using React and TypeScript\nBuild and maintain server-side RESTful API microservices\nCollaborate with product designers and senior engineers'
        );
        setQualificationsText(
          'Pursuing or completed B.Tech / B.E. / M.Tech in CS or related field\nGood grasp of data structures, algorithms, and web fundamentals'
        );
        setRawText('');
      }
    }
  }, [isOpen, initialJD, mode]);

  if (!isOpen) return null;

  const handleAddRequiredSkill = () => {
    const trimmed = newRequiredSkill.trim();
    if (trimmed && !requiredSkills.includes(trimmed)) {
      setRequiredSkills([...requiredSkills, trimmed]);
      setNewRequiredSkill('');
    }
  };

  const handleRemoveRequiredSkill = (skill: string) => {
    setRequiredSkills(requiredSkills.filter(s => s !== skill));
  };

  const handleAddPreferredSkill = () => {
    const trimmed = newPreferredSkill.trim();
    if (trimmed && !preferredSkills.includes(trimmed)) {
      setPreferredSkills([...preferredSkills, trimmed]);
      setNewPreferredSkill('');
    }
  };

  const handleRemovePreferredSkill = (skill: string) => {
    setPreferredSkills(preferredSkills.filter(s => s !== skill));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError('Job title is required.');
      return;
    }
    if (requiredSkills.length === 0) {
      setValidationError('Please specify at least one required skill.');
      return;
    }

    const responsibilities = responsibilitiesText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const qualifications = qualificationsText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const formattedRawText = rawText.trim()
      ? rawText
      : `${company} — Job Description\nPosition: ${title}\nLocation: ${location}\nDepartment: ${department}\n\nKey Requirements:\n- Required Skills: ${requiredSkills.join(', ')}\n- Preferred Skills: ${preferredSkills.join(', ')}\n\nResponsibilities:\n${responsibilities.map(r => `- ${r}`).join('\n')}\n\nQualifications:\n${qualifications.map(q => `- ${q}`).join('\n')}`;

    const updatedJD: JobDescription = {
      id: mode === 'edit' && initialJD ? initialJD.id : `jd-custom-${Date.now()}`,
      title: title.trim(),
      company: company.trim() || 'TechNova Solutions',
      location: location.trim() || 'Hybrid',
      department: department.trim() || 'Engineering',
      employmentType: employmentType.trim() || 'Full-time Internship',
      experienceLevel: experienceLevel.trim() || 'Student / Recent Graduate',
      summary: summary.trim() || `${company} is seeking an ambitious ${title} to join our team.`,
      requiredSkills,
      preferredSkills,
      responsibilities,
      qualifications,
      rawText: formattedRawText,
    };

    onSave(updatedJD);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-[#181a20] border border-slate-200 dark:border-white/[0.1] rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl dark:shadow-[0_24px_64px_rgba(0,0,0,0.5)] overflow-hidden my-8">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between bg-slate-50/80 dark:bg-[#15161a]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#0071e3]/10 dark:bg-sky-950/60 text-[#0071e3] dark:text-sky-400 border border-sky-200 dark:border-sky-800/60">
              <Briefcase className="w-5 h-5 text-[#0071e3] dark:text-sky-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-[#f5f5f7] tracking-tight flex items-center gap-2">
                {mode === 'edit' ? 'Edit Job Description' : 'Add New Job Description'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#a1a1a6]">
                {mode === 'edit'
                  ? 'Update requirements, core skills, and parameters for candidate ranking.'
                  : 'Define a custom role specification with required competencies.'}
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
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1 text-xs">
          
          {validationError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-rose-700 dark:text-rose-300 font-medium">
              {validationError}
            </div>
          )}

          {/* Basic Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Role Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Cloud Platform Engineer Intern"
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#20232b] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] transition text-xs font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Company / Organization
              </label>
              <input
                type="text"
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="e.g. TechNova Solutions"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#20232b] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] transition text-xs font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Bengaluru / Remote (Hybrid)"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#20232b] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] transition text-xs font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                placeholder="e.g. Platform Engineering"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#20232b] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] transition text-xs font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Employment Type
              </label>
              <input
                type="text"
                value={employmentType}
                onChange={e => setEmploymentType(e.target.value)}
                placeholder="e.g. Full-time Internship (6 Months)"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#20232b] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] transition text-xs font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Experience Level
              </label>
              <input
                type="text"
                value={experienceLevel}
                onChange={e => setExperienceLevel(e.target.value)}
                placeholder="e.g. Student / Recent Graduate"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#20232b] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] transition text-xs font-medium"
              />
            </div>
          </div>

          {/* Role Summary */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Role Summary
            </label>
            <textarea
              rows={2}
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="Brief summary of the role objectives and expectations..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#20232b] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] transition text-xs leading-relaxed"
            />
          </div>

          {/* Required Skills (Tag Manager) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Core Required Skills <span className="text-rose-500">*</span>
                <span className="text-[10px] text-slate-500 dark:text-[#86868b] font-normal ml-1.5">
                  (Crucial for keyword & semantic scoring)
                </span>
              </label>
              <span className="text-[10px] text-slate-500 dark:text-[#86868b] font-medium">
                {requiredSkills.length} skills added
              </span>
            </div>

            {/* Tags preview */}
            <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-[#20232b] border border-slate-200 dark:border-white/[0.08] min-h-[44px]">
              {requiredSkills.map(skill => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-semibold text-xs"
                >
                  ✓ {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveRequiredSkill(skill)}
                    className="hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer ml-0.5"
                    title={`Remove ${skill}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {requiredSkills.length === 0 && (
                <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                  No required skills yet. Type below and click Add or press Enter.
                </span>
              )}
            </div>

            {/* Tag adder */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newRequiredSkill}
                onChange={e => setNewRequiredSkill(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddRequiredSkill();
                  }
                }}
                placeholder="Add a required skill (e.g. Python, Docker, Kubernetes)..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#20232b] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] transition text-xs font-medium"
              />
              <button
                type="button"
                onClick={handleAddRequiredSkill}
                className="px-3.5 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold text-xs transition flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Skill</span>
              </button>
            </div>
          </div>

          {/* Preferred Skills (Tag Manager) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Preferred / Bonus Skills
                <span className="text-[10px] text-slate-500 dark:text-[#86868b] font-normal ml-1.5">
                  (Bonus weight in matching)
                </span>
              </label>
              <span className="text-[10px] text-slate-500 dark:text-[#86868b] font-medium">
                {preferredSkills.length} skills added
              </span>
            </div>

            {/* Tags preview */}
            <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-[#20232b] border border-slate-200 dark:border-white/[0.08] min-h-[44px]">
              {preferredSkills.map(skill => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 font-semibold text-xs"
                >
                  ★ {skill}
                  <button
                    type="button"
                    onClick={() => handleRemovePreferredSkill(skill)}
                    className="hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer ml-0.5"
                    title={`Remove ${skill}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {preferredSkills.length === 0 && (
                <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                  No preferred skills added yet.
                </span>
              )}
            </div>

            {/* Tag adder */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newPreferredSkill}
                onChange={e => setNewPreferredSkill(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPreferredSkill();
                  }
                }}
                placeholder="Add a preferred skill (e.g. AWS, CI/CD, Redis)..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#20232b] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] transition text-xs font-medium"
              />
              <button
                type="button"
                onClick={handleAddPreferredSkill}
                className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-white/[0.1] hover:bg-slate-300 dark:hover:bg-white/[0.15] text-slate-800 dark:text-slate-200 font-semibold text-xs transition flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Bonus Skill</span>
              </button>
            </div>
          </div>

          {/* Responsibilities & Qualifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Key Responsibilities (One per line)
              </label>
              <textarea
                rows={4}
                value={responsibilitiesText}
                onChange={e => setResponsibilitiesText(e.target.value)}
                placeholder="Write one responsibility per line..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#20232b] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] transition text-xs leading-relaxed"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Qualifications & Eligibility (One per line)
              </label>
              <textarea
                rows={4}
                value={qualificationsText}
                onChange={e => setQualificationsText(e.target.value)}
                placeholder="Write one qualification per line..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#20232b] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] transition text-xs leading-relaxed"
              />
            </div>
          </div>

          {/* Optional Raw Text Override */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Full Document Raw Text (Optional)
            </label>
            <textarea
              rows={4}
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder="Leave empty to auto-generate from the fields above, or paste complete JD text here..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#20232b] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] transition text-xs font-mono leading-relaxed"
            />
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-white/[0.08] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#20232b] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 font-semibold text-xs border border-slate-200 dark:border-white/[0.1] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{mode === 'edit' ? 'Save Changes' : 'Create Job Description'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
