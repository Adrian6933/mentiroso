import type { Pack } from '@mentiroso/shared';

const CLAVE = 'mentiroso-packs';

/** Packs creados por el usuario, guardados en localStorage. */
export function obtenerPacksPersonalizados(): Pack[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return [];
    const lista = JSON.parse(crudo) as Pack[];
    return Array.isArray(lista) ? lista.filter(esPackValido) : [];
  } catch {
    return [];
  }
}

export function guardarPacksPersonalizados(packs: Pack[]): void {
  localStorage.setItem(CLAVE, JSON.stringify(packs));
}

export function esPackValido(p: unknown): p is Pack {
  if (!p || typeof p !== 'object') return false;
  const pack = p as Pack;
  return (
    typeof pack.id === 'string' &&
    typeof pack.nombre === 'string' &&
    Array.isArray(pack.entradas) &&
    pack.entradas.every(
      (e) => typeof e?.id === 'string' && typeof e?.texto === 'string' && Array.isArray(e?.similares),
    )
  );
}

/** Exporta un pack como JSON descargable. */
export function exportarPack(pack: Pack): string {
  return JSON.stringify(pack, null, 2);
}

/** Importa un pack desde texto JSON; devuelve null si no es válido. */
export function importarPack(json: string): Pack | null {
  try {
    const p = JSON.parse(json);
    if (!esPackValido(p)) return null;
    p.personalizado = true;
    if (!Array.isArray(p.preguntas)) p.preguntas = [];
    if (typeof p.emoji !== 'string' || !p.emoji) p.emoji = '📦';
    if (typeof p.categoria !== 'string' || !p.categoria) p.categoria = p.nombre;
    if (typeof p.esFamosos !== 'boolean') p.esFamosos = false;
    return p;
  } catch {
    return null;
  }
}
