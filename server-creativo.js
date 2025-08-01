const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: {
    origin: "*"
  }
});

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Servidor Creativo corriendo");
});

let players = {};
let blocks = [];

io.on("connection", socket => {
  console.log("Jugador conectado:", socket.id);

  socket.on("newPlayer", name => {
    players[socket.id] = {
      x: 100 + Math.random() * 100,
      y: 100,
      name,
      mode: "creativo"
    };
    socket.emit("init", socket.id);
    io.emit("blocks", blocks);
  });

  socket.on("keys", keys => {
    const p = players[socket.id];
    if (!p) return;

    const speed = 4;

    if (keys["ArrowLeft"]) p.x -= speed;
    if (keys["ArrowRight"]) p.x += speed;
    if (keys["ArrowUp"]) p.y -= speed;
    if (keys["ArrowDown"]) p.y += speed;

    // Limitar posiciones si quieres
  });

  socket.on("chat", msg => {
    const p = players[socket.id];
    if (!p) return;
    io.emit("chat", { name: p.name, msg });
  });

  socket.on("placeBlock", ({ x, y }) => {
    blocks.push({ x: Math.floor(x / 40) * 40, y: Math.floor(y / 40) * 40 });
    io.emit("blocks", blocks);
  });

  socket.on("removeBlock", ({ x, y }) => {
    const bx = Math.floor(x / 40) * 40;
    const by = Math.floor(y / 40) * 40;
    blocks = blocks.filter(b => b.x !== bx || b.y !== by);
    io.emit("blocks", blocks);
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
  });
});

setInterval(() => {
  io.emit("state", players);
}, 1000 / 60);

http.listen(PORT, () => {
  console.log("Servidor Creativo escuchando en puerto", PORT);
});
