import React from 'react';
import { Phase, Step, Note } from '../types';
import TaskCard from './TaskCard';

interface PhaseColumnProps {
  phase: Phase;
  phaseIndex: number;
  onStepUpdate: (phaseIndex: number, stepIndex: number, updates: Partial<Step>) => void;
  onAddNote: (note: Omit<Note, 'id' | 'createdAt'>) => void;
}

const PhaseColumn: React.FC<PhaseColumnProps> = ({ phase, phaseIndex, onStepUpdate, onAddNote }) => {
  return (
    <div className="flex flex-col glass">
      <div className="p-4 border-b border-slate-700/50 sticky top-0 bg-slate-800/50 backdrop-blur-sm rounded-t-lg">
        <h2 className="text-xl font-bold text-cyan-400">{phase.title}</h2>
      </div>
      <div className="p-4 space-y-4">
        {phase.steps.map((step, stepIndex) => (
          <TaskCard 
            key={step.id} 
            step={step} 
            onUpdate={(updates) => onStepUpdate(phaseIndex, stepIndex, updates)}
            onAddNote={onAddNote}
            phaseTitle={phase.title}
          />
        ))}
      </div>
    </div>
  );
};

export default PhaseColumn;