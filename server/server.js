const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to Database
const connectDB = require('./config/db');
connectDB();

// Connect to Redis
const { connectRedis } = require('./config/redis');
connectRedis();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Bind socket instance to app context
app.set('io', io);

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to ClinicQueue API', version: '1.0.0' });
});

// Routes
const patientRoutes = require('./routes/patientRoutes');
const triageRoutes = require('./routes/triageRoutes');
const queueRoutes = require('./routes/queueRoutes');
const authRoutes = require('./routes/authRoutes');

app.use('/api/patients', patientRoutes);
app.use('/api/triage', triageRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/auth', authRoutes);

// Socket.io setup
require('./sockets/queueSocket')(io);

// Error handling middleware
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };