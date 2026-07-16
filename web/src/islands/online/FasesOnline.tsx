import type { GameState, JugadorPartida } from '@mentiroso/shared';
import { useEffect, useMemo, useState } from 'react';
import { Emoji3D } from '../../components/Emoji3D';
import { Carta } from '../../components/juego/Carta';
import { Temporizador } from '../../components/juego/Temporizador';
import { Avatar, Boton, clases, Insignia, Panel } from '../../components/ui';
import { COLOR_ROL, datosCartaDe } from '../../lib/carta';
import { lanzarConfeti } from '../../lib/confeti';
import { sfx } from '../../lib/sfx';
import { t } from '../../lib/textos';
import { vibrar } from '../../stores/ajustes';
import { useSala } from '../../stores/sala';
import { es } from '@mentiroso/shared';

interface PropsFase {
  partida: GameState;
  tuId: string;
  esHost: boolean;
}

function jugadorPorId(s: GameState, id: string | null): JugadorPartida | null {
  return s.jugadores.find((j) => j.id === id) ?? null;
}

// ── Reparto ────────────────────────────────────────────────────────
export function RepartoOnline({ partida, tuId }: PropsFase) {
  const { cartaVista, estado } = useSala();
  const [haVistoCarta, setHaVistoCarta] = useState(false);
  const yo = jugadorPorId(partida, tuId);
  const vistas = estado?.cartasVistas ?? [];
  const yaLista = vistas.includes(tuId);
  if (!yo) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#7c3aed] text-white flex flex-col justify-between py-6 px-4 select-none anim-aparecer">
      {/* Header bar estilo captura 3 */}
      <div className="flex items-center justify-between w-full max-w-xs mx-auto">
        <div className="size-10"></div>
        <span className="font-extrabold text-white/95 text-base tracking-wide">Jugador</span>
        <a
          href="/como-jugar"
          target="_blank"
          className="tactil flex size-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white font-bold"
          aria-label="Ayuda"
        >
          ?
        </a>
      </div>

      {/* Contenedor central de la carta */}
      <div className="flex-1 flex flex-col justify-center items-center my-4 w-full">
        <Carta datos={datosCartaDe(partida, yo)} nombre={yo.nombre} onRevelada={() => setHaVistoCarta(true)} />
      </div>

      <div className="w-full max-w-xs mx-auto flex flex-col items-center gap-2">
        <div className="min-h-12 w-full">
          {haVistoCarta && (
            <Boton
              grande
              className="anim-pop w-full bg-white text-[#7c3aed] hover:bg-white/90 hover:scale-[1.02] border-none shadow-xl font-black text-base transition-transform duration-150"
              disabled={yaLista}
              onClick={cartaVista}
            >
              {yaLista ? `⌛ ${t.online.esperandoJugadores}` : `✅ ${t.comunes.listo}`}
            </Boton>
          )}
        </div>
        <p className="tabular text-xs text-white/70">
          {vistas.length} / {partida.jugadores.length}
        </p>
      </div>
    </div>
  );
}

// ── Tablero de pistas ──────────────────────────────────────────────
function TableroPistas({ partida }: { partida: GameState }) {
  const conTexto = partida.pistas.filter((p) => p.texto);
  if (!partida.config.pistasEscritas || conTexto.length === 0) return null;
  return (
    <Panel className="w-full max-w-md">
      <h3 className="mb-2 text-sm font-bold tracking-wide uppercase text-texto-2">{t.pistas.verPistas}</h3>
      <ul className="flex flex-wrap gap-2">
        {conTexto.map((p, i) => {
          const j = jugadorPorId(partida, p.jugadorId);
          return (
            <li key={i} className="inline-flex items-center gap-1.5 rounded-full border border-borde bg-superficie-2 px-3 py-1.5 text-sm font-semibold">
              {j && <Emoji3D e={j.emoji} tam={17} />} {p.texto}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

// ── Pistas ─────────────────────────────────────────────────────────
export function PistasOnline({ partida, tuId, esHost }: PropsFase) {
  const { accion } = useSala();
  const [texto, setTexto] = useState('');
  const turnoDe = jugadorPorId(partida, partida.ordenTurnos[partida.turnoIdx]);
  const esMiTurno = turnoDe?.id === tuId;
  const esPregunta = partida.config.estiloPistas === 'preguntas' && partida.preguntaActual;

  useEffect(() => {
    if (esMiTurno) {
      sfx.tension();
      vibrar([40, 60, 40]);
    }
  }, [esMiTurno]);

  if (!turnoDe) return null;

  function enviar(pista: string) {
    accion({ tipo: 'enviarPista', jugadorId: tuId, texto: pista.trim() });
    setTexto('');
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-4">
      <div className="flex items-center gap-3">
        <Insignia>{`${t.comunes.ronda} ${partida.ronda}`}</Insignia>
        <Temporizador segundos={partida.config.segundosPista} clave={`${partida.ronda}-${partida.turnoIdx}`} />
      </div>

      {esMiTurno ? (
        <>
          <p className="anim-pop texto-gradiente text-3xl font-black">{t.online.tuTurno}</p>
          <p className={clases('max-w-md text-center font-semibold text-balance', esPregunta ? 'text-2xl' : 'text-lg text-texto-2')}>
            {esPregunta ? `❓ ${partida.preguntaActual}` : t.pistas.daUnaPista}
          </p>
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
                autoFocus
                enterKeyHint="send"
                aria-label={t.pistas.escribePista}
                className="min-h-13 w-0 flex-1 rounded-2xl border border-borde bg-superficie px-4 text-lg font-semibold outline-none focus:border-brand"
              />
              <Boton type="submit" disabled={!texto.trim()}>→</Boton>
            </form>
          ) : (
            <Boton grande className="w-full max-w-xs" onClick={() => enviar('')}>
              ✅ {t.pistas.hecho}
            </Boton>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm font-semibold text-texto-2">{t.online.esperandoTurno}</p>
          <div className="flex items-center gap-3">
            <Avatar emoji={turnoDe.emoji} color={turnoDe.color} />
            <p className="animate-pulse text-3xl font-black">{turnoDe.nombre}…</p>
          </div>
          {esPregunta && <p className="mt-2 max-w-md text-lg font-semibold text-balance">❓ {partida.preguntaActual}</p>}
        </div>
      )}

      <TableroPistas partida={partida} />

      {esHost && (
        <Boton variante="fantasma" onClick={() => accion({ tipo: 'irAVotacion' })}>
          {t.pistas.pasarAVotacion} ⏭
        </Boton>
      )}
    </div>
  );
}

// ── Debate ─────────────────────────────────────────────────────────
export function DebateOnline({ partida, esHost }: PropsFase) {
  const { accion } = useSala();
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
      <Temporizador segundos={partida.config.segundosDebate} clave="debate" />
      <TableroPistas partida={partida} />
      {esHost ? (
        <Boton grande className="w-full max-w-xs" onClick={() => accion({ tipo: 'irAVotacion' })}>
          🗳️ {t.debate.irAVotacion}
        </Boton>
      ) : (
        <p className="text-sm text-texto-2">{t.online.anfitrionContinua}</p>
      )}
    </div>
  );
}

// ── Votación ───────────────────────────────────────────────────────
export function VotacionOnline({ partida, tuId, esHost }: PropsFase) {
  const { accion } = useSala();
  const [seleccionHost, setSeleccionHost] = useState<string | null>(null);
  const vivosLista = useMemo(() => partida.jugadores.filter((j) => j.vivo), [partida]);
  const yo = jugadorPorId(partida, tuId);
  const miVoto = partida.votos[tuId];
  const votosEmitidos = Object.keys(partida.votos).length;
  const estoyVivo = !!yo?.vivo;

  // votación abierta: solo el anfitrión marca
  if (!partida.config.votacionSecreta) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6">
        <h2 className="text-3xl font-black">{t.votacion.titulo}</h2>
        <p className="text-center text-texto-2">{t.votacion.subtituloAbierta}</p>
        {esHost ? (
          <>
            <div className="grid w-full max-w-sm grid-cols-2 gap-2">
              {vivosLista.map((j) => (
                <button
                  key={j.id}
                  type="button"
                  aria-pressed={seleccionHost === j.id}
                  onClick={() => {
                    sfx.click();
                    setSeleccionHost(j.id === seleccionHost ? null : j.id);
                  }}
                  className={clases(
                    'tactil flex min-h-14 items-center gap-2 rounded-2xl border px-3 font-bold',
                    seleccionHost === j.id ? 'border-rojo bg-rojo/10 text-rojo' : 'border-borde bg-superficie',
                  )}
                >
                  <Avatar emoji={j.emoji} color={j.color} tam="sm" />
                  <span className="truncate">{j.nombre}</span>
                </button>
              ))}
            </div>
            <div className="flex w-full max-w-sm flex-col gap-2">
              <Boton grande variante="peligro" disabled={!seleccionHost} onClick={() => seleccionHost && accion({ tipo: 'eliminarDirecto', objetivoId: seleccionHost })}>
                ☠️ {t.votacion.eliminar}
              </Boton>
              <Boton variante="fantasma" onClick={() => accion({ tipo: 'confirmarVotos' })}>
                {t.votacion.nadie}
              </Boton>
            </div>
          </>
        ) : (
          <p className="text-sm text-texto-2">{t.online.anfitrionContinua}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6">
      <div className="flex items-center gap-3">
        <h2 className="text-3xl font-black">{t.votacion.titulo}</h2>
        <Temporizador segundos={partida.config.segundosVotacion} clave={`vot-${partida.votacionNum}-${partida.empatesEnVotacion}`} />
      </div>
      {partida.empatesEnVotacion > 0 && (
        <p className="rounded-full bg-ambar/15 px-4 py-2 text-sm font-bold text-ambar">⚖️ {t.votacion.empateRepite}</p>
      )}

      {estoyVivo ? (
        <div className="grid w-full max-w-sm grid-cols-2 gap-2">
          {vivosLista
            .filter((j) => j.id !== tuId)
            .map((j) => (
              <button
                key={j.id}
                type="button"
                aria-pressed={miVoto === j.id}
                onClick={() => {
                  sfx.click();
                  vibrar(10);
                  accion({ tipo: 'votar', votanteId: tuId, objetivoId: j.id });
                }}
                className={clases(
                  'tactil flex min-h-14 items-center gap-2 rounded-2xl border px-3 font-bold',
                  miVoto === j.id ? 'border-brand bg-brand-suave' : 'border-borde bg-superficie',
                )}
              >
                <Avatar emoji={j.emoji} color={j.color} tam="sm" />
                <span className="truncate">{j.nombre}</span>
              </button>
            ))}
        </div>
      ) : (
        <p className="text-texto-2">👻 …</p>
      )}

      <p className="tabular font-semibold text-texto-2">
        {miVoto && <span className="text-verde">✓ {t.online.hasVotado} · </span>}
        {votosEmitidos}/{vivosLista.length} {t.votacion.hanVotado}
      </p>

      {esHost && votosEmitidos > 0 && (
        <Boton variante="fantasma" onClick={() => accion({ tipo: 'confirmarVotos' })}>
          {t.votacion.verResultado} ⏭
        </Boton>
      )}
    </div>
  );
}

// ── Revelación ─────────────────────────────────────────────────────
export function RevelacionOnline({ partida, esHost }: PropsFase) {
  const { accion } = useSala();
  const [revelado, setRevelado] = useState(false);
  const eliminado = jugadorPorId(partida, partida.ultimoEliminadoId);

  useEffect(() => {
    if (!eliminado) {
      setRevelado(true);
      return;
    }
    sfx.redoble();
    const timer = setTimeout(() => {
      setRevelado(true);
      vibrar([60, 40, 120]);
      if (eliminado.rol === 'mentiroso' || eliminado.rol === 'infiltrado') sfx.exito();
      else if (eliminado.rol === 'payaso') sfx.dramatico();
      else sfx.fracaso();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const botonContinuar = esHost ? (
    <Boton grande className="w-full max-w-xs" onClick={() => accion({ tipo: 'continuar' })}>
      {t.revelacion.continuar} →
    </Boton>
  ) : (
    <p className="text-sm text-texto-2">{t.online.anfitrionContinua}</p>
  );

  if (!eliminado) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <Emoji3D e="⚖️" tam={88} className="drop-shadow-xl" />
        <h2 className="text-2xl font-black text-balance">{t.revelacion.nadieEliminado}</h2>
        {botonContinuar}
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
          {botonContinuar}
        </>
      ) : (
        <span className="animate-pulse">
          <Emoji3D e="🥁" tam={72} className="drop-shadow-xl" />
        </span>
      )}
    </div>
  );
}

// ── Adivinanza ─────────────────────────────────────────────────────
export function AdivinanzaOnline({ partida, tuId }: PropsFase) {
  const { accion } = useSala();
  const [texto, setTexto] = useState('');
  const adivinador = jugadorPorId(partida, partida.adivinanzaJugadorId);
  if (!adivinador) return null;
  const soyYo = adivinador.id === tuId;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
      <span className="anim-flotar">
        <Emoji3D e="🎯" tam={88} className="drop-shadow-xl" />
      </span>
      <div>
        <h2 className="text-3xl font-black">{t.adivinanza.titulo}</h2>
        <p className="mt-1 text-texto-2">
          <b>{adivinador.nombre}</b>, {t.adivinanza.subtitulo}
        </p>
      </div>
      {soyYo ? (
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
            autoFocus
            enterKeyHint="go"
            aria-label={t.adivinanza.placeholder}
            className="min-h-14 rounded-2xl border border-borde bg-superficie px-4 text-center text-xl font-bold outline-none focus:border-brand"
          />
          <Boton grande type="submit" disabled={!texto.trim()}>🎯 {t.adivinanza.probar}</Boton>
          <Boton variante="fantasma" type="button" onClick={() => accion({ tipo: 'saltarAdivinanza' })}>
            {t.adivinanza.rendirse}
          </Boton>
        </form>
      ) : (
        <p className="animate-pulse text-lg font-semibold text-texto-2">🤔…</p>
      )}
    </div>
  );
}

// ── Resultado ──────────────────────────────────────────────────────
const BANNER = {
  civiles: { emoji: '🕵️', texto: t.resultado.gananCiviles, color: 'var(--verde)', confeti: ['#34d399', '#a7f3d0', '#10b981'] },
  mentirosos: { emoji: '🤥', texto: t.resultado.gananMentirosos, color: 'var(--rojo)', confeti: ['#f87171', '#fca5a5', '#ef4444'] },
  payaso: { emoji: '🤡', texto: t.resultado.ganaPayaso, color: 'var(--ambar)', confeti: ['#fbbf24', '#fde68a', '#f59e0b'] },
} as const;

export function ResultadoOnline({ partida, esHost }: PropsFase) {
  const { estado, reiniciar, empezar } = useSala();
  const resultado = partida.resultado;
  if (!resultado) return null;
  const banner = BANNER[resultado.ganador];
  const marcador = estado?.marcador ?? {};

  useEffect(() => {
    sfx.exito();
    void lanzarConfeti([...banner.confeti]);
  }, []);

  const clasificacion = [...partida.jugadores].sort((a, b) => (marcador[b.id] ?? 0) - (marcador[a.id] ?? 0));

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center gap-5 px-4 py-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10"
          style={{
            background: `radial-gradient(42rem 32rem at 50% 20%, color-mix(in srgb, ${banner.color} 18%, transparent), transparent 70%)`,
          }}
        />
        <span className="anim-pop">
          <Emoji3D e={banner.emoji} tam={110} className="drop-shadow-2xl" />
        </span>
        <h2 className="anim-aparecer text-4xl font-black text-balance" style={{ color: banner.color }}>{banner.texto}</h2>
        {resultado.porAdivinanza && partida.ultimaAdivinanza && (
          <p className="font-semibold text-texto-2">🎯 {t.resultado.porAdivinanza}: «{partida.ultimaAdivinanza.texto}»</p>
        )}
        <p className="text-lg">
          {t.resultado.elSecretoEra} <b className="text-2xl">{partida.palabraCivil}</b>
        </p>
      </div>

      <Panel className="w-full">
        <h3 className="mb-3 text-sm font-bold tracking-wide uppercase text-texto-2">{t.resultado.rolesDeTodos}</h3>
        <ul className="flex flex-col gap-2">
          {partida.jugadores.map((j, i) => (
            <li key={j.id} className="anim-aparecer flex items-center gap-3" style={{ animationDelay: `${150 + i * 70}ms` }}>
              <Avatar emoji={j.emoji} color={j.color} tam="sm" atenuado={!j.vivo} />
              <span className={clases('flex-1 truncate font-semibold', !j.vivo && 'line-through opacity-60')}>{j.nombre}</span>
              <span className="text-sm font-bold" style={{ color: COLOR_ROL[j.rol] }}>
                {es.roles[j.rol]}
                {j.rol === 'infiltrado' && j.palabra ? ` («${j.palabra}»)` : ''}
              </span>
              <span className={clases('tabular w-12 text-right font-black', (resultado.puntos[j.id] ?? 0) > 0 ? 'text-verde' : 'text-texto-2/50')}>
                +{resultado.puntos[j.id] ?? 0}
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel className="w-full">
        <h3 className="mb-3 text-sm font-bold tracking-wide uppercase text-texto-2">🏆 {t.resultado.marcador}</h3>
        <ul className="flex flex-col gap-2">
          {clasificacion.map((j, i) => (
            <li key={j.id} className="anim-aparecer flex items-center gap-3" style={{ animationDelay: `${300 + i * 70}ms` }}>
              <span className="tabular grid w-6 place-items-center text-center text-sm font-bold text-texto-2">
                {i === 0 ? <Emoji3D e="👑" tam={20} /> : i + 1}
              </span>
              <Avatar emoji={j.emoji} color={j.color} tam="sm" />
              <span className="flex-1 truncate font-semibold">{j.nombre}</span>
              <span className="tabular font-black">{marcador[j.id] ?? 0}</span>
            </li>
          ))}
        </ul>
      </Panel>

      {esHost ? (
        <div className="flex w-full max-w-sm flex-col gap-2">
          <Boton
            grande
            onClick={() => {
              reiniciar();
              setTimeout(empezar, 150);
            }}
          >
            🔁 {t.resultado.otraRonda}
          </Boton>
          <Boton variante="secundario" onClick={reiniciar}>
            🛋️ {t.online.volverAlLobby}
          </Boton>
        </div>
      ) : (
        <p className="text-sm text-texto-2">{t.online.anfitrionContinua}</p>
      )}
    </div>
  );
}
