const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

io.on("connection", (socket) => {

  socket.on("join-room", (roomId) => {
    console.log("User joined:", roomId);

    socket.join(roomId);

    // ✅ send success to frontend
    socket.emit("join-success", roomId);
  });

});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});
