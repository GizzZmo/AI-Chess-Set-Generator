import React, { useState } from 'react';
import { PieceType } from '../types';
import LoadingSpinner from './icons/LoadingSpinner';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  piece: { type: PieceType; imageUrl: string | null };
  onApplyEdit: (prompt: string) => Promise<void>;
  isEditing: boolean;
}

const EditModal: React.FC<EditModalProps> = ({ isOpen, onClose, piece, onApplyEdit, isEditing }) => {
  const [editPrompt, setEditPrompt] = useState('');

  if (!isOpen || !piece.imageUrl) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editPrompt.trim() && !isEditing) {
      onApplyEdit(editPrompt);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity duration-300 animate-fade-in"
      aria-labelledby="edit-modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl p-6 md:p-8 w-11/12 max-w-lg relative transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          aria-label="Close edit modal"
          disabled={isEditing}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 id="edit-modal-title" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-600 mb-4">
          Edit {piece.type}
        </h2>

        <div className="relative w-full aspect-square bg-gray-700/50 rounded-lg mb-5 flex items-center justify-center overflow-hidden border-2 border-gray-600">
          <img src={piece.imageUrl} alt={`Current ${piece.type}`} className="w-full h-full object-contain" />
          {isEditing && (
            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
              <LoadingSpinner text="Applying edit..." />
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="editPromptInput" className="block text-lg font-semibold text-gray-100 mb-2">
            Describe your edit:
          </label>
          <input
            id="editPromptInput"
            type="text"
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            placeholder="e.g., 'Add a retro filter', 'Make it silver'"
            className="w-full p-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
            disabled={isEditing}
          />
          <button
            type="submit"
            disabled={isEditing || !editPrompt.trim()}
            className="mt-4 w-full px-4 py-3 rounded-lg font-semibold text-white text-base
              transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800
              ${isEditing
                ? 'bg-yellow-500 cursor-wait'
                : !editPrompt.trim()
                ? 'bg-gray-600 cursor-not-allowed opacity-70'
                : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 focus:ring-purple-500'
              }"
          >
            {isEditing ? 'Generating...' : 'Apply Edit'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditModal;
