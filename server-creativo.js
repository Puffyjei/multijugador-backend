const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: { origin: "*" }
});

const players = {};
const blocks = []; // bloques colocados

io.on("connection", socket => {
  console.log("Jugador conectado:", socket.id);

  // Nuevo jugador
  socket.on("newPlayer", name => {
    players[socket.id] = {
      x: 100 + Math.random() * 100,
      y: 300,
      vy: 0,
      name: name,
      grounded: false,
    };
    socket.emit("init", socket.id);
  });

  // Movimiento (con vuelo)
  socket.on("keys", keys => {
    const p = players[socket.id];
    if (!p) return;

    if (keys["ArrowLeft"]) p.x -= 5;
    if (keys["ArrowRight"]) p.x += 5;
    if (keys["ArrowUp"]) p.y -= 5;    // Vuela hacia arriba
    if (keys["ArrowDown"]) p.y += 5;  // Vuela hacia abajo
  });

  // Colocar bloque (redondeado a la cuadrícula de 40x40)
  socket.on("placeBlock", ({ x, y }) => {
    const gx = Math.floor(x / 40) * 40;
    const gy = Math.floor(y / 40) * 40;

    // Evita colocar duplicados
    const exists = blocks.some(b => b.x === gx && b.y === gy);
    if (!exists) blocks.push({ x: gx, y: gy });
  });

  // Quitar bloque
  socket.on("removeBlock", ({ x, y }) => {
    const gx = Math.floor(x / 40) * 40;
    const gy = Math.floor(y / 40) * 40;
    const index = blocks.findIndex(b => b.x === gx && b.y === gy);
    if (index !== -1) blocks.splice(index, 1);
  });

  // Desconexión
  socket.on("disconnect", () => {
    delete players[socket.id];
  });
});

// Enviar estado a todos los jugadores
setInterval(() => {
  io.emit("state", {
    players,
    blocks
  });
}, 1000 / 60);

// Iniciar servidor
http.listen(process.env.PORT || 3000, () => {
  console.log("Servidor creativo en marcha");
});
