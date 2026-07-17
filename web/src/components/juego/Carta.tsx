import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { es } from '@mentiroso/shared';
import type { DatosCarta } from '../../lib/carta';
import { t } from '../../lib/textos';
import { sfx } from '../../lib/sfx';
import { vibrar } from '../../stores/ajustes';
import { Emoji3D } from '../Emoji3D';
import { clases } from '../ui';

const RESORTE = { type: 'spring', stiffness: 420, damping: 36, mass: 0.9 } as const;

/** Colores de rol con contraste alto sobre el fondo morado del reparto. */
const COLOR_ROL_VIVO: Record<DatosCarta['rolVisible'], string> = {
  civil: '#4ade80',
  mentiroso: '#ff8a8a',
  payaso: '#fcd34d',
  complice: '#f9a8d4',
  vidente: '#67e8f9',
};

/**
 * La tarjeta secreta: se arrastra hacia arriba (siempre opaca, con tope,
 * recortada por el borde como en la app de referencia) y el secreto
 * aparece debajo. Misma tarjeta en local y online, sobre .fondo-reparto.
 */
export function Carta({
  datos,
  nombre,
  onRevelada,
}: {
  datos: DatosCarta;
  nombre: string;
  onRevelada?: () => void;
}) {
  const [revelada, setRevelada] = useState(false);
  const vistaRef = useRef(false);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const [tope, setTope] = useState(280);
  const y = useMotionValue(0);
  const opacidadSecreto = useTransform(y, [-tope, -tope * 0.45, 0], [1, 0.1, 0]);
  const trasladoSecreto = useTransform(y, [-tope, 0], [0, 36]);
  const opacidadPista = useTransform(y, [-tope * 0.4, 0], [0, 1]);

  useEffect(() => {
    function medir() {
      if (contenedorRef.current) setTope(Math.round(contenedorRef.current.offsetHeight * 0.62));
    }
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, []);

  function irA(destino: 'arriba' | 'abajo', velocidad = 0) {
    const objetivo = destino === 'arriba' ? -tope : 0;
    animate(y, objetivo, { ...RESORTE, velocity: velocidad });
    const v = destino === 'arriba';
    if (v && !vistaRef.current) {
      vistaRef.current = true;
      onRevelada?.();
    }
    if (v !== revelada) {
      sfx.voltear();
      vibrar(v ? 40 : 15);
      setRevelada(v);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xs flex-col items-center text-white select-none">
      <p className="mb-3 text-center text-4xl font-black text-balance drop-shadow-md">{nombre}</p>

      {/* escenario: recorta la tarjeta por arriba cuando sube, como el borde de la pantalla */}
      <div
        ref={contenedorRef}
        className={clases('relative aspect-[3/4.3] w-full overflow-hidden', !revelada && 'anim-flotar')}
      >
        {/* el secreto vive debajo de la tarjeta y se descubre al subirla */}
        <motion.div
          aria-hidden={!revelada}
          style={{ opacity: opacidadSecreto, y: trasladoSecreto }}
          className="absolute inset-x-0 bottom-0 flex h-[58%] flex-col items-center justify-center gap-2.5 px-1 text-center"
        >
          {datos.rolVisible === 'mentiroso' ? (
            <>
              <Emoji3D e="🤥" tam={56} className="drop-shadow-lg" />
              <p className="text-2xl font-black text-balance" style={{ color: COLOR_ROL_VIVO.mentiroso }}>
                {t.reparto.eresElMentiroso}
              </p>
              <p className="text-sm font-medium text-white/85">{t.reparto.mentirosoConsejo}</p>
              {datos.ayuda && (
                <p className="rounded-xl bg-white/15 px-3 py-2 text-sm font-semibold backdrop-blur-sm">
                  {datos.ayuda.tipo === 'inicial'
                    ? `${t.reparto.ayudaInicial}: «${datos.ayuda.texto}»`
                    : `${t.reparto.categoria}: ${datos.ayuda.texto}`}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-2xl font-black" style={{ color: COLOR_ROL_VIVO[datos.rolVisible] }}>
                {es.roles[datos.rolVisible]}
              </p>
              <p className="text-sm font-semibold text-white/80">
                {t.reparto.tuPalabra}
                {datos.categoria && (
                  <span className="block text-xs font-bold tracking-widest uppercase text-white/70">
                    {datos.categoria}
                  </span>
                )}
              </p>
              <p className="text-4xl leading-tight font-black text-balance">«{datos.palabra}»</p>

              {datos.rolVisible === 'payaso' && (
                <p className="rounded-xl bg-white/15 px-3 py-2 text-sm font-semibold backdrop-blur-sm" style={{ color: COLOR_ROL_VIVO.payaso }}>
                  🤡 {t.reparto.payasoAviso}
                </p>
              )}
              {datos.rolVisible === 'complice' && datos.complices && (
                <p className="rounded-xl bg-white/15 px-3 py-2 text-sm font-semibold backdrop-blur-sm" style={{ color: COLOR_ROL_VIVO.complice }}>
                  🤝 {t.reparto.compliceAviso} <b>{datos.complices.join(', ')}</b>
                </p>
              )}
              {datos.rolVisible === 'vidente' && datos.vision && (
                <p className="rounded-xl bg-white/15 px-3 py-2 text-sm font-semibold backdrop-blur-sm" style={{ color: COLOR_ROL_VIVO.vidente }}>
                  🔮 {t.reparto.videnteAviso} <b>{datos.vision.nombre}</b> {t.reparto.esRol}{' '}
                  <b>{es.roles[datos.vision.rol]}</b>
                </p>
              )}
            </>
          )}
        </motion.div>

        {/* tarjeta: siempre opaca, sube siguiendo el dedo hasta el tope */}
        <motion.div
          role="button"
          tabIndex={0}
          aria-label={t.reparto.instruccion}
          aria-pressed={revelada}
          drag="y"
          dragConstraints={{ top: -tope, bottom: 0 }}
          dragElastic={0.04}
          dragMomentum={false}
          onDragEnd={(_evento, info) => {
            const pasaUmbral = info.offset.y < -tope * 0.3 || info.velocity.y < -700;
            irA(pasaUmbral ? 'arriba' : 'abajo', info.velocity.y);
          }}
          onTap={() => irA(revelada ? 'abajo' : 'arriba')}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') irA(revelada ? 'abajo' : 'arriba');
          }}
          onContextMenu={(e) => e.preventDefault()}
          style={{ y, boxShadow: '0 18px 44px -14px rgb(0 0 0 / 0.55)' }}
          className="carta-cara absolute inset-0 cursor-grab touch-none overflow-hidden rounded-[28px] ring-1 ring-white/25 outline-none focus-visible:ring-4 focus-visible:ring-white/60 active:cursor-grabbing"
        >
          {/* ilustración a sangre, como el cartel de la app */}
          <img
            src="/players_suspicious.png"
            alt=""
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          />
          <span className="brillo-continuo" aria-hidden />
          {/* sombreado inferior para que la manita se lea sobre la foto */}
          <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/45 to-transparent" />
          <motion.div
            style={{ opacity: opacidadPista }}
            className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center"
          >
            <Emoji3D e="👆" tam={46} className="anim-mano drop-shadow-lg" />
          </motion.div>
        </motion.div>
      </div>

      <p className="mt-4 min-h-10 text-center text-sm font-semibold text-white/90 text-balance">
        {revelada ? (
          t.reparto.ocultar
        ) : (
          <>
            {t.reparto.instruccion}
            <span className="block">{t.reparto.soloTu}</span>
          </>
        )}
      </p>
    </div>
  );
}
