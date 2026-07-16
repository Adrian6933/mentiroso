# 🤥 El Mentiroso

El juego viral de TikTok del **impostor de famosos**: todos los jugadores reciben en secreto el mismo famoso (o palabra)… menos el Mentiroso, que tiene que improvisar pistas para no ser descubierto. Pistas → debate → votación → revelación.

Web hecha con **Astro + React + Tailwind** (juego) y **Node + Socket.IO** (multijugador online). Sin registro, sin base de datos, móvil primero.

## Cómo arrancar

```bash
npm install
npm run dev        # arranca web (4321) + servidor online (4322) a la vez
```

- Web: http://localhost:4321
- Servidor de salas: http://localhost:4322 (comprobación en `/salud`)

Otros comandos:

```bash
npm test                       # tests del motor del juego (Vitest)
npm run build                  # build de producción (web + typecheck server)
npm run dev:web                # solo la web
npm run dev:server             # solo el servidor online
```

Para desplegar la web apuntando a un servidor de salas remoto, define `PUBLIC_SERVER_URL` al hacer el build.

## Estructura

```
shared/   Motor del juego (TypeScript puro) + packs de palabras + textos.
          El MISMO motor corre en el navegador (modo local) y en el servidor (online).
web/      Astro + React. Páginas: /, /local, /online, /sala, /packs, /ajustes, /como-jugar
server/   Node + Socket.IO. Salas en memoria, vistas censuradas por jugador (anti-trampas),
          reconexión con token, migración de anfitrión, timers de fase.
```

## Qué incluye

- **Modo local** (pasar el móvil) y **modo online** (salas con código, enlace y QR).
- **6 modos de juego**: Clásico, Infiltrado (palabra parecida), Mixto (eliminación por rondas), Preguntas (estilo TikTok), Caos (roles ocultos) y Personalizado.
- **Roles**: Civil, Mentiroso, Infiltrado, Payaso, Cómplice y Vidente.
- **Muchos ajustes**: nº de mentirosos e infiltrados, rondas de pistas, pistas escritas o verbales, votación secreta o abierta, empates, adivinanza final (con robo de victoria), ayudas al mentiroso, temporizadores, puntuación…
- **Packs de contenido** (pocas palabras de momento, para probar): Futbolistas, Cantantes, Actores, Streamers, Comida y Animales, más **editor de packs propios** con import/export JSON (`/packs`).
- **Marcador acumulado**, chat en las salas, tema día/noche, sonidos, vibración y modo de animaciones reducidas.

## Anti-trampas (online)

El servidor nunca envía la palabra secreta ni los roles ajenos al cliente: cada jugador recibe una **vista censurada** del estado (`vistaParaJugador` en `shared/src/engine/vista.ts`). El mentiroso no puede encontrar la palabra ni mirando el tráfico de red.

## Créditos de assets

Los emojis 3D de `web/public/emoji3d/` son de [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji) (licencia MIT). El componente [Emoji3D.tsx](web/src/components/Emoji3D.tsx) los mapea desde el carácter emoji y cae al emoji nativo si no hay asset.

## Añadir contenido

Las palabras viven en `shared/src/data/packs.ts`. Cada entrada:

```ts
{ id: 'fut-messi', texto: 'Lionel Messi', similares: ['Cristiano Ronaldo', 'Neymar'] }
```

`similares` alimenta el modo Infiltrado y `preguntas` (a nivel de pack) el modo Preguntas. Los usuarios también pueden crear packs desde la web en `/packs` (se guardan en su dispositivo).
