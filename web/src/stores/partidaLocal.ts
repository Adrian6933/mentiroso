import {
  aplicarAccion,
  aplicarModo,
  CONFIG_DEFECTO,
  crearPartida,
  PACKS,
  validarConfig,
  type Accion,
  type GameConfig,
  type GameState,
  type JugadorInfo,
  type ModoJuego,
  type Pack,
} from '@mentiroso/shared';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { obtenerPacksPersonalizados } from '../lib/packsPersonalizados';

export const EMOJIS = ['😎', '🦊', '🐸', '👽', '🤖', '🐼', '🦄', '🐙', '🐯', '👻', '🍕', '🚀', '🌵', '🎩', '🐨', '🦁', '🍩', '⚡', '🎸', '🎯'] as const;
export const COLORES = ['#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#f97316', '#14b8a6', '#a855f7'] as const;

interface PartidaLocalState {
  jugadores: JugadorInfo[];
  config: GameConfig;
  partida: GameState | null;
  marcador: Record<string, number>;
  entradasUsadas: string[];
  error: string | null;

  anadirJugador: (nombre: string) => void;
  quitarJugador: (id: string) => void;
  cambiarAvatar: (id: string) => void;
  setConfig: (parcial: Partial<GameConfig>) => void;
  elegirModo: (modo: ModoJuego) => void;
  empezar: () => boolean;
  accion: (a: Accion) => void;
  finalizarYSumarPuntos: () => void;
  reiniciar: () => void;
  limpiarError: () => void;
}

export function todosLosPacks(): Pack[] {
  return [...PACKS, ...obtenerPacksPersonalizados()];
}

let contadorId = 1;

export const usePartidaLocal = create<PartidaLocalState>()(
  persist(
    (set, get) => ({
      jugadores: [],
      config: { ...CONFIG_DEFECTO, rolesExtra: { ...CONFIG_DEFECTO.rolesExtra }, puntos: { ...CONFIG_DEFECTO.puntos } },
      partida: null,
      marcador: {},
      entradasUsadas: [],
      error: null,

      anadirJugador: (nombre) => {
        const limpio = nombre.trim().slice(0, 18);
        if (!limpio) return;
        const { jugadores } = get();
        if (jugadores.length >= 20) return;
        const id = `local-${Date.now()}-${contadorId++}`;
        const jugador: JugadorInfo = {
          id,
          nombre: limpio,
          emoji: EMOJIS[jugadores.length % EMOJIS.length],
          color: COLORES[jugadores.length % COLORES.length],
        };
        set({ jugadores: [...jugadores, jugador] });
      },

      quitarJugador: (id) => {
        set({ jugadores: get().jugadores.filter((j) => j.id !== id) });
      },

      cambiarAvatar: (id) => {
        set({
          jugadores: get().jugadores.map((j) => {
            if (j.id !== id) return j;
            const idx = EMOJIS.indexOf(j.emoji as (typeof EMOJIS)[number]);
            return { ...j, emoji: EMOJIS[(idx + 1) % EMOJIS.length] };
          }),
        });
      },

      setConfig: (parcial) => {
        set({ config: { ...get().config, ...parcial } });
      },

      elegirModo: (modo) => {
        const { config, jugadores } = get();
        set({ config: aplicarModo(config, modo, Math.max(jugadores.length, 3)) });
      },

      empezar: () => {
        const { jugadores, config, entradasUsadas } = get();
        const error = validarConfig(config, jugadores.length);
        if (error) {
          set({ error });
          return false;
        }
        try {
          const partida = crearPartida(jugadores, config, todosLosPacks(), { entradasUsadas });
          set({ partida, error: null });
          return true;
        } catch (e) {
          set({ error: e instanceof Error ? e.message : 'error' });
          return false;
        }
      },

      accion: (a) => {
        const { partida } = get();
        if (!partida) return;
        const res = aplicarAccion(partida, a);
        if (res.error) {
          set({ error: res.error });
          return;
        }
        set({ partida: res.state });
        if (res.state.fase === 'resultado' && partida.fase !== 'resultado') {
          get().finalizarYSumarPuntos();
        }
      },

      finalizarYSumarPuntos: () => {
        const { partida, marcador, entradasUsadas } = get();
        if (!partida?.resultado) return;
        const nuevo = { ...marcador };
        for (const [id, pts] of Object.entries(partida.resultado.puntos)) {
          nuevo[id] = (nuevo[id] ?? 0) + pts;
        }
        set({
          marcador: nuevo,
          entradasUsadas: [...entradasUsadas.slice(-200), partida.entradaId],
        });
      },

      reiniciar: () => set({ partida: null, error: null }),
      limpiarError: () => set({ error: null }),
    }),
    {
      name: 'mentiroso-local',
      partialize: (s) => ({
        jugadores: s.jugadores,
        config: s.config,
        marcador: s.marcador,
        entradasUsadas: s.entradasUsadas,
      }),
    },
  ),
);
