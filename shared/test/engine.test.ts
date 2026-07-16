import { describe, expect, it } from 'vitest';
import {
  aplicarAccion,
  CONFIG_DEFECTO,
  crearPartida,
  crearRng,
  esAcierto,
  PACKS,
  sugerirMentirosos,
  validarConfig,
  vistaParaJugador,
  type Accion,
  type GameConfig,
  type GameState,
  type JugadorInfo,
} from '../src/index.js';

function jugadores(n: number): JugadorInfo[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `j${i + 1}`,
    nombre: `Jugador ${i + 1}`,
    emoji: '😀',
    color: '#fff',
  }));
}

function config(extra: Partial<GameConfig> = {}): GameConfig {
  return {
    ...CONFIG_DEFECTO,
    rolesExtra: { ...CONFIG_DEFECTO.rolesExtra },
    puntos: { ...CONFIG_DEFECTO.puntos },
    packIds: ['futbolistas'],
    ...extra,
  };
}

const rng = () => crearRng(42);

function aplicar(state: GameState, accion: Accion, r = Math.random as () => number): GameState {
  const res = aplicarAccion(state, accion, r);
  if (res.error) throw new Error(res.error);
  return res.state;
}

/** avanza reparto y todas las rondas de pistas hasta el debate */
function hastaDebate(s: GameState, r: () => number): GameState {
  while (s.fase === 'reparto') s = aplicar(s, { tipo: 'cartaVista' }, r);
  while (s.fase === 'pistas') {
    s = aplicar(s, { tipo: 'enviarPista', jugadorId: s.ordenTurnos[s.turnoIdx], texto: 'pista' }, r);
  }
  return s;
}

/** todos los vivos votan al mismo objetivo */
function votarTodosA(s: GameState, objetivoId: string, r: () => number): GameState {
  for (const j of s.jugadores.filter((x) => x.vivo && x.id !== objetivoId)) {
    s = aplicar(s, { tipo: 'votar', votanteId: j.id, objetivoId }, r);
  }
  return aplicar(s, { tipo: 'confirmarVotos' }, r);
}

describe('configuración', () => {
  it('sugiere mentirosos según jugadores', () => {
    expect(sugerirMentirosos(3)).toBe(1);
    expect(sugerirMentirosos(6)).toBe(1);
    expect(sugerirMentirosos(7)).toBe(2);
    expect(sugerirMentirosos(11)).toBe(3);
  });

  it('valida la configuración', () => {
    expect(validarConfig(config(), 2)).toBe('minJugadores');
    expect(validarConfig(config(), 4)).toBeNull();
    expect(validarConfig(config({ numMentirosos: 0 }), 4)).toBe('sinImpostores');
    expect(validarConfig(config({ numMentirosos: 2 }), 4)).toBe('demasiadosImpostores');
    expect(validarConfig(config({ packIds: [] }), 4)).toBe('sinPacks');
    expect(
      validarConfig(config({ numMentirosos: 0, numInfiltrados: 1, rolesExtra: { payaso: false, complice: true, vidente: false } }), 5),
    ).toBe('compliceSinMentiroso');
  });
});

describe('crearPartida', () => {
  it('reparte roles y palabras correctamente', () => {
    const s = crearPartida(jugadores(5), config(), PACKS, { rng: rng() });
    expect(s.fase).toBe('reparto');
    const mentirosos = s.jugadores.filter((j) => j.rol === 'mentiroso');
    expect(mentirosos).toHaveLength(1);
    expect(mentirosos[0].palabra).toBeNull();
    for (const j of s.jugadores.filter((x) => x.rol === 'civil')) {
      expect(j.palabra).toBe(s.palabraCivil);
    }
    expect(s.palabraCivil).toBeTruthy();
    expect(s.categoria).toBe('Futbolistas');
  });

  it('el infiltrado recibe una palabra parecida distinta', () => {
    const s = crearPartida(jugadores(5), config({ numMentirosos: 0, numInfiltrados: 1, adivinanzaFinal: false }), PACKS, { rng: rng() });
    const inf = s.jugadores.find((j) => j.rol === 'infiltrado')!;
    expect(inf.palabra).toBe(s.palabraInfiltrado);
    expect(inf.palabra).not.toBe(s.palabraCivil);
    expect(inf.palabra).toBeTruthy();
  });

  it('evita entradas usadas', () => {
    const c = config({ packIds: ['animales'] });
    const usadas = PACKS.find((p) => p.id === 'animales')!.entradas.slice(0, 9).map((e) => e.id);
    for (let i = 0; i < 10; i++) {
      const s = crearPartida(jugadores(4), c, PACKS, { rng: crearRng(i), entradasUsadas: usadas });
      expect(usadas).not.toContain(s.entradaId);
    }
  });

  it('el vidente recibe una visión de otro jugador', () => {
    const c = config({ rolesExtra: { payaso: false, complice: false, vidente: true } });
    const s = crearPartida(jugadores(6), c, PACKS, { rng: rng() });
    const vidente = s.jugadores.find((j) => j.rol === 'vidente')!;
    expect(vidente.vision).toBeDefined();
    expect(vidente.vision!.jugadorId).not.toBe(vidente.id);
  });

  it('el mentiroso nunca abre la primera ronda de pistas', () => {
    for (let i = 0; i < 30; i++) {
      const r = crearRng(i);
      let s = crearPartida(jugadores(4), config(), PACKS, { rng: r });
      while (s.fase === 'reparto') s = aplicar(s, { tipo: 'cartaVista' }, r);
      const primero = s.jugadores.find((j) => j.id === s.ordenTurnos[0])!;
      expect(primero.rol).not.toBe('mentiroso');
    }
  });
});

describe('flujo clásico (muerte súbita)', () => {
  it('pistas → debate → votación → pillan al mentiroso → falla la adivinanza → ganan civiles', () => {
    const r = crearRng(7);
    let s = crearPartida(jugadores(4), config({ rondasDePistas: 2 }), PACKS, { rng: r });
    s = hastaDebate(s, r);
    expect(s.fase).toBe('debate');
    expect(s.pistas).toHaveLength(8); // 4 jugadores × 2 rondas

    s = aplicar(s, { tipo: 'irAVotacion' }, r);
    const mentiroso = s.jugadores.find((j) => j.rol === 'mentiroso')!;
    s = votarTodosA(s, mentiroso.id, r);
    expect(s.fase).toBe('revelacion');
    expect(s.ultimoEliminadoId).toBe(mentiroso.id);

    s = aplicar(s, { tipo: 'continuar' }, r);
    expect(s.fase).toBe('adivinanza');
    s = aplicar(s, { tipo: 'resolverAdivinanza', texto: 'no tengo ni idea' }, r);
    expect(s.fase).toBe('resultado');
    expect(s.resultado!.ganador).toBe('civiles');
    // puntos para los civiles
    for (const j of s.jugadores.filter((x) => x.rol === 'civil')) {
      expect(s.resultado!.puntos[j.id]).toBe(s.config.puntos.civil);
    }
    expect(s.resultado!.puntos[mentiroso.id]).toBe(0);
  });

  it('el mentiroso roba la victoria adivinando la palabra', () => {
    const r = crearRng(7);
    let s = crearPartida(jugadores(4), config(), PACKS, { rng: r });
    const palabra = s.palabraCivil;
    s = hastaDebate(s, r);
    s = aplicar(s, { tipo: 'irAVotacion' }, r);
    const mentiroso = s.jugadores.find((j) => j.rol === 'mentiroso')!;
    s = votarTodosA(s, mentiroso.id, r);
    s = aplicar(s, { tipo: 'continuar' }, r);
    s = aplicar(s, { tipo: 'resolverAdivinanza', texto: palabra }, r);
    expect(s.resultado!.ganador).toBe('mentirosos');
    expect(s.resultado!.porAdivinanza).toBe(true);
    expect(s.resultado!.puntos[mentiroso.id]).toBe(
      s.config.puntos.mentiroso + s.config.puntos.adivinanza,
    );
  });

  it('si eliminan a un civil, ganan los mentirosos', () => {
    const r = crearRng(3);
    let s = crearPartida(jugadores(4), config(), PACKS, { rng: r });
    s = hastaDebate(s, r);
    s = aplicar(s, { tipo: 'irAVotacion' }, r);
    const civil = s.jugadores.find((j) => j.rol === 'civil')!;
    s = votarTodosA(s, civil.id, r);
    s = aplicar(s, { tipo: 'continuar' }, r);
    expect(s.fase).toBe('resultado');
    expect(s.resultado!.ganador).toBe('mentirosos');
    const mentiroso = s.jugadores.find((j) => j.rol === 'mentiroso')!;
    expect(s.resultado!.puntos[mentiroso.id]).toBe(s.config.puntos.mentiroso);
  });
});

describe('votaciones', () => {
  it('no permite autovoto ni votar fuera de fase', () => {
    const r = crearRng(1);
    let s = crearPartida(jugadores(4), config(), PACKS, { rng: r });
    expect(aplicarAccion(s, { tipo: 'votar', votanteId: 'j1', objetivoId: 'j2' }, r).error).toBe('faseInvalida');
    s = hastaDebate(s, r);
    s = aplicar(s, { tipo: 'irAVotacion' }, r);
    expect(aplicarAccion(s, { tipo: 'votar', votanteId: 'j1', objetivoId: 'j1' }, r).error).toBe('autoVoto');
  });

  it('empate con revotación: primer empate repite, segundo no elimina a nadie', () => {
    const r = crearRng(1);
    let s = crearPartida(jugadores(4), config({ empate: 'revotar' }), PACKS, { rng: r });
    s = hastaDebate(s, r);
    s = aplicar(s, { tipo: 'irAVotacion' }, r);
    // 2 votos a j1 y 2 a j2 (según quién vote): empate forzado
    s = aplicar(s, { tipo: 'votar', votanteId: 'j1', objetivoId: 'j2' }, r);
    s = aplicar(s, { tipo: 'votar', votanteId: 'j2', objetivoId: 'j1' }, r);
    s = aplicar(s, { tipo: 'votar', votanteId: 'j3', objetivoId: 'j1' }, r);
    s = aplicar(s, { tipo: 'votar', votanteId: 'j4', objetivoId: 'j2' }, r);
    s = aplicar(s, { tipo: 'confirmarVotos' }, r);
    expect(s.fase).toBe('votacion'); // se repite
    expect(s.empatesEnVotacion).toBe(1);
    expect(Object.keys(s.votos)).toHaveLength(0);
    // segundo empate
    s = aplicar(s, { tipo: 'votar', votanteId: 'j1', objetivoId: 'j2' }, r);
    s = aplicar(s, { tipo: 'votar', votanteId: 'j2', objetivoId: 'j1' }, r);
    s = aplicar(s, { tipo: 'confirmarVotos' }, r);
    expect(s.fase).toBe('revelacion');
    expect(s.ultimoEliminadoId).toBeNull();
  });

  it('eliminarDirecto funciona para votación no secreta', () => {
    const r = crearRng(1);
    let s = crearPartida(jugadores(4), config({ votacionSecreta: false, adivinanzaFinal: false }), PACKS, { rng: r });
    s = hastaDebate(s, r);
    s = aplicar(s, { tipo: 'irAVotacion' }, r);
    const mentiroso = s.jugadores.find((j) => j.rol === 'mentiroso')!;
    s = aplicar(s, { tipo: 'eliminarDirecto', objetivoId: mentiroso.id }, r);
    expect(s.fase).toBe('revelacion');
    s = aplicar(s, { tipo: 'continuar' }, r);
    expect(s.resultado!.ganador).toBe('civiles');
  });
});

describe('eliminación progresiva', () => {
  it('la partida continúa tras eliminar a un civil y los mentirosos ganan por paridad', () => {
    const r = crearRng(5);
    let s = crearPartida(
      jugadores(5),
      config({ eliminacionProgresiva: true, adivinanzaFinal: false, rondasDePistas: 1 }),
      PACKS,
      { rng: r },
    );
    s = hastaDebate(s, r);
    s = aplicar(s, { tipo: 'irAVotacion' }, r);
    const civiles = s.jugadores.filter((j) => j.rol === 'civil');
    // eliminan a un civil (5 → 4 vivos: 1 mentiroso vs 3): sigue
    s = votarTodosA(s, civiles[0].id, r);
    s = aplicar(s, { tipo: 'continuar' }, r);
    expect(s.fase).toBe('pistas');
    expect(s.jugadores.filter((j) => j.vivo)).toHaveLength(4);

    // otra ronda: eliminan a otro civil (1 vs 2): sigue
    while (s.fase === 'pistas') {
      s = aplicar(s, { tipo: 'enviarPista', jugadorId: s.ordenTurnos[s.turnoIdx], texto: 'x' }, r);
    }
    s = aplicar(s, { tipo: 'irAVotacion' }, r);
    s = votarTodosA(s, civiles[1].id, r);
    s = aplicar(s, { tipo: 'continuar' }, r);
    expect(s.fase).toBe('pistas');

    // tercera: eliminan al tercer civil (1 vs 1): ganan mentirosos
    while (s.fase === 'pistas') {
      s = aplicar(s, { tipo: 'enviarPista', jugadorId: s.ordenTurnos[s.turnoIdx], texto: 'x' }, r);
    }
    s = aplicar(s, { tipo: 'irAVotacion' }, r);
    s = votarTodosA(s, civiles[2].id, r);
    s = aplicar(s, { tipo: 'continuar' }, r);
    expect(s.fase).toBe('resultado');
    expect(s.resultado!.ganador).toBe('mentirosos');
  });
});

describe('roles especiales', () => {
  it('el payaso gana si lo eliminan', () => {
    const r = crearRng(9);
    const c = config({ rolesExtra: { payaso: true, complice: false, vidente: false } });
    let s = crearPartida(jugadores(5), c, PACKS, { rng: r });
    s = hastaDebate(s, r);
    s = aplicar(s, { tipo: 'irAVotacion' }, r);
    const payaso = s.jugadores.find((j) => j.rol === 'payaso')!;
    s = votarTodosA(s, payaso.id, r);
    s = aplicar(s, { tipo: 'continuar' }, r);
    expect(s.resultado!.ganador).toBe('payaso');
    expect(s.resultado!.puntos[payaso.id]).toBe(c.puntos.payaso);
    // nadie más puntúa
    for (const j of s.jugadores.filter((x) => x.id !== payaso.id)) {
      expect(s.resultado!.puntos[j.id]).toBe(0);
    }
  });

  it('el cómplice puntúa cuando ganan los mentirosos', () => {
    const r = crearRng(11);
    const c = config({
      rolesExtra: { payaso: false, complice: true, vidente: false },
      adivinanzaFinal: false,
    });
    let s = crearPartida(jugadores(6), c, PACKS, { rng: r });
    s = hastaDebate(s, r);
    s = aplicar(s, { tipo: 'irAVotacion' }, r);
    const civil = s.jugadores.find((j) => j.rol === 'civil')!;
    s = votarTodosA(s, civil.id, r);
    s = aplicar(s, { tipo: 'continuar' }, r);
    expect(s.resultado!.ganador).toBe('mentirosos');
    const complice = s.jugadores.find((j) => j.rol === 'complice')!;
    expect(s.resultado!.puntos[complice.id]).toBe(c.puntos.complice);
  });
});

describe('modo preguntas', () => {
  it('cada turno de pista lleva una pregunta del pack', () => {
    const r = crearRng(2);
    let s = crearPartida(jugadores(4), config({ estiloPistas: 'preguntas', rondasDePistas: 1 }), PACKS, { rng: r });
    while (s.fase === 'reparto') s = aplicar(s, { tipo: 'cartaVista' }, r);
    expect(s.preguntaActual).toBeTruthy();
    const pack = PACKS.find((p) => p.id === s.packId)!;
    while (s.fase === 'pistas') {
      expect(pack.preguntas).toContain(s.preguntaActual);
      s = aplicar(s, { tipo: 'enviarPista', jugadorId: s.ordenTurnos[s.turnoIdx], texto: '' }, r);
    }
    for (const p of s.pistas) expect(p.pregunta).toBeTruthy();
  });
});

describe('vista online censurada', () => {
  function partidaEnPistas() {
    const r = crearRng(13);
    let s = crearPartida(jugadores(5), config(), PACKS, { rng: r });
    s = aplicar(s, { tipo: 'repartoCompletado' }, r);
    return s;
  }

  it('el mentiroso no recibe la palabra ni los roles ajenos', () => {
    const s = partidaEnPistas();
    const mentiroso = s.jugadores.find((j) => j.rol === 'mentiroso')!;
    const vista = vistaParaJugador(s, mentiroso.id);
    expect(vista.palabraCivil).toBe('');
    expect(vista.entradaId).toBe('');
    for (const j of vista.jugadores.filter((x) => x.id !== mentiroso.id)) {
      expect(j.rol).toBe('civil');
      expect(j.palabra).toBeNull();
    }
  });

  it('el civil ve su palabra pero no el rol de los demás', () => {
    const s = partidaEnPistas();
    const civil = s.jugadores.find((j) => j.rol === 'civil')!;
    const vista = vistaParaJugador(s, civil.id);
    expect(vista.palabraCivil).toBe(s.palabraCivil);
    const mentiroso = s.jugadores.find((j) => j.rol === 'mentiroso')!;
    expect(vista.jugadores.find((j) => j.id === mentiroso.id)!.rol).toBe('civil');
  });

  it('el infiltrado se ve a sí mismo como civil con su palabra', () => {
    const r = crearRng(13);
    let s = crearPartida(jugadores(5), config({ numMentirosos: 0, numInfiltrados: 1, adivinanzaFinal: false }), PACKS, { rng: r });
    s = aplicar(s, { tipo: 'repartoCompletado' }, r);
    const inf = s.jugadores.find((j) => j.rol === 'infiltrado')!;
    const vista = vistaParaJugador(s, inf.id);
    const yo = vista.jugadores.find((j) => j.id === inf.id)!;
    expect(yo.rol).toBe('civil');
    expect(vista.palabraCivil).toBe(s.palabraInfiltrado); // ve SU palabra como si fuera la real
    expect(vista.palabraInfiltrado).toBeNull();
  });

  it('los votos en curso de otros van censurados', () => {
    const r = crearRng(13);
    let s = partidaEnPistas();
    while (s.fase === 'pistas') {
      s = aplicar(s, { tipo: 'enviarPista', jugadorId: s.ordenTurnos[s.turnoIdx], texto: 'x' }, r);
    }
    s = aplicar(s, { tipo: 'irAVotacion' }, r);
    s = aplicar(s, { tipo: 'votar', votanteId: 'j1', objetivoId: 'j2' }, r);
    s = aplicar(s, { tipo: 'votar', votanteId: 'j3', objetivoId: 'j2' }, r);
    const vista = vistaParaJugador(s, 'j1');
    expect(vista.votos['j1']).toBe('j2');
    expect(vista.votos['j3']).toBe('?');
  });

  it('al terminar la partida se revela todo', () => {
    const r = crearRng(13);
    let s = partidaEnPistas();
    while (s.fase === 'pistas') {
      s = aplicar(s, { tipo: 'enviarPista', jugadorId: s.ordenTurnos[s.turnoIdx], texto: 'x' }, r);
    }
    s = aplicar(s, { tipo: 'irAVotacion' }, r);
    const civil = s.jugadores.find((j) => j.rol === 'civil')!;
    s = votarTodosA(s, civil.id, r);
    s = aplicar(s, { tipo: 'continuar' }, r);
    expect(s.fase).toBe('resultado');
    const mentiroso = s.jugadores.find((j) => j.rol === 'mentiroso')!;
    const vista = vistaParaJugador(s, civil.id);
    expect(vista.jugadores.find((j) => j.id === mentiroso.id)!.rol).toBe('mentiroso');
    expect(vista.palabraCivil).toBe(s.palabraCivil);
  });
});

describe('adivinanza: comparación de textos', () => {
  it('normaliza tildes, mayúsculas y espacios', () => {
    expect(esAcierto('  MESSI ', 'Lionel Messi')).toBe(true);
    expect(esAcierto('lionel messi', 'Lionel Messi')).toBe(true);
    expect(esAcierto('Vinicius', 'Vinícius Jr')).toBe(true);
    expect(esAcierto('tortilla de patatas', 'Tortilla de patatas')).toBe(true);
    expect(esAcierto('cristiano', 'Lionel Messi')).toBe(false);
    expect(esAcierto('', 'Messi')).toBe(false);
  });
});
