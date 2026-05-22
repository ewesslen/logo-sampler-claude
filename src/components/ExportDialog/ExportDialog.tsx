import React, { useState, useCallback } from 'react';
import { X, Download, Copy, Share2, Check } from 'lucide-react';
import { useParamsStore } from '../../state/useParamsStore';
import { pushStateToHash } from '../../engine/urlState';
import LetterSvg from '../Canvas/LetterSvg';
import { renderToStaticMarkup } from 'react-dom/server';

interface ExportDialogProps {
  letter: string;
  font: string;
  onClose: () => void;
}

function getSvgString(letter: string, font: string, params: Record<string, any>, size: number): string {
  const element = React.createElement(LetterSvg, { letter, font, params, size });
  return renderToStaticMarkup(element);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function svgToPng(svgString: string, size: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error('Canvas toBlob failed'));
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image load failed'));
    };
    img.src = url;
  });
}

const ExportDialog = React.memo(function ExportDialog({ letter, font, onClose }: ExportDialogProps) {
  const params = useParamsStore((s) => s.params);
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const displayLetter = letter || 'A';
  const baseName = `letterforge-${displayLetter.toLowerCase()}`;

  const markCopied = (key: string) => {
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownloadSvg = useCallback(() => {
    const svgStr = getSvgString(displayLetter, font, params, 512);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    downloadBlob(blob, `${baseName}.svg`);
  }, [displayLetter, font, params, baseName]);

  const handleDownloadPng = useCallback(async (scale: number) => {
    const size = 512 * scale;
    const key = `png${scale}x`;
    setLoading(key);
    try {
      const svgStr = getSvgString(displayLetter, font, params, size);
      const blob = await svgToPng(svgStr, size);
      downloadBlob(blob, `${baseName}@${scale}x.png`);
    } catch (err) {
      console.error('PNG export failed', err);
    } finally {
      setLoading(null);
    }
  }, [displayLetter, font, params, baseName]);

  const handleCopySvg = useCallback(async () => {
    const svgStr = getSvgString(displayLetter, font, params, 512);
    await navigator.clipboard.writeText(svgStr);
    markCopied('svg');
  }, [displayLetter, font, params]);

  const handleCopyUrl = useCallback(() => {
    pushStateToHash(params);
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => markCopied('url'));
  }, [params]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-[440px] max-w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-base font-semibold text-white">Export</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Preview */}
        <div className="flex justify-center py-6 bg-gray-950 border-b border-gray-800">
          <div className="rounded-lg overflow-hidden shadow-lg">
            <LetterSvg
              letter={displayLetter}
              font={font}
              params={params}
              size={128}
            />
          </div>
        </div>

        {/* Export options */}
        <div className="p-5 space-y-3">
          {/* SVG */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">SVG</p>
              <p className="text-xs text-gray-500">Vector, scalable</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopySvg}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-sm transition-colors border border-gray-700"
              >
                {copied === 'svg' ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                <span>{copied === 'svg' ? 'Copied!' : 'Copy'}</span>
              </button>
              <button
                onClick={handleDownloadSvg}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-colors"
              >
                <Download size={13} />
                <span>Download</span>
              </button>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-3">
            <p className="text-sm font-medium text-white mb-2">PNG</p>
            <div className="flex gap-2">
              {[1, 2, 4].map((scale) => {
                const key = `png${scale}x`;
                return (
                  <button
                    key={scale}
                    onClick={() => handleDownloadPng(scale)}
                    disabled={loading === key}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-sm transition-colors border border-gray-700 disabled:opacity-50"
                  >
                    {loading === key ? (
                      <span className="text-xs">...</span>
                    ) : (
                      <>
                        <Download size={13} />
                        <span>{scale}x ({512 * scale}px)</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-gray-800 pt-3">
            <button
              onClick={handleCopyUrl}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-sm transition-colors border border-gray-700"
            >
              {copied === 'url' ? <Check size={14} className="text-green-400" /> : <Share2 size={14} />}
              <span>{copied === 'url' ? 'URL copied!' : 'Copy share URL'}</span>
            </button>
            <p className="text-xs text-gray-600 text-center mt-1">
              Encodes all settings in the URL hash
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ExportDialog;
