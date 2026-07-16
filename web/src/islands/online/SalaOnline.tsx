import { es, PACKS } from '@mentiroso/shared';
import { useEffect, useRef, useState } from 'react';
import { Emoji3D } from '../../components/Emoji3D';
import { AjustesPartida, SelectorModo, SelectorPacks } from '../../components/juego/AjustesPartida';
import { MenuPartida } from '../../components/juego/MenuPartida';
import { Avatar, Boton, clases, Insignia, Panel } from '../../components/ui';
import { sfx } from '../../lib/sfx';
import { t } from '../../lib/textos';
import { useSala } from '../../stores/sala';
import {
  AdivinanzaOnline,
  DebateOnline,
  PistasOnline,
  RepartoOnline,
  ResultadoOnline,
  RevelacionOnline,
  VotacionOnline,
} from './FasesOnline';

function codigoDeUrl(): string {
  return new URLSearchParams(location.search).get('c')?.toUpperCase() ?? '';
}

// ── Chat flotante ──────────────────────────────────────────────────
function ChatSala() {
  const { chat, enviarChat, noLeidos, marcarChatLeido, estado } = useSala();
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (abierto) {
      marcarChatLeido();
      finRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
    }
  }, [abierto, chat.length]);

  return (
    <>
      <button
        type="button"
        aria-label={t.online.chat}
        onClick={() => {
          sfx.click();
          setAbierto(!abierto);
        }}
        className="tactil fixed right-4 bottom-4 z-30 grid size-14 place-items-center rounded-full border border-borde bg-superficie shadow-lg"
      >
        <Emoji3D e="💬" tam={30} />
        {noLeidos > 0 && !abierto && (
          <span className="tabular absolute -top-1 -right-1 grid min-w-6 place-items-center rounded-full bg-rojo px-1.5 py-0.5 text-xs font-black text-white">
            {noLeidos}
          </span>
        )}
      </button>

      {abierto && (
        <div className="fixed right-4 bottom-20 z-30 flex h-96 w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-3xl border border-borde bg-superficie shadow-2xl">
          <p className="border-b border-borde px-4 py-2 text-sm font-bold">{t.online.chat}</p>
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
            {chat.map((m, i) => {
              const mio = m.deId === estado?.tuId;
              return (
                <div key={i} className={clases('max-w-[85%] rounded-2xl px-3 py-1.5 text-sm', mio ? 'self-end bg-brand-suave' : 'self-start bg-superficie-2')}>
                  {!mio && (
                    <span className="mr-1 font-bold">
                      {m.emoji} {m.de}:
                    </span>
                  )}
                  {m.texto}
                </div>
              );
            })}
            <div ref={finRef} />
          </div>
          <form
            className="flex gap-2 border-t border-borde p-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (texto.trim()) {
                enviarChat(texto);
                setTexto('');
              }
            }}
          >
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={t.online.escribeMensaje}
              maxLength={200}
              aria-label={t.online.escribeMensaje}
              className="min-h-11 w-0 flex-1 rounded-xl border border-borde bg-superficie-2 px-3 text-sm font-medium outline-none focus:border-brand"
            />
            <Boton type="submit" silencioso disabled={!texto.trim()}>→</Boton>
          </form>
        </div>
      )}
    </>
  );
}

// ── QR del enlace de la sala ───────────────────────────────────────
function QrSala({ codigo }: { codigo: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelado = false;
    void import('qrcode').then(async ({ default: QRCode }) => {
      const url = await QRCode.toDataURL(`${location.origin}/sala?c=${codigo}`, {
        margin: 1,
        width: 176,
        color: { dark: '#1c1030', light: '#ffffff' },
      });
      if (!cancelado) setDataUrl(url);
    });
    return () => {
      cancelado = true;
    };
  }, [codigo]);
  if (!dataUrl) return <div className="size-36 rounded-2xl bg-superficie-2" aria-hidden />;
  return (
    <img
      src={dataUrl}
      alt={`Código QR para unirse a la sala ${codigo}`}
      className="size-36 rounded-2xl border border-borde bg-white p-1.5"
    />
  );
}

// ── Lobby ──────────────────────────────────────────────────────────
function Lobby() {
  const { estado, setConfig, empezar, expulsar, salir, error, limpiarError } = useSala();
  const [copiado, setCopiado] = useState(false);
  if (!estado) return null;
  const yo = estado.miembros.find((m) => m.id === estado.tuId);
  const esHost = !!yo?.esHost;
  const conectados = estado.miembros.filter((m) => m.conectado);

  async function copiarEnlace() {
    try {
      await navigator.clipboard.writeText(`${location.origin}/sala?c=${estado!.codigo}`);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {}
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 pt-4 pb-28">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">{t.online.sala}</h1>
          <p className="text-sm text-texto-2">{t.online.compartir}</p>
        </div>
        <Boton variante="fantasma" onClick={() => { salir(); location.href = '/online'; }}>
          {t.comunes.salir}
        </Boton>
      </header>

      <Panel className="flex flex-col items-center gap-3">
        <p className="font-mono text-5xl font-black tracking-[0.35em]">{estado.codigo}</p>
        <QrSala codigo={estado.codigo} />
        <Boton variante="secundario" onClick={copiarEnlace}>
          {copiado ? `✅ ${t.online.copiado}` : `🔗 ${t.online.copiarEnlace}`}
        </Boton>
      </Panel>

      <Panel>
        <h2 className="mb-3 text-lg font-bold">
          {t.comunes.jugadores} <span className="tabular text-texto-2">({conectados.length})</span>
        </h2>
        <ul className="flex flex-col gap-2">
          {estado.miembros.map((m) => (
            <li key={m.id} className="flex min-h-11 items-center gap-3 rounded-2xl bg-superficie-2 px-3 py-1.5">
              <Avatar emoji={m.emoji} color={m.color} tam="sm" atenuado={!m.conectado} />
              <span className={clases('flex-1 truncate font-semibold', !m.conectado && 'opacity-50')}>
                {m.nombre} {m.id === estado.tuId && '(tú)'}
              </span>
              {m.esHost && <Insignia color="var(--ambar)">👑 {t.online.anfitrion}</Insignia>}
              {esHost && !m.esHost && (
                <button
                  type="button"
                  aria-label={`${t.online.expulsar} ${m.nombre}`}
                  onClick={() => expulsar(m.id)}
                  className="tactil grid size-10 place-items-center rounded-xl text-texto-2 hover:bg-rojo/10 hover:text-rojo"
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
        {conectados.length < 3 && <p className="mt-2 text-sm font-medium text-ambar">{t.online.faltanJugadores}</p>}
      </Panel>

      <Panel>
        <h2 className="mb-3 text-lg font-bold">{t.local.elegirModo}</h2>
        {!esHost && <p className="mb-2 text-sm text-texto-2">{t.online.soloAnfitrion}</p>}
        <div className={clases(!esHost && 'pointer-events-none opacity-70')}>
          <SelectorModo modo={estado.config.modo} onElegir={(m) => setConfig({ modoPreset: m })} />
        </div>
      </Panel>

      <Panel>
        <h2 className="mb-3 text-lg font-bold">{t.local.packsTitulo}</h2>
        <div className={clases(!esHost && 'pointer-events-none opacity-70')}>
          <SelectorPacks packs={PACKS} seleccion={estado.config.packIds} onCambio={(packIds) => setConfig({ packIds })} />
        </div>
      </Panel>

      <Panel>
        <h2 className="mb-1 text-lg font-bold">{t.local.ajustesTitulo}</h2>
        <AjustesPartida config={estado.config} numJugadores={conectados.length} onCambio={setConfig} soloLectura={!esHost} />
      </Panel>

      <div className="fixed inset-x-0 bottom-0 border-t border-borde bg-superficie/90 p-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-xl flex-col gap-2">
          {error && (
            <p role="alert" className="text-center text-sm font-semibold text-rojo">
              {es.errores[error as keyof typeof es.errores] ?? error}
            </p>
          )}
          {esHost ? (
            <Boton grande disabled={conectados.length < 3} onClick={() => { limpiarError(); empezar(); }}>
              🎴 {t.online.empezarPartida}
            </Boton>
          ) : (
            <p className="text-center font-semibold text-texto-2 animate-pulse">
              ⌛ {t.online.esperandoJugadores}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Página de la sala ──────────────────────────────────────────────
export default function SalaOnline() {
  const { estado, conectado, uniendo, reconectar, expulsado, salir } = useSala();
  const [nombre, setNombre] = useState('');
  const [sinSesion, setSinSesion] = useState(false);
  const codigo = typeof location !== 'undefined' ? codigoDeUrl() : '';

  useEffect(() => {
    if (!codigo) {
      location.href = '/online';
      return;
    }
    void reconectar(codigo).then((ok) => {
      if (!ok) setSinSesion(true);
    });
  }, []);

  // sin sesión previa: pedir nombre para unirse
  if (!estado && sinSesion) {
    return <FormularioUnirse codigo={codigo} nombre={nombre} setNombre={setNombre} />;
  }

  if (expulsado) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="text-5xl" aria-hidden>🚪</span>
        <p className="text-xl font-bold">👋</p>
        <Boton onClick={() => (location.href = '/online')}>{t.comunes.volver}</Boton>
      </div>
    );
  }

  if (!estado) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="animate-pulse text-lg font-semibold text-texto-2">{uniendo ? '🔄' : '⌛'} …</p>
      </div>
    );
  }

  const yo = estado.miembros.find((m) => m.id === estado.tuId);
  const esHost = !!yo?.esHost;
  const partida = estado.partida;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col">
      {!conectado && (
        <p className="bg-ambar/15 px-4 py-2 text-center text-sm font-bold text-ambar">
          📡 {t.online.desconectado}
        </p>
      )}

      {!partida ? (
        <Lobby />
      ) : (
        <>
          <header className="flex items-center justify-between gap-2 px-4 py-3">
            <MenuPartida
              textoAbandonar="Salir de la sala"
              onAbandonar={() => {
                salir();
                location.href = '/online';
              }}
            />
            <Insignia>{es.fases[partida.fase]}</Insignia>
            {partida.config.mostrarCategoria && partida.fase !== 'resultado' && partida.categoria ? (
              <Insignia color="var(--brand)">{partida.categoria}</Insignia>
            ) : (
              <Insignia>{estado.codigo}</Insignia>
            )}
          </header>

          {/* remontar por fase: la clase anim-aparecer da la transición de entrada */}
          <div
            key={`${partida.fase}-${partida.votacionNum}-${partida.empatesEnVotacion}`}
            className="anim-aparecer flex flex-1 flex-col"
          >
            {partida.fase === 'reparto' && <RepartoOnline partida={partida} tuId={estado.tuId} esHost={esHost} />}
            {partida.fase === 'pistas' && <PistasOnline partida={partida} tuId={estado.tuId} esHost={esHost} />}
            {partida.fase === 'debate' && <DebateOnline partida={partida} tuId={estado.tuId} esHost={esHost} />}
            {partida.fase === 'votacion' && <VotacionOnline partida={partida} tuId={estado.tuId} esHost={esHost} />}
            {partida.fase === 'revelacion' && <RevelacionOnline partida={partida} tuId={estado.tuId} esHost={esHost} />}
            {partida.fase === 'adivinanza' && <AdivinanzaOnline partida={partida} tuId={estado.tuId} esHost={esHost} />}
            {partida.fase === 'resultado' && <ResultadoOnline partida={partida} tuId={estado.tuId} esHost={esHost} />}
          </div>
        </>
      )}

      <ChatSala />
    </div>
  );
}

function FormularioUnirse({ codigo, nombre, setNombre }: { codigo: string; nombre: string; setNombre: (v: string) => void }) {
  const { unir, error, uniendo } = useSala();
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-5 px-4">
      <header className="text-center">
        <p className="font-mono text-4xl font-black tracking-[0.3em]">{codigo}</p>
        <p className="mt-1 text-texto-2">{t.online.tuNombre}</p>
      </header>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (nombre.trim()) void unir(codigo, nombre.trim());
        }}
      >
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder={t.local.nombrePlaceholder}
          maxLength={18}
          autoFocus
          aria-label={t.online.tuNombre}
          className="min-h-14 rounded-2xl border border-borde bg-superficie px-4 text-center text-xl font-bold outline-none focus:border-brand"
        />
        <Boton grande type="submit" disabled={!nombre.trim() || uniendo}>
          {t.online.unirse} →
        </Boton>
        {error && (
          <p role="alert" className="text-center font-semibold text-rojo">
            {es.errores[error as keyof typeof es.errores] ?? error}
          </p>
        )}
      </form>
    </div>
  );
}
