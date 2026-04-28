const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

// Enhanced room state management
let rooms = {};

// Add a health check endpoint
app.get("/", (req, res) => {
  res.send("SceneSync Backend is running!");
});

io.on("connection", (socket) => {

  socket.on("join-room", (room) => {
    socket.join(room);

    if (!rooms[room]) {
      rooms[room] = { 
        url: "", 
        users: [],
        videoState: { time: 0, paused: true }
      };
    }

    // Add user to room
    if (!rooms[room].users.includes(socket.id)) {
      rooms[room].users.push(socket.id);
    }

    let count = rooms[room].users.length;

    io.to(room).emit("user-count", count);
    socket.to(room).emit("chat", "A user joined the room");
    socket.emit("state", rooms[room]);
    console.log(`User ${socket.id} joined room ${room}. Users: ${count}`);
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
    // Remove user from all rooms
    Object.keys(rooms).forEach(room => {
      if (rooms[room].users.includes(socket.id)) {
        rooms[room].users = rooms[room].users.filter(user => user !== socket.id);
        let count = rooms[room].users.length;
        io.to(room).emit("user-count", count);
        io.to(room).emit("chat", "A user left the room");
        console.log(`User ${socket.id} left room ${room}. Users: ${count}`);
        
        // Clean up empty rooms
        if (count === 0) {
          delete rooms[room];
          console.log(`Room ${room} deleted (empty)`);
        }
      }
    });
  });

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
