import { es } from '@mentiroso/shared';
import { useState } from 'react';
import { Emoji3D } from '../../components/Emoji3D';
import { Boton, Panel } from '../../components/ui';
import { t } from '../../lib/textos';
import { useSala } from '../../stores/sala';

export default function OnlineHome() {
  const { crear, unir, uniendo, error, limpiarError } = useSala();
  const [nombre, setNombre] = useState(() => localStorage.getItem('mentiroso-nombre') ?? '');
  const [codigo, setCodigo] = useState('');

  async function crearSala() {
    limpiarError();
    const c = await crear(nombre.trim());
    if (c) location.href = `/sala?c=${c}`;
  }

  async function unirse() {
    limpiarError();
    const c = await unir(codigo.trim().toUpperCase(), nombre.trim());
    if (c) location.href = `/sala?c=${c}`;
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-8">
      <header className="flex items-center justify-between w-full mb-1">
        <a
          href="/"
          className="tactil flex size-10 items-center justify-center rounded-full bg-superficie border border-borde/30 shadow-md text-lg text-texto hover:bg-superficie-2/80"
          aria-label="Volver"
        >
          ←
        </a>
        <span className="font-black text-texto text-base">Partida Online</span>
        <div className="size-10"></div>
      </header>

      <div className="flex flex-col items-center gap-2 text-center">
        <span className="anim-flotar">
          <Emoji3D e="🌐" tam={88} className="drop-shadow-xl" />
        </span>
        <h1 className="text-3xl font-black">{t.online.titulo}</h1>
        <p className="text-texto-2">{t.online.subtitulo}</p>
      </div>

      <Panel>
        <label className="mb-1 block text-sm font-bold text-texto-2" htmlFor="nombre-online">
          {t.online.tuNombre}
        </label>
        <input
          id="nombre-online"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder={t.local.nombrePlaceholder}
          maxLength={18}
          className="min-h-13 w-full rounded-2xl border border-borde bg-superficie-2 px-4 text-lg font-semibold outline-none focus:border-brand"
        />
      </Panel>

      <Boton grande disabled={!nombre.trim() || uniendo} onClick={crearSala}>
        ✨ {t.online.crearSala}
      </Boton>

      <div className="flex items-center gap-3 text-texto-2">
        <span className="h-px flex-1 bg-borde" aria-hidden />
        <span className="text-sm font-bold">o</span>
        <span className="h-px flex-1 bg-borde" aria-hidden />
      </div>

      <Panel>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (nombre.trim() && codigo.trim()) void unirse();
          }}
        >
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder={t.online.codigoPlaceholder}
            maxLength={4}
            aria-label={t.online.codigoPlaceholder}
            className="min-h-13 w-0 flex-1 rounded-2xl border border-borde bg-superficie-2 px-4 text-center font-mono text-xl font-black tracking-[0.3em] uppercase outline-none focus:border-brand"
          />
          <Boton type="submit" variante="secundario" disabled={!nombre.trim() || codigo.trim().length < 4 || uniendo}>
            {t.online.unirse} →
          </Boton>
        </form>
      </Panel>

      {error && (
        <p role="alert" className="text-center font-semibold text-rojo">
          {es.errores[error as keyof typeof es.errores] ?? error}
        </p>
      )}
    </div>
  );
}
