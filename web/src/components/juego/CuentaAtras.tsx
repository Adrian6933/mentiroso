import { useEffect, useRef, useState } from 'react';
import { sfx } from '../../lib/sfx';
import { vibrar } from '../../stores/ajustes';
import { Emoji3D } from '../Emoji3D';
import { clases } from '../ui';

/**
 * Cuenta atrás a pantalla de fase (3… 2… 1…) estilo app de referencia.
 * `calido` pinta el título en amarillo cálido (pistas); sin él va en blanco/texto.
 */
export function CuentaAtras({
  titulo,
  subtitulo,
  emoji,
  desde = 3,
  calido = false,
  onFin,
}: {
  titulo: string;
  subtitulo?: string;
  emoji?: string;
  desde?: number;
  calido?: boolean;
  onFin: () => void;
}) {
  const [n, setN] = useState(desde);
  const finRef = useRef(onFin);
  finRef.current = onFin;

  useEffect(() => {
    sfx.tick();
    vibrar(20);
    const timer = setTimeout(() => {
      if (n <= 1) finRef.current();
      else setN(n - 1);
    }, 900);
    return () => clearTimeout(timer);
  }, [n]);

  return (
    <div
      role="status"
      aria-label={`${titulo} ${n}`}
      className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center select-none"
    >
      {emoji && <Emoji3D e={emoji} tam={88} className="anim-flotar drop-shadow-xl" />}
      <p className={clases('text-3xl font-black text-balance', calido && 'texto-calido')}>{titulo}</p>
      {subtitulo && (
        <p className={clases('text-2xl font-black', calido ? 'texto-calido' : 'text-texto-2')}>{subtitulo}</p>
      )}
      <span key={n} className="anim-pop tabular text-[7rem] leading-none font-black">
        {n}
      </span>
    </div>
  );
}
