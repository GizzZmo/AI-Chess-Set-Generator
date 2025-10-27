
import React from 'react';
import { EXAMPLE_THEMES } from '../constants';

interface ExampleThemesProps {
  onSelectTheme: (theme: string) => void;
}

const ExampleThemes: React.FC<ExampleThemesProps> = ({ onSelectTheme }) => {
  return (
    <div className="w-full max-w-4xl my-8 animate-fade-in">
      <h3 className="text-lg font-semibold text-gray-300 mb-4 text-center">
        Need some inspiration? Try one of these themes.
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {EXAMPLE_THEMES.map((example, index) => (
          <button
            key={index}
            onClick={() => onSelectTheme(example.theme)}
            className="text-left bg-gray-800/50 p-4 rounded-xl border border-gray-700 hover:bg-gray-700/70 hover:border-purple-500 cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transform hover:scale-105"
          >
            <h4 className="font-bold text-purple-400">{example.theme}</h4>
            <p className="text-sm text-gray-400 mt-1 italic">"{example.artDirection}"</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ExampleThemes;
