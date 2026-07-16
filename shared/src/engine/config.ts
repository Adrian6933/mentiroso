import type { GameConfig, ModoJuego } from '../types.js';

/** nº de mentirosos sugerido según jugadores: 3-6 → 1 · 7-10 → 2 · 11+ → 3 */
export function sugerirMentirosos(numJugadores: number): number {
  if (numJugadores >= 11) return 3;
  if (numJugadores >= 7) return 2;
  return 1;
}

export const CONFIG_DEFECTO: GameConfig = {
  modo: 'clasico',
  numMentirosos: 1,
  numInfiltrados: 0,
  rolesExtra: { payaso: false, complice: false, vidente: false },
  rondasDePistas: 2,
  pistasEscritas: false,
  estiloPistas: 'palabras',
  eliminacionProgresiva: false,
  votacionSecreta: true,
  empate: 'revotar',
  adivinanzaFinal: true,
  adivinanzaRobaVictoria: true,
  ayudaMentiroso: 'nada',
  mostrarCategoria: true,
  segundosPista: 0,
  segundosDebate: 0,
  segundosVotacion: 0,
  packIds: ['futbolistas', 'cantantes'],
  puntos: { civil: 2, mentiroso: 8, infiltrado: 10, payaso: 12, complice: 6, adivinanza: 4 },
  evitarRepetidas: true,
};

/** Aplica un preset de modo sobre una configuración base (sin tocar packs, timers, etc.). */
export function aplicarModo(base: GameConfig, modo: ModoJuego, numJugadores: number): GameConfig {
  const c: GameConfig = { ...base, rolesExtra: { ...base.rolesExtra }, puntos: { ...base.puntos }, modo };
  const sugeridos = sugerirMentirosos(numJugadores);
  switch (modo) {
    case 'clasico':
      c.numMentirosos = sugeridos;
      c.numInfiltrados = 0;
      c.rolesExtra = { payaso: false, complice: false, vidente: false };
      c.estiloPistas = 'palabras';
      c.eliminacionProgresiva = false;
      break;
    case 'infiltrado':
      c.numMentirosos = 0;
      c.numInfiltrados = sugeridos;
      c.rolesExtra = { payaso: false, complice: false, vidente: false };
      c.estiloPistas = 'palabras';
      c.eliminacionProgresiva = false;
      c.adivinanzaFinal = false; // el infiltrado no adivina: gana sobreviviendo
      break;
    case 'mixto':
      // estilo Undercover: mentiroso(s) + infiltrado(s) y eliminación progresiva
      c.numMentirosos = Math.max(1, sugeridos - 1);
      c.numInfiltrados = numJugadores >= 5 ? 1 : 0;
      c.eliminacionProgresiva = true;
      c.adivinanzaFinal = true;
      c.estiloPistas = 'palabras';
      break;
    case 'preguntas':
      c.numMentirosos = sugeridos;
      c.numInfiltrados = 0;
      c.estiloPistas = 'preguntas';
      c.eliminacionProgresiva = false;
      break;
    case 'caos':
      c.numMentirosos = sugeridos;
      c.numInfiltrados = numJugadores >= 6 ? 1 : 0;
      c.rolesExtra = {
        payaso: numJugadores >= 5,
        complice: numJugadores >= 6,
        vidente: numJugadores >= 7,
      };
      c.eliminacionProgresiva = true;
      break;
    case 'personalizado':
      break;
  }
  return c;
}

/** nº de roles "no civiles puros" que consume la config */
export function rolesOcupados(config: GameConfig): number {
  const extras =
    (config.rolesExtra.payaso ? 1 : 0) +
    (config.rolesExtra.complice ? 1 : 0) +
    (config.rolesExtra.vidente ? 1 : 0);
  return config.numMentirosos + config.numInfiltrados + extras;
}

/** Devuelve un mensaje de error si la config no es válida para ese nº de jugadores, o null. */
export function validarConfig(config: GameConfig, numJugadores: number): string | null {
  if (numJugadores < 3) return 'minJugadores';
  if (config.numMentirosos + config.numInfiltrados < 1) return 'sinImpostores';
  const impostores = config.numMentirosos + config.numInfiltrados;
  if (impostores * 2 >= numJugadores) return 'demasiadosImpostores'; // civiles siempre mayoría
  if (rolesOcupados(config) >= numJugadores) return 'demasiadosRoles';
  if (config.packIds.length === 0) return 'sinPacks';
  if (config.rolesExtra.complice && config.numMentirosos === 0) return 'compliceSinMentiroso';
  return null;
}
