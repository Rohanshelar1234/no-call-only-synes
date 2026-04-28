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
const rooms = {};

// Health check endpoint
app.get("/", (req, res) => {
  res.send("🎬 SceneSync Server is running!");
});

io.on("connection", (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  socket.on("join-room", (room) => {
    if (!room) {
      console.log("❌ Room ID is required");
      return;
    }

    socket.join(room);
    
    // Initialize room if it doesn't exist
    if (!rooms[room]) {
      rooms[room] = {
        video: "",
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
    
    // Send current video to the new user
    if (rooms[room].video) {
      socket.emit("set-url", rooms[room].video);
    }
    
    // Notify others in room
    socket.to(room).emit("user-joined", {
      userId: socket.id,
      userCount: rooms[room].users.length
    });
  });

  socket.on("set-url", ({ room, url }) => {
    if (!room || !url) {
      console.log("❌ Room and URL required");
      return;
    }
    
    if (!rooms[room]) {
      console.log(`❌ Room ${room} does not exist`);
      return;
    }
    
    // Update room video
    rooms[room].video = url;
    
    console.log(`🎬 Video URL set in room ${room}: ${url}`);
    
    // Send to all users in room
    io.to(room).emit("set-url", url);
  });

  socket.on("chat", ({ room, msg }) => {
    if (!room || !msg) {
      console.log("❌ Room and message required");
      return;
    }
    
    if (!rooms[room]) {
      console.log(`❌ Room ${room} does not exist`);
      return;
    }
    
    console.log(`💬 Message in room ${room}: ${msg}`);
    
    // Send to all users in room
    io.to(room).emit("chat", { msg, userId: socket.id });
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
        
        console.log(`👋 User ${socket.id} left room ${room}. Users: ${userCount}`);
        
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
  console.log(`🚀 SceneSync Server running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔗 Ready for real-time co-watching!`);
});
