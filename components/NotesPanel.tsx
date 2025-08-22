import React, { useState, useEffect } from 'react';
import { Note } from '../types';

interface NotesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  onDelete: (noteId: string) => void;
  onUpdate: (note: Note) => void;
}

const NotesPanel: React.FC<NotesPanelProps> = ({ isOpen, onClose, notes, onDelete, onUpdate }) => {
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');

  const activeNote = notes.find(n => n.id === activeNoteId);

  useEffect(() => {
    if (isOpen && !activeNoteId && notes.length > 0) {
      setActiveNoteId(notes[0].id);
    }
    if (isOpen && activeNoteId && !notes.some(n => n.id === activeNoteId)) {
        setActiveNoteId(notes.length > 0 ? notes[0].id : null);
    }
  }, [isOpen, notes, activeNoteId]);

  useEffect(() => {
    if (activeNote) {
      setEditedContent(activeNote.content);
    } else {
      setEditedContent('');
    }
  }, [activeNote]);

  const handleUpdate = () => {
    if (activeNote && activeNote.content !== editedContent) {
        onUpdate({ ...activeNote, content: editedContent });
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex flex-col sm:flex-row">
      <div className="w-full sm:w-64 md:w-80 bg-slate-900/80 border-r border-slate-800/50 flex flex-col">
        <header className="flex justify-between items-center p-4 border-b border-slate-800/50">
            <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">My Notes</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white sm:hidden">&times;</button>
        </header>
        <nav className="flex-grow overflow-y-auto p-2">
          {notes.length > 0 ? (
            <ul>
              {notes.map(note => (
                <li key={note.id}>
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); setActiveNoteId(note.id); }}
                    className={`block p-3 rounded-md truncate transition-colors text-left ${activeNoteId === note.id ? 'bg-cyan-900/50 text-white' : 'text-slate-300 hover:bg-slate-800/70'}`}
                  >
                    <span className="font-semibold">{note.title}</span>
                    <span className="block text-xs text-slate-400 mt-1">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center p-6 text-slate-500">
                <p>No notes yet.</p>
                <p className="text-sm">Save suggestions from tasks to create new notes.</p>
            </div>
          )}
        </nav>
      </div>

      <main className="flex-1 flex flex-col">
        <header className="flex justify-end items-center p-4 bg-transparent border-b border-slate-800/50">
          {activeNote && (
            <button
                onClick={() => {
                    if (window.confirm('Are you sure you want to delete this note?')) {
                        onDelete(activeNote.id);
                    }
                }}
                className="px-3 py-1 text-sm bg-red-800/50 text-red-300 font-semibold rounded-md hover:bg-red-800/80 transition-colors"
            >
                Delete Note
            </button>
          )}
          <button onClick={onClose} className="text-slate-400 hover:text-white ml-4 hidden sm:block">&times;</button>
        </header>
        <div className="flex-grow p-6 overflow-y-auto">
          {activeNote ? (
            <div>
              <h1 className="text-2xl font-bold text-slate-100 mb-2">{activeNote.title}</h1>
              <div className="text-sm text-slate-400 mb-4 pb-4 border-b border-slate-700/50">
                <span>From Task: <strong className="text-slate-300">{activeNote.source.stepTitle}</strong></span>
                <span className="mx-2">|</span>
                <span>Phase: <strong className="text-slate-300">{activeNote.source.phaseTitle}</strong></span>
              </div>
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                onBlur={handleUpdate}
                className="w-full h-[60vh] p-4 bg-transparent border border-slate-700 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none transition duration-200 resize-y text-slate-300"
                placeholder="Note content..."
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
                <p>Select a note to view or edit.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default NotesPanel;