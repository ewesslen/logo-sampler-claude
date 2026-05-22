import React, { useState, useRef } from 'react';
import { Plus, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useMoodTrayStore } from '../../state/useMoodTrayStore';
import { useParamsStore } from '../../state/useParamsStore';
import LetterSvg from '../Canvas/LetterSvg';

interface MoodTrayProps {
  letter: string;
  font: string;
}

const MoodTray = React.memo(function MoodTray({ letter, font }: MoodTrayProps) {
  const [open, setOpen] = useState(false);
  const variants = useMoodTrayStore((s) => s.variants);
  const saveVariant = useMoodTrayStore((s) => s.saveVariant);
  const removeVariant = useMoodTrayStore((s) => s.removeVariant);
  const restoreVariant = useMoodTrayStore((s) => s.restoreVariant);
  const params = useParamsStore((s) => s.params);
  const setParams = useParamsStore((s) => s.setParams);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSave = () => {
    // Generate a small thumbnail SVG data URL
    const svgElement = document.querySelector('#main-canvas');
    let thumbnail = '';
    if (svgElement) {
      thumbnail = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgElement.outerHTML);
    }
    saveVariant(params, thumbnail);
  };

  const handleRestore = (id: string) => {
    const restored = restoreVariant(id);
    if (restored) {
      setParams(restored);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    removeVariant(id);
  };

  const handleTouchStart = (id: string) => {
    longPressRef.current = setTimeout(() => {
      removeVariant(id);
    }, 600);
  };

  const handleTouchEnd = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  return (
    <div className="bg-gray-950 border-t border-gray-800">
      {/* Toggle bar */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-900 transition-colors"
      >
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Mood Tray
          {variants.length > 0 && (
            <span className="ml-2 text-blue-400">({variants.length})</span>
          )}
        </span>
        {open ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronUp size={14} className="text-gray-500" />}
      </button>

      {open && (
        <div className="flex items-center gap-3 px-4 pb-3 overflow-x-auto">
          {/* Save button */}
          <button
            onClick={handleSave}
            className="shrink-0 flex flex-col items-center justify-center w-16 h-16 border-2 border-dashed border-gray-700 rounded-lg hover:border-blue-500 hover:bg-gray-800 transition-colors text-gray-500 hover:text-blue-400"
            title="Save current variant"
          >
            <Plus size={20} />
            <span className="text-xs mt-1">Save</span>
          </button>

          {/* Variants */}
          {variants.map((variant) => (
            <div
              key={variant.id}
              className="shrink-0 relative group"
              onContextMenu={(e) => handleContextMenu(e, variant.id)}
              onTouchStart={() => handleTouchStart(variant.id)}
              onTouchEnd={handleTouchEnd}
            >
              <button
                onClick={() => handleRestore(variant.id)}
                className="w-16 h-16 rounded-lg overflow-hidden border border-gray-700 hover:border-blue-500 transition-colors"
                title={variant.label}
              >
                {variant.thumbnail ? (
                  <img
                    src={variant.thumbnail}
                    alt={variant.label}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full">
                    <LetterSvg
                      letter={letter}
                      font={font}
                      params={variant.params}
                      size={64}
                    />
                  </div>
                )}
              </button>
              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeVariant(variant.id);
                }}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:flex"
                title="Remove variant"
              >
                <X size={10} />
              </button>
              <p className="text-xs text-center text-gray-500 mt-1 truncate w-16">{variant.label}</p>
            </div>
          ))}

          {variants.length === 0 && (
            <p className="text-xs text-gray-600 py-4">
              Save variants to compare different designs
            </p>
          )}
        </div>
      )}
    </div>
  );
});

export default MoodTray;
