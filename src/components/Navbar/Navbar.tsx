import React from 'react';
import { Shuffle, Download, Undo2, Redo2 } from 'lucide-react';
import { FONTS } from '../../params.config';
import { useParamsStore } from '../../state/useParamsStore';

interface NavbarProps {
  letter: string;
  onLetterChange: (l: string) => void;
  font: string;
  onFontChange: (f: string) => void;
  onExport: () => void;
}

const Navbar = React.memo(function Navbar({
  letter,
  onLetterChange,
  font,
  onFontChange,
  onExport,
}: NavbarProps) {
  const randomize = useParamsStore((s) => s.randomize);
  const undo = useParamsStore((s) => s.undo);
  const redo = useParamsStore((s) => s.redo);
  const historyIndex = useParamsStore((s) => s.historyIndex);
  const historyLength = useParamsStore((s) => s.history.length);

  return (
    <nav className="flex items-center gap-3 px-4 py-2 bg-gray-950 border-b border-gray-800 h-12 shrink-0">
      {/* Logo */}
      <span className="text-lg font-bold text-white tracking-tight mr-2">
        Letter<span className="text-blue-400">forge</span>
      </span>

      <div className="w-px h-6 bg-gray-800" />

      {/* Letter input */}
      <input
        type="text"
        value={letter}
        onChange={(e) => {
          const val = e.target.value.slice(-3);
          onLetterChange(val || 'A');
        }}
        maxLength={3}
        className="w-14 text-center text-xl font-bold bg-gray-800 text-white border border-gray-700 rounded px-2 py-1 focus:outline-none focus:border-blue-500 tracking-widest"
        placeholder="A"
      />

      {/* Font selector */}
      <select
        value={font}
        onChange={(e) => onFontChange(e.target.value)}
        className="text-sm bg-gray-800 text-gray-200 border border-gray-700 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
        style={{ fontFamily: `"${font}", sans-serif` }}
      >
        {FONTS.map((f) => (
          <option key={f} value={f} style={{ fontFamily: `"${f}", sans-serif` }}>
            {f}
          </option>
        ))}
      </select>

      <div className="flex-1" />

      {/* Undo / Redo */}
      <button
        onClick={undo}
        disabled={historyIndex <= 0}
        className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 rounded transition-colors"
        title="Undo"
      >
        <Undo2 size={16} />
      </button>
      <button
        onClick={redo}
        disabled={historyIndex >= historyLength - 1}
        className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 rounded transition-colors"
        title="Redo"
      >
        <Redo2 size={16} />
      </button>

      {/* Randomize all */}
      <button
        onClick={() => randomize()}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-sm transition-colors border border-gray-700"
        title="Randomize all parameters"
      >
        <Shuffle size={14} />
        <span>Randomize</span>
      </button>

      {/* Export */}
      <button
        onClick={onExport}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-colors font-medium"
        title="Export"
      >
        <Download size={14} />
        <span>Export</span>
      </button>
    </nav>
  );
});

export default Navbar;
