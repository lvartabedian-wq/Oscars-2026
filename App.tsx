
import React, { useState, useEffect, useCallback } from 'react';
import { OSCAR_DATA } from './constants';
import { Selections } from './types';
import CategorySection from './components/CategorySection';
import { getAICommentary } from './services/geminiService';

const App: React.FC = () => {
  // Persistence: Load from localStorage
  const [userName, setUserName] = useState(() => localStorage.getItem('oscar_pool_name') || '');
  const [selections, setSelections] = useState<Selections>(() => {
    const saved = localStorage.getItem('oscar_pool_selections');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [aiReview, setAiReview] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('oscar_pool_name', userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem('oscar_pool_selections', JSON.stringify(selections));
  }, [selections]);

  const categories = Object.keys(OSCAR_DATA);
  const totalCategories = categories.length;
  const selectionsMade = Object.keys(selections).length;
  const progressPercent = Math.round((selectionsMade / totalCategories) * 100);

  const handleSelect = (category: string, nominee: string) => {
    if (isSubmitted) return; // Prevent changes after submission
    setSelections(prev => ({
      ...prev,
      [category]: nominee
    }));
  };

  const handleClearBallot = () => {
    if (isSubmitted) return;
    if (window.confirm("Are you sure you want to clear your entire ballot?")) {
      setSelections({});
    }
  };

  const generateSummaryText = useCallback(() => {
    let summary = `🏆 OSCARS 2026: ${userName.toUpperCase()}'S BALLOT\n`;
    summary += `--------------------------------------------------\n`;
    categories.forEach((cat) => {
      const pick = selections[cat] || "---";
      summary += `${cat}: ${pick}\n`;
    });
    if (aiReview) {
      summary += `\n🤖 AI CRITIC SAYS:\n"${aiReview}"\n`;
    }
    summary += `\nShared via Workplace Oscar Pool '26`;
    return summary;
  }, [userName, selections, aiReview, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // We no longer manually check userName.trim() here because the 
    // 'required' attribute on the input handles this automatically
    // via browser-native validation before this function is called.

    if (selectionsMade < totalCategories) {
      alert(`You still have ${totalCategories - selectionsMade} categories left to vote on!`);
      // Scroll to the first missing category for UX
      const firstMissing = categories.find(cat => !selections[cat]);
      if (firstMissing) {
        const el = document.getElementById(`category-${firstMissing}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    // Prepare Form Data for Formspree
    const formData = new FormData();
    formData.append('Name', userName);
    formData.append('_subject', 'New Oscar Prediction Submission');
    Object.entries(selections).forEach(([category, nominee]) => {
      formData.append(category, nominee as string);
    });

    try {
      // Submit to Formspree via AJAX
      const formResponse = await fetch("https://formspree.io/f/xbdoelbe", {
        method: "POST",
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!formResponse.ok) {
        throw new Error("Form submission failed. Please try again.");
      }

      setIsSubmitted(true);
      setShowSummary(true);

      setLoadingAI(true);
      const review = await getAICommentary(userName, selections);
      setAiReview(review);
    } catch (e: any) {
      console.error(e);
      setServerError(e.message || "Something went wrong.");
      alert("There was an error sending your predictions. Please check your connection and try again.");
    } finally {
      setLoadingAI(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black">
      <form onSubmit={handleSubmit} action="https://formspree.io/f/xbdoelbe" method="POST">
        <input type="hidden" name="_subject" value="New Oscar Prediction Submission" />
        {categories.map(cat => (
          <input key={`hidden-${cat}`} type="hidden" name={cat} value={selections[cat] || ''} />
        ))}

        <header className="max-w-7xl mx-auto px-6 pt-12 md:pt-24 mb-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b-2 border-white pb-12">
            <div className="flex-1">
              <h1 className="text-7xl md:text-[11rem] font-black leading-[0.75] tracking-tighter uppercase">
                Oscars<br />2026
              </h1>
              <div className="flex items-center gap-4 mt-8">
                <span className="bg-white text-black text-[10px] font-black px-2 py-0.5 uppercase">2026 Edition</span>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
                  Official Office Prediction Tracker
                </p>
              </div>
            </div>
            
            <div className="w-full md:w-96">
              <label className="block text-[10px] font-black uppercase tracking-widest mb-3 text-zinc-500">
                Contestant Name
              </label>
              <input
                type="text"
                name="Name"
                placeholder="YOUR NAME HERE"
                required
                disabled={isSubmitted}
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className={`w-full bg-transparent border-b-2 border-zinc-800 p-2 font-black uppercase text-3xl focus:outline-none focus:border-white transition-all placeholder:text-zinc-800 ${isSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 pb-40">
          {categories.map((cat) => (
            <div key={cat} id={`category-${cat}`}>
              <CategorySection
                categoryName={cat}
                nominees={OSCAR_DATA[cat]}
                selectedNominee={selections[cat]}
                onSelect={(nominee) => handleSelect(cat, nominee)}
              />
            </div>
          ))}

          {!isSubmitted && (
            <div className="flex justify-center mt-12">
              <button 
                type="button"
                onClick={handleClearBallot}
                className="text-zinc-600 hover:text-red-500 font-bold uppercase tracking-widest text-xs transition-colors"
              >
                Reset All Selections
              </button>
            </div>
          )}
        </main>

        <footer className="fixed bottom-0 left-0 w-full bg-black/80 backdrop-blur-md border-t border-zinc-800 p-6 md:p-8 z-40">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6 w-full md:w-auto">
              <div className="text-left">
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{isSubmitted ? 'Locked' : 'Filled'}</p>
                <p className="text-2xl md:text-3xl font-black tabular-nums">{selectionsMade}<span className="text-zinc-700">/{totalCategories}</span></p>
              </div>
              <div className="h-12 w-1 bg-zinc-800 hidden md:block" />
              <div className="flex-1 md:w-48 bg-zinc-900 h-1.5 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-700 ease-out ${isSubmitted ? 'bg-green-500' : 'bg-white'}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {isSubmitted ? (
              <div className="w-full md:w-auto text-center md:text-right animate-in fade-in slide-in-from-bottom-2 duration-700">
                <p className="font-black text-sm md:text-xl uppercase tracking-tight leading-tight">
                  Predictions sent to the greatest person in this agency: <span className="text-white border-b border-white">lvartabedian@the-8agency.com</span> 👑
                </p>
              </div>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className={`
                  w-full md:w-auto px-16 py-5 font-black uppercase text-xl transition-all active:scale-95
                  ${selectionsMade > 0 
                    ? 'bg-white text-black hover:bg-zinc-200' 
                    : 'bg-zinc-900 text-zinc-700 border border-zinc-800'}
                  ${isSubmitting ? 'animate-pulse' : ''}
                `}
              >
                {isSubmitting ? 'Sending...' : 'Send Predictions'}
              </button>
            )}
          </div>
        </footer>
      </form>

      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/98 backdrop-blur-2xl transition-opacity animate-in fade-in duration-300">
          <div className="max-w-3xl w-full bg-[#111] border-zinc-800 border-2 p-8 md:p-16 relative shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 p-8">
              <button 
                onClick={() => setShowSummary(false)}
                className="text-zinc-600 hover:text-white transition-colors p-2"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-12">
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-4">
                Ballot<br />Submitted.
              </h2>
              <div className="h-1 w-24 bg-green-500" />
              <p className="mt-4 text-white font-black uppercase tracking-widest text-sm leading-relaxed">
                Predictions sent to the greatest person in this agency:<br />
                <span className="underline">lvartabedian@the-8agency.com</span> 👑
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
              <div className="max-h-[40vh] overflow-y-auto pr-6 custom-scrollbar bg-black/40 p-6 border border-zinc-800">
                <p className="text-[10px] font-black uppercase tracking-widest mb-6 text-zinc-500 border-b border-zinc-800 pb-2">Your Record</p>
                <pre className="text-[11px] leading-relaxed font-mono text-zinc-300 whitespace-pre-wrap">
                  {generateSummaryText()}
                </pre>
              </div>

              <div className="flex flex-col justify-center">
                {loadingAI ? (
                  <div className="flex flex-col items-center justify-center gap-4 text-zinc-500 py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent" />
                    <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Consulting the Critics...</span>
                  </div>
                ) : (
                  <div className="p-8 bg-white text-black relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                      <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C20.1216 16 21.017 16.8954 21.017 18V21H14.017ZM14.017 21C12.9124 21 12.017 20.1046 12.017 19V12C12.017 10.8954 12.9124 10 14.017 10H17.017C18.1216 10 19.017 10.8954 19.017 12V15M3 21V18C3 16.8954 3.89543 16 5 16H8C9.10457 16 10 16.8954 10 18V21H3ZM3 21C1.89543 21 1 20.1046 1 19V12C1 10.8954 1.89543 10 3 10H6C7.10457 10 8 10.8954 8 12V15" /></svg>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-40">AI Critique</p>
                    <p className="font-bold text-xl md:text-2xl leading-tight italic">
                      "{aiReview || "The Academy is speechless."}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => setShowSummary(false)}
                className="w-full py-6 font-black uppercase text-2xl transition-all active:scale-[0.98] bg-white text-black hover:bg-zinc-200"
              >
                Close Ballot
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="h-40" />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #666;
        }
      `}</style>
    </div>
  );
};

export default App;
