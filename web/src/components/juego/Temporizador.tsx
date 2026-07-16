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
}: {
  segundos: number;
  clave: string | number;
  onFin?: () => void;
  pausado?: boolean;
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

  return (
    <div className="relative grid size-16 place-items-center" role="timer" aria-label={`${restante} segundos`}>
      <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--borde)" strokeWidth="5" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={critico ? 'var(--rojo)' : 'var(--brand)'}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={circunferencia * (1 - progreso)}
          style={{ transition: 'stroke-dashoffset 250ms linear, stroke 250ms' }}
        />
      </svg>
      <span className={clases('tabular text-lg font-black', critico && 'text-rojo animate-pulse')}>
        {restante}
      </span>
    </div>
  );
}
