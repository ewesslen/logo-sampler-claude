import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, Shuffle, RotateCcw } from 'lucide-react';
import { PARAMS, SECTIONS, type ParamConfig, type SectionId } from '../../params.config';
import { useParamsStore } from '../../state/useParamsStore';
import ParamSlider from './ParamSlider';

// Color picker param
const ColorParam = React.memo(function ColorParam({ param }: { param: ParamConfig }) {
  const value = useParamsStore((s) => s.params[param.id]);
  const setParam = useParamsStore((s) => s.setParam);
  const [hex, setHex] = useState(value ?? '#000000');

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParam(param.id, e.target.value);
    setHex(e.target.value);
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setHex(v);
    if (/^#[0-9a-fA-F]{6}$/.test(v) || /^#[0-9a-fA-F]{8}$/.test(v)) {
      setParam(param.id, v);
    }
  };

  const handleHexBlur = () => {
    setHex(value ?? '#000000');
  };

  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-gray-400">{param.label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value ?? '#000000'}
          onChange={handleColorChange}
          className="w-6 h-6 rounded cursor-pointer border border-gray-600 bg-transparent p-0"
          style={{ padding: 0, border: 'none' }}
        />
        <input
          type="text"
          value={hex !== value ? hex : (value ?? '#000000')}
          onChange={handleHexChange}
          onBlur={handleHexBlur}
          className="w-20 text-xs font-mono bg-gray-800 text-gray-200 border border-gray-700 rounded px-1 py-0.5 focus:outline-none focus:border-blue-500"
          maxLength={9}
          spellCheck={false}
        />
      </div>
    </div>
  );
});

// Toggle param
const ToggleParam = React.memo(function ToggleParam({ param }: { param: ParamConfig }) {
  const value = useParamsStore((s) => s.params[param.id]);
  const setParam = useParamsStore((s) => s.setParam);

  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-gray-400">{param.label}</span>
      <button
        onClick={() => setParam(param.id, !value)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          value ? 'bg-blue-500' : 'bg-gray-700'
        }`}
        role="switch"
        aria-checked={value}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
            value ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
});

// Dropdown param
const DropdownParam = React.memo(function DropdownParam({ param }: { param: ParamConfig }) {
  const value = useParamsStore((s) => s.params[param.id]);
  const setParam = useParamsStore((s) => s.setParam);

  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-gray-400">{param.label}</span>
      <select
        value={value}
        onChange={(e) => setParam(param.id, e.target.value)}
        className="text-xs bg-gray-800 text-gray-200 border border-gray-700 rounded px-2 py-1 focus:outline-none focus:border-blue-500 max-w-[140px]"
      >
        {param.options?.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
});

function ParamControl({ param }: { param: ParamConfig }) {
  switch (param.type) {
    case 'slider': return <ParamSlider param={param} />;
    case 'color': return <ColorParam param={param} />;
    case 'toggle': return <ToggleParam param={param} />;
    case 'dropdown': return <DropdownParam param={param} />;
    default: return null;
  }
}

interface SectionPanelProps {
  sectionId: SectionId;
  label: string;
  params: ParamConfig[];
}

const SectionPanel = React.memo(function SectionPanel({ sectionId, label, params }: SectionPanelProps) {
  const [open, setOpen] = useState(true);
  const randomize = useParamsStore((s) => s.randomize);
  const resetSection = useParamsStore((s) => s.resetSection);
  const toggleSection = useParamsStore((s) => s.toggleSection);
  const disabledSections = useParamsStore((s) => s.disabledSections);
  const isDisabled = disabledSections.has(sectionId);

  const handleRandomize = useCallback(
    (e: React.MouseEvent) => { e.stopPropagation(); randomize(sectionId); },
    [sectionId, randomize]
  );

  const handleReset = useCallback(
    (e: React.MouseEvent) => { e.stopPropagation(); resetSection(sectionId); },
    [sectionId, resetSection]
  );

  const handleToggle = useCallback(
    (e: React.MouseEvent) => { e.stopPropagation(); toggleSection(sectionId); },
    [sectionId, toggleSection]
  );

  return (
    <div className="border-b border-gray-800">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          {open
            ? <ChevronDown size={13} className="text-gray-500" />
            : <ChevronRight size={13} className="text-gray-500" />}
          <span className={`text-xs font-semibold uppercase tracking-wider transition-colors ${isDisabled ? 'text-gray-600' : 'text-gray-300'}`}>
            {label}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleReset}
            className="p-1 text-gray-500 hover:text-gray-300 rounded transition-colors"
            title={`Reset ${label} to defaults`}
          >
            <RotateCcw size={12} />
          </button>
          <button
            onClick={handleRandomize}
            className="p-1 text-gray-500 hover:text-gray-300 rounded transition-colors"
            title={`Randomize ${label}`}
          >
            <Shuffle size={12} />
          </button>
          {/* Section on/off toggle */}
          <button
            onClick={handleToggle}
            className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors flex-shrink-0 ${
              isDisabled ? 'bg-gray-700' : 'bg-blue-500'
            }`}
            title={isDisabled ? `Enable ${label}` : `Disable ${label}`}
            role="switch"
            aria-checked={!isDisabled}
          >
            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
              isDisabled ? 'translate-x-0.5' : 'translate-x-3.5'
            }`} />
          </button>
        </div>
      </button>
      {open && (
        <div className={`px-3 pb-2 transition-opacity ${isDisabled ? 'opacity-40 pointer-events-none' : ''}`}>
          {params.map((p) => (
            <ParamControl key={p.id} param={p} />
          ))}
        </div>
      )}
    </div>
  );
});

const ControlPanel = React.memo(function ControlPanel() {
  return (
    <div className="w-72 flex flex-col h-full bg-gray-950 border-l border-gray-800 overflow-y-auto">
      {SECTIONS.map((section) => {
        const sectionParams = PARAMS.filter((p) => p.section === section.id);
        return (
          <SectionPanel
            key={section.id}
            sectionId={section.id}
            label={section.label}
            params={sectionParams}
          />
        );
      })}
    </div>
  );
});

export default ControlPanel;
