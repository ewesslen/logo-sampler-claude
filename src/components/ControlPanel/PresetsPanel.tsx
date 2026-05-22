import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { PRESETS } from '../../presets/visualPresets';
import { useParamsStore } from '../../state/useParamsStore';

const PresetsPanel = React.memo(function PresetsPanel() {
  const [open, setOpen] = useState(true);
  const setParams = useParamsStore((s) => s.setParams);

  return (
    <div className="border-b border-gray-800">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-800 transition-colors"
      >
        {open ? <ChevronDown size={13} className="text-gray-500" /> : <ChevronRight size={13} className="text-gray-500" />}
        <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Presets</span>
      </button>
      {open && (
        <div className="px-3 pb-3 grid grid-cols-2 gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setParams(preset.params)}
              title={preset.description}
              className="px-2 py-1.5 text-xs text-left bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded transition-colors border border-gray-700 hover:border-gray-600 truncate"
            >
              {preset.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export default PresetsPanel;
