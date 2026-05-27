import React, { useMemo } from 'react';
import {
  mapWeightToFontWeight,
  blendModeToCss,
  terminalToLinecap,
  jointToLinejoin,
  buildFillAttr,
  buildGradientDef,
  buildFilterDef,
  getFramePath,
} from '../../engine/renderer';

interface LetterSvgProps {
  letter: string;
  font: string;
  params: Record<string, any>;
  size?: number;
  id?: string;
}

let _svgIdCounter = 0;

const LetterSvg = React.memo(function LetterSvg({
  letter,
  font,
  params,
  size = 512,
  id: propId,
}: LetterSvgProps) {
  const uid = useMemo(() => {
    if (propId) return propId;
    return `lf-${++_svgIdCounter}`;
  }, [propId]);

  const fillGradId = `${uid}-grad`;
  const filterId = `${uid}-filter`;
  const clipId = `${uid}-clip`;
  const grainId = `${uid}-grain`;

  const fontWeight = mapWeightToFontWeight(params.weight ?? 40);
  const fontSize = Math.round(size * 0.72);
  const fill = buildFillAttr(params, fillGradId);
  const gradientDef = buildGradientDef(params, fillGradId);
  const filterDef = buildFilterDef(params, filterId);
  const hasFilter = filterDef !== null;
  const hasGrain = (params.grainAmount ?? 0) > 0;
  const hasFrame = params.frameShape && params.frameShape !== 'None';

  const framePath = hasFrame
    ? getFramePath(params.frameShape, size, params.frameCornerRadius ?? 8, params.framePadding ?? 15)
    : '';

  const blendMode = blendModeToCss(params.blendMode ?? 'Normal');

  // Build the main letter transform
  const cx = size / 2;
  const cy = size / 2;
  const scaleX = (params.scaleX ?? 100) / 100;
  const scaleY = (params.scaleY ?? 100) / 100;
  const slant = params.slant ?? 0;
  const rotation = params.rotation ?? 0;
  // Bulge stretches X (positive) or pinches X (negative)
  const bulge = params.bulge ?? 0;
  const bulgeScaleX = scaleX * (1 + bulge / 300);
  // Twist is approximated as a skewY shear — gives a visible tilt/warp effect
  const twistSkew = (params.twist ?? 0) * 0.12;

  const letterTransform = [
    `translate(${cx} ${cy})`,
    rotation !== 0 ? `rotate(${rotation})` : '',
    `scale(${bulgeScaleX} ${scaleY})`,
    slant !== 0 ? `skewX(${-slant})` : '',
    twistSkew !== 0 ? `skewY(${twistSkew})` : '',
    `translate(${-cx} ${-cy})`,
  ]
    .filter(Boolean)
    .join(' ');

  const strokeColor = params.strokeColor ?? '#1E3A5F';
  const strokeWidth = params.strokeWidth ?? 0;
  const linecap = terminalToLinecap(params.terminalStyle ?? 'Round');
  const linejoin = jointToLinejoin(params.jointStyle ?? 'Round');

  const echoCount = Math.max(1, params.echoCount ?? 1);
  const echoOffsetX = params.echoOffsetX ?? 0;
  const echoOffsetY = params.echoOffsetY ?? 0;
  const echoOpacityFalloff = (params.echoOpacityFalloff ?? 0) / 100;
  const mirror = params.mirror ?? 'Off';
  const rotSym = Math.max(1, params.rotationalSymmetry ?? 1);

  // Background
  const bgColor = params.backgroundTransparent ? 'transparent' : (params.backgroundColor ?? '#FFFFFF');

  const textProps = {
    x: cx,
    y: cy + fontSize * 0.35,
    textAnchor: 'middle' as const,
    fontFamily: `"${font}", sans-serif`,
    fontSize,
    fontWeight,
    fill: fill.fill,
    stroke: strokeWidth > 0 ? strokeColor : 'none',
    strokeWidth: strokeWidth > 0 ? strokeWidth : undefined,
    strokeLinecap: linecap as any,
    strokeLinejoin: linejoin as any,
    style: { mixBlendMode: blendMode as any },
    filter: hasFilter ? `url(#${filterId})` : undefined,
  };

  // Build echo copies (behind main)
  const echoCopies: React.ReactElement[] = [];
  if (echoCount > 1) {
    for (let i = echoCount - 1; i >= 1; i--) {
      const opacity = 1 - echoOpacityFalloff * (i / echoCount);
      echoCopies.push(
        React.createElement(
          'g',
          {
            key: `echo-${i}`,
            transform: `translate(${echoOffsetX * i} ${echoOffsetY * i})`,
            opacity: Math.max(0, Math.min(1, opacity)),
          },
          React.createElement('text', { ...textProps, filter: undefined }, letter)
        )
      );
    }
  }

  // Mirror copies
  const mirrorCopies: React.ReactElement[] = [];
  if (mirror !== 'Off') {
    if (mirror === 'Horizontal' || mirror === 'Both') {
      mirrorCopies.push(
        React.createElement(
          'g',
          {
            key: 'mirror-h',
            transform: `scale(-1 1) translate(${-size} 0)`,
            opacity: 0.7,
          },
          React.createElement('text', { ...textProps, filter: undefined }, letter)
        )
      );
    }
    if (mirror === 'Vertical' || mirror === 'Both') {
      mirrorCopies.push(
        React.createElement(
          'g',
          {
            key: 'mirror-v',
            transform: `scale(1 -1) translate(0 ${-size})`,
            opacity: 0.7,
          },
          React.createElement('text', { ...textProps, filter: undefined }, letter)
        )
      );
    }
    if (mirror === 'Both') {
      mirrorCopies.push(
        React.createElement(
          'g',
          {
            key: 'mirror-both',
            transform: `scale(-1 -1) translate(${-size} ${-size})`,
            opacity: 0.5,
          },
          React.createElement('text', { ...textProps, filter: undefined }, letter)
        )
      );
    }
  }

  // Rotational symmetry copies
  const rotSymCopies: React.ReactElement[] = [];
  if (rotSym > 1) {
    for (let i = 1; i < rotSym; i++) {
      const angle = (360 / rotSym) * i;
      rotSymCopies.push(
        React.createElement(
          'g',
          {
            key: `rot-${i}`,
            transform: `rotate(${angle} ${cx} ${cy})`,
            opacity: 0.6,
          },
          React.createElement('text', { ...textProps, filter: undefined }, letter)
        )
      );
    }
  }

  // Frame element
  const frameEl = hasFrame
    ? React.createElement('path', {
        key: 'frame',
        d: framePath,
        fill: params.frameFillColor ?? '#F0F4FF',
        stroke: (params.frameStrokeWidth ?? 0) > 0 ? (params.frameStrokeColor ?? '#3B82F6') : 'none',
        strokeWidth: params.frameStrokeWidth ?? 0,
      })
    : null;

  // Build clip path for frame
  const clipPathDef = hasFrame
    ? React.createElement(
        'clipPath',
        { key: clipId, id: clipId },
        React.createElement('path', { d: framePath })
      )
    : null;

  // Grain filter
  const grainFilterDef = hasGrain
    ? React.createElement(
        'filter',
        { key: grainId, id: grainId, x: '0%', y: '0%', width: '100%', height: '100%' },
        React.createElement('feTurbulence', {
          key: 'turb',
          type: 'fractalNoise',
          baseFrequency: '0.65',
          numOctaves: '3',
          stitchTiles: 'stitch',
          result: 'noise',
        }),
        React.createElement('feColorMatrix', {
          key: 'cm',
          type: 'saturate',
          values: '0',
          in: 'noise',
          result: 'grayNoise',
        }),
        React.createElement('feBlend', {
          key: 'blend',
          in: 'SourceGraphic',
          in2: 'grayNoise',
          mode: 'multiply',
          result: 'blended',
        }),
        React.createElement('feComponentTransfer', { key: 'ct' },
          React.createElement('feFuncA', { key: 'fa', type: 'linear', slope: '1' })
        )
      )
    : null;

  // Inline offset stroke overlay
  const inlineOffset = params.inlineOffset ?? 0;
  const inlineEl =
    inlineOffset > 0
      ? React.createElement(
          'text',
          {
            key: 'inline',
            ...textProps,
            fill: 'none',
            stroke: params.color1 ?? '#3B82F6',
            strokeWidth: inlineOffset,
            filter: undefined,
          },
          letter
        )
      : null;

  const mainLetterContent = React.createElement(
    React.Fragment,
    null,
    ...echoCopies,
    ...mirrorCopies,
    ...rotSymCopies,
    inlineEl,
    React.createElement('text', { ...textProps }, letter)
  );

  const letterGroupContent = React.createElement(
    'g',
    { transform: letterTransform },
    mainLetterContent
  );

  const clippedContent = hasFrame
    ? React.createElement('g', { clipPath: `url(#${clipId})` }, letterGroupContent)
    : letterGroupContent;

  const grainOverlay =
    hasGrain
      ? React.createElement('rect', {
          key: 'grain-overlay',
          x: 0,
          y: 0,
          width: size,
          height: size,
          fill: `url(#${grainId})`,
          opacity: (params.grainAmount ?? 0) / 200,
          style: { mixBlendMode: 'overlay' as any },
        })
      : null;

  return React.createElement(
    'svg',
    {
      id: propId,
      viewBox: `0 0 ${size} ${size}`,
      xmlns: 'http://www.w3.org/2000/svg',
      width: size,
      height: size,
      style: { display: 'block' },
    },
    React.createElement(
      'defs',
      null,
      gradientDef,
      filterDef,
      clipPathDef,
      grainFilterDef
    ),
    // Background
    React.createElement('rect', {
      key: 'bg',
      x: 0,
      y: 0,
      width: size,
      height: size,
      fill: bgColor,
    }),
    // Frame (behind letter)
    frameEl,
    // Main content
    clippedContent,
    // Grain overlay
    grainOverlay
  );
});

export default LetterSvg;
