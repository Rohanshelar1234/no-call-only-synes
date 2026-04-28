// SceneSync Advanced Co-Watching Platform
const socket = io("https://no-call-only-synes.onrender.com");

// Global State
let currentRoom = "";
let currentUsername = "";
let isScreenSharing = false;
let localStream = null;
let typingTimeout = null;
let videoPlayer = null;

// DOM Elements
const elements = {
  welcomeModal: null,
  usernameInput: null,
  roomInput: null,
  roomDisplay: null,
  roomInfo: null,
  usersList: null,
  urlInput: null,
  videoPlayer: null,
  videoPlaceholder: null,
  screenShareVideo: null,
  videoControls: null,
  screenShareBtn: null,
  stopShareBtn: null,
  chatInput: null,
  chatMessages: null,
  typingIndicator: null,
  typingText: null,
  connectionStatus: null,
  userCount: null,
  toastContainer: null
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initializeElements();
  setupEventListeners();
  checkUrlParams();
  setupSocketListeners();
  
  console.log('🚀 SceneSync Advanced Platform initialized');
});

function initializeElements() {
  elements.welcomeModal = document.getElementById('welcomeModal');
  elements.usernameInput = document.getElementById('usernameInput');
  elements.roomInput = document.getElementById('roomInput');
  elements.roomDisplay = document.getElementById('roomDisplay');
  elements.roomInfo = document.getElementById('roomInfo');
  elements.usersList = document.getElementById('usersList');
  elements.urlInput = document.getElementById('urlInput');
  elements.videoPlayer = document.getElementById('videoPlayer');
  elements.videoPlaceholder = document.getElementById('videoPlaceholder');
  elements.screenShareVideo = document.getElementById('screenShareVideo');
  elements.videoControls = document.getElementById('videoControls');
  elements.screenShareBtn = document.getElementById('screenShareBtn');
  elements.stopShareBtn = document.getElementById('stopShareBtn');
  elements.chatInput = document.getElementById('chatInput');
  elements.chatMessages = document.getElementById('chatMessages');
  elements.typingIndicator = document.getElementById('typingIndicator');
  elements.typingText = document.getElementById('typingText');
  elements.connectionStatus = document.getElementById('connectionStatus');
  elements.userCount = document.getElementById('userCount');
  elements.toastContainer = document.getElementById('toastContainer');
}

function setupEventListeners() {
  // Enter key handlers
  elements.usernameInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') setUsername();
  });
  
  elements.roomInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinRoom();
  });
}

function checkUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomFromUrl = urlParams.get('room');
  
  if (roomFromUrl) {
    elements.roomInput.value = roomFromUrl.toUpperCase();
    showToast('Room detected in URL! Enter username to join.', 'info');
  }
}

function setupSocketListeners() {
  // Connection events
  socket.on('connect', () => {
    console.log('✅ Connected to SceneSync server');
    updateConnectionStatus(true);
  });
  
  socket.on('disconnect', () => {
    console.log('❌ Disconnected from server');
    updateConnectionStatus(false);
  });
  
  socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error);
    showToast('Failed to connect to server', 'error');
  });
  
  // Room events
  socket.on('room-state', (state) => {
    console.log('📦 Received room state:', state);
    handleRoomState(state);
  });
  
  socket.on('user-count', (count) => {
    elements.userCount.textContent = `${count} user${count !== 1 ? 's' : ''}`;
  });
  
  socket.on('users-list', (users) => {
    updateUsersList(users);
  });
  
  socket.on('user-joined', (data) => {
    showToast(`${data.user.username} joined the room`, 'success');
  });
  
  socket.on('user-left', (data) => {
    showToast(`${data.username} left the room`, 'info');
  });
  
  // Video events
  socket.on('set-url', (url) => {
    setVideoUrl(url, true);
  });
  
  socket.on('play', (currentTime) => {
    if (videoPlayer && videoPlayer.playVideo) {
      videoPlayer.playVideo();
      if (Math.abs(videoPlayer.getCurrentTime() - currentTime) > 2) {
        videoPlayer.seekTo(currentTime);
      }
    }
  });
  
  socket.on('pause', (currentTime) => {
    if (videoPlayer && videoPlayer.pauseVideo) {
      videoPlayer.pauseVideo();
      if (Math.abs(videoPlayer.getCurrentTime() - currentTime) > 2) {
        videoPlayer.seekTo(currentTime);
      }
    }
  });
  
  socket.on('seek', (currentTime) => {
    if (videoPlayer && videoPlayer.seekTo) {
      videoPlayer.seekTo(currentTime);
    }
  });
  
  // Screen share events
  socket.on('screen-share-started', (data) => {
    showToast(`${data.username} started screen sharing`, 'info');
    if (data.userId !== socket.id) {
      // Someone else is sharing, show their screen (implementation would need WebRTC)
      console.log('Another user is sharing screen');
    }
  });
  
  socket.on('screen-share-stopped', () => {
    showToast('Screen sharing stopped', 'info');
    if (!isScreenSharing) {
      elements.screenShareVideo.classList.add('hidden');
      elements.videoPlaceholder.classList.remove('hidden');
    }
  });
  
  // Chat events
  socket.on('chat', (message) => {
    addChatMessage(message);
  });
  
  socket.on('typing-start', (username) => {
    showTypingIndicator(username);
  });
  
  socket.on('typing-stop', (username) => {
    hideTypingIndicator(username);
  });
  
  // Error handling
  socket.on('error', (message) => {
    showToast(message, 'error');
  });
}

// User Management
function setUsername() {
  const username = elements.usernameInput.value.trim();
  
  if (!username) {
    showToast('Please enter a username', 'error');
    return;
  }
  
  if (username.length < 2) {
    showToast('Username must be at least 2 characters', 'error');
    return;
  }
  
  currentUsername = username;
  elements.welcomeModal.classList.add('hidden');
  showToast(`Welcome, ${username}!`, 'success');
  
  // Auto-join room if URL parameter exists
  const urlParams = new URLSearchParams(window.location.search);
  const roomFromUrl = urlParams.get('room');
  
  if (roomFromUrl) {
    setTimeout(() => joinRoom(), 500);
  }
}

// Room Management
function createRoom() {
  if (!currentUsername) {
    showToast('Please set your username first', 'error');
    elements.welcomeModal.classList.remove('hidden');
    return;
  }
  
  const room = generateRoomId();
  elements.roomInput.value = room;
  joinRoom();
}

function joinRoom() {
  const room = elements.roomInput.value.trim().toUpperCase();
  
  if (!room) {
    showToast('Please enter a room ID', 'error');
    return;
  }
  
  if (!currentUsername) {
    showToast('Please set your username first', 'error');
    elements.welcomeModal.classList.remove('hidden');
    return;
  }
  
  currentRoom = room;
  
  socket.emit('join-room', { room, username: currentUsername });
  
  elements.roomDisplay.textContent = room;
  elements.roomInfo.classList.remove('hidden');
  
  // Update URL
  const url = new URL(window.location);
  url.searchParams.set('room', room);
  window.history.pushState({}, '', url);
  
  showToast(`Joined room: ${room}`, 'success');
}

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function copyRoomLink() {
  if (!currentRoom) {
    showToast('No room to share', 'error');
    return;
  }
  
  const roomLink = `${window.location.origin}${window.location.pathname}?room=${currentRoom}`;
  
  navigator.clipboard.writeText(roomLink).then(() => {
    showToast('Room link copied to clipboard!', 'success');
  }).catch(() => {
    showToast('Failed to copy link', 'error');
  });
}

function updateUsersList(users) {
  if (!elements.usersList) return;
  
  elements.usersList.innerHTML = '<div class="label">Users in room:</div>';
  
  users.forEach(user => {
    const userItem = document.createElement('div');
    userItem.className = 'user-item';
    userItem.innerHTML = `
      <span class="user-status"></span>
      <span>${user.username} ${user.id === socket.id ? '(You)' : ''}</span>
    `;
    elements.usersList.appendChild(userItem);
  });
}

// Video Management
function setVideoUrl(url, isRemote = false) {
  if (!currentRoom && !isRemote) {
    showToast('Please join a room first', 'error');
    return;
  }
  
  let videoUrl = url;
  
  // Convert YouTube URL to embed format
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = url.split('v=')[1]?.split('&')[0];
    if (videoId) {
      videoUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
    }
  } else if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    if (videoId) {
      videoUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
    }
  }
  
  if (!isRemote) {
    socket.emit('set-url', { room: currentRoom, url: videoUrl });
  }
  
  // Update video player
  elements.videoPlayer.src = videoUrl;
  elements.videoPlaceholder.classList.add('hidden');
  elements.videoPlayer.classList.remove('hidden');
  elements.videoControls.classList.remove('hidden');
  
  // Setup YouTube API
  setupYouTubePlayer();
  
  if (!isRemote) {
    showToast('Video set successfully!', 'success');
  }
}

function setupYouTubePlayer() {
  // This would require YouTube IFrame API setup
  // For now, we'll use basic iframe controls
  
  // Create a simple video controller
  videoPlayer = {
    playVideo: () => {
      const iframe = elements.videoPlayer;
      iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
    },
    pauseVideo: () => {
      const iframe = elements.videoPlayer;
      iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
    },
    seekTo: (seconds) => {
      const iframe = elements.videoPlayer;
      iframe.contentWindow.postMessage(`{"event":"command","func":"seekTo","args":[${seconds}, true]}`, '*');
    },
    getCurrentTime: () => {
      // This would require more complex YouTube API integration
      return 0;
    }
  };
}

function playVideo() {
  if (!videoPlayer) return;
  
  videoPlayer.playVideo();
  socket.emit('play', { 
    room: currentRoom, 
    currentTime: videoPlayer.getCurrentTime() 
  });
}

function pauseVideo() {
  if (!videoPlayer) return;
  
  videoPlayer.pauseVideo();
  socket.emit('pause', { 
    room: currentRoom, 
    currentTime: videoPlayer.getCurrentTime() 
  });
}

// Screen Sharing
async function toggleScreenShare() {
  if (isScreenSharing) {
    stopScreenShare();
  } else {
    await startScreenShare();
  }
}

async function startScreenShare() {
  try {
    if (!currentRoom) {
      showToast('Please join a room first', 'error');
      return;
    }
    
    localStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true
    });
    
    elements.screenShareVideo.srcObject = localStream;
    elements.screenShareVideo.classList.remove('hidden');
    elements.videoPlaceholder.classList.add('hidden');
    elements.videoPlayer.classList.add('hidden');
    
    isScreenSharing = true;
    elements.screenShareBtn.innerHTML = '<span class="btn-icon">🛑</span> Stop Sharing';
    elements.stopShareBtn.classList.remove('hidden');
    
    socket.emit('start-screen-share', { room: currentRoom });
    
    showToast('Screen sharing started!', 'success');
    
    // Handle screen share end
    localStream.getVideoTracks()[0].addEventListener('ended', () => {
      stopScreenShare();
    });
    
  } catch (error) {
    console.error('Error starting screen share:', error);
    showToast('Failed to start screen sharing', 'error');
  }
}

function stopScreenShare() {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
  
  elements.screenShareVideo.classList.add('hidden');
  elements.screenShareVideo.srcObject = null;
  
  if (elements.videoPlayer.src) {
    elements.videoPlayer.classList.remove('hidden');
  } else {
    elements.videoPlaceholder.classList.remove('hidden');
  }
  
  isScreenSharing = false;
  elements.screenShareBtn.innerHTML = '<span class="btn-icon">🖥️</span> Share Screen';
  elements.stopShareBtn.classList.add('hidden');
  
  socket.emit('stop-screen-share', { room: currentRoom });
  
  showToast('Screen sharing stopped', 'info');
}

// Chat System
function sendMessage() {
  const message = elements.chatInput.value.trim();
  
  if (!message) {
    showToast('Please enter a message', 'error');
    return;
  }
  
  if (!currentRoom) {
    showToast('Please join a room first', 'error');
    return;
  }
  
  socket.emit('chat', { 
    room: currentRoom, 
    message: message, 
    username: currentUsername 
  });
  
  elements.chatInput.value = '';
  stopTyping();
}

function addChatMessage(messageData) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${messageData.type}`;
  
  if (messageData.type === 'system') {
    messageDiv.textContent = messageData.message;
  } else {
    const isOwnMessage = messageData.username === currentUsername;
    messageDiv.className += isOwnMessage ? ' user' : ' other';
    
    messageDiv.innerHTML = `
      <div class="message-header">${messageData.username}</div>
      <div class="message-text">${messageData.message}</div>
    `;
  }
  
  elements.chatMessages.appendChild(messageDiv);
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function handleTyping() {
  if (!currentRoom) return;
  
  const message = elements.chatInput.value.trim();
  
  if (message.length > 0) {
    startTyping();
  } else {
    stopTyping();
  }
}

function startTyping() {
  if (typingTimeout) return;
  
  socket.emit('typing-start', { 
    room: currentRoom, 
    username: currentUsername 
  });
  
  typingTimeout = setTimeout(() => {
    stopTyping();
  }, 3000);
}

function stopTyping() {
  if (typingTimeout) {
    clearTimeout(typingTimeout);
    typingTimeout = null;
  }
  
  socket.emit('typing-stop', { 
    room: currentRoom, 
    username: currentUsername 
  });
}

function showTypingIndicator(username) {
  elements.typingText.textContent = `${username} is typing...`;
  elements.typingIndicator.classList.remove('hidden');
}

function hideTypingIndicator(username) {
  elements.typingIndicator.classList.add('hidden');
}

// UI Utilities
function updateConnectionStatus(isConnected) {
  if (isConnected) {
    elements.connectionStatus.classList.remove('offline');
    elements.connectionStatus.classList.add('online');
  } else {
    elements.connectionStatus.classList.remove('online');
    elements.connectionStatus.classList.add('offline');
  }
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  elements.toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

function handleRoomState(state) {
  if (state.videoState && state.videoState.url) {
    setVideoUrl(state.videoState.url, true);
  }
  
  if (state.screenShare && state.screenShare.active) {
    showToast(`${state.screenShare.username} is sharing their screen`, 'info');
  }
}

// Error Handling
window.addEventListener('error', (event) => {
  console.error('JavaScript error:', event.error);
  showToast('An error occurred. Please refresh the page.', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  showToast('A network error occurred. Please check your connection.', 'error');
});

console.log('🎬 SceneSync Advanced Platform loaded successfully!');
