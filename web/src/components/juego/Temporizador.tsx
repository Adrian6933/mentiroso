import { useEffect, useRef, useState } from 'react';
import { sfx } from '../../lib/sfx';
import { clases } from '../ui';

/**
 * Cuenta atrás circular. `clave` reinicia el temporizador al cambiar.
 * Con 0 segundos no se renderiza nada (sin límite).
 */
export function Temporizador({
  segundos,
  clave,
  onFin,
  pausado = false,
  grande = false,
}: {
  segundos: number;
  clave: string | number;
  onFin?: () => void;
  pausado?: boolean;
  /** versión grande para el debate, con formato m:ss */
  grande?: boolean;
}) {
  const [restante, setRestante] = useState(segundos);
  const finRef = useRef(onFin);
  finRef.current = onFin;

  useEffect(() => {
    setRestante(segundos);
    if (segundos <= 0 || pausado) return;
    const inicio = Date.now();
    const intervalo = setInterval(() => {
      const quedan = Math.max(0, segundos - Math.floor((Date.now() - inicio) / 1000));
      setRestante((prev) => {
        if (quedan !== prev && quedan <= 3 && quedan > 0) sfx.tick();
        return quedan;
      });
      if (quedan <= 0) {
        clearInterval(intervalo);
        finRef.current?.();
      }
    }, 250);
    return () => clearInterval(intervalo);
  }, [clave, segundos, pausado]);

  if (segundos <= 0) return null;

  const progreso = restante / segundos;
  const critico = restante <= 5;
  const r = 26;
  const circunferencia = 2 * Math.PI * r;
  const texto =
    segundos >= 60 ? `${Math.floor(restante / 60)}:${String(restante % 60).padStart(2, '0')}` : `${restante}`;

  return (
    <div
      className={clases('relative grid place-items-center', grande ? 'size-36' : 'size-16')}
      role="timer"
      aria-label={`${restante} segundos`}
    >
      <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--borde)" strokeWidth={grande ? 3.5 : 5} />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={critico ? 'var(--rojo)' : 'var(--brand)'}
          strokeWidth={grande ? 3.5 : 5}
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={circunferencia * (1 - progreso)}
          style={{ transition: 'stroke-dashoffset 250ms linear, stroke 250ms' }}
        />
      </svg>
      <span
        className={clases('tabular font-black', grande ? 'text-4xl' : 'text-lg', critico && 'text-rojo animate-pulse')}
      >
        {texto}
      </span>
    </div>
  );
}
