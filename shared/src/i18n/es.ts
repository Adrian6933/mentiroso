/**
 * Textos de la interfaz en español.
 * Para añadir un idioma: copiar este archivo (p. ej. en.ts) con las mismas claves
 * y registrarlo en i18n/index.ts.
 */
export const es = {
  app: {
    nombre: 'El Mentiroso',
    eslogan: 'El juego del impostor de famosos',
  },
  roles: {
    civil: 'Civil',
    mentiroso: 'Mentiroso',
    infiltrado: 'Infiltrado',
    payaso: 'Payaso',
    complice: 'Cómplice',
    vidente: 'Vidente',
  },
  rolesDesc: {
    civil: 'Conoces la palabra. Encuentra al mentiroso sin desvelarla.',
    mentiroso: 'No conoces la palabra. Improvisa, disimula y sobrevive.',
    infiltrado: 'Tienes una palabra parecida… pero no lo sabes.',
    payaso: 'Conoces la palabra, pero solo ganas si consiguen eliminarte.',
    complice: 'Conoces la palabra y quién es el mentiroso. Ganas con él.',
    vidente: 'Conoces la palabra y el rol de un jugador al azar.',
  },
  modos: {
    clasico: 'Clásico',
    infiltrado: 'Infiltrado',
    mixto: 'Mixto',
    preguntas: 'Preguntas',
    caos: 'Caos',
    personalizado: 'Personalizado',
  },
  modosDesc: {
    clasico: 'Todos reciben el famoso menos el mentiroso. Pistas, debate y votación.',
    infiltrado: 'Nadie es el mentiroso: uno tiene un famoso parecido y no lo sabe.',
    mixto: 'Mentirosos e infiltrados a la vez, con eliminación por rondas.',
    preguntas: 'La app lanza preguntas sobre el famoso y cada uno responde. Estilo TikTok.',
    caos: 'Roles especiales ocultos: payaso, cómplice, vidente… todo puede pasar.',
    personalizado: 'Configúralo todo a tu gusto.',
  },
  fases: {
    reparto: 'Reparto de cartas',
    pistas: 'Ronda de pistas',
    debate: 'Debate',
    votacion: 'Votación',
    revelacion: 'Revelación',
    adivinanza: 'Adivinanza final',
    resultado: 'Resultado',
  },
  errores: {
    minJugadores: 'Hacen falta al menos 3 jugadores',
    sinImpostores: 'Debe haber al menos un mentiroso o infiltrado',
    demasiadosImpostores: 'Demasiados impostores: los civiles deben ser mayoría',
    demasiadosRoles: 'Hay más roles especiales que jugadores',
    sinPacks: 'Elige al menos un pack de palabras',
    compliceSinMentiroso: 'El cómplice necesita que haya al menos un mentiroso',
    faseInvalida: 'Acción no válida en esta fase',
    noEsTuTurno: 'No es tu turno',
    jugadorInvalido: 'Jugador no válido',
    autoVoto: 'No puedes votarte a ti mismo',
    salaLlena: 'La sala está llena',
    salaNoExiste: 'Esa sala no existe',
    nombreEnUso: 'Ya hay alguien con ese nombre en la sala',
    partidaEnCurso: 'La partida ya ha empezado',
  },
} as const;

export type Diccionario = typeof es;
