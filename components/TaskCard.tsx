import React, { useState, useEffect } from 'react';
import { Step, SubTask, TaskStatus, Suggestion, Note } from '../types';
import { elaborateOnText } from '../services/geminiService';
import SuggestionModal from './SuggestionModal';

interface TaskCardProps {
  step: Step;
  onUpdate: (updates: Partial<Step>) => void;
  onAddNote: (note: Omit<Note, 'id' | 'createdAt'>) => void;
  phaseTitle: string;
}

type ElaborationTarget = 'activity' | 'considerations' | 'output';

const statusColors: { [key in TaskStatus]: { border: string, bg: string, text: string } } = {
  'To Do': { border: 'border-cyan-500', bg: 'bg-cyan-900/50', text: 'text-cyan-400' },
  'In Progress': { border: 'border-yellow-500', bg: 'bg-yellow-900/50', text: 'text-yellow-400' },
  'Done': { border: 'border-green-500', bg: 'bg-green-900/50', text: 'text-green-400' },
};

const InfoSection: React.FC<{ title: string; content: string; icon: React.ReactNode; onExpand: () => void; }> = ({ title, content, icon, onExpand }) => {
    
    const provenanceMarker = `\n\n> ✨ Suggestions from AI`;
    const hasSuggestions = content.includes(provenanceMarker);

    let originalContent = content;
    let suggestionsContent: string | null = null;

    if (hasSuggestions) {
        const parts = content.split(provenanceMarker);
        originalContent = parts[0];
        suggestionsContent = `✨ Suggestions from AI${parts[1]}`;
    }

    const renderWithBold = (text: string) => {
        return text.split('**').map((part, index) => 
            index % 2 === 1 ? <strong key={index} className="text-slate-200 font-semibold">{part}</strong> : part
        );
    };

    return (
        <div>
            <div className="flex justify-between items-center">
                <h4 className="flex items-center text-sm font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                    {icon}
                    <span className="ml-2">{title}</span>
                </h4>
                <button onClick={onExpand} title="Elaborate with AI" className="text-slate-400 hover:text-cyan-400 transition-colors">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 3.5a1.5 1.5 0 011.06.44l3.536 3.535a1.5 1.5 0 010 2.122L11.06 13.06a1.5 1.5 0 01-2.122 0L5.404 9.526a1.5 1.5 0 010-2.122L8.94 3.94A1.5 1.5 0 0110 3.5zm.707 2.207a.5.5 0 00-.707 0L6.464 9.243a.5.5 0 000 .707l3.536 3.535a.5.5 0 00.707 0l3.536-3.535a.5.5 0 000-.707L10.707 5.707z" />
                        <path d="M14.5 2.5a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.5 14.5a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1z" />
                     </svg>
                </button>
            </div>
            <div className="text-slate-400 text-sm pl-6 whitespace-pre-wrap">
                {originalContent}
                {suggestionsContent && (
                    <blockquote className="mt-4 p-4 glass glass-subtle border-l-4 border-cyan-500 rounded-r-md text-slate-300">
                        {suggestionsContent.split('\n').map((line, index) => {
                            const cleanLine = line.startsWith('> ') ? line.substring(2) : (line.startsWith('>') ? line.substring(1) : line);
                            return (
                                <p key={index} className="leading-relaxed">
                                    {renderWithBold(cleanLine)}
                                </p>
                            );
                        })}
                    </blockquote>
                )}
            </div>
        </div>
    );
};


const TaskCard: React.FC<TaskCardProps> = ({ step, onUpdate, onAddNote, phaseTitle }) => {
  const [newSubtask, setNewSubtask] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isElaborating, setIsElaborating] = useState(false);
  const [elaborationTarget, setElaborationTarget] = useState<ElaborationTarget | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [undoState, setUndoState] = useState<Partial<Step> | null>(null);

  useEffect(() => {
    if (undoState) {
        const timer = setTimeout(() => setUndoState(null), 5000);
        return () => clearTimeout(timer);
    }
  }, [undoState]);

  const handleAddSubtask = () => {
    if (newSubtask.trim() === '') return;
    const newSubtaskObj: SubTask = {
      id: `sub-${Date.now()}`,
      title: newSubtask.trim(),
      completed: false,
    };
    onUpdate({ subTasks: [...step.subTasks, newSubtaskObj] });
    setNewSubtask('');
  };

  const handleToggleSubtask = (id: string) => {
    const updatedSubtasks = step.subTasks.map(sub =>
      sub.id === id ? { ...sub, completed: !sub.completed } : sub
    );
    onUpdate({ subTasks: updatedSubtasks });
  };
  
  const handleElaborationRequest = async (target: ElaborationTarget) => {
    setElaborationTarget(target);
    setIsModalOpen(true);
    setIsElaborating(true);
    setError(null);
    try {
        const response = await elaborateOnText(target, step[target]);
        setSuggestions(response.suggestions);
    } catch (e) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
        setIsElaborating(false);
    }
  };

  const handleApplySuggestions = (selectedSuggestions: Suggestion[]) => {
    if (!elaborationTarget || selectedSuggestions.length === 0) {
      setIsModalOpen(false);
      return;
    }

    const previousValue = step[elaborationTarget];
    setUndoState({ [elaborationTarget]: previousValue });

    const provenance = `> ✨ Suggestions from AI (${new Date().toLocaleString()})`;
    const suggestionsBlock = selectedSuggestions
        .map(s => `> **${s.title}**\n>\n> ${s.description}`)
        .join('\n>\n');

    const updatedText = `${step[elaborationTarget]}\n\n${provenance}\n>\n${suggestionsBlock}`;
    
    onUpdate({ [elaborationTarget]: updatedText });
    setIsModalOpen(false);
  };

  const handleSaveSuggestionToNote = (suggestion: Suggestion) => {
    onAddNote({
      title: suggestion.title,
      content: suggestion.description,
      source: {
        phaseTitle: phaseTitle,
        stepTitle: step.title,
      },
    });
  };

  const handleUndo = () => {
      if (undoState) {
          onUpdate(undoState);
          setUndoState(null);
      }
  };

  const color = statusColors[step.status];

  return (
    <>
      <div
        className={`relative glass glass-subtle p-4 border-l-4 transition-all duration-300 ${
          step.status === 'Done' ? 'opacity-70' : 'opacity-100'
        } ${color.border}`}
      >
        {undoState && (
            <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-sm p-2 rounded-md shadow-lg z-10">
                <button onClick={handleUndo} className="text-sm text-cyan-400 hover:text-cyan-300 font-semibold">Undo</button>
            </div>
        )}
        <div className="flex items-start justify-between mb-3">
          <h3 className={`font-bold text-slate-100 flex-1 pr-2 ${step.status === 'Done' ? 'line-through' : ''}`}>
            {step.title}
          </h3>
          <select
              value={step.status}
              onChange={(e) => onUpdate({ status: e.target.value as TaskStatus })}
              className={`form-select rounded-md text-sm py-1 pl-2 pr-7 border-0 focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors ${color.bg} ${color.text} focus:ring-cyan-500`}
          >
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label htmlFor={`agent-${step.id}`} className="flex items-center text-sm font-semibold text-slate-300 mb-1 uppercase tracking-wider">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
            <span className="ml-2">Agent</span>
          </label>
          <input
              id={`agent-${step.id}`}
              type="text"
              value={step.agent}
              onChange={(e) => onUpdate({ agent: e.target.value })}
              className="w-full text-sm bg-slate-900/50 rounded-md border border-slate-700 px-2 py-1 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
              placeholder="Assign to..."
          />
        </div>

        <div className="space-y-4 mb-4">
          <InfoSection 
              title="Activity" 
              content={step.activity} 
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
              onExpand={() => handleElaborationRequest('activity')}
          />
          <InfoSection 
              title="Considerations" 
              content={step.considerations}
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
              onExpand={() => handleElaborationRequest('considerations')}
          />
          <InfoSection 
              title="Output" 
              content={step.output}
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              onExpand={() => handleElaborationRequest('output')}
          />
        </div>

        <div className="border-t border-slate-700/50 pt-3">
          <h4 className="text-sm font-semibold text-slate-300 mb-2 uppercase tracking-wider">Sub-tasks</h4>
          <div className="space-y-2">
              {step.subTasks.map(sub => (
                  <div key={sub.id} className="flex items-center text-sm">
                      <input
                          type="checkbox"
                          checked={sub.completed}
                          onChange={() => handleToggleSubtask(sub.id)}
                          className="form-checkbox h-4 w-4 rounded bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                      />
                      <span className={`ml-2 text-slate-400 ${sub.completed ? 'line-through text-slate-500' : ''}`}>
                          {sub.title}
                      </span>
                  </div>
              ))}
          </div>
          <div className="flex mt-2">
              <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                  placeholder="Add a new sub-task..."
                  className="flex-grow text-sm bg-slate-900/50 rounded-l-md border border-slate-700 px-2 py-1 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
              />
              <button
                  onClick={handleAddSubtask}
                  className="bg-slate-700 hover:bg-slate-600 text-cyan-400 px-3 py-1 rounded-r-md transition-colors"
              >+</button>
          </div>
        </div>
      </div>
      <SuggestionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApply={handleApplySuggestions}
        onSaveToNotes={handleSaveSuggestionToNote}
        suggestions={suggestions}
        isLoading={isElaborating}
        error={error}
        title={elaborationTarget ? `Suggestions for ${elaborationTarget}` : 'Suggestions'}
      />
    </>
  );
};

export default TaskCard;