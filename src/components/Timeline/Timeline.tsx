import React, { useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { useTimelineStore } from '../../state/useTimelineStore';
import { useState } from 'react';

const Timeline = React.memo(function Timeline() {
  const [open, setOpen] = useState(false);
  const {
    isPlaying,
    currentTime,
    duration,
    keyframes,
    play,
    pause,
    seek,
    setDuration,
    tick,
    removeKeyframe,
  } = useTimelineStore();

  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
      return;
    }

    const loop = (now: number) => {
      if (lastTimeRef.current !== null) {
        const dt = (now - lastTimeRef.current) / 1000;
        tick(dt);
      }
      lastTimeRef.current = now;
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, tick]);

  const progress = duration > 0 ? currentTime / duration : 0;

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(parseFloat(e.target.value));
  };

  const handleReset = () => {
    pause();
    seek(0);
  };

  const paramIds = [...new Set(keyframes.map((kf) => kf.paramId))];

  return (
    <div className="bg-gray-950 border-t border-gray-800">
      {/* Toggle bar */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-900 transition-colors"
      >
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Timeline
          {keyframes.length > 0 && (
            <span className="ml-2 text-blue-400">({keyframes.length} kf)</span>
          )}
        </span>
        {open ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronUp size={14} className="text-gray-500" />}
      </button>

      {open && (
        <div className="px-4 pb-3 space-y-3">
          {/* Transport controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="p-1.5 text-gray-400 hover:text-white rounded transition-colors"
              title="Reset"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={isPlaying ? pause : play}
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-colors"
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <span className="text-xs font-mono text-gray-400">
              {currentTime.toFixed(2)}s / {duration.toFixed(1)}s
            </span>

            <div className="flex items-center gap-1 ml-auto">
              <label className="text-xs text-gray-500">Duration:</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseFloat(e.target.value) || 3)}
                min={0.1}
                max={60}
                step={0.5}
                className="w-16 text-xs bg-gray-800 text-gray-200 border border-gray-700 rounded px-1 py-0.5 focus:outline-none"
              />
              <span className="text-xs text-gray-500">s</span>
            </div>
          </div>

          {/* Scrub bar */}
          <div className="relative h-5 flex items-center">
            <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={duration}
              step={0.01}
              value={currentTime}
              onChange={handleScrub}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
            {/* Keyframe dots on scrub bar */}
            {keyframes.map((kf) => (
              <div
                key={kf.id}
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-yellow-400 rounded-full pointer-events-none"
                style={{ left: `calc(${(kf.time / duration) * 100}% - 4px)` }}
                title={`${kf.paramId} @ ${kf.time.toFixed(2)}s`}
              />
            ))}
          </div>

          {/* Parameter lanes */}
          {paramIds.length > 0 ? (
            <div className="space-y-1">
              {paramIds.map((paramId) => {
                const lanes = keyframes.filter((kf) => kf.paramId === paramId);
                return (
                  <div key={paramId} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-28 truncate">{paramId}</span>
                    <div className="flex-1 h-5 bg-gray-800 rounded relative">
                      {lanes.map((kf) => (
                        <button
                          key={kf.id}
                          className="absolute top-0.5 w-4 h-4 bg-yellow-400 rounded-sm text-black hover:bg-yellow-300 transition-colors"
                          style={{
                            left: `calc(${(kf.time / duration) * 100}% - 8px)`,
                          }}
                          title={`Remove keyframe at ${kf.time.toFixed(2)}s`}
                          onClick={() => removeKeyframe(kf.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-600 py-1">
              No keyframes. Right-click on sliders to add keyframes.
            </p>
          )}
        </div>
      )}
    </div>
  );
});

export default Timeline;
