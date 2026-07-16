// ─── Roles ────────────────────────────────────────────────────────────────
// civil      → conoce la palabra secreta
// mentiroso  → NO conoce la palabra (el impostor clásico / Sr. Blanco)
// infiltrado → recibe una palabra PARECIDA y no sabe que es el infiltrado
// payaso     → civil que solo gana si consigue que lo eliminen
// complice   → civil que conoce quiénes son los mentirosos y gana con ellos
// vidente    → civil que ve el rol (no la palabra) de otro jugador al azar
export type Rol = 'civil' | 'mentiroso' | 'infiltrado' | 'payaso' | 'complice' | 'vidente';

/** Bandos a efectos de victoria. payaso va por libre. */
export type Bando = 'civiles' | 'mentirosos' | 'payaso';

export type ModoJuego = 'clasico' | 'infiltrado' | 'mixto' | 'preguntas' | 'caos' | 'personalizado';

export type Fase =
  | 'reparto'      // se muestran las cartas (pasar el móvil / cada uno en su dispositivo)
  | 'pistas'       // turnos de pistas
  | 'debate'       // discusión libre
  | 'votacion'     // cada jugador vota
  | 'revelacion'   // se muestra el resultado de la votación
  | 'adivinanza'   // el mentiroso eliminado intenta adivinar la palabra
  | 'resultado';   // fin de partida

export type AyudaMentiroso = 'nada' | 'categoria' | 'inicial';
export type ResolucionEmpate = 'revotar' | 'nadie';

export interface RolesExtraConfig {
  payaso: boolean;
  complice: boolean;
  vidente: boolean;
}

export interface GameConfig {
  modo: ModoJuego;
  /** nº de mentirosos; usar sugerirReparto() para el valor automático */
  numMentirosos: number;
  numInfiltrados: number;
  rolesExtra: RolesExtraConfig;
  /** rondas de pistas antes de la primera votación (1-3) */
  rondasDePistas: number;
  /** true = las pistas se escriben en la app (historial); false = solo de palabra */
  pistasEscritas: boolean;
  /** palabras = pista de una palabra; preguntas = la app lanza preguntas del pack */
  estiloPistas: 'palabras' | 'preguntas';
  /** true = se elimina 1 por votación hasta que un bando gane; false = muerte súbita (una única votación) */
  eliminacionProgresiva: boolean;
  /** true = votación secreta en la app; false = el anfitrión marca el resultado del voto verbal */
  votacionSecreta: boolean;
  empate: ResolucionEmpate;
  /** el mentiroso eliminado puede adivinar la palabra */
  adivinanzaFinal: boolean;
  /** si acierta la adivinanza, roba la victoria */
  adivinanzaRobaVictoria: boolean;
  ayudaMentiroso: AyudaMentiroso;
  /** mostrar la categoría a todos los jugadores */
  mostrarCategoria: boolean;
  /** segundos por turno de pista; 0 = sin límite */
  segundosPista: number;
  /** segundos de debate; 0 = sin límite */
  segundosDebate: number;
  /** segundos de votación; 0 = sin límite */
  segundosVotacion: number;
  /** ids de packs activos */
  packIds: string[];
  /** puntos que recibe cada rol al ganar */
  puntos: {
    civil: number;
    mentiroso: number;
    infiltrado: number;
    payaso: number;
    complice: number;
    /** bonus del mentiroso por acertar la adivinanza */
    adivinanza: number;
  };
  evitarRepetidas: boolean;
}

export interface JugadorInfo {
  id: string;
  nombre: string;
  emoji: string;
  color: string;
}

export interface JugadorPartida extends JugadorInfo {
  rol: Rol;
  /** lo que ve en su carta: la palabra civil, la parecida (infiltrado) o null (mentiroso) */
  palabra: string | null;
  vivo: boolean;
  /** solo vidente: id y rol del jugador que ha visto */
  vision?: { jugadorId: string; rol: Rol };
  /** solo cómplice (rellenado en la vista online): nombres de los mentirosos */
  infoComplice?: string[];
  /** solo mentiroso (vista online): texto de ayuda según config (categoría o inicial) */
  ayudaTexto?: string;
}

export interface Pista {
  ronda: number;
  jugadorId: string;
  /** texto escrito, o '' si la pista fue verbal */
  texto: string;
  /** pregunta lanzada en modo preguntas */
  pregunta?: string;
}

export interface RegistroVotacion {
  ronda: number;
  votos: Record<string, string>; // votante -> objetivo
  eliminadoId: string | null;    // null = empate sin eliminado
  empate: boolean;
}

export interface ResultadoPartida {
  ganador: Bando;
  /** true si el mentiroso ganó adivinando la palabra */
  porAdivinanza: boolean;
  /** id del payaso si ganó él */
  payasoId?: string;
  /** puntos ganados por jugador en esta partida */
  puntos: Record<string, number>;
}

export interface GameState {
  fase: Fase;
  config: GameConfig;
  jugadores: JugadorPartida[];
  /** palabra de los civiles */
  palabraCivil: string;
  /** palabra parecida que reciben los infiltrados (null si no hay) */
  palabraInfiltrado: string | null;
  categoria: string;
  packId: string;
  entradaId: string;
  /** índice del jugador cuya carta toca revelar (modo local, fase reparto) */
  repartoIdx: number;
  /** nº de ronda de pistas (empieza en 1) */
  ronda: number;
  /** rondas de pistas que quedan antes de pasar a debate */
  rondasRestantes: number;
  /** nº de votación (empieza en 1) */
  votacionNum: number;
  /** empates consecutivos en la votación en curso (para revotar solo una vez) */
  empatesEnVotacion: number;
  /** orden de turnos de la ronda actual (ids), solo vivos */
  ordenTurnos: string[];
  turnoIdx: number;
  pistas: Pista[];
  /** preguntas del pack elegido (modo preguntas) */
  preguntasPack: string[];
  /** preguntas ya usadas (modo preguntas) */
  preguntasUsadas: string[];
  /** pregunta activa del turno (modo preguntas) */
  preguntaActual: string | null;
  /** votos de la votación en curso: votante -> objetivo */
  votos: Record<string, string>;
  historialVotaciones: RegistroVotacion[];
  /** eliminado en la última revelación */
  ultimoEliminadoId: string | null;
  /** jugador con adivinanza pendiente (mentiroso eliminado) */
  adivinanzaJugadorId: string | null;
  /** última adivinanza hecha: texto y si acertó (para la pantalla de resultado) */
  ultimaAdivinanza: { jugadorId: string; texto: string; acierto: boolean } | null;
  resultado: ResultadoPartida | null;
}

// ─── Packs de contenido ───────────────────────────────────────────────────

export interface EntradaPack {
  id: string;
  texto: string;
  /** palabras/famosos parecidos para el rol infiltrado */
  similares: string[];
}

export interface Pack {
  id: string;
  nombre: string;
  emoji: string;
  /** nombre de la categoría que se muestra en el juego */
  categoria: string;
  /** true si es de famosos (personas), false si son palabras/conceptos */
  esFamosos: boolean;
  /** preguntas genéricas del pack para el modo preguntas */
  preguntas: string[];
  entradas: EntradaPack[];
  /** packs creados por el usuario */
  personalizado?: boolean;
}

// ─── Acciones del engine ──────────────────────────────────────────────────

export type Accion =
  | { tipo: 'cartaVista' }                                    // local: avanza al siguiente jugador en el reparto
  | { tipo: 'repartoCompletado' }                             // online: todos confirmaron su carta
  | { tipo: 'enviarPista'; jugadorId: string; texto: string } // texto '' si es verbal
  | { tipo: 'irADebate' }
  | { tipo: 'irAVotacion' }
  | { tipo: 'votar'; votanteId: string; objetivoId: string }
  | { tipo: 'quitarVoto'; votanteId: string }
  | { tipo: 'confirmarVotos' }                                // resuelve la votación → revelacion
  | { tipo: 'eliminarDirecto'; objetivoId: string }           // votación no secreta: el anfitrión marca al eliminado
  | { tipo: 'continuar' }                                     // tras revelacion: adivinanza | resultado | siguiente ronda
  | { tipo: 'resolverAdivinanza'; texto: string }
  | { tipo: 'saltarAdivinanza' };

export interface ResultadoAccion {
  state: GameState;
  error?: string;
}

// ─── Utilidades de configuración ──────────────────────────────────────────

export interface AjustesUsuario {
  tema: 'oscuro' | 'claro' | 'sistema';
  idioma: 'es';
  sonidos: boolean;
  vibracion: boolean;
  reducirAnimaciones: boolean;
}
