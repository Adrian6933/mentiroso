import type { ReactNode } from 'react';
import { sfx } from '../lib/sfx';
import { vibrar } from '../stores/ajustes';
import { Emoji3D } from './Emoji3D';

export function clases(...xs: (string | false | null | undefined)[]): string {
  return xs.filter(Boolean).join(' ');
}

// ── Botón ──────────────────────────────────────────────────────────
type VarianteBoton = 'primario' | 'secundario' | 'fantasma' | 'peligro';

const ESTILOS_BOTON: Record<VarianteBoton, string> = {
  primario:
    'btn-brillo bg-[linear-gradient(115deg,var(--brand),var(--rosa))] text-white dark:text-[#14101f] font-bold shadow-lg shadow-brand/30 hover:brightness-110 hover:shadow-xl hover:shadow-brand/40 disabled:shadow-none',
  secundario:
    'bg-superficie-2 text-texto font-semibold border border-borde hover:border-brand/50 hover:shadow-md hover:shadow-brand/10',
  fantasma: 'text-texto-2 font-semibold hover:text-texto hover:bg-superficie-2',
  peligro: 'bg-rojo/10 text-rojo font-semibold border border-rojo/30 hover:bg-rojo/20',
};

export function Boton({
  variante = 'primario',
  grande = false,
  silencioso = false,
  className,
  children,
  onClick,
  ...props
}: {
  variante?: VarianteBoton;
  grande?: boolean;
  silencioso?: boolean;
  className?: string;
  children: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      onClick={(e) => {
        if (!silencioso) {
          sfx.click();
          vibrar(15);
        }
        onClick?.(e);
      }}
      className={clases(
        'tactil inline-flex items-center justify-center gap-2 rounded-2xl outline-none',
        'focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-fondo',
        'disabled:opacity-40 disabled:pointer-events-none',
        grande ? 'min-h-14 px-7 text-lg' : 'min-h-11 px-5 text-base',
        ESTILOS_BOTON[variante],
        className,
      )}
    >
      {children}
    </button>
  );
}

// ── Panel / tarjeta de superficie ──────────────────────────────────
export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={clases(
        'rounded-3xl border border-borde bg-superficie/75 p-5 backdrop-blur-md',
        'shadow-[0_8px_30px_-18px_rgb(0_0_0/0.45)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

// ── Interruptor ────────────────────────────────────────────────────
export function Interruptor({
  activo,
  onCambio,
  etiqueta,
  descripcion,
}: {
  activo: boolean;
  onCambio: (v: boolean) => void;
  etiqueta: string;
  descripcion?: string;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4 py-1.5">
      <span>
        <span className="block font-semibold">{etiqueta}</span>
        {descripcion && <span className="block text-sm text-texto-2">{descripcion}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={activo}
        aria-label={etiqueta}
        onClick={() => {
          sfx.click();
          vibrar(10);
          onCambio(!activo);
        }}
        className={clases(
          'tactil relative h-8 w-14 shrink-0 rounded-full border',
          activo ? 'bg-brand border-brand' : 'bg-superficie-2 border-borde',
        )}
      >
        <span
          className={clases(
            'absolute top-1 size-6 rounded-full bg-white shadow transition-[left] duration-150 ease-out',
            activo ? 'left-7' : 'left-1',
          )}
        />
      </button>
    </label>
  );
}

// ── Selector segmentado ────────────────────────────────────────────
export function Segmentos<T extends string | number>({
  opciones,
  valor,
  onCambio,
  ariaLabel,
}: {
  opciones: { valor: T; etiqueta: string }[];
  valor: T;
  onCambio: (v: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex w-full rounded-2xl border border-borde bg-superficie-2 p-1"
    >
      {opciones.map((o) => (
        <button
          key={String(o.valor)}
          type="button"
          role="radio"
          aria-checked={o.valor === valor}
          onClick={() => {
            sfx.click();
            onCambio(o.valor);
          }}
          className={clases(
            'tactil min-h-9 flex-1 rounded-xl px-2 text-sm font-semibold',
            o.valor === valor
              ? 'bg-superficie text-texto shadow-sm border border-borde'
              : 'text-texto-2 hover:text-texto',
          )}
        >
          {o.etiqueta}
        </button>
      ))}
    </div>
  );
}

// ── Contador +/- ───────────────────────────────────────────────────
export function Contador({
  valor,
  min,
  max,
  onCambio,
  etiqueta,
}: {
  valor: number;
  min: number;
  max: number;
  onCambio: (v: number) => void;
  etiqueta?: string;
}) {
  return (
    <div className="flex items-center gap-1" aria-label={etiqueta}>
      <button
        type="button"
        aria-label="menos"
        disabled={valor <= min}
        onClick={() => {
          sfx.click();
          onCambio(valor - 1);
        }}
        className="tactil grid size-11 place-items-center rounded-xl border border-borde bg-superficie-2 text-xl font-bold disabled:opacity-30"
      >
        −
      </button>
      <span className="tabular w-10 text-center text-lg font-bold">{valor}</span>
      <button
        type="button"
        aria-label="más"
        disabled={valor >= max}
        onClick={() => {
          sfx.click();
          onCambio(valor + 1);
        }}
        className="tactil grid size-11 place-items-center rounded-xl border border-borde bg-superficie-2 text-xl font-bold disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}

// ── Avatar de jugador ──────────────────────────────────────────────
export function Avatar({
  emoji,
  color,
  tam = 'md',
  atenuado = false,
}: {
  emoji: string;
  color: string;
  tam?: 'sm' | 'md' | 'lg';
  atenuado?: boolean;
}) {
  const tams = { sm: 'size-8', md: 'size-11', lg: 'size-16' };
  const tamEmoji = { sm: 19, md: 27, lg: 42 };
  return (
    <span
      aria-hidden
      className={clases(
        'grid shrink-0 place-items-center rounded-full border-2',
        tams[tam],
        atenuado && 'opacity-40 grayscale',
      )}
      style={{ borderColor: color, backgroundColor: `${color}22` }}
    >
      <Emoji3D e={emoji} tam={tamEmoji[tam]} className="drop-shadow-sm" />
    </span>
  );
}

// ── Insignia de fase / etiqueta pequeña ────────────────────────────
export function Insignia({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-borde bg-superficie-2 px-3 py-1 text-xs font-bold tracking-wide uppercase text-texto-2"
      style={color ? { color, borderColor: `${color}55` } : undefined}
    >
      {children}
    </span>
  );
}
