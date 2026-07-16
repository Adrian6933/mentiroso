import { es, type GameState } from '@mentiroso/shared';
import { useEffect } from 'react';
import { Emoji3D } from '../../components/Emoji3D';
import { Avatar, Boton, clases, Panel } from '../../components/ui';
import { COLOR_ROL } from '../../lib/carta';
import { lanzarConfeti } from '../../lib/confeti';
import { sfx } from '../../lib/sfx';
import { t } from '../../lib/textos';
import { usePartidaLocal } from '../../stores/partidaLocal';

const BANNER = {
  civiles: { emoji: '🕵️', texto: t.resultado.gananCiviles, color: 'var(--verde)', confeti: ['#34d399', '#a7f3d0', '#10b981'] },
  mentirosos: { emoji: '🤥', texto: t.resultado.gananMentirosos, color: 'var(--rojo)', confeti: ['#f87171', '#fca5a5', '#ef4444'] },
  payaso: { emoji: '🤡', texto: t.resultado.ganaPayaso, color: 'var(--ambar)', confeti: ['#fbbf24', '#fde68a', '#f59e0b'] },
} as const;

export function ResultadoLocal({ partida }: { partida: GameState }) {
  const { marcador, reiniciar, empezar } = usePartidaLocal();
  const resultado = partida.resultado;
  if (!resultado) return null;
  const banner = BANNER[resultado.ganador];

  useEffect(() => {
    sfx.exito();
    void lanzarConfeti([...banner.confeti]);
  }, []);

  const clasificacion = [...partida.jugadores].sort(
    (a, b) => (marcador[b.id] ?? 0) - (marcador[a.id] ?? 0),
  );

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
        <h2 className="anim-aparecer text-4xl font-black text-balance" style={{ color: banner.color }}>
          {banner.texto}
        </h2>
        {resultado.porAdivinanza && partida.ultimaAdivinanza && (
          <p className="font-semibold text-texto-2">
            🎯 {t.resultado.porAdivinanza}: «{partida.ultimaAdivinanza.texto}»
          </p>
        )}
        <p className="text-lg">
          {t.resultado.elSecretoEra} <b className="text-2xl">{partida.palabraCivil}</b>
        </p>
      </div>

      {/* roles y puntos de la partida */}
      <Panel className="w-full">
        <h3 className="mb-3 text-sm font-bold tracking-wide uppercase text-texto-2">
          {t.resultado.rolesDeTodos}
        </h3>
        <ul className="flex flex-col gap-2">
          {partida.jugadores.map((j, i) => (
            <li key={j.id} className="anim-aparecer flex items-center gap-3" style={{ animationDelay: `${150 + i * 70}ms` }}>
              <Avatar emoji={j.emoji} color={j.color} tam="sm" atenuado={!j.vivo} />
              <span className={clases('flex-1 truncate font-semibold', !j.vivo && 'line-through opacity-60')}>
                {j.nombre}
              </span>
              <span className="text-sm font-bold" style={{ color: COLOR_ROL[j.rol] }}>
                {es.roles[j.rol]}
                {j.rol === 'infiltrado' && j.palabra ? ` («${j.palabra}»)` : ''}
              </span>
              <span
                className={clases(
                  'tabular w-12 text-right font-black',
                  (resultado.puntos[j.id] ?? 0) > 0 ? 'text-verde' : 'text-texto-2/50',
                )}
              >
                +{resultado.puntos[j.id] ?? 0}
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      {/* marcador acumulado */}
      <Panel className="w-full">
        <h3 className="mb-3 text-sm font-bold tracking-wide uppercase text-texto-2">
          🏆 {t.resultado.marcador}
        </h3>
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

      <div className="flex w-full max-w-sm flex-col gap-2">
        <Boton grande onClick={() => empezar()}>
          🔁 {t.resultado.otraRonda}
        </Boton>
        <Boton variante="secundario" onClick={reiniciar}>
          ⚙️ {t.resultado.cambiarAjustes}
        </Boton>
      </div>
    </div>
  );
}
