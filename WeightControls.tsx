import React from 'react';
import { Sliders, Search, RotateCcw } from 'lucide-react';
import { ScoringWeights } from '../types';

interface WeightControlsProps {
  weights: ScoringWeights;
  onWeightsChange: (newWeights: ScoringWeights) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTier: 'all' | 'strong' | 'medium' | 'weak';
  onTierChange: (tier: 'all' | 'strong' | 'medium' | 'weak') => void;
  onResetWeights: () => void;
}

export const WeightControls: React.FC<WeightControlsProps> = ({
  weights,
  onWeightsChange,
  searchQuery,
  onSearchChange,
  selectedTier,
  onTierChange,
  onResetWeights,
}) => {
  const semanticPercent = Math.round(weights.semanticWeight * 100);
  const keywordPercent = 100 - semanticPercent;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const semanticVal = parseInt(e.target.value, 10);
    const semanticWeight = semanticVal / 100;
    const keywordWeight = (100 - semanticVal) / 100;

    onWeightsChange({
      ...weights,
      semanticWeight,
      keywordWeight,
    });
  };

  const isCustomWeights = weights.semanticWeight !== 0.5 || weights.keywordWeight !== 0.5;

  return (
    <div id="weight-controls-panel" className="bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-4 mb-5 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Weight Balance Slider */}
        <div className="flex-1 max-w-lg">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#0a664e]" />
              <span>Scoring Weight</span>
            </span>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-indigo-700 font-medium">
                Keyword: <strong>{keywordPercent}%</strong>
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-[#0a664e] font-medium">
                Semantic: <strong>{semanticPercent}%</strong>
              </span>
              {isCustomWeights && (
                <button
                  onClick={onResetWeights}
                  className="ml-1 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                  title="Reset to 50/50"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[11px] text-slate-400 select-none">Keyword</span>
            <input
              id="slider-semantic-weight"
              type="range"
              min="10"
              max="90"
              step="5"
              value={semanticPercent}
              onChange={handleSliderChange}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#0a664e] transition-all"
            />
            <span className="text-[11px] text-slate-400 select-none">Semantic</span>
          </div>
        </div>

        {/* Search & Tier Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          
          {/* Search Bar */}
          <div className="relative min-w-[210px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-candidates-input"
              type="text"
              placeholder="Search candidate, skill, college..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Tier Buttons */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 text-xs">
            <button
              onClick={() => onTierChange('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                selectedTier === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => onTierChange('strong')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                selectedTier === 'strong'
                  ? 'bg-[#0a664e] text-white shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Strong (≥75%)
            </button>
            <button
              onClick={() => onTierChange('medium')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                selectedTier === 'medium'
                  ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Medium
            </button>
            <button
              onClick={() => onTierChange('weak')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                selectedTier === 'weak'
                  ? 'bg-amber-600 text-white shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Weak (&lt;50%)
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
