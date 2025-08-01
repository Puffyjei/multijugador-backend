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
    players[socket.id] = { x: 100, y: 400, vy: 0, name: username };
    socket.emit("init", socket.id);
  });

  socket.on("keys", keys => {
    if (players[socket.id]) players[socket.id].keys = keys;
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

server.listen(process.env.PORT || 3000, () => console.log("Tranqui listo"));
