import {
  aplicarAccion,
  aplicarModo,
  CONFIG_DEFECTO,
  crearPartida,
  validarConfig,
  vistaParaJugador,
  PACKS,
  type Accion,
  type GameConfig,
  type GameState,
  type ModoJuego,
} from '@mentiroso/shared';
import { randomBytes, randomUUID } from 'node:crypto';
import type { Server, Socket } from 'socket.io';

const MAX_JUGADORES = 20;
const GRACIA_LOBBY_MS = 45_000; // si te desconectas en el lobby, se libera tu asiento
const SALA_INACTIVA_MS = 45 * 60_000;

interface Miembro {
  id: string;
  token: string;
  nombre: string;
  emoji: string;
  color: string;
  socketId: string | null;
  conectado: boolean;
  esHost: boolean;
}

interface Sala {
  codigo: string;
  miembros: Miembro[];
  config: GameConfig;
  partida: GameState | null;
  cartasVistas: Set<string>;
  entradasUsadas: string[];
  marcador: Record<string, number>;
  ultimaActividad: number;
  timerFase: ReturnType<typeof setTimeout> | null;
}

const salas = new Map<string, Sala>();

const EMOJIS = ['😎', '🦊', '🐸', '👽', '🤖', '🐼', '🦄', '🐙', '🐯', '👻', '🍕', '🚀', '🌵', '🎩', '🐨', '🦁', '🍩', '⚡', '🎸', '🎯'];
const COLORES = ['#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#f97316', '#14b8a6', '#a855f7'];
const ALFABETO_CODIGO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function nuevoCodigo(): string {
  let codigo = '';
  do {
    codigo = Array.from(randomBytes(4), (b) => ALFABETO_CODIGO[b % ALFABETO_CODIGO.length]).join('');
  } while (salas.has(codigo));
  return codigo;
}

function configInicial(): GameConfig {
  return {
    ...CONFIG_DEFECTO,
    rolesExtra: { ...CONFIG_DEFECTO.rolesExtra },
    puntos: { ...CONFIG_DEFECTO.puntos },
    packIds: [...CONFIG_DEFECTO.packIds],
  };
}

export function montarSalas(io: Server): void {
  // limpieza periódica de salas muertas
  setInterval(() => {
    const ahora = Date.now();
    for (const [codigo, sala] of salas) {
      const todosDesconectados = sala.miembros.every((m) => !m.conectado);
      if (ahora - sala.ultimaActividad > SALA_INACTIVA_MS || (todosDesconectados && ahora - sala.ultimaActividad > 5 * 60_000)) {
        if (sala.timerFase) clearTimeout(sala.timerFase);
        salas.delete(codigo);
      }
    }
  }, 60_000).unref();

  function tocar(sala: Sala) {
    sala.ultimaActividad = Date.now();
  }

  /** Envía a cada miembro conectado SU vista del estado (censurada). */
  function difundir(sala: Sala) {
    for (const m of sala.miembros) {
      if (!m.conectado || !m.socketId) continue;
      io.to(m.socketId).emit('sala:estado', {
        codigo: sala.codigo,
        tuId: m.id,
        miembros: sala.miembros.map((x) => ({
          id: x.id,
          nombre: x.nombre,
          emoji: x.emoji,
          color: x.color,
          conectado: x.conectado,
          esHost: x.esHost,
        })),
        config: sala.config,
        partida: sala.partida ? vistaParaJugador(sala.partida, m.id) : null,
        cartasVistas: [...sala.cartasVistas],
        marcador: sala.marcador,
      });
    }
  }

  /** Timers de fase del lado servidor (autoridad). */
  function programarTimer(sala: Sala) {
    if (sala.timerFase) {
      clearTimeout(sala.timerFase);
      sala.timerFase = null;
    }
    const p = sala.partida;
    if (!p) return;
    const c = p.config;

    const auto = (ms: number, fn: () => void) => {
      sala.timerFase = setTimeout(fn, ms + 1500); // margen para latencia
    };

    if (p.fase === 'pistas' && c.segundosPista > 0) {
      const turnoDe = p.ordenTurnos[p.turnoIdx];
      auto(c.segundosPista * 1000, () => aplicarYDifundir(sala, { tipo: 'enviarPista', jugadorId: turnoDe, texto: '' }));
    } else if (p.fase === 'debate' && c.segundosDebate > 0) {
      auto(c.segundosDebate * 1000, () => aplicarYDifundir(sala, { tipo: 'irAVotacion' }));
    } else if (p.fase === 'votacion' && c.segundosVotacion > 0) {
      auto(c.segundosVotacion * 1000, () => aplicarYDifundir(sala, { tipo: 'confirmarVotos' }));
    }
  }

  function aplicarYDifundir(sala: Sala, accion: Accion): string | null {
    if (!sala.partida) return 'faseInvalida';
    const res = aplicarAccion(sala.partida, accion);
    if (res.error) return res.error;
    const faseAnterior = sala.partida.fase;
    sala.partida = res.state;
    tocar(sala);

    // en votación: confirmar automáticamente cuando todos los vivos han votado
    if (res.state.fase === 'votacion' && res.state.config.votacionSecreta) {
      const vivos = res.state.jugadores.filter((j) => j.vivo);
      if (vivos.every((j) => j.id in res.state.votos)) {
        const conf = aplicarAccion(sala.partida, { tipo: 'confirmarVotos' });
        if (!conf.error) sala.partida = conf.state;
      }
    }

    // al terminar: sumar puntos al marcador de la sala
    if (sala.partida.fase === 'resultado' && faseAnterior !== 'resultado' && sala.partida.resultado) {
      for (const [id, pts] of Object.entries(sala.partida.resultado.puntos)) {
        sala.marcador[id] = (sala.marcador[id] ?? 0) + pts;
      }
      sala.entradasUsadas = [...sala.entradasUsadas.slice(-200), sala.partida.entradaId];
    }

    programarTimer(sala);
    difundir(sala);
    return null;
  }

  function migrarHost(sala: Sala) {
    if (sala.miembros.some((m) => m.esHost && m.conectado)) return;
    const candidato = sala.miembros.find((m) => m.conectado);
    if (candidato) {
      for (const m of sala.miembros) m.esHost = false;
      candidato.esHost = true;
    }
  }

  io.on('connection', (socket: Socket) => {
    let salaActual: Sala | null = null;
    let miembroActual: Miembro | null = null;

    function responderEstado(sala: Sala) {
      salaActual = sala;
      difundir(sala);
    }

    socket.on('sala:crear', (datos: { nombre?: string }, cb?: (r: unknown) => void) => {
      const nombre = String(datos?.nombre ?? '').trim().slice(0, 18);
      if (!nombre) return cb?.({ error: 'jugadorInvalido' });
      const sala: Sala = {
        codigo: nuevoCodigo(),
        miembros: [],
        config: configInicial(),
        partida: null,
        cartasVistas: new Set(),
        entradasUsadas: [],
        marcador: {},
        ultimaActividad: Date.now(),
        timerFase: null,
      };
      salas.set(sala.codigo, sala);
      const miembro: Miembro = {
        id: randomUUID(),
        token: randomUUID(),
        nombre,
        emoji: EMOJIS[0],
        color: COLORES[0],
        socketId: socket.id,
        conectado: true,
        esHost: true,
      };
      sala.miembros.push(miembro);
      miembroActual = miembro;
      cb?.({ ok: true, codigo: sala.codigo, token: miembro.token, id: miembro.id });
      responderEstado(sala);
    });

    socket.on('sala:unir', (datos: { codigo?: string; nombre?: string; token?: string }, cb?: (r: unknown) => void) => {
      const codigo = String(datos?.codigo ?? '').trim().toUpperCase();
      const sala = salas.get(codigo);
      if (!sala) return cb?.({ error: 'salaNoExiste' });

      // reconexión con token
      if (datos?.token) {
        const previo = sala.miembros.find((m) => m.token === datos.token);
        if (previo) {
          previo.socketId = socket.id;
          previo.conectado = true;
          miembroActual = previo;
          migrarHost(sala);
          tocar(sala);
          cb?.({ ok: true, codigo: sala.codigo, token: previo.token, id: previo.id });
          responderEstado(sala);
          return;
        }
      }

      const nombre = String(datos?.nombre ?? '').trim().slice(0, 18);
      if (!nombre) return cb?.({ error: 'jugadorInvalido' });
      if (sala.partida) return cb?.({ error: 'partidaEnCurso' });
      if (sala.miembros.length >= MAX_JUGADORES) return cb?.({ error: 'salaLlena' });
      if (sala.miembros.some((m) => m.nombre.toLowerCase() === nombre.toLowerCase())) {
        return cb?.({ error: 'nombreEnUso' });
      }
      const miembro: Miembro = {
        id: randomUUID(),
        token: randomUUID(),
        nombre,
        emoji: EMOJIS[sala.miembros.length % EMOJIS.length],
        color: COLORES[sala.miembros.length % COLORES.length],
        socketId: socket.id,
        conectado: true,
        esHost: sala.miembros.length === 0,
      };
      sala.miembros.push(miembro);
      miembroActual = miembro;
      tocar(sala);
      cb?.({ ok: true, codigo: sala.codigo, token: miembro.token, id: miembro.id });
      responderEstado(sala);
    });

    socket.on('sala:config', (parcial: Partial<GameConfig> & { modoPreset?: ModoJuego }) => {
      if (!salaActual || !miembroActual?.esHost || salaActual.partida) return;
      if (parcial.modoPreset) {
        salaActual.config = aplicarModo(salaActual.config, parcial.modoPreset, salaActual.miembros.length || 3);
      } else {
        const { modoPreset: _ignorado, ...resto } = parcial;
        salaActual.config = { ...salaActual.config, ...resto };
      }
      tocar(salaActual);
      difundir(salaActual);
    });

    socket.on('sala:empezar', (_datos: unknown, cb?: (r: unknown) => void) => {
      const sala = salaActual;
      if (!sala || !miembroActual?.esHost || sala.partida) return;
      const conectados = sala.miembros.filter((m) => m.conectado);
      const error = validarConfig(sala.config, conectados.length);
      if (error) return cb?.({ error });
      try {
        sala.partida = crearPartida(
          conectados.map((m) => ({ id: m.id, nombre: m.nombre, emoji: m.emoji, color: m.color })),
          sala.config,
          PACKS,
          { entradasUsadas: sala.entradasUsadas },
        );
        sala.cartasVistas = new Set();
        tocar(sala);
        cb?.({ ok: true });
        programarTimer(sala);
        difundir(sala);
      } catch (e) {
        cb?.({ error: e instanceof Error ? e.message : 'error' });
      }
    });

    socket.on('sala:cartaVista', () => {
      const sala = salaActual;
      if (!sala?.partida || !miembroActual) return;
      if (sala.partida.fase !== 'reparto') return;
      sala.cartasVistas.add(miembroActual.id);
      const todos = sala.partida.jugadores.every((j) => sala.cartasVistas.has(j.id));
      if (todos) {
        aplicarYDifundir(sala, { tipo: 'repartoCompletado' });
      } else {
        difundir(sala);
      }
    });

    socket.on('sala:accion', (accion: Accion, cb?: (r: unknown) => void) => {
      const sala = salaActual;
      if (!sala?.partida || !miembroActual) return cb?.({ error: 'faseInvalida' });
      const yo = miembroActual.id;
      const esHost = miembroActual.esHost;

      // permisos por tipo de acción
      switch (accion.tipo) {
        case 'enviarPista':
          if (accion.jugadorId !== yo) return cb?.({ error: 'noEsTuTurno' });
          break;
        case 'votar':
        case 'quitarVoto':
          if (accion.votanteId !== yo) return cb?.({ error: 'jugadorInvalido' });
          break;
        case 'resolverAdivinanza':
        case 'saltarAdivinanza':
          if (sala.partida.adivinanzaJugadorId !== yo) return cb?.({ error: 'jugadorInvalido' });
          break;
        case 'irADebate':
        case 'irAVotacion':
        case 'continuar':
        case 'confirmarVotos':
        case 'eliminarDirecto':
          if (!esHost) return cb?.({ error: 'jugadorInvalido' });
          break;
        default:
          return cb?.({ error: 'accionDesconocida' });
      }
      const error = aplicarYDifundir(sala, accion);
      cb?.(error ? { error } : { ok: true });
    });

    socket.on('sala:reiniciar', () => {
      const sala = salaActual;
      if (!sala || !miembroActual?.esHost) return;
      if (sala.timerFase) clearTimeout(sala.timerFase);
      sala.timerFase = null;
      sala.partida = null;
      sala.cartasVistas = new Set();
      tocar(sala);
      difundir(sala);
    });

    socket.on('sala:chat', (texto: unknown) => {
      const sala = salaActual;
      if (!sala || !miembroActual) return;
      const limpio = String(texto ?? '').trim().slice(0, 200);
      if (!limpio) return;
      tocar(sala);
      for (const m of sala.miembros) {
        if (m.conectado && m.socketId) {
          io.to(m.socketId).emit('sala:chat', {
            deId: miembroActual.id,
            de: miembroActual.nombre,
            emoji: miembroActual.emoji,
            texto: limpio,
            ts: Date.now(),
          });
        }
      }
    });

    socket.on('sala:expulsar', (id: unknown) => {
      const sala = salaActual;
      if (!sala || !miembroActual?.esHost || sala.partida) return;
      const idx = sala.miembros.findIndex((m) => m.id === id && !m.esHost);
      if (idx === -1) return;
      const [expulsado] = sala.miembros.splice(idx, 1);
      if (expulsado.socketId) io.to(expulsado.socketId).emit('sala:expulsado');
      difundir(sala);
    });

    socket.on('sala:salir', () => {
      const sala = salaActual;
      if (!sala || !miembroActual) return;
      sala.miembros = sala.miembros.filter((m) => m.id !== miembroActual!.id);
      migrarHost(sala);
      difundir(sala);
      salaActual = null;
      miembroActual = null;
    });

    socket.on('disconnect', () => {
      const sala = salaActual;
      const miembro = miembroActual;
      if (!sala || !miembro) return;
      miembro.conectado = false;
      miembro.socketId = null;
      migrarHost(sala);

      // en el lobby, liberar el asiento pasado un tiempo de gracia
      if (!sala.partida) {
        setTimeout(() => {
          if (!miembro.conectado && !sala.partida) {
            sala.miembros = sala.miembros.filter((m) => m.id !== miembro.id);
            migrarHost(sala);
            difundir(sala);
          }
        }, GRACIA_LOBBY_MS).unref();
      }
      difundir(sala);
    });
  });
}
