const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { globalErrorHandler, requestLogger, notFoundHandler } = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Make io globally available
global.io = io;

// Middleware
app.use(requestLogger);
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Discord Clone API is running!', status: 'OK' });
});

// Routes
console.log('Loading routes...');
try {
  app.use('/api/auth', require('./routes/auth'));
  console.log('✅ Auth routes loaded');
  app.use('/api/users', require('./routes/users'));
  console.log('✅ Users routes loaded');
  app.use('/api/servers', require('./routes/servers'));
  console.log('✅ Servers routes loaded');
  app.use('/api/channels', require('./routes/channels'));
  console.log('✅ Channels routes loaded');
  app.use('/api/messages', require('./routes/messages'));
  console.log('✅ Messages routes loaded');
  app.use('/api/friends', require('./routes/friends'));
  console.log('✅ Friends routes loaded');
} catch (error) {
  console.error('❌ Error loading routes:', error);
}

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    console.log('❌ Socket connection rejected: No token provided');
    return next(new Error('Authentication error: No token provided'));
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    console.log('✅ Socket authenticated for user:', decoded.userId);
    next();
  } catch (err) {
    console.log('❌ Socket connection rejected: Invalid token');
    return next(new Error('Authentication error: Invalid token'));
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id, 'User ID:', socket.userId);

  // Join server room
  socket.on('join-server', (serverId) => {
    socket.join(`server-${serverId}`);
    console.log(`👤 User ${socket.id} joined server ${serverId}`);
  });

  // Join channel room
  socket.on('join-channel', (channelId) => {
    socket.join(`channel-${channelId}`);
    console.log(`👤 User ${socket.id} joined channel ${channelId}`);
  });

  // Join user room for DM notifications
  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`👤 User ${socket.id} joined user room ${userId}`);
  });

  // Handle typing indicators
  socket.on('typing-start', (data) => {
    socket.to(`channel-${data.channelId}`).emit('user-typing', {
      userId: data.userId,
      username: data.username,
      channelId: data.channelId
    });
  });

  socket.on('typing-stop', (data) => {
    socket.to(`channel-${data.channelId}`).emit('user-stopped-typing', {
      userId: data.userId,
      channelId: data.channelId
    });
  });

  // Handle new messages
  socket.on('new-message', (message) => {
    socket.to(`channel-${message.channelId}`).emit('message-received', message);
  });

  // Handle user status updates
  socket.on('status-update', (data) => {
    socket.broadcast.emit('user-status-changed', data);
  });

  socket.on('disconnect', () => {
    console.log('👤 User disconnected:', socket.id);
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, io };
