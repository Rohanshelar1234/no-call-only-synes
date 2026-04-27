const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

let rooms = {};

io.on("connection", (socket) => {

  socket.on("join-room", (room) => {
    socket.join(room);

    if (!rooms[room]) {
      rooms[room] = { url: "" };
    }

    let count = io.sockets.adapter.rooms.get(room)?.size || 1;

    io.to(room).emit("user-count", count);
    socket.to(room).emit("chat", "A user joined the room");
    socket.emit("state", rooms[room]);
  });

  socket.on("set-url", ({ room, url }) => {
    if (!rooms[room]) {
      rooms[room] = {};
    }

    rooms[room].url = url;

    io.to(room).emit("set-url", url);
  });

  socket.on("chat", ({ room, msg }) => {
    io.to(room).emit("chat", msg);
  });

  socket.on("start-share", ({ room }) => {
    socket.to(room).emit("start-share");
  });

  socket.on("video-state", (data) => {
    socket.to(data.room).emit("video-state", data);
  });

  socket.on("disconnect", () => {
    // Update user count for all rooms the socket was in
    socket.rooms.forEach(room => {
      if (room !== socket.id) {
        let count = io.sockets.adapter.rooms.get(room)?.size || 0;
        io.to(room).emit("user-count", count);
      }
    });
  });

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
