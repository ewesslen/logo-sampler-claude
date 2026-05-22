import React, { useState, useRef, useCallback } from 'react';
import { Lock, LockOpen, Shuffle } from 'lucide-react';
import { useParamsStore } from '../../state/useParamsStore';
import { type ParamConfig } from '../../params.config';

interface ParamSliderProps {
  param: ParamConfig;
}

const ParamSlider = React.memo(function ParamSlider({ param }: ParamSliderProps) {
  const value = useParamsStore((s) => s.params[param.id]);
  const isLocked = useParamsStore((s) => s.lockedParams.has(param.id));
  const setParam = useParamsStore((s) => s.setParam);
  const lockParam = useParamsStore((s) => s.lockParam);
  const unlockParam = useParamsStore((s) => s.unlockParam);

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const min = param.min ?? 0;
  const max = param.max ?? 100;
  const step = param.step ?? 1;

  const percent = ((value - min) / (max - min)) * 100;

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isLocked) return;
      setParam(param.id, Number(e.target.value));
    },
    [isLocked, param.id, setParam]
  );

  const handleValueClick = () => {
    if (isLocked) return;
    setEditValue(String(value));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitEdit = () => {
    const parsed = Number(editValue);
    if (!isNaN(parsed)) {
      const clamped = Math.min(max, Math.max(min, parsed));
      setParam(param.id, clamped);
    }
    setEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') setEditing(false);
  };

  const handleRandomize = () => {
    if (isLocked) return;
    const lo = param.randomMin ?? min;
    const hi = param.randomMax ?? max;
    const range = Math.floor((hi - lo) / step);
    const rand = lo + Math.round(Math.random() * range) * step;
    setParam(param.id, rand);
  };

  const toggleLock = () => {
    if (isLocked) unlockParam(param.id);
    else lockParam(param.id);
  };

  return (
    <div className="flex flex-col gap-1 py-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{param.label}</span>
        <div className="flex items-center gap-1">
          {/* Editable value display */}
          {editing ? (
            <input
              ref={inputRef}
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleEditKeyDown}
              className="w-14 text-right text-xs bg-gray-700 text-white border border-blue-500 rounded px-1 py-0 focus:outline-none"
              min={min}
              max={max}
              step={step}
            />
          ) : (
            <button
              onClick={handleValueClick}
              className="w-14 text-right text-xs text-gray-200 font-mono hover:text-white hover:bg-gray-700 rounded px-1 py-0.5 transition-colors"
              title="Click to edit value"
            >
              {typeof value === 'number' ? (Number.isInteger(step) ? Math.round(value) : value.toFixed(1)) : value}
            </button>
          )}

          {/* Randomize button */}
          {param.randomizable && (
            <button
              onClick={handleRandomize}
              disabled={isLocked}
              className="p-0.5 text-gray-500 hover:text-gray-300 disabled:opacity-30 rounded transition-colors"
              title="Randomize"
            >
              <Shuffle size={11} />
            </button>
          )}

          {/* Lock button */}
          <button
            onClick={toggleLock}
            className={`p-0.5 rounded transition-colors ${
              isLocked ? 'text-amber-400 hover:text-amber-300' : 'text-gray-600 hover:text-gray-400'
            }`}
            title={isLocked ? 'Unlock' : 'Lock'}
          >
            {isLocked ? <Lock size={11} /> : <LockOpen size={11} />}
          </button>
        </div>
      </div>

      {/* Slider track */}
      <div className="relative h-4 flex items-center">
        {/* Track background */}
        <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full"
            style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
          />
        </div>
        {/* Range input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          disabled={isLocked}
          className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          style={{ margin: 0 }}
        />
        {/* Thumb indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-gray-900 pointer-events-none"
          style={{ left: `calc(${Math.max(0, Math.min(100, percent))}% - 6px)` }}
        />
      </div>
    </div>
  );
});

export default ParamSlider;
