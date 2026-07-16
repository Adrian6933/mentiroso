import { useEffect, useState } from 'react';
import { useAjustes } from '../stores/ajustes';
import { sfx } from '../lib/sfx';

/** Conmutador día/noche. */
export default function BotonTema() {
  const { tema, setTema } = useAjustes();
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);
  if (!montado) return <span className="inline-block size-11" aria-hidden />;

  const oscuroActivo =
    tema === 'oscuro' || (tema === 'sistema' && matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <button
      type="button"
      aria-label={oscuroActivo ? 'Cambiar a modo día' : 'Cambiar a modo noche'}
      onClick={() => {
        sfx.click();
        setTema(oscuroActivo ? 'claro' : 'oscuro');
      }}
      className="tactil grid size-10 place-items-center rounded-full border border-borde/30 bg-superficie/80 text-lg shadow-md hover:bg-superficie-2/80"
    >
      {oscuroActivo ? '☀️' : '🌙'}
    </button>
  );
}
