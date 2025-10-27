import React, { useState, useCallback, useEffect } from 'react';
import JSZip from 'jszip';
import { PieceType, ChessSet } from './types';
import { PIECE_TYPES_ORDERED, DEFAULT_PIECE_DESCRIPTIONS } from './constants';
import { generateChessPieceImage, generateStyleGuide, editChessPieceImage } from './services/geminiService';
import PieceCard from './components/PieceCard';
import LoadingSpinner from './components/icons/LoadingSpinner';
import DownloadIcon from './components/icons/DownloadIcon';
import ExampleThemes from './components/ExampleThemes';
import EditModal from './components/EditModal';

const initialChessSet = (): ChessSet => {
  const set: Partial<ChessSet> = {};
  PIECE_TYPES_ORDERED.forEach(type => {
    set[type] = { type, imageUrl: null, promptUsed: undefined };
  });
  return set as ChessSet;
};

const App: React.FC = () => {
  const [theme, setTheme] = useState<string>('');
  const [chessSet, setChessSet] = useState<ChessSet>(initialChessSet());
  const [loadingStates, setLoadingStates] = useState<Record<PieceType, boolean>>(
    PIECE_TYPES_ORDERED.reduce((acc, type) => ({ ...acc, [type]: false }), {} as Record<PieceType, boolean>)
  );
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState<boolean>(false);
  const [apiKeyMissing, setApiKeyMissing] = useState<boolean>(false);
  
  const [styleGuide, setStyleGuide] = useState<string | null>(null);
  const [styleGuideTheme, setStyleGuideTheme] = useState<string>('');
  const [isGeneratingStyleGuide, setIsGeneratingStyleGuide] = useState<boolean>(false);

  const [editingPiece, setEditingPiece] = useState<PieceType | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);


  useEffect(() => {
    if (!process.env.API_KEY) {
      setApiKeyMissing(true);
      setGlobalError("Gemini API Key is missing. Please ensure it's configured in your environment.");
    }
  }, []);

  const handleGeneratePiece = useCallback(async (pieceType: PieceType, currentTheme: string, currentStyleGuide: string) => {
    if (apiKeyMissing) return;
    
    setGlobalError(null);
    setLoadingStates(prev => ({ ...prev, [pieceType]: true }));

    const pieceBaseDescription = DEFAULT_PIECE_DESCRIPTIONS[pieceType];
    const fullPrompt = `${pieceBaseDescription}. The piece must strictly adhere to the following artistic style guide: "${currentStyleGuide}". Use the theme "${currentTheme}" as inspiration. Detailed, iconic chess piece design, suitable for a digital chess set, clear silhouette, on a neutral studio background.`;

    try {
      const imageUrl = await generateChessPieceImage(fullPrompt);
      setChessSet(prev => ({
        ...prev,
        [pieceType]: { type: pieceType, imageUrl, promptUsed: fullPrompt },
      }));
    } catch (error) {
      console.error(`Error generating ${pieceType}:`, error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while generating the piece.";
      setGlobalError(`Failed to generate ${pieceType}: ${errorMessage}`);
      setChessSet(prev => ({
        ...prev,
        [pieceType]: { ...prev[pieceType], imageUrl: null },
      }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [pieceType]: false }));
    }
  }, [apiKeyMissing]);
  
  const prepareAndGenerate = useCallback(async (piecesToGenerate: PieceType[]) => {
      if (apiKeyMissing || !theme.trim()) {
        if (!theme.trim()) setGlobalError("Please enter a theme first.");
        return;
      }
      setGlobalError(null);

      let currentStyleGuide = styleGuide;

      if (theme.trim().toLowerCase() !== styleGuideTheme.toLowerCase() || !currentStyleGuide) {
        setIsGeneratingStyleGuide(true);
        try {
          const newStyleGuide = await generateStyleGuide(theme);
          setStyleGuide(newStyleGuide);
          setStyleGuideTheme(theme.trim());
          currentStyleGuide = newStyleGuide;
        } catch (error) {
          console.error("Error generating style guide:", error);
          const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
          setGlobalError(`Failed to establish art direction: ${errorMessage}`);
          setIsGeneratingStyleGuide(false);
          return;
        } finally {
          setIsGeneratingStyleGuide(false);
        }
      }
      
      if (!currentStyleGuide) {
          setGlobalError("Could not proceed without an art direction.");
          return;
      }

      const isBatchJob = piecesToGenerate.length > 1;
      if (isBatchJob) setIsGeneratingAll(true);

      for (const pieceType of piecesToGenerate) {
        if (isBatchJob && globalError && globalError.startsWith("Failed to generate")) {
           break; 
        }
        await handleGeneratePiece(pieceType, theme, currentStyleGuide);
      }
      if (isBatchJob) setIsGeneratingAll(false);
  }, [apiKeyMissing, theme, styleGuide, styleGuideTheme, handleGeneratePiece, globalError]);


  const handleClearSet = () => {
    setChessSet(initialChessSet());
    setTheme('');
    setGlobalError(null);
    setStyleGuide(null);
    setStyleGuideTheme('');
    setLoadingStates(PIECE_TYPES_ORDERED.reduce((acc, type) => ({ ...acc, [type]: false }), {} as Record<PieceType, boolean>));
    setIsGeneratingAll(false);
  };
  
  const hasGeneratedPieces = Object.values(chessSet).some(p => p.imageUrl);

  const handleDownloadSet = async () => {
    if (!hasGeneratedPieces) return;

    const zip = new JSZip();
    const themeName = theme.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'ai_chess_set';
    const imageFolder = zip.folder(themeName);
    if (!imageFolder) return;

    const imagePromises = Object.values(chessSet)
      .filter(piece => piece.imageUrl)
      .map(async (piece) => {
        const response = await fetch(piece.imageUrl!);
        const blob = await response.blob();
        imageFolder.file(`${piece.type.toLowerCase()}.jpeg`, blob);
      });
    
    await Promise.all(imagePromises);

    if (styleGuide) {
      imageFolder.file('art_direction_style_guide.txt', styleGuide);
    }

    zip.generateAsync({ type: 'blob' }).then((content) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `${themeName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    });
  };
  
  const handleSelectExampleTheme = (selectedTheme: string) => {
    setTheme(selectedTheme);
    // Clear previous results to avoid confusion with the new theme
    setChessSet(initialChessSet());
    setStyleGuide(null);
    setStyleGuideTheme('');
    setGlobalError(null);
  };

  const handleOpenEditModal = (pieceType: PieceType) => {
    if (chessSet[pieceType].imageUrl) {
      setEditingPiece(pieceType);
    }
  };

  const handleCloseEditModal = () => {
    if (isEditing) return; // Prevent closing while an edit is in progress
    setEditingPiece(null);
  };

  const handleApplyEdit = async (editPrompt: string) => {
    if (!editingPiece || !chessSet[editingPiece].imageUrl || apiKeyMissing) {
      return;
    }

    setGlobalError(null);
    setIsEditing(true);

    try {
      const currentImageUrl = chessSet[editingPiece].imageUrl!;
      const newImageUrl = await editChessPieceImage(currentImageUrl, editPrompt);
      setChessSet(prev => ({
        ...prev,
        [editingPiece]: { ...prev[editingPiece], imageUrl: newImageUrl, promptUsed: `Edited: "${editPrompt}"` },
      }));
      handleCloseEditModal(); // Close modal on success
    } catch (error) {
      console.error(`Error editing ${editingPiece}:`, error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while editing the piece.";
      // Display error inside the modal or globally. Global is simpler for now.
      setGlobalError(`Failed to edit ${editingPiece}: ${errorMessage}`);
    } finally {
      setIsEditing(false);
    }
  };

  const isBusy = isGeneratingAll || isGeneratingStyleGuide;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-4 sm:p-6 md:p-8 flex flex-col items-center selection:bg-purple-500 selection:text-white">
      <header className="my-8 md:my-12 text-center w-full max-w-4xl">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            AI Chess Set Artisan
          </span>
        </h1>
        <p className="text-gray-300 mt-3 text-base sm:text-lg md:text-xl max-w-2xl mx-auto">
          Envision a theme, and let AI craft a unique, consistent set of chess pieces for you.
        </p>
      </header>

      {apiKeyMissing && (
        <div className="w-full max-w-2xl mb-6 p-4 bg-red-800 border border-red-600 text-white rounded-lg shadow-xl" role="alert">
          <p className="font-bold text-lg">Configuration Error:</p>
          <p>The Gemini API Key (API_KEY) is not configured in the environment. Please set it up to enable image generation.</p>
        </div>
      )}

      {/* Theme Input */}
      <div className="w-full max-w-2xl mb-8 p-6 bg-gray-800/70 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700">
        <label htmlFor="themeInput" className="block text-xl font-semibold text-gray-100 mb-3">
          Enter Your Chess Set Theme:
        </label>
        <input
          id="themeInput"
          type="text"
          value={theme}
          onChange={(e) => {
            setTheme(e.target.value);
            if (globalError && !globalError.includes("API Key")) setGlobalError(null); 
          }}
          placeholder="e.g., 'Cosmic Horror', 'Elven Forest', 'Cyberpunk Samurai'"
          className="w-full p-3.5 bg-gray-700 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-lg"
          disabled={apiKeyMissing || isBusy}
        />
      </div>

      {/* Example Themes - show only before generation starts */}
      {!isBusy && !hasGeneratedPieces && (
        <ExampleThemes onSelectTheme={handleSelectExampleTheme} />
      )}

      {/* Art Direction Display */}
       <div className="w-full max-w-2xl mb-8">
        {isGeneratingStyleGuide && (
          <div className="p-6 bg-gray-800/70 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700 flex flex-col items-center">
            <LoadingSpinner text="Establishing Art Direction..." />
          </div>
        )}
        {styleGuide && !isGeneratingStyleGuide && (
          <div className="p-6 bg-gray-800/70 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700 animate-fade-in">
            <h3 className="text-xl font-semibold text-gray-100 mb-3 text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-600">
              Generated Art Direction:
            </h3>
            <p className="text-gray-300 italic">"{styleGuide}"</p>
          </div>
        )}
      </div>

      {/* Global Error Display (excluding API key error handled above) */}
      {globalError && !globalError.includes("API Key") && (
        <div className="w-full max-w-2xl mb-6 p-4 bg-red-700/80 backdrop-blur-sm border border-red-900 text-white rounded-lg shadow-lg" role="alert">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-semibold">Oops! Something went wrong:</p>
              <p className="text-sm">{globalError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex flex-wrap justify-center gap-4 mb-10 md:mb-12">
        <button
          onClick={() => prepareAndGenerate(PIECE_TYPES_ORDERED)}
          disabled={apiKeyMissing || isBusy || !theme.trim()}
          title={!theme.trim() ? "Enter a theme to generate all pieces" : apiKeyMissing ? "API Key missing" : "Generate all pieces with current theme"}
          className={`px-6 py-3 rounded-lg font-bold text-base text-white transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 shadow-lg
            ${isBusy || !theme.trim() || apiKeyMissing
              ? 'bg-gray-600 cursor-not-allowed opacity-70'
              : 'bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 focus:ring-green-500'
            }`}
        >
          {isBusy ? <LoadingSpinner className="w-5 h-5 inline mr-2" /> : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 4a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2H5zm0 10a1 1 0 00-1 1v1a1 1 0 001 1h10a1 1 0 001-1v-1a1 1 0 00-1-1H5z" />
            </svg>
          )}
          {isGeneratingAll ? 'Conjuring Full Set...' : isGeneratingStyleGuide ? 'Thinking...' : 'Generate Full Set'}
        </button>
         <button
          onClick={handleDownloadSet}
          disabled={isBusy || !hasGeneratedPieces}
          title={!hasGeneratedPieces ? "Generate some pieces first" : "Download the set as a ZIP file"}
          className={`px-6 py-3 rounded-lg font-bold text-base text-white transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 shadow-lg
            ${isBusy || !hasGeneratedPieces
              ? 'bg-gray-600 cursor-not-allowed opacity-70'
              : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 focus:ring-sky-500'
            }`}
        >
          <DownloadIcon className="h-5 w-5 inline mr-2" />
          Download Set
        </button>
        <button
          onClick={handleClearSet}
          disabled={isBusy}
          className="px-6 py-3 rounded-lg font-bold text-base text-white bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Clear Set & Theme
        </button>
      </div>

      {/* Chess Pieces Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 w-full max-w-6xl px-2">
        {PIECE_TYPES_ORDERED.map(pieceType => (
          <PieceCard
            key={pieceType}
            pieceType={pieceType}
            imageUrl={chessSet[pieceType].imageUrl}
            isLoading={loadingStates[pieceType] || (isBusy && !chessSet[pieceType].imageUrl) }
            onGenerate={() => prepareAndGenerate([pieceType])}
            onEdit={() => handleOpenEditModal(pieceType)}
            currentTheme={theme}
            promptUsed={chessSet[pieceType].promptUsed}
          />
        ))}
      </div>

      {editingPiece && (
        <EditModal
          isOpen={!!editingPiece}
          onClose={handleCloseEditModal}
          piece={chessSet[editingPiece]}
          onApplyEdit={handleApplyEdit}
          isEditing={isEditing}
        />
      )}

      <footer className="mt-16 mb-8 text-center text-gray-500 text-sm">
        <p>Crafted with Gemini AI. All generated images are for creative exploration and personal use.</p>
        <p>&copy; {new Date().getFullYear()} AI Chess Set Artisan. Not affiliated with Google.</p>
      </footer>
    </div>
  );
};

export default App;
