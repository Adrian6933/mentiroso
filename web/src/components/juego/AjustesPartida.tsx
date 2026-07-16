import { es, sugerirMentirosos, type GameConfig, type ModoJuego, type Pack } from '@mentiroso/shared';
import { useState } from 'react';
import { t } from '../../lib/textos';
import { sfx } from '../../lib/sfx';
import { Emoji3D } from '../Emoji3D';
import { clases, Contador, Interruptor, Segmentos } from '../ui';

const MODOS: { id: ModoJuego; emoji: string }[] = [
  { id: 'clasico', emoji: '🤥' },
  { id: 'infiltrado', emoji: '🕵️' },
  { id: 'mixto', emoji: '🎭' },
  { id: 'preguntas', emoji: '❓' },
  { id: 'caos', emoji: '🌀' },
  { id: 'personalizado', emoji: '🛠️' },
];

export function SelectorModo({
  modo,
  onElegir,
}: {
  modo: ModoJuego;
  onElegir: (m: ModoJuego) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {MODOS.map((m) => (
        <button
          key={m.id}
          type="button"
          aria-pressed={modo === m.id}
          onClick={() => {
            sfx.click();
            onElegir(m.id);
          }}
          className={clases(
            'tactil flex min-h-24 flex-col items-start gap-1 rounded-2xl border p-3 text-left',
            'transition-[transform,border-color,box-shadow,background-color] duration-200 ease-out hover:-translate-y-0.5',
            modo === m.id
              ? 'border-brand bg-brand-suave shadow-lg shadow-brand/20'
              : 'border-borde bg-superficie hover:border-brand/40 hover:shadow-md hover:shadow-brand/10',
          )}
        >
          <Emoji3D e={m.emoji} tam={34} className="drop-shadow-md" />
          <span className="text-sm font-bold">{es.modos[m.id]}</span>
          <span className="text-xs leading-snug text-texto-2">{es.modosDesc[m.id]}</span>
        </button>
      ))}
    </div>
  );
}

export function SelectorPacks({
  packs,
  seleccion,
  onCambio,
}: {
  packs: Pack[];
  seleccion: string[];
  onCambio: (ids: string[]) => void;
}) {
  function alternar(id: string) {
    sfx.click();
    onCambio(seleccion.includes(id) ? seleccion.filter((x) => x !== id) : [...seleccion, id]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {packs.map((p) => {
        const activo = seleccion.includes(p.id);
        return (
          <button
            key={p.id}
            type="button"
            aria-pressed={activo}
            onClick={() => alternar(p.id)}
            className={clases(
              'tactil inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold',
              activo
                ? 'border-brand bg-brand-suave text-texto'
                : 'border-borde bg-superficie text-texto-2 hover:border-brand/40',
            )}
          >
            <Emoji3D e={p.emoji} tam={22} />
            {p.nombre}
            <span className="tabular text-xs opacity-60">{p.entradas.length}</span>
          </button>
        );
      })}
    </div>
  );
}

function FilaAjuste({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-1.5">
      <span className="font-semibold">{etiqueta}</span>
      {children}
    </div>
  );
}

/**
 * Panel completo de ajustes de la partida. `soloLectura` para los invitados
 * de una sala online (solo el anfitrión edita).
 */
export function AjustesPartida({
  config,
  numJugadores,
  onCambio,
  soloLectura = false,
}: {
  config: GameConfig;
  numJugadores: number;
  onCambio: (parcial: Partial<GameConfig>) => void;
  soloLectura?: boolean;
}) {
  const [avanzado, setAvanzado] = useState(false);
  const sugeridos = sugerirMentirosos(Math.max(numJugadores, 3));
  const maxImpostores = Math.max(1, Math.ceil(Math.max(numJugadores, 3) / 2) - 1);

  return (
    <div className={clases('flex flex-col gap-1', soloLectura && 'pointer-events-none opacity-70')}>
      <FilaAjuste etiqueta={`${t.ajustesPartida.mentirosos} (${t.ajustesPartida.auto}: ${sugeridos})`}>
        <Contador
          valor={config.numMentirosos}
          min={0}
          max={maxImpostores}
          onCambio={(v) => onCambio({ numMentirosos: v, modo: 'personalizado' })}
          etiqueta={t.ajustesPartida.mentirosos}
        />
      </FilaAjuste>

      <FilaAjuste etiqueta={t.ajustesPartida.rondas}>
        <div className="w-40">
          <Segmentos
            opciones={[1, 2, 3].map((n) => ({ valor: n, etiqueta: String(n) }))}
            valor={config.rondasDePistas}
            onCambio={(v) => onCambio({ rondasDePistas: v })}
            ariaLabel={t.ajustesPartida.rondas}
          />
        </div>
      </FilaAjuste>

      <Interruptor
        activo={config.votacionSecreta}
        onCambio={(v) => onCambio({ votacionSecreta: v })}
        etiqueta={t.ajustesPartida.votacionSecreta}
        descripcion={config.votacionSecreta ? t.votacion.subtituloSecreta : t.votacion.subtituloAbierta}
      />

      <Interruptor
        activo={config.pistasEscritas}
        onCambio={(v) => onCambio({ pistasEscritas: v })}
        etiqueta={t.ajustesPartida.pistasEscritas}
      />

      <button
        type="button"
        onClick={() => {
          sfx.click();
          setAvanzado(!avanzado);
        }}
        className="tactil mt-2 flex min-h-11 items-center justify-between rounded-xl px-1 font-bold text-brand"
        aria-expanded={avanzado}
      >
        {t.ajustesPartida.avanzado}
        <span className={clases('transition-transform duration-150', avanzado && 'rotate-180')} aria-hidden>▾</span>
      </button>

      {avanzado && (
        <div className="flex flex-col gap-1 rounded-2xl border border-borde bg-superficie-2/50 p-3">
          <FilaAjuste etiqueta={t.ajustesPartida.infiltrados}>
            <Contador
              valor={config.numInfiltrados}
              min={0}
              max={maxImpostores}
              onCambio={(v) => onCambio({ numInfiltrados: v, modo: 'personalizado' })}
              etiqueta={t.ajustesPartida.infiltrados}
            />
          </FilaAjuste>

          <p className="mt-1 font-semibold">{t.ajustesPartida.rolesExtra}</p>
          {(['payaso', 'complice', 'vidente'] as const).map((rol) => (
            <Interruptor
              key={rol}
              activo={config.rolesExtra[rol]}
              onCambio={(v) =>
                onCambio({ rolesExtra: { ...config.rolesExtra, [rol]: v }, modo: 'personalizado' })
              }
              etiqueta={`${rol === 'payaso' ? '🤡' : rol === 'complice' ? '🤝' : '🔮'} ${es.roles[rol]}`}

              descripcion={es.rolesDesc[rol]}
            />
          ))}

          <Interruptor
            activo={config.eliminacionProgresiva}
            onCambio={(v) => onCambio({ eliminacionProgresiva: v })}
            etiqueta={t.ajustesPartida.eliminacionProgresiva}
            descripcion={es.modosDesc.mixto}
          />
          <Interruptor
            activo={config.adivinanzaFinal}
            onCambio={(v) => onCambio({ adivinanzaFinal: v })}
            etiqueta={t.ajustesPartida.adivinanzaFinal}
          />
          {config.adivinanzaFinal && (
            <Interruptor
              activo={config.adivinanzaRobaVictoria}
              onCambio={(v) => onCambio({ adivinanzaRobaVictoria: v })}
              etiqueta={t.ajustesPartida.robaVictoria}
            />
          )}
          <Interruptor
            activo={config.mostrarCategoria}
            onCambio={(v) => onCambio({ mostrarCategoria: v })}
            etiqueta={t.ajustesPartida.mostrarCategoria}
          />
          <Interruptor
            activo={config.evitarRepetidas}
            onCambio={(v) => onCambio({ evitarRepetidas: v })}
            etiqueta={t.ajustesPartida.evitarRepetidas}
          />

          <FilaAjuste etiqueta={t.ajustesPartida.ayudaMentiroso}>
            <div className="w-full">
              <Segmentos
                opciones={[
                  { valor: 'nada', etiqueta: t.ajustesPartida.ayudaNada },
                  { valor: 'categoria', etiqueta: t.ajustesPartida.ayudaCategoria },
                  { valor: 'inicial', etiqueta: t.ajustesPartida.ayudaInicial },
                ]}
                valor={config.ayudaMentiroso}
                onCambio={(v) => onCambio({ ayudaMentiroso: v })}
                ariaLabel={t.ajustesPartida.ayudaMentiroso}
              />
            </div>
          </FilaAjuste>

          <FilaAjuste etiqueta={t.ajustesPartida.empate}>
            <div className="w-full">
              <Segmentos
                opciones={[
                  { valor: 'revotar', etiqueta: t.ajustesPartida.empateRevotar },
                  { valor: 'nadie', etiqueta: t.ajustesPartida.empateNadie },
                ]}
                valor={config.empate}
                onCambio={(v) => onCambio({ empate: v })}
                ariaLabel={t.ajustesPartida.empate}
              />
            </div>
          </FilaAjuste>

          <FilaAjuste etiqueta={t.ajustesPartida.tiempoPista}>
            <div className="w-full">
              <Segmentos
                opciones={[0, 15, 30, 60].map((s) => ({
                  valor: s,
                  etiqueta: s === 0 ? t.ajustesPartida.sinLimite : `${s}s`,
                }))}
                valor={config.segundosPista}
                onCambio={(v) => onCambio({ segundosPista: v })}
                ariaLabel={t.ajustesPartida.tiempoPista}
              />
            </div>
          </FilaAjuste>

          <FilaAjuste etiqueta={t.ajustesPartida.tiempoDebate}>
            <div className="w-full">
              <Segmentos
                opciones={[0, 60, 120, 180].map((s) => ({
                  valor: s,
                  etiqueta: s === 0 ? t.ajustesPartida.sinLimite : `${s / 60}min`,
                }))}
                valor={config.segundosDebate}
                onCambio={(v) => onCambio({ segundosDebate: v })}
                ariaLabel={t.ajustesPartida.tiempoDebate}
              />
            </div>
          </FilaAjuste>

          <FilaAjuste etiqueta={t.ajustesPartida.tiempoVotacion}>
            <div className="w-full">
              <Segmentos
                opciones={[0, 30, 60].map((s) => ({
                  valor: s,
                  etiqueta: s === 0 ? t.ajustesPartida.sinLimite : `${s}s`,
                }))}
                valor={config.segundosVotacion}
                onCambio={(v) => onCambio({ segundosVotacion: v })}
                ariaLabel={t.ajustesPartida.tiempoVotacion}
              />
            </div>
          </FilaAjuste>
        </div>
      )}
    </div>
  );
}
