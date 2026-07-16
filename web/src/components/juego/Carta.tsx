import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { es } from '@mentiroso/shared';
import { COLOR_ROL, type DatosCarta } from '../../lib/carta';
import { t } from '../../lib/textos';
import { sfx } from '../../lib/sfx';
import { vibrar } from '../../stores/ajustes';
import { Emoji3D } from '../Emoji3D';
import { clases } from '../ui';

const RESORTE = { type: 'spring', stiffness: 420, damping: 36, mass: 0.9 } as const;

/** Marcas «?» decorativas repartidas por la tarjeta. */
const INTERROGANTES = [
  { top: '8%', left: '10%', size: 34, rot: -18 },
  { top: '14%', right: '12%', size: 26, rot: 14 },
  { top: '42%', left: '6%', size: 22, rot: 10 },
  { top: '55%', right: '8%', size: 30, rot: -12 },
  { bottom: '12%', left: '16%', size: 24, rot: 16 },
  { bottom: '20%', right: '18%', size: 20, rot: -8 },
] as const;

/**
 * La tarjeta secreta: se arrastra hacia arriba (siempre opaca, con tope)
 * y el secreto aparece debajo. Misma tarjeta en local y online.
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
  const [tope, setTope] = useState(420);
  const y = useMotionValue(420);
  
  const opacidadPortada = useTransform(y, [0, tope * 0.5, tope], [0, 1, 1]);
  const opacidadSecreto = useTransform(y, [0, tope * 0.5, tope], [1, 0, 0]);
  const opacidadFondo = useTransform(y, [0, tope * 0.5, tope], [0, 1, 1]);

  useEffect(() => {
    function medir() {
      const h = window.innerHeight * 0.72;
      const nuevoTope = Math.round(h - 100);
      setTope(nuevoTope);
      y.set(revelada ? 0 : nuevoTope);
    }
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, [revelada]);

  function irA(destino: 'arriba' | 'abajo', velocidad = 0) {
    const objetivo = destino === 'arriba' ? 0 : tope;
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
    <div className="relative w-full h-full flex flex-col justify-end overflow-hidden select-none">
      {/* Elementos fijos en el fondo, tal como en la captura 3 */}
      <motion.div
        style={{ opacity: opacidadFondo }}
        className="absolute inset-0 flex flex-col items-center justify-start pt-4 px-4 select-none pb-24"
      >
        <p className="text-4xl font-black text-white text-center tracking-tight mb-3 mt-1 drop-shadow-md">
          {nombre}
        </p>
        
        {/* Ilustración de los personajes sospechosos */}
        <div className="w-full flex-1 max-h-[30vh] flex items-center justify-center mb-5">
          <img
            src="/players_suspicious.png"
            alt="Personajes sospechosos"
            className="w-full h-full object-contain drop-shadow-[0_16px_36px_rgba(0,0,0,0.4)]"
          />
        </div>
        
        <p className="text-center text-sm font-semibold text-white/90 max-w-[280px] leading-relaxed">
          Arrastra tu tarjeta para revelar tu palabra.
          <span className="block mt-1 font-bold text-white">¡Evita a los impostores! 👀</span>
        </p>
      </motion.div>

      {/* Tarjeta deslizable */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: tope }}
        dragElastic={0.04}
        dragMomentum={false}
        style={{ y }}
        onDragEnd={(_evento, info) => {
          const valorY = y.get();
          const pasaUmbral = valorY < tope * 0.55 || info.velocity.y < -300;
          irA(pasaUmbral ? 'arriba' : 'abajo', info.velocity.y);
        }}
        onTap={() => irA(revelada ? 'abajo' : 'arriba')}
        className="absolute left-0 right-0 bottom-0 h-[74dvh] rounded-t-[38px] overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none shadow-[0_-12px_45px_rgba(0,0,0,0.65)] border-t border-white/20 z-10"
      >
        {/* Capa 1: Portada (Pico de la tarjeta en el reverso) */}
        <motion.div
          style={{ opacity: opacidadPortada, background: 'var(--carta-dorso)' }}
          className="absolute inset-0 flex flex-col items-center justify-start pt-5 text-white"
        >
          <div className="w-12 h-1.5 rounded-full bg-white/35 mb-2"></div>
          <Emoji3D e="👆" tam={40} className="anim-mano drop-shadow-md" />
          <span className="text-[11px] font-black uppercase tracking-widest text-white/90 mt-1">Desliza para revelar</span>
          
          {INTERROGANTES.map((m, i) => (
            <span
              key={i}
              aria-hidden
              className="absolute font-black text-white/10 pointer-events-none select-none"
              style={{ ...m, fontSize: m.size, transform: `rotate(${m.rot}deg)` }}
            >
              ?
            </span>
          ))}
          <span className="brillo-continuo" aria-hidden />
        </motion.div>

        {/* Capa 2: Secreto (Se revela al arrastrar hacia arriba) */}
        <motion.div
          style={{ opacity: opacidadSecreto, pointerEvents: revelada ? 'auto' : 'none' }}
          className="absolute inset-0 bg-[#120d26] flex flex-col items-center justify-center p-6 text-center text-white"
        >
          {datos.rolVisible === 'mentiroso' ? (
            <>
              <Emoji3D e="🤥" tam={72} className="drop-shadow-lg mb-3" />
              <p className="text-3xl font-black text-rojo text-balance mb-2">{t.reparto.eresElMentiroso}</p>
              <p className="text-sm text-texto-2 max-w-[250px] leading-relaxed">{t.reparto.mentirosoConsejo}</p>
              {datos.ayuda && (
                <p className="mt-4 rounded-2xl bg-[#221845] px-4 py-2.5 text-sm font-semibold text-amber border border-amber/20 shadow-inner">
                  {datos.ayuda.tipo === 'inicial'
                    ? `${t.reparto.ayudaInicial}: «${datos.ayuda.texto}»`
                    : `${t.reparto.categoria}: ${datos.ayuda.texto}`}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-2xl font-black mb-1" style={{ color: COLOR_ROL[datos.rolVisible] }}>
                {es.roles[datos.rolVisible]}
              </p>
              <p className="text-xs font-bold text-texto-2 uppercase tracking-widest mb-4">
                {t.reparto.tuPalabra}
                {datos.categoria && (
                  <span className="block text-[11px] font-black text-brand tracking-widest mt-0.5">
                    {datos.categoria}
                  </span>
                )}
              </p>
              <p className="text-5xl font-black mb-6 text-balance text-white">«{datos.palabra}»</p>

              {datos.rolVisible === 'payaso' && (
                <p className="rounded-2xl px-4 py-3 text-sm font-semibold max-w-[280px]" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                  🤡 {t.reparto.payasoAviso}
                </p>
              )}
              {datos.rolVisible === 'complice' && datos.complices && (
                <p className="rounded-2xl px-4 py-3 text-sm font-semibold max-w-[280px]" style={{ backgroundColor: 'rgba(236, 56, 131, 0.15)', color: '#ec3883' }}>
                  🤝 {t.reparto.compliceAviso} <b>{datos.complices.join(', ')}</b>
                </p>
              )}
              {datos.rolVisible === 'vidente' && datos.vision && (
                <p className="rounded-2xl px-4 py-3 text-sm font-semibold max-w-[280px]" style={{ backgroundColor: 'rgba(5, 150, 105, 0.15)', color: '#10b981' }}>
                  🔮 {t.reparto.videnteAviso} <b>{datos.vision.nombre}</b> {t.reparto.esRol}{' '}
                  <b>{es.roles[datos.vision.rol]}</b>
                </p>
              )}
            </>
          )}
          
          <div className="mt-8 text-xs text-texto-2/70 font-semibold flex flex-col items-center gap-1.5 select-none">
            <div className="w-10 h-1 rounded-full bg-texto-2/20"></div>
            Desliza hacia abajo para tapar
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
