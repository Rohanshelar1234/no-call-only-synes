const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { 
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static("frontend"));

// Room state management
const rooms = {};

// Health check endpoint
app.get("/", (req, res) => {
  res.send("🎬 SceneSync Server is running!");
});

io.on("connection", (socket) => {

  socket.on("join-room", (room) => {
    socket.join(room);

    if (!rooms[room]) {
      rooms[room] = { video: "" };
    }

    socket.emit("set-url", rooms[room].video);
  });

  socket.on("set-url", ({ room, url }) => {
    rooms[room].video = url;
    io.to(room).emit("set-url", url);
  });

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 SceneSync Server running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔗 Ready for real-time co-watching!`);
});
