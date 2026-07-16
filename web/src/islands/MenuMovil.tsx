import { useState } from 'react';
import { Emoji3D } from '../components/Emoji3D';
import { sfx } from '../lib/sfx';

const ENLACES = [
  { href: '/local', texto: 'Jugar en local', img: '📱' },
  { href: '/online', texto: 'Jugar online', img: '🌐' },
  { href: '/packs', texto: 'Packs', img: '📦' },
  { href: '/como-jugar', texto: 'Cómo jugar', img: '❓' },
  { href: '/ajustes', texto: 'Ajustes', img: '⚙️' },
];

/** Menú de navegación para móvil (la cabecera solo muestra enlaces en escritorio). */
export default function MenuMovil() {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        aria-label="Abrir menú"
        aria-expanded={abierto}
        onClick={() => {
          sfx.click();
          setAbierto(!abierto);
        }}
        className="tactil grid size-11 place-items-center rounded-xl border border-borde bg-superficie text-xl hover:border-brand/50"
      >
        {abierto ? '✕' : '☰'}
      </button>

      {abierto && (
        <div className="fixed inset-x-0 top-[61px] z-30">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setAbierto(false)}
            className="fixed inset-0 bg-black/45 backdrop-blur-sm"
          />
          <nav
            aria-label="Menú móvil"
            className="anim-aparecer relative mx-3 mt-2 flex flex-col gap-1 rounded-3xl border border-borde bg-superficie p-3 shadow-2xl"
          >
            {ENLACES.map((e) => (
              <a
                key={e.href}
                href={e.href}
                className="tactil flex min-h-12 items-center gap-3 rounded-2xl px-3 font-semibold hover:bg-superficie-2"
              >
                <Emoji3D e={e.img} tam={26} />
                {e.texto}
              </a>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
