import type { Accion, GameConfig, GameState, ModoJuego } from '@mentiroso/shared';
import { io, type Socket } from 'socket.io-client';
import { create } from 'zustand';

const URL_SERVIDOR = (import.meta.env.PUBLIC_SERVER_URL as string | undefined) ?? 'http://localhost:4322';
const CLAVE_SESION = 'mentiroso-sala';

export interface MiembroSala {
  id: string;
  nombre: string;
  emoji: string;
  color: string;
  conectado: boolean;
  esHost: boolean;
}

export interface EstadoSala {
  codigo: string;
  tuId: string;
  miembros: MiembroSala[];
  config: GameConfig;
  partida: GameState | null;
  cartasVistas: string[];
  marcador: Record<string, number>;
}

export interface MensajeChat {
  deId: string;
  de: string;
  emoji: string;
  texto: string;
  ts: number;
}

interface SesionGuardada {
  codigo: string;
  token: string;
  nombre: string;
}

/**
 * La sesión de sala vive en sessionStorage: es por pestaña (dos jugadores
 * pueden probar desde el mismo navegador) y sobrevive a recargas, que es
 * justo lo que necesita la reconexión. El nombre se recuerda aparte.
 */
function leerSesion(): SesionGuardada | null {
  try {
    const crudo = sessionStorage.getItem(CLAVE_SESION);
    return crudo ? (JSON.parse(crudo) as SesionGuardada) : null;
  } catch {
    return null;
  }
}

function guardarSesion(s: SesionGuardada | null) {
  try {
    if (s) {
      sessionStorage.setItem(CLAVE_SESION, JSON.stringify(s));
      localStorage.setItem('mentiroso-nombre', s.nombre);
    } else {
      sessionStorage.removeItem(CLAVE_SESION);
    }
  } catch {}
}

interface SalaStore {
  conectado: boolean;
  uniendo: boolean;
  error: string | null;
  expulsado: boolean;
  estado: EstadoSala | null;
  chat: MensajeChat[];
  noLeidos: number;

  crear: (nombre: string) => Promise<string | null>;
  unir: (codigo: string, nombre: string) => Promise<string | null>;
  reconectar: (codigo: string) => Promise<boolean>;
  setConfig: (parcial: Partial<GameConfig> & { modoPreset?: ModoJuego }) => void;
  empezar: () => void;
  accion: (a: Accion) => void;
  cartaVista: () => void;
  enviarChat: (texto: string) => void;
  marcarChatLeido: () => void;
  reiniciar: () => void;
  expulsar: (id: string) => void;
  salir: () => void;
  limpiarError: () => void;
}

let socket: Socket | null = null;

function conectar(): Socket {
  if (socket) return socket;
  socket = io(URL_SERVIDOR, { transports: ['websocket', 'polling'] });

  socket.on('connect', () => {
    useSala.setState({ conectado: true });
    // reintentar volver a la sala tras una reconexión del socket
    const sesion = leerSesion();
    const { estado } = useSala.getState();
    if (sesion && estado) {
      socket!.emit('sala:unir', { codigo: sesion.codigo, token: sesion.token }, () => {});
    }
  });
  socket.on('disconnect', () => useSala.setState({ conectado: false }));
  socket.on('sala:estado', (estado: EstadoSala) => {
    useSala.setState({ estado, uniendo: false });
  });
  socket.on('sala:chat', (mensaje: MensajeChat) => {
    useSala.setState((s) => ({
      chat: [...s.chat.slice(-99), mensaje],
      noLeidos: s.noLeidos + (mensaje.deId === s.estado?.tuId ? 0 : 1),
    }));
  });
  socket.on('sala:expulsado', () => {
    guardarSesion(null);
    useSala.setState({ expulsado: true, estado: null });
  });
  return socket;
}

type RespuestaSala = { ok?: boolean; codigo?: string; token?: string; id?: string; error?: string };

export const useSala = create<SalaStore>()((set, get) => ({
  conectado: false,
  uniendo: false,
  error: null,
  expulsado: false,
  estado: null,
  chat: [],
  noLeidos: 0,

  crear: (nombre) =>
    new Promise((resolver) => {
      set({ uniendo: true, error: null });
      conectar().emit('sala:crear', { nombre }, (r: RespuestaSala) => {
        if (r?.ok && r.codigo && r.token) {
          guardarSesion({ codigo: r.codigo, token: r.token, nombre });
          resolver(r.codigo);
        } else {
          set({ error: r?.error ?? 'error', uniendo: false });
          resolver(null);
        }
      });
    }),

  unir: (codigo, nombre) =>
    new Promise((resolver) => {
      set({ uniendo: true, error: null });
      conectar().emit('sala:unir', { codigo, nombre }, (r: RespuestaSala) => {
        if (r?.ok && r.codigo && r.token) {
          guardarSesion({ codigo: r.codigo, token: r.token, nombre });
          resolver(r.codigo);
        } else {
          set({ error: r?.error ?? 'error', uniendo: false });
          resolver(null);
        }
      });
    }),

  reconectar: (codigo) =>
    new Promise((resolver) => {
      const sesion = leerSesion();
      if (!sesion || sesion.codigo !== codigo.toUpperCase()) return resolver(false);
      set({ uniendo: true, error: null });
      conectar().emit('sala:unir', { codigo: sesion.codigo, token: sesion.token }, (r: RespuestaSala) => {
        if (r?.ok) {
          resolver(true);
        } else {
          set({ uniendo: false });
          resolver(false);
        }
      });
    }),

  setConfig: (parcial) => conectar().emit('sala:config', parcial),
  empezar: () =>
    conectar().emit('sala:empezar', {}, (r: RespuestaSala) => {
      if (r?.error) set({ error: r.error });
    }),
  accion: (a) =>
    conectar().emit('sala:accion', a, (r: RespuestaSala) => {
      if (r?.error && r.error !== 'faseInvalida') set({ error: r.error });
    }),
  cartaVista: () => conectar().emit('sala:cartaVista'),
  enviarChat: (texto) => conectar().emit('sala:chat', texto),
  marcarChatLeido: () => set({ noLeidos: 0 }),
  reiniciar: () => conectar().emit('sala:reiniciar'),
  expulsar: (id) => conectar().emit('sala:expulsar', id),
  salir: () => {
    conectar().emit('sala:salir');
    guardarSesion(null);
    set({ estado: null, chat: [], noLeidos: 0 });
  },
  limpiarError: () => set({ error: null }),
}));
