import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MoodVariant {
  id: string;
  params: Record<string, any>;
  thumbnail: string;
  label: string;
  createdAt: number;
}

interface MoodTrayState {
  variants: MoodVariant[];
  saveVariant: (params: Record<string, any>, thumbnail: string, label?: string) => void;
  removeVariant: (id: string) => void;
  restoreVariant: (id: string) => Record<string, any> | null;
  reorderVariants: (fromIndex: number, toIndex: number) => void;
}

export const useMoodTrayStore = create<MoodTrayState>()(
  persist(
    (set, get) => ({
      variants: [],

      saveVariant(params, thumbnail, label) {
        const variant: MoodVariant = {
          id: `variant-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          params: { ...params },
          thumbnail,
          label: label ?? `Variant ${get().variants.length + 1}`,
          createdAt: Date.now(),
        };
        set((state) => ({ variants: [...state.variants, variant] }));
      },

      removeVariant(id) {
        set((state) => ({
          variants: state.variants.filter((v) => v.id !== id),
        }));
      },

      restoreVariant(id) {
        const variant = get().variants.find((v) => v.id === id);
        return variant ? { ...variant.params } : null;
      },

      reorderVariants(fromIndex, toIndex) {
        set((state) => {
          const next = [...state.variants];
          const [item] = next.splice(fromIndex, 1);
          next.splice(toIndex, 0, item);
          return { variants: next };
        });
      },
    }),
    {
      name: 'letterforge-mood-tray',
    }
  )
);
