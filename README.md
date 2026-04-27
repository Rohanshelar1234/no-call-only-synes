# SceneSync - No call, just sync.

A real-time co-watching web application where users can watch the same content together in perfect sync without video calls.

## Features

- **Real-time Synchronization**: All users see the same video state at the same time
- **Room System**: Create or join rooms using simple Room IDs
- **YouTube Integration**: Watch any YouTube video together
- **Video Sync**: Play, pause, and timeline synchronization across all devices
- **Real-time Chat**: Instant messaging while watching
- **Cross-Device Support**: Works on mobile and desktop browsers
- **No Video Calls**: Focus on content, not communication overhead

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js with Express
- **Real-time**: Socket.IO (WebSockets)
- **Video**: YouTube IFrame API

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone or download the project
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## How to Use

1. **Create/Join Room**: The app automatically generates a Room ID when you open it
2. **Share Room ID**: Copy the Room ID and share it with friends
3. **Load Video**: Paste a YouTube URL (any format works):
   - `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
   - `https://youtu.be/dQw4w9WgXcQ`
   - `https://www.youtube.com/embed/dQw4w9WgXcQ`
4. **Watch Together**: All users in the room will see the same video in sync
5. **Chat**: Use the chat to communicate while watching

## Project Structure

```
scenesync/
├── server.js              # Node.js backend server
├── package.json           # Dependencies and scripts
├── README.md              # This file
└── public/                # Frontend assets
    ├── index.html         # Main HTML page
    ├── style.css          # Styling (dark theme)
    └── app.js             # Frontend JavaScript logic
```

## How It Works

### Backend (server.js)
- Express server serves static files
- Socket.IO handles real-time communication
- Room-based state management
- Maintains shared state per room (video URL, playback status, messages)

### Frontend (app.js)
- YouTube IFrame API integration
- Socket.IO client for real-time updates
- Responsive design for mobile and desktop
- Real-time chat functionality

### Real-time Features
- **Video URL Changes**: When one user loads a video, all users see it
- **Playback Control**: Play/pause syncs across all users
- **Timeline Sync**: Video position stays synchronized
- **Chat Messages**: Instant message delivery
- **User Presence**: See when users join/leave

## Deployment

### Local Network
For local network access, run:
```bash
npm start
```
Then access from other devices using your local IP:
```
http://YOUR_LOCAL_IP:3000
```

### Internet Deployment
Deploy to any platform that supports Node.js:
- Heroku
- Vercel
- AWS
- DigitalOcean
- Railway

Make sure to set the PORT environment variable if required.

## Troubleshooting

### Video Not Loading
- Ensure you're using a valid YouTube URL
- Check if the video is embed-enabled
- Try refreshing the page

### Sync Issues
- Check your internet connection
- Ensure all users are in the same room
- Refresh the page if desync occurs

### Connection Problems
- Verify the server is running on port 3000
- Check firewall settings
- Ensure CORS is properly configured

## Contributing

Feel free to fork and contribute! Key areas for improvement:
- Support for other video platforms
- Enhanced chat features
- User authentication
- Room persistence

## License

MIT License - feel free to use this project for personal or commercial purposes.

---

**SceneSync** - Watch together, stay in sync. 🎬✨
