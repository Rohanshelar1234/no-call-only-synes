const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.static("frontend"));

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (room) => {
    socket.join(room);
    console.log(socket.id + " joined " + room);
  });

  socket.on("set-url", ({ room, url }) => {
    io.to(room).emit("set-url", url);
  });

  socket.on("chat", ({ room, msg }) => {
    io.to(room).emit("chat", msg);
  });

});

server.listen(3000, () => {
  console.log("Server running on 3000");
});
