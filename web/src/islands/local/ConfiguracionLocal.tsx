import { es, type GameConfig, type ModoJuego } from '@mentiroso/shared';
import { useState } from 'react';
import { AjustesPartida, SelectorModo, SelectorPacks } from '../../components/juego/AjustesPartida';
import { Avatar, Boton, clases, Panel } from '../../components/ui';
import { sfx } from '../../lib/sfx';
import { t } from '../../lib/textos';
import { todosLosPacks, usePartidaLocal } from '../../stores/partidaLocal';

/** Presets de un toque: modo + tiempos, para empezar sin bucear en ajustes. */
const PRESETS: {
  id: string;
  emoji: string;
  nombre: string;
  desc: string;
  modo: ModoJuego;
  extra: Partial<GameConfig>;
}[] = [
  {
    id: 'rapida',
    emoji: '⚡',
    nombre: 'Rápida',
    desc: '1 ronda, tiempos cortos',
    modo: 'clasico',
    extra: { rondasDePistas: 1, segundosPista: 15, segundosDebate: 60, segundosVotacion: 30 },
  },
  {
    id: 'clasica',
    emoji: '🎯',
    nombre: 'Clásica',
    desc: 'Sin prisas, debate largo',
    modo: 'clasico',
    extra: { rondasDePistas: 2, segundosPista: 0, segundosDebate: 240, segundosVotacion: 0 },
  },
  {
    id: 'caos',
    emoji: '🌀',
    nombre: 'Caos total',
    desc: 'Roles ocultos y eliminación',
    modo: 'caos',
    extra: { rondasDePistas: 2, segundosPista: 30, segundosDebate: 120, segundosVotacion: 45 },
  },
];

export function ConfiguracionLocal() {
  const { jugadores, config, error, anadirJugador, quitarJugador, cambiarAvatar, setConfig, elegirModo, empezar, limpiarError } =
    usePartidaLocal();
  const [nombre, setNombre] = useState('');
  const [presetActivo, setPresetActivo] = useState<string | null>(null);

  function aplicarPreset(p: (typeof PRESETS)[number]) {
    sfx.click();
    elegirModo(p.modo);
    setConfig(p.extra);
    setPresetActivo(p.id);
  }

  function enviarNombre() {
    if (nombre.trim()) {
      anadirJugador(nombre);
      setNombre('');
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 pt-4 pb-28">
      <header className="flex items-center justify-between w-full mb-1">
        <a
          href="/"
          className="tactil flex size-10 items-center justify-center rounded-full bg-superficie border border-borde/30 shadow-md text-lg text-texto hover:bg-superficie-2/80"
          aria-label="Volver"
        >
          ←
        </a>
        <span className="font-black text-texto text-base">Partida Local</span>
        <div className="size-10"></div>
      </header>

      <div>
        <h1 className="text-2xl font-black">{t.local.titulo}</h1>
        <p className="text-sm text-texto-2">{t.local.subtitulo}</p>
      </div>

      {/* jugadores */}
      <Panel>
        <h2 className="mb-3 text-lg font-bold">
          {t.comunes.jugadores}{' '}
          <span className="tabular text-texto-2">({jugadores.length})</span>
        </h2>
        <div className="flex flex-col gap-2">
          {jugadores.map((j) => (
            <div key={j.id} className="flex items-center gap-3 rounded-2xl bg-superficie-2 px-3 py-2">
              <button
                type="button"
                aria-label={`Cambiar avatar de ${j.nombre}`}
                title="Toca para cambiar el avatar"
                onClick={() => cambiarAvatar(j.id)}
                className="tactil rounded-full"
              >
                <Avatar emoji={j.emoji} color={j.color} tam="sm" />
              </button>
              <span className="flex-1 truncate font-semibold">{j.nombre}</span>
              <button
                type="button"
                aria-label={`Quitar a ${j.nombre}`}
                onClick={() => quitarJugador(j.id)}
                className="tactil grid size-10 place-items-center rounded-xl text-texto-2 hover:bg-rojo/10 hover:text-rojo"
              >
                ✕
              </button>
            </div>
          ))}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              enviarNombre();
            }}
          >
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={t.local.nombrePlaceholder}
              maxLength={18}
              enterKeyHint="done"
              aria-label={t.local.anadirJugador}
              className="min-h-12 flex-1 rounded-2xl border border-borde bg-superficie-2 px-4 font-semibold outline-none placeholder:text-texto-2/60 focus:border-brand"
            />
            <Boton type="submit" variante="secundario" disabled={!nombre.trim()}>
              + {t.local.anadirJugador}
            </Boton>
          </form>
          {jugadores.length < 3 && (
            <p className="text-sm font-medium text-ambar">{t.local.minJugadores}</p>
          )}
          <p className="text-xs text-texto-2">{t.local.grupoGuardado}</p>
        </div>
      </Panel>

      {/* presets de un toque */}
      <Panel>
        <h2 className="mb-3 text-lg font-bold">{t.local.presetsTitulo}</h2>
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={presetActivo === p.id}
              onClick={() => aplicarPreset(p)}
              className={clases(
                'tactil flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-center',
                presetActivo === p.id
                  ? 'border-brand bg-brand-suave shadow-md shadow-brand/15'
                  : 'border-borde bg-superficie-2 hover:border-brand/50',
              )}
            >
              <span className="text-2xl" aria-hidden>{p.emoji}</span>
              <span className="text-sm font-extrabold">{p.nombre}</span>
              <span className="text-[11px] leading-tight text-texto-2">{p.desc}</span>
            </button>
          ))}
        </div>
      </Panel>

      {/* modo */}
      <Panel>
        <h2 className="mb-3 text-lg font-bold">{t.local.elegirModo}</h2>
        <SelectorModo
          modo={config.modo}
          onElegir={(m) => {
            setPresetActivo(null);
            elegirModo(m);
          }}
        />
      </Panel>

      {/* packs */}
      <Panel>
        <h2 className="mb-3 text-lg font-bold">{t.local.packsTitulo}</h2>
        <SelectorPacks
          packs={todosLosPacks()}
          seleccion={config.packIds}
          onCambio={(packIds) => setConfig({ packIds })}
        />
      </Panel>

      {/* ajustes */}
      <Panel>
        <h2 className="mb-1 text-lg font-bold">{t.local.ajustesTitulo}</h2>
        <AjustesPartida config={config} numJugadores={jugadores.length} onCambio={setConfig} />
      </Panel>

      {/* barra inferior fija */}
      <div className="fixed inset-x-0 bottom-0 border-t border-borde bg-superficie/90 p-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-xl flex-col gap-2">
          {error && (
            <p role="alert" className="text-center text-sm font-semibold text-rojo">
              {es.errores[error as keyof typeof es.errores] ?? error}
            </p>
          )}
          <Boton
            grande
            disabled={jugadores.length < 3}
            onClick={() => {
              limpiarError();
              empezar();
            }}
          >
            🎴 {t.local.empezarPartida}
          </Boton>
        </div>
      </div>
    </div>
  );
}
