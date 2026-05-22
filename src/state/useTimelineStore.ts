import { create } from 'zustand';

export interface Keyframe {
  id: string;
  paramId: string;
  time: number;
  value: any;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

interface TimelineState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  fps: number;
  loop: boolean;
  keyframes: Keyframe[];

  play: () => void;
  pause: () => void;
  seek: (t: number) => void;
  addKeyframe: (paramId: string, time: number, value: any, easing?: Keyframe['easing']) => void;
  removeKeyframe: (id: string) => void;
  setDuration: (d: number) => void;
  tick: (dt: number) => void;
  getInterpolatedParams: (baseParams: Record<string, any>) => Record<string, any>;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function applyEasing(t: number, easing: Keyframe['easing']): number {
  switch (easing) {
    case 'ease-in': return t * t;
    case 'ease-out': return 1 - (1 - t) * (1 - t);
    case 'ease-in-out': return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    default: return t;
  }
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  isPlaying: false,
  currentTime: 0,
  duration: 3,
  fps: 30,
  loop: true,
  keyframes: [],

  play() {
    set({ isPlaying: true });
  },

  pause() {
    set({ isPlaying: false });
  },

  seek(t) {
    set({ currentTime: Math.max(0, Math.min(t, get().duration)) });
  },

  addKeyframe(paramId, time, value, easing = 'linear') {
    const id = `kf-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    set((state) => ({
      keyframes: [...state.keyframes, { id, paramId, time, value, easing }],
    }));
  },

  removeKeyframe(id) {
    set((state) => ({
      keyframes: state.keyframes.filter((kf) => kf.id !== id),
    }));
  },

  setDuration(d) {
    set({ duration: Math.max(0.1, d) });
  },

  tick(dt) {
    const { isPlaying, currentTime, duration, loop, fps } = get();
    if (!isPlaying) return;

    const frameDuration = 1 / fps;
    const advance = Math.min(dt, frameDuration);
    let next = currentTime + advance;

    if (next >= duration) {
      if (loop) {
        next = next % duration;
      } else {
        next = duration;
        set({ isPlaying: false });
      }
    }

    set({ currentTime: next });
  },

  getInterpolatedParams(baseParams) {
    const { currentTime, keyframes } = get();
    if (keyframes.length === 0) return baseParams;

    const result = { ...baseParams };
    const paramIds = [...new Set(keyframes.map((kf) => kf.paramId))];

    for (const paramId of paramIds) {
      const frames = keyframes
        .filter((kf) => kf.paramId === paramId)
        .sort((a, b) => a.time - b.time);

      if (frames.length === 0) continue;

      // Before first keyframe
      if (currentTime <= frames[0].time) {
        result[paramId] = frames[0].value;
        continue;
      }

      // After last keyframe
      if (currentTime >= frames[frames.length - 1].time) {
        result[paramId] = frames[frames.length - 1].value;
        continue;
      }

      // Between two keyframes
      for (let i = 0; i < frames.length - 1; i++) {
        if (currentTime >= frames[i].time && currentTime <= frames[i + 1].time) {
          const span = frames[i + 1].time - frames[i].time;
          const t = span === 0 ? 0 : (currentTime - frames[i].time) / span;
          const easedT = applyEasing(t, frames[i].easing);

          const a = frames[i].value;
          const b = frames[i + 1].value;
          if (typeof a === 'number' && typeof b === 'number') {
            result[paramId] = lerp(a, b, easedT);
          } else {
            result[paramId] = easedT < 0.5 ? a : b;
          }
          break;
        }
      }
    }

    return result;
  },
}));
