import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Tema = 'oscuro' | 'claro' | 'sistema';

interface AjustesState {
  tema: Tema;
  sonidos: boolean;
  vibracion: boolean;
  reducirAnimaciones: boolean;
  setTema: (t: Tema) => void;
  setSonidos: (v: boolean) => void;
  setVibracion: (v: boolean) => void;
  setReducirAnimaciones: (v: boolean) => void;
}

function aplicarTema(tema: Tema) {
  if (typeof document === 'undefined') return;
  const oscuro =
    tema === 'oscuro' ||
    (tema === 'sistema' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', oscuro);
}

function aplicarAnimaciones(reducir: boolean) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('sin-animaciones', reducir);
}

export const useAjustes = create<AjustesState>()(
  persist(
    (set) => ({
      tema: 'oscuro',
      sonidos: true,
      vibracion: true,
      reducirAnimaciones: false,
      setTema: (tema) => {
        aplicarTema(tema);
        set({ tema });
      },
      setSonidos: (sonidos) => set({ sonidos }),
      setVibracion: (vibracion) => set({ vibracion }),
      setReducirAnimaciones: (reducirAnimaciones) => {
        aplicarAnimaciones(reducirAnimaciones);
        set({ reducirAnimaciones });
      },
    }),
    { name: 'mentiroso-ajustes' },
  ),
);

/** Vibración corta si el usuario la tiene activada. */
export function vibrar(patron: number | number[] = 30) {
  if (!useAjustes.getState().vibracion) return;
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(patron);
  }
}
