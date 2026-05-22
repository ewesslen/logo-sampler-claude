import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import LetterSvg from './LetterSvg';
import { useParamsStore } from '../../state/useParamsStore';

interface CanvasProps {
  letter: string;
  font: string;
}

const ICON_SIZES = [16, 32, 64, 128, 256];

const Canvas = React.memo(function Canvas({ letter, font }: CanvasProps) {
  const params = useParamsStore((s) => s.params);
  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((z) => Math.min(400, z + 25));
  const handleZoomOut = () => setZoom((z) => Math.max(25, z - 25));
  const handleResetZoom = () => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan({ x: dragStart.current.px + dx, y: dragStart.current.py + dy });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStart.current = null;
  }, []);

  useEffect(() => {
    const handler = () => handleMouseUp();
    window.addEventListener('mouseup', handler);
    return () => window.removeEventListener('mouseup', handler);
  }, [handleMouseUp]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -10 : 10;
    setZoom((z) => Math.min(400, Math.max(25, z + delta)));
  }, []);

  const isTransparent = params.backgroundTransparent ?? false;
  const scale = zoom / 100;

  const displayLetter = letter || 'A';

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Main canvas area */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Checkerboard background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(45deg, #374151 25%, transparent 25%), linear-gradient(-45deg, #374151 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #374151 75%), linear-gradient(-45deg, transparent 75%, #374151 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
            backgroundColor: '#1f2937',
          }}
        />

        {/* Canvas wrapper */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
        >
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            {isTransparent ? (
              <div
                style={{
                  position: 'relative',
                  width: 512,
                  height: 512,
                  backgroundImage:
                    'linear-gradient(45deg, #9ca3af 25%, transparent 25%), linear-gradient(-45deg, #9ca3af 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #9ca3af 75%), linear-gradient(-45deg, transparent 75%, #9ca3af 75%)',
                  backgroundSize: '16px 16px',
                  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                  backgroundColor: '#e5e7eb',
                }}
              >
                <div style={{ position: 'absolute', inset: 0 }}>
                  <LetterSvg
                    letter={displayLetter}
                    font={font}
                    params={params}
                    size={512}
                    id="main-canvas"
                  />
                </div>
              </div>
            ) : (
              <LetterSvg
                letter={displayLetter}
                font={font}
                params={params}
                size={512}
                id="main-canvas"
              />
            )}
          </div>
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-gray-800 bg-opacity-90 rounded-lg px-2 py-1 border border-gray-700">
          <button
            onClick={handleZoomOut}
            className="p-1 text-gray-400 hover:text-white rounded"
            title="Zoom out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={handleResetZoom}
            className="px-2 py-0.5 text-xs text-gray-300 hover:text-white font-mono min-w-[3.5rem] text-center"
            title="Reset zoom"
          >
            {zoom}%
          </button>
          <button
            onClick={handleZoomIn}
            className="p-1 text-gray-400 hover:text-white rounded"
            title="Zoom in"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1 text-gray-400 hover:text-white rounded ml-1"
            title="Fit to view"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* Icon preview strip */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-900 border-t border-gray-800 overflow-x-auto">
        <span className="text-xs text-gray-500 shrink-0">Preview:</span>
        {ICON_SIZES.map((sz) => (
          <div key={sz} className="flex flex-col items-center gap-1 shrink-0">
            <div
              className="border border-gray-700 rounded overflow-hidden"
              style={{
                width: Math.min(sz, 64),
                height: Math.min(sz, 64),
                minWidth: Math.min(sz, 64),
              }}
            >
              <div
                style={{
                  width: sz,
                  height: sz,
                  transform: `scale(${Math.min(sz, 64) / sz})`,
                  transformOrigin: 'top left',
                  pointerEvents: 'none',
                }}
              >
                <LetterSvg
                  letter={displayLetter}
                  font={font}
                  params={params}
                  size={sz}
                  id={`preview-${sz}`}
                />
              </div>
            </div>
            <span className="text-xs text-gray-600">{sz}px</span>
          </div>
        ))}
      </div>
    </div>
  );
});

export default Canvas;
