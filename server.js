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

// Enhanced room state management
let rooms = {};

// Add a health check endpoint
app.get("/", (req, res) => {
  res.send("SceneSync Advanced Backend is running!");
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join-room", (data) => {
    const { room, username } = data;
    
    if (!room || !username) {
      socket.emit("error", "Room ID and username are required");
      return;
    }

    socket.join(room);

    // Initialize room if it doesn't exist
    if (!rooms[room]) {
      rooms[room] = {
        users: [],
        videoState: { url: "", currentTime: 0, isPlaying: false },
        screenShare: null,
        typingUsers: new Set()
      };
    }

    // Add user to room
    const user = {
      id: socket.id,
      username: username,
      joinedAt: new Date().toISOString()
    };
    
    rooms[room].users.push(user);
    socket.room = room;
    socket.username = username;

    // Send current room state to new user
    socket.emit("room-state", rooms[room]);
    
    // Notify others
    socket.to(room).emit("user-joined", { user, userCount: rooms[room].users.length });
    socket.to(room).emit("chat", { 
      username: "System", 
      message: `${username} joined the room`,
      type: "system"
    });

    // Update user count for everyone
    io.to(room).emit("user-count", rooms[room].users.length);
    io.to(room).emit("users-list", rooms[room].users);

    console.log(`${username} joined room ${room}. Users: ${rooms[room].users.length}`);
  });

  socket.on("set-url", ({ room, url }) => {
    if (!rooms[room]) return;
    
    rooms[room].videoState.url = url;
    rooms[room].videoState.currentTime = 0;
    rooms[room].videoState.isPlaying = false;
    
    io.to(room).emit("set-url", url);
    console.log(`Room ${room}: Video URL set to ${url}`);
  });

  socket.on("play", ({ room, currentTime }) => {
    if (!rooms[room]) return;
    
    rooms[room].videoState.isPlaying = true;
    rooms[room].videoState.currentTime = currentTime;
    
    socket.to(room).emit("play", currentTime);
    console.log(`Room ${room}: Video played at ${currentTime}`);
  });

  socket.on("pause", ({ room, currentTime }) => {
    if (!rooms[room]) return;
    
    rooms[room].videoState.isPlaying = false;
    rooms[room].videoState.currentTime = currentTime;
    
    socket.to(room).emit("pause", currentTime);
    console.log(`Room ${room}: Video paused at ${currentTime}`);
  });

  socket.on("seek", ({ room, currentTime }) => {
    if (!rooms[room]) return;
    
    rooms[room].videoState.currentTime = currentTime;
    
    socket.to(room).emit("seek", currentTime);
    console.log(`Room ${room}: Video seeked to ${currentTime}`);
  });

  socket.on("chat", ({ room, message, username }) => {
    if (!rooms[room] || !message.trim()) return;
    
    const chatMessage = {
      username: username,
      message: message.trim(),
      timestamp: new Date().toISOString(),
      type: "user"
    };
    
    io.to(room).emit("chat", chatMessage);
    console.log(`Room ${room}: ${username} sent message`);
  });

  socket.on("typing-start", ({ room, username }) => {
    if (!rooms[room]) return;
    
    rooms[room].typingUsers.add(username);
    socket.to(room).emit("typing-start", username);
  });

  socket.on("typing-stop", ({ room, username }) => {
    if (!rooms[room]) return;
    
    rooms[room].typingUsers.delete(username);
    socket.to(room).emit("typing-stop", username);
  });

  socket.on("start-screen-share", ({ room }) => {
    if (!rooms[room]) return;
    
    rooms[room].screenShare = {
      userId: socket.id,
      username: socket.username,
      active: true
    };
    
    io.to(room).emit("screen-share-started", {
      userId: socket.id,
      username: socket.username
    });
    
    console.log(`Room ${room}: ${socket.username} started screen sharing`);
  });

  socket.on("stop-screen-share", ({ room }) => {
    if (!rooms[room]) return;
    
    rooms[room].screenShare = null;
    io.to(room).emit("screen-share-stopped");
    
    console.log(`Room ${room}: Screen sharing stopped`);
  });

  socket.on("disconnect", () => {
    if (socket.room && socket.username) {
      const room = socket.room;
      const username = socket.username;
      
      // Remove user from room
      if (rooms[room]) {
        rooms[room].users = rooms[room].users.filter(user => user.id !== socket.id);
        
        // Remove from typing users
        rooms[room].typingUsers.delete(username);
        
        // If screen sharer left, stop screen share
        if (rooms[room].screenShare && rooms[room].screenShare.userId === socket.id) {
          rooms[room].screenShare = null;
          io.to(room).emit("screen-share-stopped");
        }
        
        const userCount = rooms[room].users.length;
        io.to(room).emit("user-count", userCount);
        io.to(room).emit("users-list", rooms[room].users);
        io.to(room).emit("user-left", { username, userCount });
        io.to(room).emit("chat", { 
          username: "System", 
          message: `${username} left the room`,
          type: "system"
        });
        
        // Clean up empty rooms
        if (userCount === 0) {
          delete rooms[room];
          console.log(`Room ${room} deleted (empty)`);
        }
        
        console.log(`${username} left room ${room}. Users: ${userCount}`);
      }
    }
    
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 SceneSync Advanced Server running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔗 Backend ready for connections!`);
});
