import { PACKS, type EntradaPack, type Pack } from '@mentiroso/shared';
import { useState } from 'react';
import { Avatar, Boton, Interruptor, Panel } from '../components/ui';
import {
  exportarPack,
  guardarPacksPersonalizados,
  importarPack,
  obtenerPacksPersonalizados,
} from '../lib/packsPersonalizados';

/**
 * Formato de texto del editor: una entrada por línea.
 *   Nombre del famoso | parecido 1, parecido 2
 */
function entradasATexto(entradas: EntradaPack[]): string {
  return entradas
    .map((e) => (e.similares.length ? `${e.texto} | ${e.similares.join(', ')}` : e.texto))
    .join('\n');
}

function textoAEntradas(texto: string, packId: string): EntradaPack[] {
  return texto
    .split('\n')
    .map((linea) => linea.trim())
    .filter(Boolean)
    .map((linea, i) => {
      const [principal, similares] = linea.split('|');
      return {
        id: `${packId}-${i}`,
        texto: principal.trim(),
        similares: (similares ?? '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };
    })
    .filter((e) => e.texto.length > 0);
}

interface Borrador {
  id: string;
  nombre: string;
  emoji: string;
  categoria: string;
  esFamosos: boolean;
  textoEntradas: string;
  textoPreguntas: string;
}

function borradorVacio(): Borrador {
  return {
    id: `pack-${Date.now()}`,
    nombre: '',
    emoji: '📦',
    categoria: '',
    esFamosos: true,
    textoEntradas: '',
    textoPreguntas: '',
  };
}

function borradorDePack(p: Pack): Borrador {
  return {
    id: p.id,
    nombre: p.nombre,
    emoji: p.emoji,
    categoria: p.categoria,
    esFamosos: p.esFamosos,
    textoEntradas: entradasATexto(p.entradas),
    textoPreguntas: p.preguntas.join('\n'),
  };
}

export default function PacksEditor() {
  const [personalizados, setPersonalizados] = useState<Pack[]>(() => obtenerPacksPersonalizados());
  const [borrador, setBorrador] = useState<Borrador | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [importando, setImportando] = useState(false);
  const [jsonImport, setJsonImport] = useState('');
  const [borrandoId, setBorrandoId] = useState<string | null>(null);

  function persistir(nuevos: Pack[]) {
    setPersonalizados(nuevos);
    guardarPacksPersonalizados(nuevos);
  }

  function guardarBorrador() {
    if (!borrador) return;
    const entradas = textoAEntradas(borrador.textoEntradas, borrador.id);
    if (!borrador.nombre.trim() || entradas.length < 3) {
      setAviso('Ponle un nombre y al menos 3 entradas (una por línea).');
      return;
    }
    const pack: Pack = {
      id: borrador.id,
      nombre: borrador.nombre.trim().slice(0, 30),
      emoji: borrador.emoji.trim() || '📦',
      categoria: borrador.categoria.trim() || borrador.nombre.trim(),
      esFamosos: borrador.esFamosos,
      preguntas: borrador.textoPreguntas.split('\n').map((x) => x.trim()).filter(Boolean),
      entradas,
      personalizado: true,
    };
    const sinEste = personalizados.filter((p) => p.id !== pack.id);
    persistir([...sinEste, pack]);
    setBorrador(null);
    setAviso(null);
  }

  function confirmarImportacion() {
    const pack = importarPack(jsonImport);
    if (!pack) {
      setAviso('Ese JSON no parece un pack válido.');
      return;
    }
    pack.id = `pack-${Date.now()}`;
    persistir([...personalizados, pack]);
    setImportando(false);
    setJsonImport('');
    setAviso(`Pack «${pack.nombre}» importado.`);
  }

  async function exportar(pack: Pack) {
    try {
      await navigator.clipboard.writeText(exportarPack(pack));
      setAviso(`Pack «${pack.nombre}» copiado al portapapeles como JSON.`);
    } catch {
      setAviso('No se pudo copiar. Inténtalo de nuevo.');
    }
  }

  if (borrador) {
    return (
      <Panel className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">✏️ Editar pack</h2>
        <div className="flex gap-2">
          <input
            value={borrador.emoji}
            onChange={(e) => setBorrador({ ...borrador, emoji: e.target.value.slice(0, 4) })}
            aria-label="Emoji"
            className="min-h-12 w-16 rounded-2xl border border-borde bg-superficie-2 text-center text-xl outline-none focus:border-brand"
          />
          <input
            value={borrador.nombre}
            onChange={(e) => setBorrador({ ...borrador, nombre: e.target.value })}
            placeholder="Nombre del pack"
            maxLength={30}
            aria-label="Nombre del pack"
            className="min-h-12 flex-1 rounded-2xl border border-borde bg-superficie-2 px-4 font-semibold outline-none focus:border-brand"
          />
        </div>
        <input
          value={borrador.categoria}
          onChange={(e) => setBorrador({ ...borrador, categoria: e.target.value })}
          placeholder="Categoría visible en el juego (ej.: Futbolistas)"
          maxLength={30}
          aria-label="Categoría"
          className="min-h-12 rounded-2xl border border-borde bg-superficie-2 px-4 font-semibold outline-none focus:border-brand"
        />
        <Interruptor
          activo={borrador.esFamosos}
          onCambio={(v) => setBorrador({ ...borrador, esFamosos: v })}
          etiqueta="Es un pack de famosos"
        />
        <label className="text-sm font-bold text-texto-2" htmlFor="entradas-pack">
          Entradas — una por línea. Los «parecidos» (para el modo Infiltrado) van tras una barra:
          <code className="ml-1 rounded bg-superficie-2 px-1">Messi | Cristiano, Neymar</code>
        </label>
        <textarea
          id="entradas-pack"
          value={borrador.textoEntradas}
          onChange={(e) => setBorrador({ ...borrador, textoEntradas: e.target.value })}
          rows={8}
          className="rounded-2xl border border-borde bg-superficie-2 p-3 font-medium outline-none focus:border-brand"
        />
        <label className="text-sm font-bold text-texto-2" htmlFor="preguntas-pack">
          Preguntas para el modo Preguntas (opcional) — una por línea
        </label>
        <textarea
          id="preguntas-pack"
          value={borrador.textoPreguntas}
          onChange={(e) => setBorrador({ ...borrador, textoPreguntas: e.target.value })}
          rows={4}
          placeholder="¿De qué equipo es?&#10;¿De qué país es?"
          className="rounded-2xl border border-borde bg-superficie-2 p-3 font-medium outline-none focus:border-brand"
        />
        {aviso && <p className="text-sm font-semibold text-ambar">{aviso}</p>}
        <div className="flex gap-2">
          <Boton onClick={guardarBorrador} className="flex-1">💾 Guardar</Boton>
          <Boton variante="secundario" onClick={() => { setBorrador(null); setAviso(null); }}>
            Cancelar
          </Boton>
        </div>
      </Panel>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-36">
      {/* Subheader descriptivo estilo captura 2 */}
      <div className="text-center my-1 select-none">
        <span className="block text-xs font-black text-texto-2 uppercase tracking-widest">Paquetes personalizados</span>
        <span className="block text-xs font-bold text-texto-2/70 mt-0.5">Crea tu primer paquete</span>
      </div>

      <h2 className="text-lg font-black tracking-tight mb-1">Paquetes</h2>
      
      {/* Rejilla de cartas de paquetes */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {PACKS.map((p) => {
          let imgRuta = '';
          let cardBgClass = 'bg-[#151126]'; // Fondo oscuro por defecto
          let isGradient = false;
          let cameraIcon = false;

          if (p.id === 'futbolistas') {
            imgRuta = '/trophy_3d.png';
            cardBgClass = 'bg-gradient-to-br from-red-800 via-red-950 to-orange-900 border-red-900/40';
            isGradient = true;
            cameraIcon = true;
          } else if (p.id === 'animales') {
            imgRuta = '/lion_3d.png';
            cardBgClass = 'bg-[#120d20] border-slate-900/50';
          } else if (p.id === 'comida') {
            imgRuta = '/food_3d.png';
            cardBgClass = 'bg-[#120d20] border-slate-900/50';
          } else if (p.id === 'cotidiana') {
            imgRuta = '/daily_3d.png';
            cardBgClass = 'bg-[#120d20] border-slate-900/50';
          } else if (p.id === 'cantantes') {
            imgRuta = '/emoji3d/microphone.png';
          } else if (p.id === 'actores') {
            imgRuta = '/emoji3d/clapper.png';
          } else if (p.id === 'streamers') {
            imgRuta = '/emoji3d/mobile_phone.png';
          }

          return (
            <div
              key={p.id}
              className={`tactil relative rounded-[28px] overflow-hidden aspect-square flex flex-col justify-end p-3.5 border shadow-lg group ${cardBgClass}`}
            >
              {cameraIcon && (
                <span className="absolute top-3.5 right-3.5 text-white/60 text-[10px] z-10" aria-hidden>
                  📹
                </span>
              )}
              <div className="absolute inset-0 flex items-center justify-center p-5 select-none">
                <img
                  src={imgRuta}
                  alt=""
                  className={`w-full h-full object-contain max-h-[72%] max-w-[72%] drop-shadow-md group-hover:scale-105 transition-transform duration-300 mix-blend-screen`}
                />
              </div>
              
              {/* Difuminado negro inferior para leer el título */}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#06040a]/90 to-transparent pointer-events-none"></div>

              <span className="relative text-[11px] font-black text-center text-white/95 leading-tight z-10">
                {p.nombre}
              </span>
            </div>
          );
        })}
      </div>

      {aviso && <p className="text-sm font-semibold text-verde">{aviso}</p>}

      {importando && (
        <Panel className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">📥 Importar pack</h2>
          <label className="text-sm font-bold text-texto-2" htmlFor="json-import">
            Pega aquí el JSON del pack
          </label>
          <textarea
            id="json-import"
            value={jsonImport}
            onChange={(e) => setJsonImport(e.target.value)}
            rows={7}
            placeholder='{"id": "...", "nombre": "...", "entradas": [...]}'
            className="rounded-2xl border border-borde bg-superficie-2 p-3 font-mono text-sm outline-none focus:border-brand"
          />
          <div className="flex gap-2">
            <Boton onClick={confirmarImportacion} disabled={!jsonImport.trim()} className="flex-1">
              Importar
            </Boton>
            <Boton variante="secundario" onClick={() => { setImportando(false); setJsonImport(''); }}>
              Cancelar
            </Boton>
          </div>
        </Panel>
      )}

      {/* Packs creados */}
      {personalizados.length > 0 && (
        <div className="mt-2">
          <h2 className="text-lg font-black mb-3">Tus paquetes creados</h2>
          <ul className="flex flex-col gap-2">
            {personalizados.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-2 rounded-2xl bg-superficie-2 px-3 py-2 border border-borde/20 shadow-sm">
                <span className="text-xl" aria-hidden>{p.emoji}</span>
                <span className="flex-1 font-semibold text-sm">
                  {p.nombre} <span className="tabular text-xs text-texto-2">({p.entradas.length})</span>
                </span>
                <Boton variante="fantasma" className="min-h-9 px-3" onClick={() => setBorrador(borradorDePack(p))}>✏️</Boton>
                <Boton variante="fantasma" className="min-h-9 px-3" onClick={() => void exportar(p)}>📤</Boton>
                <Boton
                  variante={borrandoId === p.id ? 'peligro' : 'fantasma'}
                  className="min-h-9 px-3"
                  onClick={() => {
                    if (borrandoId === p.id) {
                      persistir(personalizados.filter((x) => x.id !== p.id));
                      setBorrandoId(null);
                    } else {
                      setBorrandoId(p.id);
                      setTimeout(() => setBorrandoId((v) => (v === p.id ? null : v)), 2500);
                    }
                  }}
                >
                  {borrandoId === p.id ? '¿Seguro?' : '🗑️'}
                </Boton>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Barra inferior fija (Bottom Sheet) */}
      <div className="fixed inset-x-0 bottom-0 bg-[#0a0715]/95 border-t border-borde/40 px-4 pt-4 pb-6 backdrop-blur-md z-30 flex flex-col shadow-[0_-10px_35px_rgba(0,0,0,0.6)]">
        <div className="mx-auto w-full max-w-md">
          <div className="flex gap-3">
            <button
              onClick={() => setBorrador(borradorVacio())}
              className="tactil flex-1 min-h-13 rounded-2xl bg-gradient-to-b from-[#10b981] to-[#047857] text-white font-black text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-[#047857]/15 hover:brightness-105 active:scale-95 transition-transform duration-100 border border-white/10 cursor-pointer"
            >
              ＋ Crear paquete
            </button>
            <Boton
              variante="secundario"
              onClick={() => { setImportando(true); setAviso(null); }}
              className="min-h-13 rounded-2xl shrink-0"
            >
              📥 Importar
            </Boton>
          </div>
        </div>
      </div>
    </div>
  );
}
