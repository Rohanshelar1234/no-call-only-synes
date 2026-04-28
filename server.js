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
app.use(express.static("frontend"));

// Room state management
let rooms = {};

// Health check endpoint
app.get("/", (req, res) => {
  res.send("🎬 SceneSync Premium Server is running!");
});

io.on("connection", (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  socket.on("join-room", (room) => {
    if (!room) {
      socket.emit("error", "Room ID is required");
      return;
    }

    socket.join(room);
    
    // Initialize room if it doesn't exist
    if (!rooms[room]) {
      rooms[room] = {
        users: [],
        createdAt: new Date().toISOString()
      };
    }
    
    // Add user to room
    rooms[room].users.push({
      id: socket.id,
      joinedAt: new Date().toISOString()
    });
    
    console.log(`🏠 ${socket.id} joined room ${room}. Users: ${rooms[room].users.length}`);
    
    // Notify others in room
    socket.to(room).emit("user-joined", {
      userId: socket.id,
      userCount: rooms[room].users.length
    });
  });

  socket.on("set-url", ({ room, url }) => {
    if (!room || !url) return;
    
    console.log(`🎬 Video URL set in room ${room}: ${url}`);
    io.to(room).emit("set-url", url);
  });

  socket.on("chat", ({ room, msg }) => {
    if (!room || !msg) return;
    
    console.log(`💬 Message in room ${room}: ${msg}`);
    io.to(room).emit("chat", msg);
  });

  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.id}`);
    
    // Remove user from all rooms
    Object.keys(rooms).forEach(room => {
      if (rooms[room]) {
        rooms[room].users = rooms[room].users.filter(user => user.id !== socket.id);
        
        const userCount = rooms[room].users.length;
        socket.to(room).emit("user-left", {
          userId: socket.id,
          userCount: userCount
        });
        
        // Clean up empty rooms
        if (userCount === 0) {
          delete rooms[room];
          console.log(`🗑️ Room ${room} deleted (empty)`);
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 SceneSync Premium Server running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔗 Ready for premium co-watching experience!`);
});
