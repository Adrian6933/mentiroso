import { clases } from './ui';

/**
 * Emoji 3D estilo app (assets de Microsoft Fluent Emoji, licencia MIT,
 * descargados en /public/emoji3d). Si el emoji no tiene asset, cae al
 * emoji nativo del sistema.
 */
const MAPA: Record<string, string> = {
  '🤥': 'lying_face',
  '🤫': 'shushing_face',
  '😎': 'sunglasses',
  '🦊': 'fox',
  '🐸': 'frog',
  '👽': 'alien',
  '🤖': 'robot',
  '🐼': 'panda',
  '🦄': 'unicorn',
  '🐙': 'octopus',
  '🐯': 'tiger',
  '👻': 'ghost',
  '🍕': 'food_3d',
  '🚀': 'rocket',
  '🌵': 'cactus',
  '🎩': 'top_hat',
  '🐨': 'koala',
  '🦁': 'lion_3d',
  '🍩': 'doughnut',
  '⚡': 'high_voltage',
  '🎸': 'guitar',
  '🎯': 'direct_hit',
  '⚽': 'soccer_ball',
  '🎤': 'microphone',
  '🎬': 'clapper',
  '📱': 'mobile_phone',
  '🍔': 'hamburger',
  '🗣': 'speaking_head',
  '🗳': 'ballot_box',
  '🥁': 'drum',
  '🤡': 'clown',
  '🔮': 'crystal_ball',
  '⚖': 'balance_scale',
  '🏆': 'trophy_3d',
  '⏰': 'daily_3d',
  '👑': 'crown',
  '💬': 'speech_balloon',
  '🎉': 'party_popper',
  '🌐': 'globe',
  '📦': 'package',
  '⚙': 'gear',
  '🎭': 'performing_arts',
  '❓': 'question',
  '🌀': 'cyclone',
  '🛠': 'tools',
  '✨': 'sparkles',
  '👀': 'eyes',
  '🚪': 'door',
  '☀': 'sun',
  '🌙': 'moon',
  '🕵': 'detective',
  '🤝': 'handshake',
  '👆': 'backhand_index_pointing_up',
};

// quita el selector de variante (U+FE0F) y el zero-width joiner (U+200D)
const MODIFICADORES = new RegExp('[\\uFE0F\\u200D]', 'g');

export function rutaEmoji3D(e: string): string | null {
  const clave = e.replace(MODIFICADORES, '');
  const nombre = MAPA[clave];
  return nombre ? `/emoji3d/${nombre}.png` : null;
}

export function Emoji3D({
  e,
  tam = 24,
  className,
}: {
  e: string;
  tam?: number;
  className?: string;
}) {
  const ruta = rutaEmoji3D(e);
  if (!ruta) {
    return (
      <span aria-hidden className={className} style={{ fontSize: tam * 0.82, lineHeight: 1 }}>
        {e}
      </span>
    );
  }
  return (
    <img
      src={ruta}
      alt=""
      aria-hidden
      width={tam}
      height={tam}
      draggable={false}
      loading="lazy"
      className={clases('inline-block select-none', className)}
      style={{ width: tam, height: tam }}
    />
  );
}
