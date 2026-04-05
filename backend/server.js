import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/ping', (req, res) => res.send('pong'));

const httpServer = createServer(app);
console.log('Initializing Socket.IO with CORS origin: *');
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// In-memory room store.
const rooms = {};

// Helper to generate a uppercase 6-character random room ID
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Routes
app.post('/api/rooms', (req, res) => {
  const { videoId, host } = req.body;
  if (!videoId) return res.status(400).json({ error: 'videoId is required' });

  const roomId = generateRoomId(); 
  const newRoom = {
    roomId,
    videoId,
    host: host || 'Guest',
    createdAt: new Date().toISOString(),
    participants: []
  };

  rooms[roomId] = newRoom;
  console.log(`Creating room with video: ${videoId}`);
  res.status(201).json(newRoom);
});

app.get('/api/rooms/:roomId', (req, res) => {
  const normalizedId = req.params.roomId.trim().toUpperCase();
  const room = rooms[normalizedId];
  if (!room) return res.status(404).json({ error: 'Room not found' });

  res.json(room);
});

// Real-Time Socket Logic
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join-room', (roomId, user) => {
    socket.join(roomId);
    
    // Mount user connection
    const participant = {
       socketId: socket.id,
       email: user?.email || '',
       name: user?.name || 'Guest',
       picture: user?.picture || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + socket.id,
       role: user?.email === rooms[roomId]?.host ? 'host' : 'guest',
       muted: false
    };

    if (rooms[roomId]) {
       if (!rooms[roomId].participants) rooms[roomId].participants = [];
       // Discard dangling duplicates
       rooms[roomId].participants = rooms[roomId].participants.filter(p => p.socketId !== socket.id);
       rooms[roomId].participants.push(participant);
       io.to(roomId).emit('participants-updated', rooms[roomId].participants);
    }
    
    socket.to(roomId).emit('user-joined');
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on('change-video', (roomId, videoId) => {
    const normalizedId = roomId.trim().toUpperCase();
    if (rooms[normalizedId]) {
      rooms[normalizedId].videoId = videoId;
    }
    socket.to(roomId).emit('change-video', videoId);
    console.log(`Room ${roomId} video changed to ${videoId}`);
  });

  socket.on('play', (roomId, currentTime) => {
    socket.to(roomId).emit('play', currentTime);
  });

  socket.on('pause', (roomId, currentTime) => {
    socket.to(roomId).emit('pause', currentTime);
  });

  socket.on('seek', (roomId, currentTime) => {
    socket.to(roomId).emit('seek', currentTime);
  });

  // Moderation events
  socket.on('kick-user', (roomId, targetSocketId) => {
    io.to(targetSocketId).emit('kicked');
    if (rooms[roomId] && rooms[roomId].participants) {
       rooms[roomId].participants = rooms[roomId].participants.filter(p => p.socketId !== targetSocketId);
       io.to(roomId).emit('participants-updated', rooms[roomId].participants);
    }
  });

  socket.on('mute-user', (roomId, targetSocketId) => {
    if (rooms[roomId] && rooms[roomId].participants) {
       const user = rooms[roomId].participants.find(p => p.socketId === targetSocketId);
       if (user) {
          user.muted = !user.muted;
          io.to(roomId).emit('participants-updated', rooms[roomId].participants);
       }
    }
  });

  socket.on('promote-user', (roomId, targetSocketId) => {
    if (rooms[roomId] && rooms[roomId].participants) {
       const user = rooms[roomId].participants.find(p => p.socketId === targetSocketId);
       if (user && user.role !== 'host') {
          user.role = user.role === 'co-host' ? 'guest' : 'co-host';
          io.to(roomId).emit('participants-updated', rooms[roomId].participants);
       }
    }
  });

  // Chat message interception
  socket.on('send-message', (roomId, message) => {
     if (rooms[roomId] && rooms[roomId].participants) {
        const user = rooms[roomId].participants.find(p => p.socketId === socket.id);
        if (user && user.muted) return; // Silent reject
     }
     io.to(roomId).emit('receive-message', message);
  });

  socket.on('disconnect', () => {
    for (const roomId in rooms) {
      const room = rooms[roomId];
      if (room.participants) {
        const index = room.participants.findIndex(p => p.socketId === socket.id);
        if (index !== -1) {
           room.participants.splice(index, 1);
           io.to(roomId).emit('participants-updated', room.participants);
        }
      }
    }
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Serve frontend static artifacts
const distPath = path.join(__dirname, '../dist');
console.log(`Serving static files from: ${distPath}`);
app.use(express.static(distPath));

app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath);
});

// Start Server
const PORT = parseInt(process.env.PORT) || 5000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`>>> MONOLITH STARTUP SUCCESSFUL <<<`);
  console.log(`>>> SERVICE_PORT: ${PORT} <<<`);
  console.log(`>>> INTERFACE: 0.0.0.0 <<<`);
  console.log(`>>> Health check: /ping <<<`);
});
