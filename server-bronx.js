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
      x: 100,
      y: 400,
      vy: 0,
      name: username,
      life: 100,
      keys: {},
      direction: "right"
    };
    socket.emit("init", socket.id);
  });

  socket.on("keys", keys => {
    if (players[socket.id]) {
      players[socket.id].keys = keys;

      // Detectar última dirección pulsada
      if (keys["ArrowLeft"]) players[socket.id].direction = "left";
      if (keys["ArrowRight"]) players[socket.id].direction = "right";

      // Atacar si se pulsa tecla de ataque
      if (keys["attack"]) {
        const attacker = players[socket.id];
        let closestId = null;
        let closestDist = Infinity;

        for (let id in players) {
          if (id === socket.id) continue;
          const target = players[id];
          const dx = target.x - attacker.x;
          const inDirection = attacker.direction === "right" ? dx > 0 : dx < 0;
          const distance = Math.abs(dx);

          if (inDirection && distance < 80 && distance < closestDist) {
            closestDist = distance;
            closestId = id;
          }
        }

        if (closestId) {
          players[closestId].life -= 25;

          if (players[closestId].life <= 0) {
            io.emit("chat", {
              name: "💀",
              msg: `${attacker.name} ha asesinado a ${players[closestId].name}`
            });

            // Respawn
            players[closestId].x = 100 + Math.random() * 200;
            players[closestId].y = 400;
            players[closestId].vy = 0;
            players[closestId].life = 100;
          }
        }
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

server.listen(process.env.PORT || 3000, () => console.log("Bronx listo"));
