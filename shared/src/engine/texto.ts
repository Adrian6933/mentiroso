const DIACRITICOS = new RegExp('[\\u0300-\\u036f]', 'g');

/** Normaliza para comparar adivinanzas: minúsculas, sin tildes, espacios colapsados. */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICOS, '')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Comprueba si una adivinanza acierta la palabra secreta.
 * Acepta coincidencia exacta normalizada y, para nombres compuestos
 * (p. ej. "Lionel Messi"), acertar el apellido o nombre distintivo completo.
 */
export function esAcierto(adivinanza: string, palabra: string): boolean {
  const a = normalizar(adivinanza);
  const p = normalizar(palabra);
  if (!a || !p) return false;
  if (a === p) return true;
  const partesP = p.split(' ');
  // nombres de varias palabras: aceptar que diga una parte "larga" (≥4 letras)
  if (partesP.length > 1) {
    const partesLargas = partesP.filter((x) => x.length >= 4);
    if (partesLargas.includes(a)) return true;
    // o que la adivinanza contenga el nombre completo
    if (a.includes(p)) return true;
  }
  return false;
}
