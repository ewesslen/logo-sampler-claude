import { useState, useEffect } from 'react';
import Navbar from './components/Navbar/Navbar';
import Canvas from './components/Canvas/Canvas';
import ControlPanel from './components/ControlPanel/ControlPanel';
import PresetsPanel from './components/ControlPanel/PresetsPanel';
import MoodTray from './components/MoodTray/MoodTray';
import Timeline from './components/Timeline/Timeline';
import ExportDialog from './components/ExportDialog/ExportDialog';
import { useParamsStore } from './state/useParamsStore';
import { getStateFromHash, pushStateToHash } from './engine/urlState';

function App() {
  const [letter, setLetter] = useState('A');
  const [font, setFont] = useState('Inter');
  const [showExport, setShowExport] = useState(false);

  const setParams = useParamsStore((s) => s.setParams);
  const params = useParamsStore((s) => s.params);

  // On mount: load state from URL hash if present
  useEffect(() => {
    const fromHash = getStateFromHash();
    if (fromHash) {
      setParams(fromHash);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync state to URL hash on param changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      pushStateToHash(params);
    }, 500);
    return () => clearTimeout(timer);
  }, [params]);

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100 overflow-hidden">
      {/* Navbar */}
      <Navbar
        letter={letter}
        onLetterChange={setLetter}
        font={font}
        onFontChange={setFont}
        onExport={() => setShowExport(true)}
      />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <Canvas letter={letter} font={font} />
          </div>
        </div>

        {/* Right control panel */}
        <div className="flex flex-col overflow-hidden" style={{ width: 288 }}>
          <div className="overflow-y-auto flex-1 bg-gray-950">
            <PresetsPanel />
            <ControlPanel />
          </div>
        </div>
      </div>

      {/* Bottom panels */}
      <MoodTray letter={letter} font={font} />
      <Timeline />

      {/* Export dialog */}
      {showExport && (
        <ExportDialog
          letter={letter}
          font={font}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}

export default App;
