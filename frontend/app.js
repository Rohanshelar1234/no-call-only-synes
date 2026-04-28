// SceneSync - Safe Functionality Fix (NO UI CHANGES)
let room = ""

// Connect to production backend
const socket = io("https://no-call-only-synes.onrender.com")

// YouTube URL conversion function
function convertToEmbed(url) {
  if (url.includes("watch?v=")) {
    return url.replace("watch?v=", "embed/");
  }

  if (url.includes("youtu.be/")) {
    return url.replace("youtu.be/", "youtube.com/embed/");
  }

  return url;
}

// Socket Events
socket.on("connect", () => {
  console.log("✅ Connected to production server")
  showStatus("Connected to server", "success")
})

socket.on("disconnect", () => {
  console.log("❌ Disconnected from server")
  showStatus("Disconnected from server", "error")
})

socket.on("connect_error", (error) => {
  console.error("❌ Connection error:", error)
  showStatus("Failed to connect to server", "error")
})

socket.on("reconnect", () => {
  console.log("🔄 Reconnected to server")
  showStatus("Reconnected to server", "success")
})

socket.on("reconnect_attempt", (attemptNumber) => {
  console.log(`🔄 Reconnection attempt ${attemptNumber}`)
})

// SAFE Room Functions
function createRoom() {
  console.log("Create Room clicked")
  
  room = Math.random().toString(36).substring(2, 8).toUpperCase()
  
  const roomDisplayEl = document.getElementById("roomDisplay")
  if (roomDisplayEl) {
    roomDisplayEl.innerText = "Room: " + room
  }
  
  const roomInputEl = document.getElementById("roomInput")
  if (roomInputEl) {
    roomInputEl.value = ""
  }
  
  socket.emit("join-room", room)
  
  showStatus(`Room ${room} created!`, "success")
  console.log("Created room:", room)
}

function joinRoom() {
  console.log("Join Room clicked")
  
  const roomInputEl = document.getElementById("roomInput")
  
  if (!roomInputEl || !roomInputEl.value) {
    alert("Enter Room ID")
    return
  }
  
  room = roomInputEl.value.trim().toUpperCase()
  
  const roomDisplayEl = document.getElementById("roomDisplay")
  if (roomDisplayEl) {
    roomDisplayEl.innerText = "Room: " + room
  }
  
  if (roomInputEl) {
    roomInputEl.value = ""
  }
  
  socket.emit("join-room", room)
  
  showStatus(`Joined room ${room}`, "success")
  console.log("Joined room:", room)
}

// SAFE Video Functions
function setUrl() {
  console.log("Load Video clicked")
  
  const urlInputEl = document.getElementById("urlInput")
  
  if (!room) {
    alert("Join room first")
    return
  }
  
  if (!urlInputEl || !urlInputEl.value) {
    alert("Enter video URL")
    return
  }
  
  let url = urlInputEl.value.trim()
  
  // Convert YouTube URL to embed format using the improved function
  url = convertToEmbed(url)
  
  socket.emit("set-url", { room, url })
  
  showStatus("Loading video...", "info")
  console.log("Setting video URL:", url)
}

// Receive video URL from server
socket.on("set-url", (url) => {
  if (url) {
    const videoEl = document.getElementById("video")
    if (videoEl) {
      videoEl.src = url
      showStatus("Video loaded!", "success")
      console.log("Video URL received:", url)
    }
  }
})

// SAFE Chat Functions
function sendMsg() {
  console.log("Send Message clicked")
  
  const msgEl = document.getElementById("msg")
  
  if (!room) {
    alert("Join room first")
    return
  }
  
  if (!msgEl || !msgEl.value) {
    alert("Enter message")
    return
  }
  
  const message = msgEl.value.trim()
  
  socket.emit("chat", { room, msg: message })
  
  if (msgEl) {
    msgEl.value = ""
  }
  
  console.log("Sent message:", message)
}

// Receive chat messages
socket.on("chat", (data) => {
  const chatEl = document.getElementById("chat")
  if (chatEl) {
    const messageDiv = document.createElement("div")
    messageDiv.className = "chat-message"
    messageDiv.textContent = data.msg || data // Handle both formats
    chatEl.appendChild(messageDiv)
    chatEl.scrollTop = chatEl.scrollHeight
    
    console.log("Received message:", data)
  }
})

// SAFE Status Display
function showStatus(message, type) {
  const statusEl = document.getElementById("status")
  if (statusEl) {
    statusEl.textContent = message
    statusEl.className = `status ${type}`
    statusEl.style.display = "block"
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      if (statusEl) {
        statusEl.style.display = "none"
      }
    }, 3000)
  }
}

// SAFE Keyboard shortcuts
document.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const activeElement = document.activeElement
    if (activeElement) {
      if (activeElement.id === 'roomInput') {
        joinRoom()
      } else if (activeElement.id === 'urlInput') {
        setUrl()
      } else if (activeElement.id === 'msg') {
        sendMsg()
      }
    }
  }
})

// URL parameter handling for auto-join
const urlParams = new URLSearchParams(window.location.search)
const roomFromUrl = urlParams.get('room')

if (roomFromUrl) {
  const roomInputEl = document.getElementById("roomInput")
  if (roomInputEl) {
    roomInputEl.value = roomFromUrl.toUpperCase()
    showStatus(`Room ${roomFromUrl} detected in URL`, "info")
    setTimeout(() => {
      joinRoom()
    }, 1000)
  }
}

console.log("🎬 SceneSync app loaded with safe functionality fixes!")
