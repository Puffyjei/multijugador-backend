const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let players = {};

io.on("connection", socket => {
  console.log("Jugador conectado:", socket.id);

  socket.on("newPlayer", username => {
    players[socket.id] = {
      x: 100, y: 400, vy: 0,
      name: username,
      life: 100,
      keys: {}
    };
    socket.emit("init", socket.id);
  });

  socket.on("keys", keys => {
    if (players[socket.id]) players[socket.id].keys = keys;
  });

  socket.on("attack", direction => {
    const attacker = players[socket.id];
    if (!attacker) return;

    let closest = null;
    let closestDist = Infinity;

    for (let id in players) {
      if (id === socket.id) continue;

      const target = players[id];
      const dx = target.x - attacker.x;

      // Solo considerar jugadores en la dirección dada
      if ((direction === "right" && dx >= 0) || (direction === "left" && dx <= 0)) {
        const dist = Math.abs(dx);
        if (dist < 100 && dist < closestDist) {
          closest = target;
          closest.id = id;
          closestDist = dist;
        }
      }
    }

    if (closest) {
      closest.life -= 25;
      if (closest.life <= 0) {
        io.emit("chat", {
          name: "💀",
          msg: `${attacker.name} ha asesinado a ${closest.name}`
        });
        players[closest.id] = {
          x: 100, y: 400, vy: 0,
          name: closest.name,
          life: 100,
          keys: {}
        };
      }
    }
  });

  socket.on("chat", msg => {
    const p = players[socket.id];
    if (p) io.emit("chat", { name: p.name, msg });
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
  });
});

setInterval(() => {
  for (let id in players) {
    const p = players[id];
    const keys = p.keys || {};
    if (keys["ArrowLeft"]) p.x -= 7;
    if (keys["ArrowRight"]) p.x += 7;
    if (keys["ArrowUp"] && p.vy === 0) p.vy = -14;

    p.vy += 1;
    p.y += p.vy;
    if (p.y >= 400) { p.y = 400; p.vy = 0; }
    if (p.x < 0) p.x = 0;
    if (p.x > 3000) p.x = 3000;
  }
  io.emit("state", players);
}, 1000 / 60);

server.listen(process.env.PORT || 3000, () => {
  console.log("Servidor Bronx listo");
});
