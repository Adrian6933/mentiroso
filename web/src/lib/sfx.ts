import { useAjustes } from '../stores/ajustes';

/** Efectos de sonido sintetizados con WebAudio: sin descargar ningún asset. */
let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!useAjustes.getState().sonidos) return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tono(
  frecuencia: number,
  duracion: number,
  opts: { tipo?: OscillatorType; volumen?: number; retardo?: number; glide?: number } = {},
) {
  const c = audio();
  if (!c) return;
  const { tipo = 'sine', volumen = 0.12, retardo = 0, glide } = opts;
  const t0 = c.currentTime + retardo;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = tipo;
  osc.frequency.setValueAtTime(frecuencia, t0);
  if (glide) osc.frequency.exponentialRampToValueAtTime(glide, t0 + duracion);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(volumen, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duracion);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duracion + 0.05);
}

export const sfx = {
  click: () => tono(520, 0.08, { tipo: 'triangle', volumen: 0.06 }),
  voltear: () => {
    tono(300, 0.12, { tipo: 'triangle', glide: 600 });
    tono(900, 0.1, { tipo: 'sine', retardo: 0.08, volumen: 0.08 });
  },
  tension: () => {
    for (let i = 0; i < 6; i++) tono(180 + i * 8, 0.1, { tipo: 'square', volumen: 0.03, retardo: i * 0.12 });
  },
  redoble: () => {
    for (let i = 0; i < 14; i++) {
      tono(140 + Math.random() * 40, 0.05, { tipo: 'square', volumen: 0.04, retardo: i * 0.07 });
    }
  },
  exito: () => {
    tono(523, 0.15, { tipo: 'triangle' });
    tono(659, 0.15, { tipo: 'triangle', retardo: 0.12 });
    tono(784, 0.3, { tipo: 'triangle', retardo: 0.24 });
    tono(1047, 0.45, { tipo: 'sine', retardo: 0.36, volumen: 0.1 });
  },
  fracaso: () => {
    tono(392, 0.2, { tipo: 'sawtooth', volumen: 0.06 });
    tono(311, 0.25, { tipo: 'sawtooth', retardo: 0.18, volumen: 0.06 });
    tono(233, 0.5, { tipo: 'sawtooth', retardo: 0.36, volumen: 0.06 });
  },
  dramatico: () => {
    tono(110, 0.7, { tipo: 'sawtooth', volumen: 0.08 });
    tono(116.5, 0.7, { tipo: 'sawtooth', volumen: 0.08 });
  },
  tick: () => tono(880, 0.05, { tipo: 'sine', volumen: 0.05 }),
};
