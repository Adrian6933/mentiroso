import type { EntradaPack, GameConfig, GameState, JugadorInfo, JugadorPartida, Pack, Rol } from '../types.js';
import { validarConfig } from './config.js';
import { barajar, elegir, type Rng } from './rng.js';

export interface OpcionesCrear {
  rng?: Rng;
  /** ids de entradas ya usadas (para evitarRepetidas) */
  entradasUsadas?: string[];
}

/** Baraja el orden de turnos garantizando que un mentiroso nunca abre la ronda. */
export function nuevoOrdenTurnos(jugadores: JugadorPartida[], rng: Rng): string[] {
  const vivos = jugadores.filter((j) => j.vivo);
  let orden = barajar(vivos, rng);
  const hayNoMentiroso = vivos.some((j) => j.rol !== 'mentiroso');
  if (hayNoMentiroso) {
    let intentos = 0;
    while (orden[0].rol === 'mentiroso' && intentos < 20) {
      orden = barajar(vivos, rng);
      intentos++;
    }
    if (orden[0].rol === 'mentiroso') {
      const idx = orden.findIndex((j) => j.rol !== 'mentiroso');
      [orden[0], orden[idx]] = [orden[idx], orden[0]];
    }
  }
  return orden.map((j) => j.id);
}

function elegirEntrada(
  packs: Pack[],
  config: GameConfig,
  usadas: string[],
  rng: Rng,
): { pack: Pack; entrada: EntradaPack } {
  const activos = packs.filter((p) => config.packIds.includes(p.id) && p.entradas.length > 0);
  if (activos.length === 0) throw new Error('sinPacks');
  const todas = activos.flatMap((p) => p.entradas.map((e) => ({ pack: p, entrada: e })));
  let candidatas = todas;
  if (config.evitarRepetidas) {
    const sinUsar = todas.filter((x) => !usadas.includes(x.entrada.id));
    if (sinUsar.length > 0) candidatas = sinUsar;
  }
  return elegir(candidatas, rng);
}

function palabraParaInfiltrado(pack: Pack, entrada: EntradaPack, rng: Rng): string {
  if (entrada.similares.length > 0) return elegir(entrada.similares, rng);
  // sin similares definidos: usar otra entrada del mismo pack
  const otras = pack.entradas.filter((e) => e.id !== entrada.id);
  if (otras.length > 0) return elegir(otras, rng).texto;
  return entrada.texto;
}

export function crearPartida(
  jugadoresInfo: JugadorInfo[],
  config: GameConfig,
  packs: Pack[],
  opciones: OpcionesCrear = {},
): GameState {
  const rng = opciones.rng ?? Math.random;
  const error = validarConfig(config, jugadoresInfo.length);
  if (error) throw new Error(error);

  const { pack, entrada } = elegirEntrada(packs, config, opciones.entradasUsadas ?? [], rng);
  const palabraCivil = entrada.texto;
  const palabraInfiltrado =
    config.numInfiltrados > 0 ? palabraParaInfiltrado(pack, entrada, rng) : null;

  // repartir roles
  const roles: Rol[] = [];
  for (let i = 0; i < config.numMentirosos; i++) roles.push('mentiroso');
  for (let i = 0; i < config.numInfiltrados; i++) roles.push('infiltrado');
  if (config.rolesExtra.payaso) roles.push('payaso');
  if (config.rolesExtra.complice) roles.push('complice');
  if (config.rolesExtra.vidente) roles.push('vidente');
  while (roles.length < jugadoresInfo.length) roles.push('civil');
  const rolesBarajados = barajar(roles, rng);

  const jugadores: JugadorPartida[] = jugadoresInfo.map((info, i) => {
    const rol = rolesBarajados[i];
    let palabra: string | null = palabraCivil;
    if (rol === 'mentiroso') palabra = null;
    if (rol === 'infiltrado') palabra = palabraInfiltrado;
    return { ...info, rol, palabra, vivo: true };
  });

  // visión del vidente: rol de otro jugador al azar
  const vidente = jugadores.find((j) => j.rol === 'vidente');
  if (vidente) {
    const otros = jugadores.filter((j) => j.id !== vidente.id);
    const visto = elegir(otros, rng);
    // el vidente nunca "desenmascara" a un infiltrado como tal: lo ve como civil
    const rolVisto: Rol = visto.rol === 'infiltrado' ? 'civil' : visto.rol;
    vidente.vision = { jugadorId: visto.id, rol: rolVisto };
  }

  const state: GameState = {
    fase: 'reparto',
    config,
    jugadores,
    palabraCivil,
    palabraInfiltrado,
    categoria: pack.categoria,
    packId: pack.id,
    entradaId: entrada.id,
    repartoIdx: 0,
    ronda: 1,
    rondasRestantes: config.rondasDePistas,
    votacionNum: 1,
    empatesEnVotacion: 0,
    ordenTurnos: [],
    turnoIdx: 0,
    pistas: [],
    preguntasPack: pack.preguntas,
    preguntasUsadas: [],
    preguntaActual: null,
    votos: {},
    historialVotaciones: [],
    ultimoEliminadoId: null,
    adivinanzaJugadorId: null,
    ultimaAdivinanza: null,
    resultado: null,
  };
  return state;
}

/** Los nombres de los mentirosos, para mostrárselos al cómplice. */
export function nombresMentirosos(state: GameState): string[] {
  return state.jugadores.filter((j) => j.rol === 'mentiroso').map((j) => j.nombre);
}
