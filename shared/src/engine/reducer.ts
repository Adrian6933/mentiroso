import type { Accion, Bando, GameState, JugadorPartida, ResultadoAccion, ResultadoPartida } from '../types.js';
import { nuevoOrdenTurnos } from './crear.js';
import { elegir, type Rng } from './rng.js';
import { esAcierto } from './texto.js';

const ROLES_IMPOSTOR = ['mentiroso', 'infiltrado'] as const;

export function esImpostor(j: JugadorPartida): boolean {
  return (ROLES_IMPOSTOR as readonly string[]).includes(j.rol);
}

export function vivos(state: GameState): JugadorPartida[] {
  return state.jugadores.filter((j) => j.vivo);
}

function impostoresVivos(state: GameState): number {
  return vivos(state).filter(esImpostor).length;
}

function clonar(state: GameState): GameState {
  return structuredClone(state);
}

function siguientePregunta(s: GameState, rng: Rng): string | null {
  if (s.config.estiloPistas !== 'preguntas' || s.preguntasPack.length === 0) return null;
  let disponibles = s.preguntasPack.filter((p) => !s.preguntasUsadas.includes(p));
  if (disponibles.length === 0) {
    s.preguntasUsadas = [];
    disponibles = s.preguntasPack;
  }
  const pregunta = elegir(disponibles, rng);
  s.preguntasUsadas.push(pregunta);
  return pregunta;
}

function entrarEnPistas(s: GameState, rng: Rng): void {
  s.fase = 'pistas';
  s.ordenTurnos = nuevoOrdenTurnos(s.jugadores, rng);
  s.turnoIdx = 0;
  s.preguntaActual = siguientePregunta(s, rng);
}

function calcularPuntos(
  s: GameState,
  ganador: Bando,
  porAdivinanza: boolean,
): Record<string, number> {
  const pts = s.config.puntos;
  const resultado: Record<string, number> = {};
  for (const j of s.jugadores) resultado[j.id] = 0;

  if (ganador === 'payaso') {
    const payaso = s.jugadores.find((j) => j.rol === 'payaso');
    if (payaso) resultado[payaso.id] = pts.payaso;
    return resultado;
  }

  if (ganador === 'civiles') {
    for (const j of s.jugadores) {
      if (j.rol === 'civil' || j.rol === 'vidente') resultado[j.id] = pts.civil;
    }
  } else {
    // ganan los mentirosos
    for (const j of s.jugadores) {
      if (j.rol === 'mentiroso' && (j.vivo || (porAdivinanza && s.ultimaAdivinanza?.jugadorId === j.id))) {
        resultado[j.id] = pts.mentiroso;
      }
      if (j.rol === 'infiltrado' && j.vivo) resultado[j.id] = pts.infiltrado;
      if (j.rol === 'complice') resultado[j.id] = pts.complice;
    }
  }

  // bonus por acertar la adivinanza (gane quien gane)
  if (s.ultimaAdivinanza?.acierto) {
    resultado[s.ultimaAdivinanza.jugadorId] =
      (resultado[s.ultimaAdivinanza.jugadorId] ?? 0) + pts.adivinanza;
  }
  return resultado;
}

function terminar(s: GameState, ganador: Bando, porAdivinanza = false): void {
  const res: ResultadoPartida = {
    ganador,
    porAdivinanza,
    puntos: calcularPuntos(s, ganador, porAdivinanza),
  };
  if (ganador === 'payaso') {
    res.payasoId = s.jugadores.find((j) => j.rol === 'payaso')?.id;
  }
  s.resultado = res;
  s.fase = 'resultado';
}

/** Tras una eliminación (o adivinanza fallida) decide: fin de partida o siguiente ronda. */
function evaluarContinuacion(s: GameState, rng: Rng): void {
  const elim = s.ultimoEliminadoId
    ? s.jugadores.find((j) => j.id === s.ultimoEliminadoId) ?? null
    : null;

  if (impostoresVivos(s) === 0) {
    terminar(s, 'civiles');
    return;
  }

  if (!s.config.eliminacionProgresiva) {
    // muerte súbita: una única votación decide
    if (elim && esImpostor(elim)) terminar(s, 'civiles');
    else terminar(s, 'mentirosos');
    return;
  }

  // progresiva: los impostores ganan al igualar en número a los demás
  const noImpostoresVivos = vivos(s).length - impostoresVivos(s);
  if (impostoresVivos(s) >= noImpostoresVivos) {
    terminar(s, 'mentirosos');
    return;
  }

  // sigue la partida: una ronda de pistas más y nueva votación
  s.ronda++;
  s.rondasRestantes = 1;
  s.ultimoEliminadoId = null;
  entrarEnPistas(s, rng);
}

function resolverEliminacion(s: GameState, eliminadoId: string | null, empate: boolean): void {
  s.historialVotaciones.push({
    ronda: s.votacionNum,
    votos: { ...s.votos },
    eliminadoId,
    empate,
  });
  if (eliminadoId) {
    const j = s.jugadores.find((x) => x.id === eliminadoId);
    if (j) j.vivo = false;
  }
  s.ultimoEliminadoId = eliminadoId;
  s.votos = {};
  s.votacionNum++;
  s.empatesEnVotacion = 0;
  s.fase = 'revelacion';
}

export function aplicarAccion(
  state: GameState,
  accion: Accion,
  rng: Rng = Math.random,
): ResultadoAccion {
  const s = clonar(state);

  switch (accion.tipo) {
    case 'cartaVista': {
      if (s.fase !== 'reparto') return { state, error: 'faseInvalida' };
      s.repartoIdx++;
      if (s.repartoIdx >= s.jugadores.length) entrarEnPistas(s, rng);
      return { state: s };
    }

    case 'repartoCompletado': {
      if (s.fase !== 'reparto') return { state, error: 'faseInvalida' };
      entrarEnPistas(s, rng);
      return { state: s };
    }

    case 'enviarPista': {
      if (s.fase !== 'pistas') return { state, error: 'faseInvalida' };
      const turnoDe = s.ordenTurnos[s.turnoIdx];
      if (accion.jugadorId !== turnoDe) return { state, error: 'noEsTuTurno' };
      s.pistas.push({
        ronda: s.ronda,
        jugadorId: accion.jugadorId,
        texto: accion.texto,
        pregunta: s.preguntaActual ?? undefined,
      });
      s.turnoIdx++;
      if (s.turnoIdx >= s.ordenTurnos.length) {
        // fin de la ronda de pistas
        s.rondasRestantes--;
        if (s.rondasRestantes > 0) {
          s.ronda++;
          s.ordenTurnos = nuevoOrdenTurnos(s.jugadores, rng);
          s.turnoIdx = 0;
          s.preguntaActual = siguientePregunta(s, rng);
        } else {
          s.fase = 'debate';
          s.preguntaActual = null;
        }
      } else {
        s.preguntaActual = siguientePregunta(s, rng) ?? s.preguntaActual;
      }
      return { state: s };
    }

    case 'irADebate': {
      if (s.fase !== 'pistas') return { state, error: 'faseInvalida' };
      s.fase = 'debate';
      s.preguntaActual = null;
      return { state: s };
    }

    case 'irAVotacion': {
      if (s.fase !== 'debate' && s.fase !== 'pistas') return { state, error: 'faseInvalida' };
      s.fase = 'votacion';
      s.votos = {};
      s.empatesEnVotacion = 0;
      return { state: s };
    }

    case 'votar': {
      if (s.fase !== 'votacion') return { state, error: 'faseInvalida' };
      const votante = s.jugadores.find((j) => j.id === accion.votanteId);
      const objetivo = s.jugadores.find((j) => j.id === accion.objetivoId);
      if (!votante?.vivo || !objetivo?.vivo) return { state, error: 'jugadorInvalido' };
      if (votante.id === objetivo.id) return { state, error: 'autoVoto' };
      s.votos[votante.id] = objetivo.id;
      return { state: s };
    }

    case 'quitarVoto': {
      if (s.fase !== 'votacion') return { state, error: 'faseInvalida' };
      delete s.votos[accion.votanteId];
      return { state: s };
    }

    case 'confirmarVotos': {
      if (s.fase !== 'votacion') return { state, error: 'faseInvalida' };
      const recuento = new Map<string, number>();
      for (const objetivo of Object.values(s.votos)) {
        recuento.set(objetivo, (recuento.get(objetivo) ?? 0) + 1);
      }
      const max = Math.max(0, ...recuento.values());
      const lideres = [...recuento.entries()].filter(([, n]) => n === max).map(([id]) => id);

      if (max === 0 || lideres.length > 1) {
        // empate
        if (s.config.empate === 'revotar' && s.empatesEnVotacion === 0 && max > 0) {
          s.historialVotaciones.push({
            ronda: s.votacionNum,
            votos: { ...s.votos },
            eliminadoId: null,
            empate: true,
          });
          s.votos = {};
          s.empatesEnVotacion = 1;
          return { state: s }; // se repite la votación
        }
        resolverEliminacion(s, null, true);
        return { state: s };
      }

      resolverEliminacion(s, lideres[0], false);
      return { state: s };
    }

    case 'eliminarDirecto': {
      if (s.fase !== 'votacion') return { state, error: 'faseInvalida' };
      const objetivo = s.jugadores.find((j) => j.id === accion.objetivoId);
      if (!objetivo?.vivo) return { state, error: 'jugadorInvalido' };
      resolverEliminacion(s, objetivo.id, false);
      return { state: s };
    }

    case 'continuar': {
      if (s.fase !== 'revelacion') return { state, error: 'faseInvalida' };
      const elim = s.ultimoEliminadoId
        ? s.jugadores.find((j) => j.id === s.ultimoEliminadoId) ?? null
        : null;

      if (elim?.rol === 'payaso') {
        terminar(s, 'payaso');
        return { state: s };
      }
      if (elim?.rol === 'mentiroso' && s.config.adivinanzaFinal) {
        s.fase = 'adivinanza';
        s.adivinanzaJugadorId = elim.id;
        return { state: s };
      }
      evaluarContinuacion(s, rng);
      return { state: s };
    }

    case 'resolverAdivinanza': {
      if (s.fase !== 'adivinanza' || !s.adivinanzaJugadorId) return { state, error: 'faseInvalida' };
      const acierto = esAcierto(accion.texto, s.palabraCivil);
      s.ultimaAdivinanza = { jugadorId: s.adivinanzaJugadorId, texto: accion.texto, acierto };
      s.adivinanzaJugadorId = null;
      if (acierto && s.config.adivinanzaRobaVictoria) {
        terminar(s, 'mentirosos', true);
      } else {
        evaluarContinuacion(s, rng);
      }
      return { state: s };
    }

    case 'saltarAdivinanza': {
      if (s.fase !== 'adivinanza') return { state, error: 'faseInvalida' };
      s.adivinanzaJugadorId = null;
      evaluarContinuacion(s, rng);
      return { state: s };
    }

    default:
      return { state, error: 'accionDesconocida' };
  }
}
