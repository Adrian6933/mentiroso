import type { GameState } from '../types.js';
import { nombresMentirosos } from './crear.js';

/**
 * Devuelve el estado que puede ver un jugador concreto en el modo online.
 * El servidor NUNCA envía la palabra secreta ni los roles ajenos por la red:
 * así el mentiroso no puede hacer trampas mirando el tráfico.
 */
export function vistaParaJugador(state: GameState, jugadorId: string): GameState {
  const s = structuredClone(state);
  const yo = s.jugadores.find((j) => j.id === jugadorId);
  const esFin = s.fase === 'resultado';
  if (!yo) return censurarTodo(s, esFin);

  // ── info propia ──
  if (yo.rol === 'complice') {
    yo.infoComplice = nombresMentirosos(state);
  }
  if (yo.rol === 'mentiroso' && !esFin) {
    if (s.config.ayudaMentiroso === 'inicial') {
      yo.ayudaTexto = state.palabraCivil.charAt(0).toUpperCase();
    } else if (s.config.ayudaMentiroso === 'categoria') {
      yo.ayudaTexto = state.categoria;
    }
  }

  // ── info de los demás ──
  for (const j of s.jugadores) {
    if (j.id === jugadorId) continue;
    if (esFin) continue; // al final se revela todo
    j.palabra = null;
    j.vision = undefined;
    j.infoComplice = undefined;
    j.ayudaTexto = undefined;
    if (j.vivo) j.rol = 'civil'; // los eliminados sí revelan su rol
  }

  // el infiltrado no debe saber que lo es (ve su carta como un civil más)
  if (yo.rol === 'infiltrado' && !esFin) {
    yo.rol = 'civil';
  }

  // ── datos globales sensibles ──
  if (!esFin) {
    const conoceLaPalabra = yo.rol !== 'mentiroso'; // el infiltrado ya viene disfrazado de civil
    if (!conoceLaPalabra) s.palabraCivil = '';
    else if (yo.palabra) s.palabraCivil = yo.palabra; // el infiltrado ve SU palabra como si fuera la civil
    s.palabraInfiltrado = null;
    s.entradaId = '';
    if (yo.rol === 'mentiroso' && !s.config.mostrarCategoria && s.config.ayudaMentiroso !== 'categoria') {
      s.categoria = '';
    }
    // los votos en curso son secretos: solo se ve el propio
    const miVoto = s.votos[jugadorId];
    const votantes = Object.keys(s.votos);
    s.votos = {};
    for (const v of votantes) s.votos[v] = v === jugadorId ? miVoto : '?';
  }

  return s;
}

/** Vista para un espectador sin asiento (no debería ocurrir, por seguridad). */
function censurarTodo(s: GameState, esFin: boolean): GameState {
  if (esFin) return s;
  for (const j of s.jugadores) {
    j.palabra = null;
    j.vision = undefined;
    j.infoComplice = undefined;
    j.ayudaTexto = undefined;
    if (j.vivo) j.rol = 'civil';
  }
  s.palabraCivil = '';
  s.palabraInfiltrado = null;
  s.entradaId = '';
  const votantes = Object.keys(s.votos);
  s.votos = {};
  for (const v of votantes) s.votos[v] = '?';
  return s;
}
