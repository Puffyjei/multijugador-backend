const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: { origin: "*" }
});

const players = {};
const blocks = []; // lista de bloques colocados

io.on("connection", socket => {
  console.log("Jugador conectado:", socket.id);

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

  socket.on("keys", keys => {
    const p = players[socket.id];
    if (!p) return;

    if (keys["ArrowLeft"]) p.x -= 5;
    if (keys["ArrowRight"]) p.x += 5;
    if (keys["ArrowUp"]) p.y -= 5;   // Vuela
    if (keys["ArrowDown"]) p.y += 5;
  });

  socket.on("placeBlock", ({ x, y }) => {
    blocks.push({ x, y });
  });

  socket.on("removeBlock", ({ x, y }) => {
    const index = blocks.findIndex(b => b.x === x && b.y === y);
    if (index !== -1) blocks.splice(index, 1);
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
  });
});

// Enviar estado a todos
setInterval(() => {
  io.emit("state", {
    players,
    blocks
  });
}, 1000 / 60);

http.listen(process.env.PORT || 3000, () => {
  console.log("Servidor creativo en marcha");
});
