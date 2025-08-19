import React, { useState, useMemo, useEffect } from 'react';
import { Workflow, Step, Note } from './types';
import { parseWorkflowFromText } from './services/geminiService';
import * as dbService from './services/dbService';
import WorkflowBoard from './components/WorkflowBoard';
import Loader from './components/Loader';
import FloatingNoteButton from './components/FloatingNoteButton';
import NotesPanel from './components/NotesPanel';
import { initialWorkflowText } from './constants';

const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>(initialWorkflowText);
  const [workflowData, setWorkflowData] = useState<Workflow | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isNotesPanelOpen, setIsNotesPanelOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);

  // Load initial data from IndexedDB
  useEffect(() => {
    const loadData = async () => {
      const savedWorkflow = await dbService.loadWorkflow();
      if (savedWorkflow) {
        setWorkflowData(savedWorkflow);
      }
      const savedNotes = await dbService.loadNotes();
      setNotes(savedNotes);
    };
    loadData();
  }, []);

  // Save workflow data whenever it changes
  useEffect(() => {
    if (workflowData) {
      dbService.saveWorkflow(workflowData);
    }
  }, [workflowData]);

  const handleProcessWorkflow = async () => {
    if (!inputText.trim()) {
      setError("Input text cannot be empty.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setWorkflowData(null);

    try {
      const parsedData = await parseWorkflowFromText(inputText);
      setWorkflowData(parsedData);
    } catch (e) {
      console.error(e);
      setError("Failed to parse workflow. Please check the console for details.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleStepUpdate = (phaseIndex: number, stepIndex: number, updates: Partial<Step>) => {
    setWorkflowData(prevData => {
      if (!prevData) return null;

      const newPhases = prevData.phases.map((phase, pIndex) => {
        if (pIndex === phaseIndex) {
          const newSteps = phase.steps.map((step, sIndex) => {
            if (sIndex === stepIndex) {
              return { ...step, ...updates };
            }
            return step;
          });
          return { ...phase, steps: newSteps };
        }
        return phase;
      });

      return { ...prevData, phases: newPhases };
    });
  };

  // --- Notes Management ---
  const handleAddNote = async (note: Omit<Note, 'id' | 'createdAt'>) => {
    const newNote: Note = {
        ...note,
        id: `note-${Date.now()}`,
        createdAt: Date.now(),
    };
    await dbService.saveNote(newNote);
    const updatedNotes = await dbService.loadNotes();
    setNotes(updatedNotes);
    setIsNotesPanelOpen(true); // Open panel to show the new note
  };

  const handleDeleteNote = async (noteId: string) => {
      await dbService.deleteNote(noteId);
      const updatedNotes = await dbService.loadNotes();
      setNotes(updatedNotes);
  };
  
  const handleUpdateNote = async (note: Note) => {
    await dbService.saveNote(note);
    const updatedNotes = await dbService.loadNotes();
    setNotes(updatedNotes);
  };

  const { totalSteps, completedSteps, progressPercentage } = useMemo(() => {
    if (!workflowData) {
      return { totalSteps: 0, completedSteps: 0, progressPercentage: 0 };
    }
    const steps = workflowData.phases.flatMap(phase => phase.steps);
    const total = steps.length;
    const completed = steps.filter(step => step.status === 'Done').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { totalSteps: total, completedSteps: completed, progressPercentage: percentage };
  }, [workflowData]);

  return (
    <>
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
              AI Workflow Visualizer
            </h1>
            <p className="mt-2 text-slate-400">
              Paste your project plan below and let Gemini structure it into an interactive board.
            </p>
          </header>

          <div className="bg-slate-800 rounded-lg p-6 shadow-2xl mb-8">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full h-48 p-4 bg-slate-900 border border-slate-700 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none transition duration-200 resize-y text-slate-300"
              placeholder="Paste your workflow text here..."
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleProcessWorkflow}
                disabled={isLoading}
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-200 shadow-lg"
              >
                {isLoading ? 'Processing...' : 'Visualize Workflow'}
              </button>
            </div>
          </div>

          {isLoading && <Loader />}
          {error && <div className="text-center text-red-400 bg-red-900/20 p-4 rounded-md">{error}</div>}

          {workflowData && (
            <div>
              <div className="mb-6 bg-slate-800 p-4 rounded-lg shadow-lg">
                  <div className="flex flex-wrap justify-between items-center mb-2 gap-2">
                      <h2 className="text-lg font-semibold text-slate-200">Project Progress</h2>
                      <div className="flex items-center gap-4">
                          <span className="text-cyan-400 font-bold">{`${completedSteps} / ${totalSteps} Tasks Completed`}</span>
                      </div>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-4">
                      <div
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-4 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${progressPercentage}%` }}
                      ></div>
                  </div>
                  <p className="text-right text-slate-400 mt-1 text-sm">{progressPercentage}% Complete</p>
              </div>
              <WorkflowBoard 
                workflow={workflowData} 
                onStepUpdate={handleStepUpdate}
                onAddNote={handleAddNote}
              />
            </div>
          )}
        </div>
      </div>
      <FloatingNoteButton onClick={() => setIsNotesPanelOpen(true)} />
      <NotesPanel
        isOpen={isNotesPanelOpen}
        onClose={() => setIsNotesPanelOpen(false)}
        notes={notes}
        onDelete={handleDeleteNote}
        onUpdate={handleUpdateNote}
      />
    </>
  );
};

export default App;
