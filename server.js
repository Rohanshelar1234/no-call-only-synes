const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: false
  },
  transports: ["websocket", "polling"]
});

// Serve static files from frontend directory
app.use(express.static("frontend"));

// Track rooms and users
let rooms = {};
let users = {};

// Helper function to generate random color
function getRandomColor() {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Helper function to get current timestamp
function getTimestamp() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// Clean up empty rooms after 10 minutes
setInterval(() => {
  const now = Date.now();
  for (let roomId in rooms) {
    if (rooms[roomId].users.length === 0 && (now - rooms[roomId].lastActivity) > 600000) {
      delete rooms[roomId];
      console.log("Cleaned up empty room:", roomId);
    }
  }
}, 60000); // Check every minute

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join room
  socket.on("join-room", (data) => {
    const { roomId, username, password } = data;
    
    // Create room if it doesn't exist
    if (!rooms[roomId]) {
      rooms[roomId] = {
        users: [],
        password: password || null,
        notepad: "",
        createdAt: Date.now(),
        lastActivity: Date.now()
      };
    }

    // Check password if room has one
    if (rooms[roomId].password && rooms[roomId].password !== password) {
      socket.emit("join-error", "Incorrect password");
      return;
    }

    // Add user to room
    const userColor = getRandomColor();
    const userData = {
      id: socket.id,
      username: username,
      color: userColor,
      joinedAt: Date.now()
    };

    rooms[roomId].users.push(userData);
    rooms[roomId].lastActivity = Date.now();
    
    // Join socket room
    socket.join(roomId);
    socket.currentRoom = roomId;
    socket.userData = userData;

    console.log(`${username} joined room ${roomId}`);

    // Send success to user
    socket.emit("join-success", {
      roomId: roomId,
      userList: rooms[roomId].users
    });

    // Notify others in room
    socket.to(roomId).emit("user-joined", {
      username: username,
      userList: rooms[roomId].users
    });

    // Send system message
    const systemMessage = {
      username: "System",
      message: `${username} joined the room`,
      time: getTimestamp(),
      color: "#888888"
    };
    io.to(roomId).emit("new-message", systemMessage);

    // Update user count
    io.to(roomId).emit("user-count", rooms[roomId].users.length);
  });

  // Send message
  socket.on("send-message", (data) => {
    const { roomId, message, username } = data;
    
    if (!rooms[roomId]) return;

    const messageData = {
      username: username,
      message: message,
      time: getTimestamp(),
      color: socket.userData?.color || "#FFFFFF"
    };

    rooms[roomId].lastActivity = Date.now();
    io.to(roomId).emit("new-message", messageData);
    console.log(`Message in ${roomId}: ${username}: ${message}`);
  });

  // Sync notepad
  socket.on("sync-note", (data) => {
    const { roomId, content } = data;
    
    if (!rooms[roomId]) return;

    rooms[roomId].notepad = content;
    rooms[roomId].lastActivity = Date.now();
    
    socket.to(roomId).emit("note-updated", content);
    console.log(`Notepad updated in room ${roomId}`);
  });

  // Typing indicators
  socket.on("typing-start", (data) => {
    const { roomId, username } = data;
    
    if (!rooms[roomId]) return;

    socket.to(roomId).emit("user-typing", username);
  });

  socket.on("typing-stop", (data) => {
    const { roomId, username } = data;
    
    if (!rooms[roomId]) return;

    socket.to(roomId).emit("user-stopped-typing", username);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    if (socket.currentRoom && socket.userData) {
      const roomId = socket.currentRoom;
      const username = socket.userData.username;

      // Remove user from room
      if (rooms[roomId]) {
        rooms[roomId].users = rooms[roomId].users.filter(user => user.id !== socket.id);
        rooms[roomId].lastActivity = Date.now();

        // Notify others
        socket.to(roomId).emit("user-left", {
          username: username,
          userList: rooms[roomId].users
        });

        // Send system message
        const systemMessage = {
          username: "System",
          message: `${username} left the room`,
          time: getTimestamp(),
          color: "#888888"
        };
        io.to(roomId).emit("new-message", systemMessage);

        // Update user count
        io.to(roomId).emit("user-count", rooms[roomId].users.length);

        // Clear notepad if room is empty
        if (rooms[roomId].users.length === 0) {
          rooms[roomId].notepad = "";
        }
      }
    }

    // Clean up user data
    delete users[socket.id];
  });
});

server.listen(3000, () => {
  console.log("🚀 No Call Just Sync server running on port 3000");
});
