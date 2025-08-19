import React from 'react';

interface FloatingNoteButtonProps {
  onClick: () => void;
}

const FloatingNoteButton: React.FC<FloatingNoteButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      title="Open Notes Panel"
      className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 h-16 w-16 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg flex items-center justify-center hover:scale-105 hover:shadow-cyan-500/50 transition-all duration-200"
      aria-label="Open Notes Panel"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </button>
  );
};

export default FloatingNoteButton;
