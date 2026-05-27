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

export function getFramePath(shape: string, size: number, cornerRadius: number, padding: number = 0): string {
  // padding is 0–50 (percent of size). Inset the frame on all sides.
  const pad = size * (padding / 100);
  const x0 = pad;
  const y0 = pad;
  const w = size - 2 * pad;
  const h = size - 2 * pad;
  const cx = x0 + w / 2;
  const cy = y0 + h / 2;
  // r is pixel corner radius, clamped so it never exceeds half the shortest side
  const r = Math.min(cornerRadius, Math.min(w, h) / 2);

  switch (shape) {
    case 'Circle': {
      const radius = Math.min(w, h) / 2;
      return `M ${cx},${y0} A ${radius},${radius} 0 1,1 ${cx - 0.01},${y0} Z`;
    }

    case 'Square': {
      if (r > 0) {
        return (
          `M ${x0 + r},${y0} H ${x0 + w - r} Q ${x0 + w},${y0} ${x0 + w},${y0 + r} ` +
          `V ${y0 + h - r} Q ${x0 + w},${y0 + h} ${x0 + w - r},${y0 + h} ` +
          `H ${x0 + r} Q ${x0},${y0 + h} ${x0},${y0 + h - r} ` +
          `V ${y0 + r} Q ${x0},${y0} ${x0 + r},${y0} Z`
        );
      }
      return `M ${x0},${y0} H ${x0 + w} V ${y0 + h} H ${x0} Z`;
    }

    case 'Squircle': {
      // cornerRadius 0–50 controls curvature: 0 = squarish, 50 = nearly circular
      const factor = 0.5 + (cornerRadius / 50) * 0.45;
      const cpx = (w / 2) * factor;
      const cpy = (h / 2) * factor;
      return (
        `M ${cx},${y0} ` +
        `C ${cx + cpx},${y0} ${x0 + w},${cy - cpy} ${x0 + w},${cy} ` +
        `C ${x0 + w},${cy + cpy} ${cx + cpx},${y0 + h} ${cx},${y0 + h} ` +
        `C ${cx - cpx},${y0 + h} ${x0},${cy + cpy} ${x0},${cy} ` +
        `C ${x0},${cy - cpy} ${cx - cpx},${y0} ${cx},${y0} Z`
      );
    }

    case 'Hexagon': {
      const hr = Math.min(w, h) / 2;
      const wr = hr * 0.866;
      const verts: [number, number][] = [
        [cx,      y0],
        [cx + wr, cy - hr * 0.5],
        [cx + wr, cy + hr * 0.5],
        [cx,      y0 + h],
        [cx - wr, cy + hr * 0.5],
        [cx - wr, cy - hr * 0.5],
      ];
      if (r <= 0) {
        return verts.map((v, i) => `${i === 0 ? 'M' : 'L'} ${v[0]},${v[1]}`).join(' ') + ' Z';
      }
      // Rounded hexagon: quadratic arc at each vertex
      const n = verts.length;
      let d = '';
      for (let i = 0; i < n; i++) {
        const prev = verts[(i - 1 + n) % n];
        const curr = verts[i];
        const next = verts[(i + 1) % n];
        const dx1 = prev[0] - curr[0]; const dy1 = prev[1] - curr[1];
        const dx2 = next[0] - curr[0]; const dy2 = next[1] - curr[1];
        const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
        const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        const cr = Math.min(r, len1 / 2, len2 / 2);
        const p1x = curr[0] + (dx1 / len1) * cr;
        const p1y = curr[1] + (dy1 / len1) * cr;
        const p2x = curr[0] + (dx2 / len2) * cr;
        const p2y = curr[1] + (dy2 / len2) * cr;
        d += i === 0 ? `M ${p1x},${p1y} ` : `L ${p1x},${p1y} `;
        d += `Q ${curr[0]},${curr[1]} ${p2x},${p2y} `;
      }
      return d + 'Z';
    }

    case 'Shield': {
      return (
        `M ${cx},${y0} ` +
        `C ${x0 + w * 0.9},${y0} ${x0 + w},${y0 + h * 0.1} ${x0 + w},${y0 + h * 0.4} ` +
        `C ${x0 + w},${y0 + h * 0.75} ${cx},${y0 + h} ${cx},${y0 + h} ` +
        `C ${cx},${y0 + h} ${x0},${y0 + h * 0.75} ${x0},${y0 + h * 0.4} ` +
        `C ${x0},${y0 + h * 0.1} ${x0 + w * 0.1},${y0} ${cx},${y0} Z`
      );
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
