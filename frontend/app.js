const socket = io();

let room = "";

// Socket connection debugging
socket.on("connect", () => {
  console.log("✅ Connected to backend successfully!");
});

socket.on("disconnect", () => {
  console.log("❌ Disconnected from backend");
});

socket.on("connect_error", (error) => {
  console.error("❌ Connection error:", error);
});

function createRoom() {
  console.log("Create Room button clicked!");
  
  try {
    // Generate room ID
    room = Math.random().toString(36).substring(2, 8);
    console.log("Generated room ID:", room);
    
    // Update UI
    const roomDisplay = document.getElementById("roomDisplay");
    if (roomDisplay) {
      roomDisplay.innerText = "Room: " + room;
      console.log("UI updated with room ID");
    } else {
      console.error("roomDisplay element not found!");
    }
    
    // Emit to socket
    if (socket && socket.emit) {
      socket.emit("join-room", room);
      console.log("Emitted join-room to server");
    } else {
      console.error("Socket not available!");
    }
    
  } catch (error) {
    console.error("Error in createRoom:", error);
  }
}

function joinRoom() {
  console.log("Join Room button clicked!");
  
  try {
    const roomInput = document.getElementById("roomInput");
    if (!roomInput || !roomInput.value.trim()) {
      alert("Please enter a room ID!");
      return;
    }
    
    room = roomInput.value.trim().toUpperCase();
    console.log("Joining room:", room);
    
    // Update UI
    const roomDisplay = document.getElementById("roomDisplay");
    if (roomDisplay) {
      roomDisplay.innerText = "Room: " + room;
    }
    
    // Emit to socket
    if (socket && socket.emit) {
      socket.emit("join-room", room);
      console.log("Emitted join-room to server");
    }
    
  } catch (error) {
    console.error("Error in joinRoom:", error);
  }
}

function setUrl() {
  console.log("Set URL button clicked!");
  
  try {
    if (!room) {
      alert("Create or join room first!");
      return;
    }

    const urlInput = document.getElementById("urlInput");
    if (!urlInput || !urlInput.value.trim()) {
      alert("Please enter a YouTube URL!");
      return;
    }
    
    let url = urlInput.value.trim();
    console.log("Setting URL:", url);
    
    // Convert YouTube URL to embed if needed
    if (url.includes("youtube.com/watch?v=")) {
      const videoId = url.split("v=")[1];
      url = "https://www.youtube.com/embed/" + videoId;
      console.log("Converted to embed URL:", url);
    }
    
    // Emit to socket
    if (socket && socket.emit) {
      socket.emit("set-url", { room, url });
      console.log("Emitted set-url to server");
    }
    
  } catch (error) {
    console.error("Error in setUrl:", error);
  }
}

socket.on("set-url", (url) => {
  console.log("Received URL:", url);
  try {
    const video = document.getElementById("video");
    if (video) {
      video.src = url;
      console.log("Video src updated");
    }
  } catch (error) {
    console.error("Error updating video:", error);
  }
});

function sendMsg() {
  console.log("Send Message button clicked!");
  
  try {
    if (!room) {
      alert("Create or join room first!");
      return;
    }

    const msgInput = document.getElementById("msg");
    if (!msgInput || !msgInput.value.trim()) {
      alert("Please enter a message!");
      return;
    }
    
    const msg = msgInput.value.trim();
    console.log("Sending message:", msg);
    
    // Emit to socket
    if (socket && socket.emit) {
      socket.emit("chat", { room, msg });
      console.log("Emitted chat to server");
    }
    
    // Clear input
    msgInput.value = "";
    
  } catch (error) {
    console.error("Error in sendMsg:", error);
  }
}

socket.on("chat", (msg) => {
  console.log("Received chat message:", msg);
  try {
    const chat = document.getElementById("chat");
    if (chat) {
      const div = document.createElement("div");
      div.innerText = msg;
      chat.appendChild(div);
      
      // Auto-scroll to bottom
      chat.scrollTop = chat.scrollHeight;
      console.log("Chat message added");
    }
  } catch (error) {
    console.error("Error adding chat message:", error);
  }
});

// Add user count listener
socket.on("user-count", (count) => {
  console.log("User count:", count);
  try {
    // You can update UI with user count if needed
    const usersElement = document.getElementById("users");
    if (usersElement) {
      usersElement.innerText = "Users: " + count;
    }
  } catch (error) {
    console.error("Error updating user count:", error);
  }
});

console.log("SceneSync frontend loaded successfully!");
