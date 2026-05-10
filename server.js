require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const voterRoutes = require('./routes/voterRoutes');

const app = express();

// Database Connection Middleware
const dbMiddleware = async (req, res, next) => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is missing from environment variables');
    return res.status(500).json({ message: 'Server configuration error: Database URI missing' });
  }
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ message: 'Database connection error' });
  }
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', dbMiddleware);

// Serve frontend static files (Only needed for local development)
if (process.env.NODE_ENV !== 'production') {
  app.use(express.static(path.join(__dirname, 'frontend')));
}

// API Routes
app.get('/api/health', (req, res) => res.json({ status: 'ok', environment: process.env.NODE_ENV }));
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/voter', voterRoutes);

// Fallback for frontend (Only needed for local development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Socket.io for live results (Note: Persistent sockets don't work on Vercel Serverless)
  const io = require('socket.io')(server, {
    cors: { origin: '*' }
  });
  app.set('io', io);
  io.on('connection', (socket) => {
    console.log('New client connected', socket.id);
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
}

module.exports = app;