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

  socket.on("newPlayer", () => {
    players[socket.id] = { x: 100, y: 100 };
    io.emit("updatePlayers", players);
  });

  socket.on("playerMove", pos => {
    if (players[socket.id]) {
      players[socket.id].x = pos.x;
      players[socket.id].y = pos.y;
      io.emit("updatePlayers", players);
    }
  });

  socket.on("disconnect", () => {
    console.log("Jugador desconectado:", socket.id);
    delete players[socket.id];
    io.emit("removePlayer", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor listo en puerto ${PORT}`);
});
