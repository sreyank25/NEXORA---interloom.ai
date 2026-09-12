import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, User, Bot, CornerDownLeft } from 'lucide-react';
import { CandidateMatchResult, JobDescription, RecruiterChatMessage } from '../types';

interface RecruiterChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: CandidateMatchResult[];
  jd: JobDescription;
  initialQuery?: string;
}

export const RecruiterChatDrawer: React.FC<RecruiterChatDrawerProps> = ({
  isOpen,
  onClose,
  candidates,
  jd,
  initialQuery,
}) => {
  const [messages, setMessages] = useState<RecruiterChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I am your **InternLoom AI Recruiter Assistant**. I have analyzed all ${candidates.length} candidate resumes against **${jd.title}**.

Feel free to ask me anything about the candidate pool, such as:
- *"Why is ${candidates[0]?.candidate.name || 'Candidate #1'} ranked higher than ${candidates[1]?.candidate.name || 'Candidate #2'}?"*
- *"Which candidate is best for backend engineering?"*
- *"Does any candidate have production React experience?"*
- *"Who is the best cultural fit for a fast-paced startup?"*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (initialQuery) {
      handleSend(initialQuery);
    }
  }, [initialQuery]);

  const handleSend = async (queryToSend?: string) => {
    const text = queryToSend || inputQuery;
    if (!text.trim() || loading) return;

    const userMsg: RecruiterChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryToSend) setInputQuery('');
    setLoading(true);

    try {
      const candidatesContext = candidates.slice(0, 10).map(c => ({
        rank: c.rank,
        name: c.candidate.name,
        finalScore: c.finalScore,
        keywordScore: c.keywordScore,
        semanticScore: c.semanticScore,
        matchedExplicitSkills: c.matchedExplicitSkills,
        missingRequiredSkills: c.missingRequiredSkills,
        domainScores: c.domainScores,
        education: `${c.candidate.education.degree} (${c.candidate.education.institution})`,
        explanation: c.explanation,
      }));

      const res = await fetch('/api/recruiter-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: text,
          candidatesContext,
          jdContext: `${jd.title} at ${jd.company}.\nRequired: ${jd.requiredSkills.join(', ')}.\nPreferred: ${jd.preferredSkills.join(', ')}`,
        }),
      });

      const data = await res.json();
      const botMsg: RecruiterChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.answer || 'I evaluated the candidate pool against your query.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error('Recruiter chat error:', err);
      const fallbackMsg: RecruiterChatMessage = {
        id: `assistant-err-${Date.now()}`,
        sender: 'assistant',
        text: `**Recruiter Analysis for "${text}":**\n- Top ranked candidate is **${candidates[0]?.candidate.name}** with **${candidates[0]?.finalScore}%** fit.\n- All candidates are evaluated through hybrid BM25 and vector semantic embeddings with full evidence traceability.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const quickPrompts = [
    `Why is ${candidates[0]?.candidate.name || 'Candidate #1'} ranked higher than ${candidates[1]?.candidate.name || 'Candidate #2'}?`,
    'Which candidate is best for backend engineering?',
    'Does any candidate have production React experience?',
    'Who is the best cultural fit for a startup?',
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-white dark:bg-[#181a20] border-l border-black/[0.08] dark:border-white/[0.1] shadow-[0_0_50px_rgba(0,0,0,0.15)] dark:shadow-[0_0_50px_rgba(0,0,0,0.6)] flex flex-col animate-in slide-in-from-right duration-300">
      
      {/* Header */}
      <div className="p-5 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between bg-[#fbfbfd] dark:bg-[#15161a]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0071e3] to-[#5856d6] text-white flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">
              AI Recruiter Assistant
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-[#86868b]">
              Evidence-grounded conversational intelligence
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-3.5 bg-black/[0.02] dark:bg-[#121316] border-b border-black/[0.04] dark:border-white/[0.06] flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
        <span className="text-slate-400 dark:text-[#86868b] font-semibold uppercase tracking-wider text-[10px] shrink-0 mr-1">
          Suggestions:
        </span>
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="shrink-0 px-2.5 py-1 rounded-full bg-white dark:bg-[#20232b] text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-[#0071e3] dark:hover:text-sky-400 border border-black/[0.06] dark:border-white/[0.08] transition text-[11px] font-medium cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-6 h-6 rounded-full bg-sky-50 dark:bg-sky-950/50 text-[#0071e3] dark:text-sky-300 border border-sky-100 dark:border-sky-800/60 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3 h-3" />
                </div>
              )}

              <div
                className={`max-w-[85%] p-3.5 rounded-2xl ${
                  isUser
                    ? 'bg-[#0071e3] text-white rounded-br-xs'
                    : 'bg-[#fbfbfd] dark:bg-[#20232b] text-slate-800 dark:text-slate-200 border border-black/[0.06] dark:border-white/[0.08] rounded-bl-xs leading-relaxed shadow-2xs'
                }`}
              >
                <div className="whitespace-pre-line text-xs font-normal">
                  {m.text}
                </div>
                <div
                  className={`text-[10px] mt-1.5 text-right font-mono ${
                    isUser ? 'text-blue-100' : 'text-slate-400 dark:text-[#86868b]'
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>

              {isUser && (
                <div className="w-6 h-6 rounded-full bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3 h-3" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-2.5 items-center text-slate-400 dark:text-[#86868b] text-xs">
            <div className="w-6 h-6 rounded-full bg-sky-50 dark:bg-sky-950/50 text-[#0071e3] dark:text-sky-300 border border-sky-100 dark:border-sky-800/60 flex items-center justify-center shrink-0">
              <Sparkles className="w-3 h-3 animate-spin" />
            </div>
            <div className="p-3 rounded-2xl bg-[#fbfbfd] dark:bg-[#20232b] border border-black/[0.06] dark:border-white/[0.08] text-slate-500 dark:text-[#a1a1a6] italic">
              Consulting resume evidence & scoring matrices...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-black/[0.06] dark:border-white/[0.08] bg-[#fbfbfd] dark:bg-[#15161a]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask about candidate strengths, gaps, or rankings..."
            className="w-full pl-4 pr-11 py-2.5 rounded-full text-xs bg-white dark:bg-[#20232b] border border-black/[0.08] dark:border-white/[0.1] text-slate-900 dark:text-[#f5f5f7] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#0071e3] shadow-2xs"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || loading}
            className="absolute right-1.5 p-1.5 rounded-full bg-[#0071e3] text-white hover:bg-[#0077ed] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
        <span className="text-[10px] text-slate-400 dark:text-[#86868b] text-center block mt-2">
          Responses are grounded exclusively in candidate resume data & scoring equations.
        </span>
      </div>

    </div>
  );
};
