import { createServer } from 'node:http';
import { Server } from 'socket.io';

const PORT = Number(process.env.PORT ?? 4322);

const http = createServer((req, res) => {
  if (req.url === '/salud') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  res.writeHead(404);
  res.end();
});

export const io = new Server(http, {
  cors: { origin: true, methods: ['GET', 'POST'] },
});

// El registro de salas se monta en salas.ts (multijugador)
import('./salas.js').then(({ montarSalas }) => montarSalas(io)).catch((e) => {
  console.error('No se pudo montar el módulo de salas:', e);
});

http.listen(PORT, () => {
  console.log(`Servidor de El Mentiroso escuchando en http://localhost:${PORT}`);
});
