import { useState } from 'react';
import { sfx } from '../../lib/sfx';
import { useAjustes } from '../../stores/ajustes';
import { Emoji3D } from '../Emoji3D';
import { Boton, clases, Interruptor, Segmentos } from '../ui';

/**
 * Menú de pausa dentro de la partida: ajustes rápidos, reglas y salida
 * con confirmación en dos toques (sin diálogos feos del navegador).
 */
export function MenuPartida({
  textoAbandonar,
  onAbandonar,
}: {
  textoAbandonar: string;
  onAbandonar: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const a = useAjustes();

  function cerrar() {
    setAbierto(false);
    setConfirmando(false);
  }

  return (
    <>
      <button
        type="button"
        aria-label="Menú de partida"
        aria-expanded={abierto}
        onClick={() => {
          sfx.click();
          setAbierto(true);
        }}
        className="tactil grid size-11 place-items-center rounded-xl border border-borde bg-superficie/75 backdrop-blur-md hover:border-brand/50"
      >
        <Emoji3D e="⚙️" tam={22} />
      </button>

      {abierto && (
        <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={cerrar}
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
          />
          <div className="anim-aparecer relative z-10 flex w-full max-w-md flex-col gap-4 rounded-t-[28px] border border-borde bg-superficie p-6 pb-8 shadow-2xl sm:rounded-[28px] sm:pb-6">
            <div className="mx-auto h-1.5 w-12 rounded-full bg-borde sm:hidden" aria-hidden />
            <h2 className="text-center text-xl font-black">Menú</h2>

            <div className="flex flex-col gap-1">
              <Interruptor activo={a.sonidos} onCambio={a.setSonidos} etiqueta="🔊 Sonidos" />
              <Interruptor activo={a.vibracion} onCambio={a.setVibracion} etiqueta="📳 Vibración" />
              <div className="mt-1">
                <Segmentos
                  opciones={[
                    { valor: 'oscuro', etiqueta: '🌙 Noche' },
                    { valor: 'claro', etiqueta: '☀️ Día' },
                  ]}
                  valor={a.tema === 'claro' ? 'claro' : 'oscuro'}
                  onCambio={a.setTema}
                  ariaLabel="Tema"
                />
              </div>
            </div>

            <a
              href="/como-jugar"
              target="_blank"
              rel="noreferrer"
              className="tactil flex min-h-12 items-center justify-between rounded-2xl border border-borde bg-superficie-2 px-4 font-semibold hover:border-brand/50"
            >
              <span className="flex items-center gap-2">
                <Emoji3D e="❓" tam={20} /> Cómo se juega
              </span>
              <span aria-hidden className="text-texto-2">↗</span>
            </a>

            <div className="flex flex-col gap-2">
              <Boton
                variante="peligro"
                className={clases(confirmando && 'ring-2 ring-rojo')}
                onClick={() => {
                  if (!confirmando) {
                    setConfirmando(true);
                    return;
                  }
                  cerrar();
                  onAbandonar();
                }}
              >
                {confirmando ? '¿Seguro? Toca otra vez para salir' : `🚪 ${textoAbandonar}`}
              </Boton>
              <Boton onClick={cerrar}>Seguir jugando</Boton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
