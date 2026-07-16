import { Interruptor, Panel, Segmentos } from '../components/ui';
import { useAjustes } from '../stores/ajustes';

export default function AjustesGenerales() {
  const a = useAjustes();

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <h2 className="mb-3 text-lg font-bold">Apariencia</h2>
        <Segmentos
          opciones={[
            { valor: 'oscuro', etiqueta: '🌙 Noche' },
            { valor: 'claro', etiqueta: '☀️ Día' },
            { valor: 'sistema', etiqueta: '💻 Sistema' },
          ]}
          valor={a.tema}
          onCambio={a.setTema}
          ariaLabel="Tema"
        />
        <div className="mt-2">
          <Interruptor
            activo={a.reducirAnimaciones}
            onCambio={a.setReducirAnimaciones}
            etiqueta="Reducir animaciones"
            descripcion="Desactiva confeti y transiciones"
          />
        </div>
      </Panel>

      <Panel>
        <h2 className="mb-1 text-lg font-bold">Sonido y vibración</h2>
        <Interruptor activo={a.sonidos} onCambio={a.setSonidos} etiqueta="Efectos de sonido" />
        <Interruptor
          activo={a.vibracion}
          onCambio={a.setVibracion}
          etiqueta="Vibración"
          descripcion="Solo en móviles compatibles"
        />
      </Panel>

      <Panel>
        <h2 className="mb-1 text-lg font-bold">Idioma</h2>
        <Segmentos
          opciones={[{ valor: 'es', etiqueta: '🇪🇸 Español' }]}
          valor="es"
          onCambio={() => {}}
          ariaLabel="Idioma"
        />
        <p className="mt-2 text-sm text-texto-2">Más idiomas próximamente.</p>
      </Panel>
    </div>
  );
}
