const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

let rooms = {};

io.on("connection", (socket) => {

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    
    // Track room users
    if (!rooms[roomId]) {
      rooms[roomId] = 0;
    }
    rooms[roomId]++;
    
    console.log("User joined room:", roomId, "Total users:", rooms[roomId]);
    
    // Send success back to user
    socket.emit("join-success", roomId);
    
    // Send user count to all users in room
    io.to(roomId).emit("user-count", rooms[roomId]);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
    
    // Decrement user count for all rooms
    for (let roomId in rooms) {
      if (rooms[roomId] > 0) {
        rooms[roomId]--;
        console.log("Room", roomId, "now has", rooms[roomId], "users");
        io.to(roomId).emit("user-count", rooms[roomId]);
      }
    }
  });

});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});
