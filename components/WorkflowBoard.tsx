import React from 'react';
import { Workflow, Step, Note } from '../types';
import PhaseColumn from './PhaseColumn';

interface WorkflowBoardProps {
  workflow: Workflow;
  onStepUpdate: (phaseIndex: number, stepIndex: number, updates: Partial<Step>) => void;
  onAddNote: (note: Omit<Note, 'id' | 'createdAt'>) => void;
}

const WorkflowBoard: React.FC<WorkflowBoardProps> = ({ workflow, onStepUpdate, onAddNote }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {workflow.phases.map((phase, phaseIndex) => (
        <PhaseColumn 
          key={phase.id} 
          phase={phase}
          phaseIndex={phaseIndex}
          onStepUpdate={onStepUpdate}
          onAddNote={onAddNote}
        />
      ))}
    </div>
  );
};

export default WorkflowBoard;
