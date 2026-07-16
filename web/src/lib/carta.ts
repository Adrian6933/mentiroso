import type { GameState, JugadorPartida, Rol } from '@mentiroso/shared';
import { nombresMentirosos } from '@mentiroso/shared';

/** Todo lo que la carta secreta necesita mostrar para un jugador. */
export interface DatosCarta {
  rol: Rol;
  /** rol que se le enseña al jugador (el infiltrado se ve como civil) */
  rolVisible: Exclude<Rol, 'infiltrado'>;
  palabra: string | null;
  categoria: string | null;
  /** ayuda del mentiroso según config */
  ayuda: { tipo: 'categoria' | 'inicial'; texto: string } | null;
  /** nombres de mentirosos (solo cómplice) */
  complices: string[] | null;
  /** visión del vidente */
  vision: { nombre: string; rol: Rol } | null;
}

/** Calcula los datos de la carta desde el estado COMPLETO (modo local). */
export function datosCartaDe(state: GameState, jugador: JugadorPartida): DatosCarta {
  const c = state.config;
  const rolVisible = (jugador.rol === 'infiltrado' ? 'civil' : jugador.rol) as DatosCarta['rolVisible'];

  let ayuda: DatosCarta['ayuda'] = null;
  if (jugador.rol === 'mentiroso') {
    if (jugador.ayudaTexto) {
      // vista online: el servidor ya calculó la ayuda
      ayuda = { tipo: c.ayudaMentiroso === 'inicial' ? 'inicial' : 'categoria', texto: jugador.ayudaTexto };
    } else if (c.ayudaMentiroso === 'inicial' && state.palabraCivil) {
      ayuda = { tipo: 'inicial', texto: state.palabraCivil.charAt(0).toUpperCase() };
    } else if (c.ayudaMentiroso === 'categoria') {
      ayuda = { tipo: 'categoria', texto: state.categoria };
    }
  }

  let complices: string[] | null = null;
  if (jugador.rol === 'complice') {
    complices = jugador.infoComplice ?? nombresMentirosos(state);
  }

  let vision: DatosCarta['vision'] = null;
  if (jugador.rol === 'vidente' && jugador.vision) {
    const visto = state.jugadores.find((j) => j.id === jugador.vision!.jugadorId);
    if (visto) vision = { nombre: visto.nombre, rol: jugador.vision.rol };
  }

  const muestraCategoria =
    c.mostrarCategoria && (rolVisible !== 'mentiroso' || c.ayudaMentiroso === 'categoria');

  return {
    rol: jugador.rol,
    rolVisible,
    palabra: jugador.palabra,
    categoria: muestraCategoria && state.categoria ? state.categoria : null,
    ayuda,
    complices,
    vision,
  };
}

export const COLOR_ROL: Record<Rol, string> = {
  civil: 'var(--verde)',
  mentiroso: 'var(--rojo)',
  infiltrado: 'var(--ambar)',
  payaso: 'var(--ambar)',
  complice: 'var(--rosa)',
  vidente: 'var(--cian)',
};
