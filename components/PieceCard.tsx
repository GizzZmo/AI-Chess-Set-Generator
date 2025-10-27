import React from 'react';
import { PieceType } from '../types';
import LoadingSpinner from './icons/LoadingSpinner';
import DownloadIcon from './icons/DownloadIcon';
import EditIcon from './icons/EditIcon';

interface PieceCardProps {
  pieceType: PieceType;
  imageUrl: string | null;
  isLoading: boolean;
  onGenerate: () => void;
  onEdit: () => void;
  currentTheme: string;
  promptUsed?: string;
}

const PieceCard: React.FC<PieceCardProps> = ({ pieceType, imageUrl, isLoading, onGenerate, onEdit, currentTheme, promptUsed }) => {
  const canGenerate = !!currentTheme.trim();

  const handleDownload = () => {
    if (!imageUrl) return;

    const link = document.createElement('a');
    link.href = imageUrl;
    
    const themeName = currentTheme.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'themed';
    const pieceName = pieceType.toLowerCase();
    
    link.download = `${themeName}_${pieceName}.jpeg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-2xl p-5 flex flex-col items-center transition-all duration-300 hover:shadow-blue-500/30 hover:scale-105">
      <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-600 mb-4">{pieceType}</h3>
      <div className="relative group w-52 h-52 lg:w-60 lg:h-60 bg-gray-700/50 rounded-lg mb-5 flex items-center justify-center overflow-hidden border-2 border-gray-600 shadow-inner">
        {isLoading ? (
          <LoadingSpinner className="w-12 h-12" />
        ) : imageUrl ? (
          <>
            <img src={imageUrl} alt={`${pieceType} - ${currentTheme}`} className="w-full h-full object-contain" />
            <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300">
              <button
                onClick={handleDownload}
                title={`Download ${pieceType} image`}
                aria-label={`Download ${pieceType} image`}
                className="p-2 bg-gray-900/70 backdrop-blur-sm rounded-full text-white transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <DownloadIcon className="w-5 h-5" />
              </button>
              <button
                onClick={onEdit}
                title={`Edit ${pieceType} image`}
                aria-label={`Edit ${pieceType} image`}
                className="p-2 bg-gray-900/70 backdrop-blur-sm rounded-full text-white transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <EditIcon className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          <div className="text-gray-400 text-center p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm mt-1">Ready to Generate</span>
          </div>
        )}
      </div>
      <button
        onClick={onGenerate}
        disabled={isLoading || !canGenerate}
        title={!canGenerate ? "Please enter a theme first" : `Generate ${pieceType}`}
        className={`w-full px-4 py-3 rounded-lg font-semibold text-white text-sm
          transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800
          ${isLoading 
            ? 'bg-yellow-500 cursor-wait' 
            : !canGenerate 
            ? 'bg-gray-600 cursor-not-allowed opacity-70' 
            : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:ring-blue-500'
          }`}
      >
        {isLoading ? 'Crafting...' : `Generate ${pieceType}`}
      </button>
      {!canGenerate && !isLoading && (
         <p className="text-xs text-yellow-300 mt-2.5 text-center">Enter a theme to enable generation.</p>
      )}
      {promptUsed && !isLoading && imageUrl && (
        <p className="text-xs text-gray-400 mt-2.5 text-center italic" title={promptUsed}>
          {promptUsed.startsWith("Edited") ? promptUsed : `Generated with theme: "${currentTheme}"`}
        </p>
      )}
    </div>
  );
};

export default PieceCard;
