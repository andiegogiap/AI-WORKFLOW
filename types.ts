export type TaskStatus = 'To Do' | 'In Progress' | 'Done';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Step {
  id: string;
  title: string;
  activity: string;
  considerations: string;
  output: string;
  status: TaskStatus;
  agent: string;
  subTasks: SubTask[];
}

export interface Phase {
  id:string;
  title: string;
  steps: Step[];
}

export interface Workflow {
  phases: Phase[];
}

// Types for the live AI elaboration feature
export interface Suggestion {
  title: string;
  description: string;
}

export interface SuggestionsResponse {
  suggestions: Suggestion[];
}

// Type for the new note-taking feature
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number; // Using number for timestamp for easier IndexedDB storage
  source: {
    phaseTitle: string;
    stepTitle: string;
  };
}
