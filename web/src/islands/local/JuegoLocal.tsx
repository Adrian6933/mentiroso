import { es } from '@mentiroso/shared';
import { MenuPartida } from '../../components/juego/MenuPartida';
import { Insignia } from '../../components/ui';
import { t } from '../../lib/textos';
import { usePartidaLocal } from '../../stores/partidaLocal';
import { ConfiguracionLocal } from './ConfiguracionLocal';
import {
  AdivinanzaLocal,
  DebateLocal,
  PistasLocal,
  RepartoLocal,
  RevelacionLocal,
  VotacionLocal,
} from './FasesLocal';
import { ResultadoLocal } from './ResultadoLocal';

export default function JuegoLocal() {
  const { partida, reiniciar } = usePartidaLocal();

  if (!partida) return <ConfiguracionLocal />;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col">
      {/* barra superior de partida */}
      <header className="flex items-center justify-between gap-2 px-4 py-3">
        <MenuPartida textoAbandonar={t.comunes.salir + ' de la partida'} onAbandonar={reiniciar} />
        <Insignia>{es.fases[partida.fase]}</Insignia>
        {partida.config.mostrarCategoria && partida.fase !== 'resultado' ? (
          <Insignia color="var(--brand)">{partida.categoria}</Insignia>
        ) : (
          <span className="size-11" aria-hidden />
        )}
      </header>

      {/* remontar por fase: la clase anim-aparecer da la transición de entrada */}
      <div
        key={`${partida.fase}-${partida.votacionNum}-${partida.empatesEnVotacion}`}
        className="anim-aparecer flex flex-1 flex-col"
      >
        {partida.fase === 'reparto' && <RepartoLocal partida={partida} />}
        {partida.fase === 'pistas' && <PistasLocal partida={partida} />}
        {partida.fase === 'debate' && <DebateLocal partida={partida} />}
        {partida.fase === 'votacion' && <VotacionLocal partida={partida} />}
        {partida.fase === 'revelacion' && <RevelacionLocal partida={partida} />}
        {partida.fase === 'adivinanza' && <AdivinanzaLocal partida={partida} />}
        {partida.fase === 'resultado' && <ResultadoLocal partida={partida} />}
      </div>
    </div>
  );
}
