import { es, type GameState, type JugadorPartida } from '@mentiroso/shared';
import { useEffect, useMemo, useState } from 'react';
import { Emoji3D } from '../../components/Emoji3D';
import { Carta } from '../../components/juego/Carta';
import { CuentaAtras } from '../../components/juego/CuentaAtras';
import { Temporizador } from '../../components/juego/Temporizador';
import { Avatar, Boton, clases, Insignia, Panel } from '../../components/ui';
import { COLOR_ROL, datosCartaDe } from '../../lib/carta';
import { sfx } from '../../lib/sfx';
import { t } from '../../lib/textos';
import { vibrar } from '../../stores/ajustes';
import { usePartidaLocal } from '../../stores/partidaLocal';

function jugadorPorId(s: GameState, id: string | null): JugadorPartida | null {
  return s.jugadores.find((j) => j.id === id) ?? null;
}

/** Pantalla intermedia: "pásale el móvil a X". */
function PasaElMovil({ jugador, onListo, texto }: { jugador: JugadorPartida; onListo: () => void; texto?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-lg font-semibold text-texto-2">{texto ?? t.reparto.turnoDe}</p>
      <div className="flex flex-col items-center gap-3">
        <span className="anim-pop">
          <Avatar emoji={jugador.emoji} color={jugador.color} tam="lg" />
        </span>
        <p className="anim-aparecer text-4xl font-black text-balance">{jugador.nombre}</p>
      </div>
      <Boton grande onClick={onListo} className="w-full max-w-xs">
        {`Soy ${jugador.nombre}`}
      </Boton>
    </div>
  );
}

// ── Reparto ────────────────────────────────────────────────────────
export function RepartoLocal({ partida }: { partida: GameState }) {
  const accion = usePartidaLocal((s) => s.accion);
  const [viendoCarta, setViendoCarta] = useState(false);
  const [cartaVista, setCartaVista] = useState(false);
  const jugador = partida.jugadores[partida.repartoIdx];
  if (!jugador) return null;

  if (!viendoCarta) {
    return <PasaElMovil jugador={jugador} onListo={() => { setViendoCarta(true); setCartaVista(false); }} />;
  }

  const esUltimo = partida.repartoIdx === partida.jugadores.length - 1;

  return (
    <div className="fondo-reparto anim-aparecer fixed inset-0 z-50 flex flex-col overflow-y-auto px-4 py-5 text-white select-none">
      {/* cabecera mínima, como la app de referencia */}
      <div className="mx-auto flex w-full max-w-sm items-center justify-between">
        <button
          type="button"
          onClick={() => setViendoCarta(false)}
          className="tactil flex size-10 items-center justify-center rounded-full bg-white/10 font-bold text-white hover:bg-white/20"
          aria-label="Cerrar"
        >
          ✕
        </button>
        <span className="text-base font-extrabold tracking-wide text-white/90">Jugador</span>
        <a
          href="/como-jugar"
          target="_blank"
          rel="noopener"
          className="tactil flex size-10 items-center justify-center rounded-full bg-white/10 font-bold text-white hover:bg-white/20"
          aria-label="Ayuda"
        >
          ?
        </a>
      </div>

      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center py-4">
        <Carta
          datos={datosCartaDe(partida, jugador)}
          nombre={jugador.nombre}
          onRevelada={() => setCartaVista(true)}
        />
      </div>

      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-2">
        <div className="min-h-14 w-full">
          {cartaVista && (
            <Boton
              grande
              variante="exito"
              className="anim-pop w-full"
              onClick={() => {
                setViendoCarta(false);
                accion({ tipo: 'cartaVista' });
              }}
            >
              {esUltimo ? t.reparto.aJugar : `${t.reparto.entendido} →`}
            </Boton>
          )}
        </div>
        <p className="tabular text-xs text-white/70">
          {partida.repartoIdx + 1} / {partida.jugadores.length}
        </p>
      </div>
    </div>
  );
}

// ── Tablero de pistas escritas ─────────────────────────────────────
export function ListaPistas({ partida }: { partida: GameState }) {
  if (!partida.config.pistasEscritas || partida.pistas.length === 0) return null;
  const conTexto = partida.pistas.filter((p) => p.texto);
  if (conTexto.length === 0) return null;
  return (
    <Panel className="w-full max-w-md">
      <h3 className="mb-2 text-sm font-bold tracking-wide uppercase text-texto-2">{t.pistas.verPistas}</h3>
      <ul className="flex flex-wrap gap-2">
        {conTexto.map((p, i) => {
          const j = jugadorPorId(partida, p.jugadorId);
          return (
            <li
              key={i}
              className="inline-flex items-center gap-1.5 rounded-full border border-borde bg-superficie-2 px-3 py-1.5 text-sm font-semibold"
            >
              {j && <Emoji3D e={j.emoji} tam={17} />} {p.texto}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

// ── Pistas ─────────────────────────────────────────────────────────
export function PistasLocal({ partida }: { partida: GameState }) {
  const accion = usePartidaLocal((s) => s.accion);
  const [texto, setTexto] = useState('');
  const [preparado, setPreparado] = useState(partida.ronda > 1 || partida.pistas.length > 0);
  const jugador = jugadorPorId(partida, partida.ordenTurnos[partida.turnoIdx]);
  if (!jugador) return null;

  if (!preparado) {
    return (
      <CuentaAtras
        titulo={`${jugador.nombre} ${t.pistas.empieza}`}
        subtitulo={t.pistas.preparate}
        calido
        onFin={() => setPreparado(true)}
      />
    );
  }

  function enviar(pista: string) {
    accion({ tipo: 'enviarPista', jugadorId: jugador!.id, texto: pista.trim() });
    setTexto('');
  }

  const esPregunta = partida.config.estiloPistas === 'preguntas' && partida.preguntaActual;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-4">
      <div className="flex items-center gap-3">
        <Insignia>{`${t.comunes.ronda} ${partida.ronda}`}</Insignia>
        <Temporizador
          segundos={partida.config.segundosPista}
          clave={`${partida.ronda}-${partida.turnoIdx}`}
          onFin={() => enviar('')}
        />
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm font-semibold text-texto-2">{t.pistas.turnoDe}</p>
        <div className="flex items-center gap-3">
          <Avatar emoji={jugador.emoji} color={jugador.color} />
          <p className="text-3xl font-black">{jugador.nombre}</p>
        </div>
      </div>

      <p className={clases('max-w-md text-center font-semibold text-balance', esPregunta ? 'text-2xl' : 'text-lg text-texto-2')}>
        {esPregunta ? `❓ ${partida.preguntaActual}` : t.pistas.daUnaPista}
      </p>
      {esPregunta && <p className="text-sm text-texto-2">{t.pistas.responde}</p>}

      {partida.config.pistasEscritas && !esPregunta ? (
        <form
          className="flex w-full max-w-sm gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (texto.trim()) enviar(texto);
          }}
        >
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={t.pistas.escribePista}
            maxLength={30}
            enterKeyHint="send"
            aria-label={t.pistas.escribePista}
            className="min-h-13 flex-1 rounded-2xl border border-borde bg-superficie px-4 text-lg font-semibold outline-none focus:border-brand"
          />
          <Boton type="submit" disabled={!texto.trim()}>→</Boton>
        </form>
      ) : (
        <Boton grande className="w-full max-w-xs" onClick={() => enviar('')}>
          ✅ {t.pistas.hecho}
        </Boton>
      )}

      <ListaPistas partida={partida} />

      <Boton variante="fantasma" onClick={() => accion({ tipo: 'irAVotacion' })}>
        {t.pistas.pasarAVotacion} ⏭
      </Boton>
    </div>
  );
}

// ── Debate ─────────────────────────────────────────────────────────
export function DebateLocal({ partida }: { partida: GameState }) {
  const accion = usePartidaLocal((s) => s.accion);
  useEffect(() => {
    sfx.tension();
  }, []);
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="anim-flotar">
        <Emoji3D e="🗣️" tam={88} className="drop-shadow-xl" />
      </span>
      <div>
        <h2 className="text-3xl font-black">{t.debate.titulo}</h2>
        <p className="mt-1 max-w-sm text-texto-2">{t.debate.subtitulo}</p>
      </div>
      <Temporizador grande segundos={partida.config.segundosDebate} clave="debate" onFin={() => sfx.dramatico()} />
      <ListaPistas partida={partida} />
      <Boton grande className="w-full max-w-xs" onClick={() => accion({ tipo: 'irAVotacion' })}>
        🗳️ {t.debate.irAVotacion}
      </Boton>
    </div>
  );
}

// ── Votación ───────────────────────────────────────────────────────
export function VotacionLocal({ partida }: { partida: GameState }) {
  const accion = usePartidaLocal((s) => s.accion);
  const [confirmado, setConfirmado] = useState(false);
  const [seleccion, setSeleccion] = useState<string | null>(null);

  const vivosLista = useMemo(() => partida.jugadores.filter((j) => j.vivo), [partida]);
  const votantesPendientes = vivosLista.filter((j) => !(j.id in partida.votos));
  const votante = votantesPendientes[0] ?? null;
  const huboEmpate = partida.empatesEnVotacion > 0;

  // votación abierta: el anfitrión marca el resultado
  if (!partida.config.votacionSecreta) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6">
        <h2 className="text-3xl font-black">{t.votacion.titulo}</h2>
        <p className="text-center text-texto-2">{t.votacion.subtituloAbierta}</p>
        <div className="grid w-full max-w-sm grid-cols-2 gap-2">
          {vivosLista.map((j) => (
            <button
              key={j.id}
              type="button"
              aria-pressed={seleccion === j.id}
              onClick={() => {
                sfx.click();
                setSeleccion(j.id === seleccion ? null : j.id);
              }}
              className={clases(
                'tactil flex min-h-14 items-center gap-2 rounded-2xl border px-3 font-bold',
                seleccion === j.id ? 'border-rojo bg-rojo/10 text-rojo' : 'border-borde bg-superficie',
              )}
            >
              <Avatar emoji={j.emoji} color={j.color} tam="sm" />
              <span className="truncate">{j.nombre}</span>
            </button>
          ))}
        </div>
        <div className="flex w-full max-w-sm flex-col gap-2">
          <Boton
            grande
            disabled={!seleccion}
            variante="peligro"
            onClick={() => seleccion && accion({ tipo: 'eliminarDirecto', objetivoId: seleccion })}
          >
            ☠️ {t.votacion.eliminar}
          </Boton>
          <Boton variante="fantasma" onClick={() => accion({ tipo: 'confirmarVotos' })}>
            {t.votacion.nadie}
          </Boton>
        </div>
      </div>
    );
  }

  // votación secreta pasando el móvil
  if (!votante) {
    // todos han votado
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <Emoji3D e="🗳️" tam={88} className="drop-shadow-xl" />
        <p className="text-xl font-bold">
          {Object.keys(partida.votos).length}/{vivosLista.length} {t.votacion.hanVotado}
        </p>
        <Boton grande className="w-full max-w-xs" onClick={() => accion({ tipo: 'confirmarVotos' })}>
          👀 {t.votacion.verResultado}
        </Boton>
      </div>
    );
  }

  if (!confirmado) {
    return (
      <div className="flex flex-1 flex-col">
        {huboEmpate && Object.keys(partida.votos).length === 0 && (
          <p className="mx-auto mt-4 rounded-full bg-ambar/15 px-4 py-2 text-center text-sm font-bold text-ambar">
            ⚖️ {t.votacion.empateRepite}
          </p>
        )}
        <PasaElMovil jugador={votante} onListo={() => setConfirmado(true)} texto={t.reparto.turnoDe} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6">
      <div className="flex items-center gap-3">
        <Avatar emoji={votante.emoji} color={votante.color} />
        <p className="text-2xl font-black">
          {votante.nombre} <span className="font-semibold text-texto-2">{t.votacion.vota}</span>
        </p>
      </div>
      <Temporizador
        segundos={partida.config.segundosVotacion}
        clave={votante.id}
        onFin={() => setSeleccion(null)}
      />
      <div className="grid w-full max-w-sm grid-cols-2 gap-2">
        {vivosLista
          .filter((j) => j.id !== votante.id)
          .map((j) => (
            <button
              key={j.id}
              type="button"
              aria-pressed={seleccion === j.id}
              onClick={() => {
                sfx.click();
                vibrar(10);
                setSeleccion(j.id === seleccion ? null : j.id);
              }}
              className={clases(
                'tactil flex min-h-14 items-center gap-2 rounded-2xl border px-3 font-bold',
                seleccion === j.id ? 'border-brand bg-brand-suave' : 'border-borde bg-superficie',
              )}
            >
              <Avatar emoji={j.emoji} color={j.color} tam="sm" />
              <span className="truncate">{j.nombre}</span>
            </button>
          ))}
      </div>
      <Boton
        grande
        className="w-full max-w-xs"
        disabled={!seleccion}
        onClick={() => {
          if (!seleccion) return;
          accion({ tipo: 'votar', votanteId: votante.id, objetivoId: seleccion });
          setSeleccion(null);
          setConfirmado(false);
        }}
      >
        ✅ {t.votacion.confirmarVoto}
      </Boton>
    </div>
  );
}

// ── Revelación ─────────────────────────────────────────────────────
export function RevelacionLocal({ partida }: { partida: GameState }) {
  const accion = usePartidaLocal((s) => s.accion);
  const eliminado = jugadorPorId(partida, partida.ultimoEliminadoId);
  const [revelado, setRevelado] = useState(!eliminado);

  useEffect(() => {
    if (eliminado && !revelado) sfx.redoble();
  }, []);

  function alExponer() {
    if (!eliminado) return;
    setRevelado(true);
    vibrar([60, 40, 120]);
    if (eliminado.rol === 'mentiroso' || eliminado.rol === 'infiltrado') sfx.exito();
    else if (eliminado.rol === 'payaso') sfx.dramatico();
    else sfx.fracaso();
  }

  if (eliminado && !revelado) {
    return <CuentaAtras emoji="👀" titulo={t.revelacion.expuestoEn} onFin={alExponer} />;
  }

  if (!eliminado) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <Emoji3D e="⚖️" tam={88} className="drop-shadow-xl" />
        <h2 className="text-2xl font-black text-balance">{t.revelacion.nadieEliminado}</h2>
        <Boton grande className="w-full max-w-xs" onClick={() => accion({ tipo: 'continuar' })}>
          {t.revelacion.continuar} →
        </Boton>
      </div>
    );
  }

  const textoRol =
    eliminado.rol === 'mentiroso'
      ? t.revelacion.mentirosoPillado
      : eliminado.rol === 'infiltrado'
        ? t.revelacion.infiltradoPillado
        : eliminado.rol === 'payaso'
          ? t.revelacion.payasoGana
          : t.revelacion.civilInocente;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <Avatar emoji={eliminado.emoji} color={eliminado.color} tam="lg" atenuado={revelado} />
        <p className="text-3xl font-black">{eliminado.nombre}</p>
        <p className="text-lg text-texto-2">{t.revelacion.eliminado}… {t.revelacion.era}</p>
      </div>

      {revelado ? (
        <>
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 -z-10"
            style={{
              background: `radial-gradient(38rem 30rem at 50% 45%, color-mix(in srgb, ${COLOR_ROL[eliminado.rol]} 22%, transparent), transparent 70%)`,
              animation: 'latido-glow 1.8s ease-in-out infinite',
            }}
          />
          <p className="anim-pop text-4xl font-black text-balance" style={{ color: COLOR_ROL[eliminado.rol] }}>
            {textoRol}
          </p>
          <Boton grande className="anim-aparecer w-full max-w-xs" onClick={() => accion({ tipo: 'continuar' })}>
            {t.revelacion.continuar} →
          </Boton>
        </>
      ) : (
        <span className="animate-pulse">
          <Emoji3D e="🥁" tam={72} className="drop-shadow-xl" />
        </span>
      )}
    </div>
  );
}

// ── Adivinanza final ───────────────────────────────────────────────
export function AdivinanzaLocal({ partida }: { partida: GameState }) {
  const accion = usePartidaLocal((s) => s.accion);
  const [texto, setTexto] = useState('');
  const mentiroso = jugadorPorId(partida, partida.adivinanzaJugadorId);
  if (!mentiroso) return null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
      <span className="anim-flotar">
        <Emoji3D e="🎯" tam={88} className="drop-shadow-xl" />
      </span>
      <div>
        <h2 className="text-3xl font-black">{t.adivinanza.titulo}</h2>
        <p className="mt-1 text-texto-2">
          <b>{mentiroso.nombre}</b>, {t.adivinanza.subtitulo}
        </p>
        <p className="mt-2 font-semibold">{t.adivinanza.instruccion}</p>
      </div>
      <form
        className="flex w-full max-w-sm flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (texto.trim()) accion({ tipo: 'resolverAdivinanza', texto });
        }}
      >
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={t.adivinanza.placeholder}
          maxLength={40}
          enterKeyHint="go"
          aria-label={t.adivinanza.placeholder}
          className="min-h-14 rounded-2xl border border-borde bg-superficie px-4 text-center text-xl font-bold outline-none focus:border-brand"
        />
        <Boton grande type="submit" disabled={!texto.trim()}>
          🎯 {t.adivinanza.probar}
        </Boton>
        <Boton variante="fantasma" type="button" onClick={() => accion({ tipo: 'saltarAdivinanza' })}>
          {t.adivinanza.rendirse}
        </Boton>
      </form>
    </div>
  );
}
