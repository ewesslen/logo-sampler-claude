import { create } from 'zustand';
import { PARAMS, DEFAULT_PARAMS } from '../params.config';

interface ParamsState {
  params: Record<string, any>;
  lockedParams: Set<string>;
  history: Record<string, any>[];
  historyIndex: number;

  setParam: (id: string, value: any) => void;
  setParams: (partial: Record<string, any>) => void;
  lockParam: (id: string) => void;
  unlockParam: (id: string) => void;
  undo: () => void;
  redo: () => void;
  randomize: (sectionId?: string) => void;
}

const MAX_HISTORY = 50;

function pushHistory(
  history: Record<string, any>[],
  historyIndex: number,
  snapshot: Record<string, any>
): { history: Record<string, any>[]; historyIndex: number } {
  // Slice off any redo states
  const newHistory = history.slice(0, historyIndex + 1);
  newHistory.push({ ...snapshot });
  if (newHistory.length > MAX_HISTORY) {
    newHistory.shift();
  }
  return { history: newHistory, historyIndex: newHistory.length - 1 };
}

export const useParamsStore = create<ParamsState>((set, get) => ({
  params: { ...DEFAULT_PARAMS },
  lockedParams: new Set<string>(),
  history: [{ ...DEFAULT_PARAMS }],
  historyIndex: 0,

  setParam(id, value) {
    set((state) => {
      const newParams = { ...state.params, [id]: value };
      const { history, historyIndex } = pushHistory(
        state.history,
        state.historyIndex,
        newParams
      );
      return { params: newParams, history, historyIndex };
    });
  },

  setParams(partial) {
    set((state) => {
      const newParams = { ...state.params, ...partial };
      const { history, historyIndex } = pushHistory(
        state.history,
        state.historyIndex,
        newParams
      );
      return { params: newParams, history, historyIndex };
    });
  },

  lockParam(id) {
    set((state) => {
      const next = new Set(state.lockedParams);
      next.add(id);
      return { lockedParams: next };
    });
  },

  unlockParam(id) {
    set((state) => {
      const next = new Set(state.lockedParams);
      next.delete(id);
      return { lockedParams: next };
    });
  },

  undo() {
    set((state) => {
      if (state.historyIndex <= 0) return {};
      const newIndex = state.historyIndex - 1;
      return { params: { ...state.history[newIndex] }, historyIndex: newIndex };
    });
  },

  redo() {
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return {};
      const newIndex = state.historyIndex + 1;
      return { params: { ...state.history[newIndex] }, historyIndex: newIndex };
    });
  },

  randomize(sectionId?: string) {
    const { lockedParams } = get();
    const updates: Record<string, any> = {};

    const candidates = sectionId
      ? PARAMS.filter((p) => p.section === sectionId)
      : PARAMS;

    for (const param of candidates) {
      if (!param.randomizable) continue;
      if (lockedParams.has(param.id)) continue;

      if (param.type === 'slider') {
        const lo = param.randomMin ?? param.min ?? 0;
        const hi = param.randomMax ?? param.max ?? 100;
        const step = param.step ?? 1;
        const range = Math.floor((hi - lo) / step);
        updates[param.id] = lo + Math.round(Math.random() * range) * step;
      }
    }

    if (Object.keys(updates).length > 0) {
      set((state) => {
        const newParams = { ...state.params, ...updates };
        const hist = pushHistory(state.history, state.historyIndex, newParams);
        return { params: newParams, ...hist };
      });
    }
  },
}));
