import { useAjustes } from '../stores/ajustes';

/** Lanza confeti (respeta el ajuste de reducir animaciones). */
export async function lanzarConfeti(colores?: string[]) {
  if (typeof window === 'undefined') return;
  if (useAjustes.getState().reducirAnimaciones) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const { default: confetti } = await import('canvas-confetti');
  const opciones = { spread: 75, ticks: 120, gravity: 0.9, colors: colores };
  confetti({ ...opciones, particleCount: 80, origin: { x: 0.2, y: 0.7 }, angle: 60 });
  confetti({ ...opciones, particleCount: 80, origin: { x: 0.8, y: 0.7 }, angle: 120 });
  setTimeout(() => confetti({ ...opciones, particleCount: 60, origin: { x: 0.5, y: 0.6 } }), 250);
}
