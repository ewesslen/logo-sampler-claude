import React from 'react';

export interface SVGData {
  defs: React.ReactNode;
  content: React.ReactNode;
  background: React.ReactNode;
}

// Map weight param (1-200) to CSS font-weight (100-900)
export function mapWeightToFontWeight(weight: number): number {
  return Math.round(100 + (weight / 200) * 800);
}

// Convert blend mode name to CSS mix-blend-mode
export function blendModeToCss(mode: string): string {
  switch (mode) {
    case 'Multiply': return 'multiply';
    case 'Screen': return 'screen';
    case 'Overlay': return 'overlay';
    case 'Difference': return 'difference';
    default: return 'normal';
  }
}

// Map line cap from terminalStyle
export function terminalToLinecap(style: string): string {
  switch (style) {
    case 'Butt': return 'butt';
    case 'Square': return 'square';
    default: return 'round';
  }
}

// Map joint style to SVG stroke-linejoin
export function jointToLinejoin(style: string): string {
  switch (style) {
    case 'Miter': return 'miter';
    case 'Bevel': return 'bevel';
    default: return 'round';
  }
}

// Generate unique IDs for SVG defs
let _idCounter = 0;
export function generateSvgId(prefix: string): string {
  return `${prefix}-${++_idCounter}`;
}

export function getFramePath(shape: string, size: number, cornerRadius: number): string {
  const half = size / 2;
  const r = cornerRadius;

  switch (shape) {
    case 'Circle':
      return `M ${half},0 A ${half},${half} 0 1,1 ${half - 0.01},0 Z`;

    case 'Square':
      if (r > 0) {
        return `M ${r},0 H ${size - r} Q ${size},0 ${size},${r} V ${size - r} Q ${size},${size} ${size - r},${size} H ${r} Q 0,${size} 0,${size - r} V ${r} Q 0,0 ${r},0 Z`;
      }
      return `M 0,0 H ${size} V ${size} H 0 Z`;

    case 'Squircle': {
      const c = half * 0.85;
      return `M ${half},0 C ${half + c},0 ${size},${half - c} ${size},${half} C ${size},${half + c} ${half + c},${size} ${half},${size} C ${half - c},${size} 0,${half + c} 0,${half} C 0,${half - c} ${half - c},0 ${half},0 Z`;
    }

    case 'Hexagon': {
      const h = half;
      const w = half * 0.866;
      return `M ${half},0 L ${half + w},${h * 0.5} L ${half + w},${h * 1.5} L ${half},${size} L ${half - w},${h * 1.5} L ${half - w},${h * 0.5} Z`;
    }

    case 'Shield': {
      const sw = size * 0.85;
      const sh = size * 0.9;
      const ox = (size - sw) / 2;
      const oy = (size - sh) / 2;
      return `M ${half},${oy} C ${ox + sw * 0.9},${oy} ${ox + sw},${oy + sh * 0.1} ${ox + sw},${oy + sh * 0.4} C ${ox + sw},${oy + sh * 0.75} ${half},${oy + sh} ${half},${oy + sh} C ${half},${oy + sh} ${ox},${oy + sh * 0.75} ${ox},${oy + sh * 0.4} C ${ox},${oy + sh * 0.1} ${ox + sw * 0.1},${oy} ${half},${oy} Z`;
    }

    default:
      return '';
  }
}

export interface RendererOptions {
  letter: string;
  font: string;
  params: Record<string, any>;
  svgSize?: number;
}

export function buildFillAttr(
  params: Record<string, any>,
  fillId: string
): { fill: string; fillId: string | null } {
  switch (params.fillMode) {
    case 'None':
      return { fill: 'none', fillId: null };
    case 'Linear Gradient':
    case 'Radial Gradient':
    case 'Conic':
      return { fill: `url(#${fillId})`, fillId };
    default:
      return { fill: params.color1 ?? '#3B82F6', fillId: null };
  }
}

export function buildGradientDef(
  params: Record<string, any>,
  fillId: string
): React.ReactElement | null {
  const c1 = params.color1 ?? '#3B82F6';
  const c2 = params.color2 ?? '#8B5CF6';
  const angle = params.gradientAngle ?? 45;

  if (params.fillMode === 'Linear Gradient') {
    const rad = (angle - 90) * (Math.PI / 180);
    const x1 = 50 - Math.cos(rad) * 50;
    const y1 = 50 - Math.sin(rad) * 50;
    const x2 = 50 + Math.cos(rad) * 50;
    const y2 = 50 + Math.sin(rad) * 50;
    return React.createElement(
      'linearGradient',
      {
        key: fillId,
        id: fillId,
        gradientUnits: 'userSpaceOnUse',
        x1: `${x1}%`,
        y1: `${y1}%`,
        x2: `${x2}%`,
        y2: `${y2}%`,
      },
      React.createElement('stop', { offset: '0%', stopColor: c1 }),
      React.createElement('stop', { offset: '100%', stopColor: c2 })
    );
  }

  if (params.fillMode === 'Radial Gradient') {
    return React.createElement(
      'radialGradient',
      { key: fillId, id: fillId, cx: '50%', cy: '50%', r: '50%' },
      React.createElement('stop', { offset: '0%', stopColor: c1 }),
      React.createElement('stop', { offset: '100%', stopColor: c2 })
    );
  }

  return null;
}

export function buildFilterDef(
  params: Record<string, any>,
  filterId: string
): React.ReactElement | null {
  const waveAmplitude = params.waveAmplitude ?? 0;
  const waveFrequency = params.waveFrequency ?? 4;
  const noiseAmount = params.noiseAmount ?? 0;
  const noiseSeed = (params.noiseSeed ?? 0) % 100;
  const shadowBlurVal = params.shadowBlur ?? 0;
  const shadowX = params.shadowX ?? 0;
  const shadowY = params.shadowY ?? 0;
  const glowIntensity = params.glowIntensity ?? 0;

  const hasWave = waveAmplitude > 0;
  const hasNoise = noiseAmount > 0;
  const hasShadow = shadowBlurVal > 0 || shadowX !== 0 || shadowY !== 0;
  const hasGlow = glowIntensity > 0;

  if (!hasWave && !hasNoise && !hasShadow && !hasGlow) return null;

  const children: React.ReactElement[] = [];
  let current = 'SourceGraphic';

  // Wave displacement — fractalNoise gives smooth organic undulation
  if (hasWave) {
    const freqX = (0.005 + (waveFrequency / 20) * 0.095).toFixed(4);
    const freqY = (0.003 + (waveFrequency / 20) * 0.030).toFixed(4);
    children.push(
      React.createElement('feTurbulence', {
        key: 'wave-turb',
        type: 'fractalNoise',
        baseFrequency: `${freqX} ${freqY}`,
        numOctaves: 2,
        seed: noiseSeed,
        result: 'waveMap',
      }),
      React.createElement('feDisplacementMap', {
        key: 'wave-disp',
        in: current,
        in2: 'waveMap',
        scale: waveAmplitude * 2,
        xChannelSelector: 'R',
        yChannelSelector: 'G',
        result: 'waved',
      })
    );
    current = 'waved';
  }

  // Noise/roughness — turbulence type gives jagged, rough edges
  if (hasNoise) {
    children.push(
      React.createElement('feTurbulence', {
        key: 'noise-turb',
        type: 'turbulence',
        baseFrequency: '0.065',
        numOctaves: 4,
        seed: (noiseSeed + 42) % 100,
        result: 'noiseMap',
      }),
      React.createElement('feDisplacementMap', {
        key: 'noise-disp',
        in: current,
        in2: 'noiseMap',
        scale: noiseAmount * 2,
        xChannelSelector: 'R',
        yChannelSelector: 'G',
        result: 'noised',
      })
    );
    current = 'noised';
  }

  // Shadow — explicit primitives so it composites on the distorted result
  if (hasShadow) {
    const shadowMergeResult = hasGlow ? 'afterShadow' : undefined;
    children.push(
      React.createElement('feGaussianBlur', {
        key: 'shd-blur',
        in: current,
        stdDeviation: shadowBlurVal / 2,
        result: 'shdBlur',
      }),
      React.createElement('feOffset', {
        key: 'shd-off',
        in: 'shdBlur',
        dx: shadowX,
        dy: shadowY,
        result: 'shdOff',
      }),
      React.createElement('feFlood', {
        key: 'shd-flood',
        floodColor: params.shadowColor ?? '#000000',
        result: 'shdCol',
      }),
      React.createElement('feComposite', {
        key: 'shd-comp',
        in: 'shdCol',
        in2: 'shdOff',
        operator: 'in',
        result: 'shdFinal',
      }),
      React.createElement(
        'feMerge',
        { key: 'shd-merge', ...(shadowMergeResult ? { result: shadowMergeResult } : {}) },
        React.createElement('feMergeNode', { key: 'smn1', in: 'shdFinal' }),
        React.createElement('feMergeNode', { key: 'smn2', in: current })
      )
    );
    if (shadowMergeResult) current = shadowMergeResult;
  }

  // Glow — blur on SourceGraphic merged behind final result
  if (hasGlow) {
    const intensity = glowIntensity / 5;
    children.push(
      React.createElement('feGaussianBlur', {
        key: 'glow-blur',
        in: 'SourceGraphic',
        stdDeviation: intensity,
        result: 'glowBlur',
      }),
      React.createElement('feMerge', { key: 'glow-merge' },
        React.createElement('feMergeNode', { key: 'gmn1', in: 'glowBlur' }),
        React.createElement('feMergeNode', { key: 'gmn2', in: current })
      )
    );
  }

  if (children.length === 0) return null;

  return React.createElement(
    'filter',
    {
      key: filterId,
      id: filterId,
      x: '-50%',
      y: '-50%',
      width: '200%',
      height: '200%',
    },
    ...children
  );
}
