import React, { useState, useEffect } from 'react';
import { Suggestion } from '../types';

interface SuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (selectedSuggestions: Suggestion[]) => void;
  onSaveToNotes: (suggestion: Suggestion) => void;
  suggestions: Suggestion[];
  isLoading: boolean;
  error: string | null;
  title: string;
}

const SuggestionItem: React.FC<{
    suggestion: Suggestion;
    isSelected: boolean;
    onToggle: (title: string) => void;
    onSave: (suggestion: Suggestion) => void;
}> = ({ suggestion, isSelected, onToggle, onSave }) => {
    const [copied, setCopied] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(`${suggestion.title}\n\n${suggestion.description}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSave(suggestion);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div
            className={`p-3 rounded-lg cursor-pointer transition-all duration-200 relative glass glass-subtle ${isSelected ? 'ring-2 ring-cyan-500' : 'hover:bg-slate-700/50'}`}
            onClick={() => onToggle(suggestion.title)}
        >
            <div className="flex items-start pr-20">
                <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    className="form-checkbox h-5 w-5 mt-1 rounded bg-slate-600 border-slate-500 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                />
                <div className="ml-3">
                    <h4 className="font-semibold text-slate-100">{suggestion.title}</h4>
                    <p className="text-slate-400 text-sm">{suggestion.description}</p>
                </div>
            </div>
            <div className="absolute top-3 right-3 flex items-center space-x-2">
                <button onClick={handleSave} title="Save to Notes" className="text-slate-400 hover:text-cyan-400 transition-colors">
                    {saved ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v12l-5-3-5 3V4z" /></svg>
                    )}
                </button>
                <button onClick={handleCopy} title="Copy to Clipboard" className="text-slate-400 hover:text-cyan-400 transition-colors">
                    {copied ? (
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" /><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" /></svg>
                    )}
                </button>
            </div>
        </div>
    );
};


const SuggestionModal: React.FC<SuggestionModalProps> = ({ isOpen, onClose, onApply, onSaveToNotes, suggestions, isLoading, error, title }) => {
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      setSelected({});
    }
  }, [isOpen]);

  const handleToggle = (title: string) => {
    setSelected(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const handleApplyClick = () => {
    const selectedSuggestions = suggestions.filter(s => selected[s.title]);
    onApply(selectedSuggestions);
  };
  
  if (!isOpen) return null;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-cyan-400 mb-4"></div>
            <p className="text-slate-300">Generating suggestions with Gemini...</p>
        </div>
      );
    }
    if (error) {
      return <div className="p-6 text-center text-red-400 bg-red-900/30 rounded-md">{error}</div>;
    }
    if (suggestions.length === 0) {
      return (
        <div className="p-6 text-center text-slate-400">
            <p>No actionable suggestions were generated.</p>
            <p className="text-sm mt-1">Try refining the original task text for better results.</p>
        </div>
      );
    }
    return (
      <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1 pr-4">
        {suggestions.map((suggestion) => (
          <SuggestionItem
            key={suggestion.title}
            suggestion={suggestion}
            isSelected={!!selected[suggestion.title]}
            onToggle={handleToggle}
            onSave={onSaveToNotes}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass glass-strong w-full max-w-2xl flex flex-col">
        <header className="flex justify-between items-center p-4 border-b border-slate-700/50">
          <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 capitalize">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
        </header>
        <main className="p-6">
            {renderContent()}
        </main>
        {!isLoading && !error && suggestions.length > 0 && (
            <footer className="flex justify-end p-4 border-t border-slate-700/50 bg-slate-900/30 rounded-b-lg">
                <button onClick={onClose} className="px-4 py-2 text-slate-300 font-semibold rounded-md hover:bg-slate-700 transition-colors">
                    Cancel
                </button>
                <button
                    onClick={handleApplyClick}
                    disabled={Object.values(selected).every(v => !v)}
                    className="ml-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                    Apply Suggestions
                </button>
            </footer>
        )}
      </div>
    </div>
  );
};

export default SuggestionModal;