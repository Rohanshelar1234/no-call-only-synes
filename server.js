const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.static("frontend"));

let rooms = {}; // 🔥 important

io.on("connection", (socket) => {

  console.log("User connected:", socket.id);

  // JOIN ROOM
  socket.on("join-room", (room) => {

    if (!rooms[room]) {
      rooms[room] = {
        video: "",
        users: []
      };
    }

    socket.join(room);
    rooms[room].users.push(socket.id);

    console.log(`User ${socket.id} joined room ${room}`);

    // 🔥 send success back
    socket.emit("joined-success", room);

    // 🔥 notify others
    io.to(room).emit("user-count", rooms[room].users.length);

    // 🔥 send existing video
    if (rooms[room].video) {
      socket.emit("set-video", rooms[room].video);
    }
  });

  // SET VIDEO
  socket.on("set-video", ({ room, url }) => {
    if (rooms[room]) {
      rooms[room].video = url;
      io.to(room).emit("set-video", url);
    }
  });

  // CHAT
  socket.on("chat", ({ room, msg }) => {
    io.to(room).emit("chat", msg);
  });

  // SCREEN SHARE
  socket.on("screen-share-start", ({ room }) => {
    console.log(`User ${socket.id} started sharing screen in room ${room}`);
    socket.to(room).emit("screen-share-start");
  });

  socket.on("screen-share-stop", ({ room }) => {
    console.log(`User ${socket.id} stopped sharing screen in room ${room}`);
    socket.to(room).emit("screen-share-stop");
  });

  // PLAY/PAUSE
  socket.on("play", (room) => {
    console.log(`User ${socket.id} played video in room ${room}`);
    socket.to(room).emit("play");
  });

  socket.on("pause", (room) => {
    console.log(`User ${socket.id} paused video in room ${room}`);
    socket.to(room).emit("pause");
  });

  // TYPING
  socket.on("typing", (room) => {
    console.log(`User ${socket.id} is typing in room ${room}`);
    socket.to(room).emit("typing");
  });

  socket.on("stop-typing", (room) => {
    console.log(`User ${socket.id} stopped typing in room ${room}`);
    socket.to(room).emit("stop-typing");
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    for (let room in rooms) {
      rooms[room].users = rooms[room].users.filter(id => id !== socket.id);
      io.to(room).emit("user-count", rooms[room].users.length);
    }
  });

});

server.listen(3000, () => console.log("Server running on 3000"));
