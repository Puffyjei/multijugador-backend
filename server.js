const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

let players = {};

io.on("connection", socket => {
  console.log("Jugador conectado:", socket.id);

  socket.on("newPlayer", name => {
    players[socket.id] = {
      x: 100,
      y: 100,
      vy: 0,
      name: name || "Anónimo",
      keys: {}
    };
    socket.emit("init", socket.id);
  });

  socket.on("keys", keys => {
    if (players[socket.id]) {
      players[socket.id].keys = keys;
    }
  });

  socket.on("chat", text => {
    const player = players[socket.id];
    if (player) {
      io.emit("chat", { name: player.name, msg: text });
    }
  });

  socket.on("disconnect", () => {
    console.log("Jugador desconectado:", socket.id);
    delete players[socket.id];
  });
});

setInterval(() => {
  for (let id in players) {
    const player = players[id];
    const keys = player.keys || {};

    // Movimiento horizontal mejorado
    if (keys["ArrowLeft"]) player.x -= 7;
    if (keys["ArrowRight"]) player.x += 7;

    // Salto (si está en el suelo)
    if (keys[" "] && player.vy === 0) {
      player.vy = -14;
    }

    // Gravedad
    player.vy += 1;
    player.y += player.vy;

    // Suelo
    if (player.y >= 400) {
      player.y = 400;
      player.vy = 0;
    }

    // Límite del nivel
    if (player.x < 0) player.x = 0;
    if (player.x > 3000) player.x = 3000;
  }

  io.emit("state", players);
}, 1000 / 60);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor listo en puerto ${PORT}`);
});
