const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.static("frontend"));

let rooms = {};

io.on("connection", (socket) => {

  socket.on("join-room", (roomId) => {
    socket.join(roomId);

    // create room if not exists
    if (!rooms[roomId]) {
      rooms[roomId] = 0;
    }

    rooms[roomId]++;

    console.log("User joined:", roomId);

    // 🔥 send confirmation to user
    socket.emit("join-success", roomId);

    // 🔥 update all users count
    io.to(roomId).emit("user-count", rooms[roomId]);
  });

  socket.on("disconnect", () => {
    for (let roomId in rooms) {
      rooms[roomId]--;
      io.to(roomId).emit("user-count", rooms[roomId]);
    }
  });

});

server.listen(3000, () => console.log("Server running on 3000"));
