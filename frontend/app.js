// Socket connection
const socket = io("http://localhost:3000");

// Global state
let username = "";
let room = "";
let userColor = "";
let typingTimeout = null;
let notepadTimeout = null;

// Web Audio API for message sounds
function playMessageSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.frequency.value = 440;
    gainNode.gain.value = 0.1;
    
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (error) {
    console.log("Audio not available");
  }
}

// Username setup
function setUsername() {
  const input = document.getElementById("usernameInput");
  const value = input.value.trim();
  
  if (!value) {
    input.classList.add("shake");
    setTimeout(() => input.classList.remove("shake"), 500);
    return;
  }
  
  username = value;
  document.getElementById("roomSection").style.display = "block";
  input.style.display = "none";
  event.target.style.display = "none";
}

// Create room
function createRoom() {
  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  const password = document.getElementById("passwordInput").value.trim();
  
  joinRoomById(roomId, password);
}

// Join room
function joinRoom() {
  const input = document.getElementById("roomInput");
  const roomId = input.value.trim().toUpperCase();
  const password = document.getElementById("passwordInput").value.trim();
  
  if (!roomId) {
    input.classList.add("shake");
    setTimeout(() => input.classList.remove("shake"), 500);
    return;
  }
  
  joinRoomById(roomId, password);
}

// Join room by ID
function joinRoomById(roomId, password = "") {
  room = roomId;
  
  socket.emit("join-room", {
    roomId: roomId,
    username: username,
    password: password
  });
}

// Copy room ID
function copyRoomId() {
  if (!room) return;
  
  navigator.clipboard.writeText(room).then(() => {
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = "✅ Copied!";
    btn.classList.add("success-checkmark");
    
    setTimeout(() => {
      btn.textContent = originalText;
      btn.classList.remove("success-checkmark");
    }, 2000);
  });
}

// Send message
function sendMessage() {
  const input = document.getElementById("messageInput");
  const message = input.value.trim();
  
  if (!message || !room) return;
  
  socket.emit("send-message", {
    roomId: room,
    message: message,
    username: username
  });
  
  input.value = "";
  stopTyping();
  playMessageSound();
}

// Add emoji to message input
function addEmoji(emoji) {
  const input = document.getElementById("messageInput");
  input.value += emoji;
  input.focus();
}

// Typing indicators
function startTyping() {
  if (!room) return;
  
  if (!typingTimeout) {
    socket.emit("typing-start", {
      roomId: room,
      username: username
    });
  }
  
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(stopTyping, 2000);
}

function stopTyping() {
  if (!room) return;
  
  clearTimeout(typingTimeout);
  typingTimeout = null;
  
  socket.emit("typing-stop", {
    roomId: room,
    username: username
  });
}

// Notepad sync
function syncNotepad() {
  if (!room) return;
  
  const content = document.getElementById("notepad").value;
  
  clearTimeout(notepadTimeout);
  notepadTimeout = setTimeout(() => {
    socket.emit("sync-note", {
      roomId: room,
      content: content
    });
    
    updateSyncStatus("Syncing...");
    setTimeout(() => updateSyncStatus("Synced"), 500);
  }, 500);
}

// UI Updates
function showRoomScreen() {
  document.getElementById("landingScreen").style.display = "none";
  document.getElementById("roomScreen").style.display = "block";
  document.getElementById("roomIdDisplay").textContent = `Room: ${room}`;
}

function updateUsersList(userList) {
  const container = document.getElementById("usersList");
  container.innerHTML = "";
  
  userList.forEach(user => {
    const userDiv = document.createElement("div");
    userDiv.className = "user-item";
    userDiv.innerHTML = `
      <div class="user-dot"></div>
      <span style="color: ${user.color}; font-weight: bold;">${user.username}</span>
    `;
    container.appendChild(userDiv);
  });
}

function addMessage(data) {
  const container = document.getElementById("chatMessages");
  const messageDiv = document.createElement("div");
  messageDiv.className = data.username === "System" ? "message system-message" : "message";
  
  messageDiv.innerHTML = `
    <div class="message-header">
      <span class="username" style="color: ${data.color};">${data.username}</span>
      <span class="timestamp">${data.time}</span>
    </div>
    <div class="message-content">${data.message}</div>
  `;
  
  container.appendChild(messageDiv);
  container.scrollTop = container.scrollHeight;
}

function showTypingIndicator(typingUser) {
  const indicator = document.getElementById("typingIndicator");
  indicator.innerHTML = `
    <div class="typing-dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
    ${typingUser} is typing...
  `;
}

function hideTypingIndicator() {
  document.getElementById("typingIndicator").innerHTML = "";
}

function updateSyncStatus(status) {
  document.getElementById("syncStatus").textContent = status;
}

// Socket event handlers
socket.on("connect", () => {
  console.log("Connected to server");
  document.getElementById("connectionStatus").textContent = "Connected";
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
  document.getElementById("connectionStatus").textContent = "Disconnected";
});

socket.on("join-success", (data) => {
  console.log("Successfully joined room:", data.roomId);
  showRoomScreen();
  updateUsersList(data.userList);
  playMessageSound();
});

socket.on("join-error", (message) => {
  alert("Error: " + message);
});

socket.on("new-message", (data) => {
  addMessage(data);
  if (data.username !== username) {
    playMessageSound();
  }
});

socket.on("user-joined", (data) => {
  updateUsersList(data.userList);
});

socket.on("user-left", (data) => {
  updateUsersList(data.userList);
});

socket.on("user-count", (count) => {
  document.getElementById("userCountDisplay").textContent = `Users: ${count}`;
});

socket.on("note-updated", (content) => {
  document.getElementById("notepad").value = content;
  updateSyncStatus("Synced");
});

socket.on("user-typing", (typingUser) => {
  if (typingUser !== username) {
    showTypingIndicator(typingUser);
  }
});

socket.on("user-stopped-typing", () => {
  hideTypingIndicator();
});

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Message input events
  const messageInput = document.getElementById("messageInput");
  messageInput.addEventListener("input", startTyping);
  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });
  
  // Notepad sync
  document.getElementById("notepad").addEventListener("input", syncNotepad);
  
  // Username input enter key
  document.getElementById("usernameInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      setUsername();
    }
  });
  
  // Room input enter key
  document.getElementById("roomInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      joinRoom();
    }
  });
});

// Focus management
document.getElementById("usernameInput").focus();
