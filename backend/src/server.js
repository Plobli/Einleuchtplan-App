import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

// Routes
import authRoutes from './routes/auth.js';
import showRoutes from './routes/shows.js';
import channelRoutes from './routes/channels.js';
import photoRoutes from './routes/photos.js';
import oscRoutes from './routes/osc.js';

// Middleware
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';

// WebSocket handlers
import { setupWebSocket } from './services/websocket.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/shows', authMiddleware, showRoutes);
app.use('/api/channels', authMiddleware, channelRoutes);
app.use('/api', authMiddleware, photoRoutes);
app.use('/api', authMiddleware, oscRoutes);

// Error handling
app.use(errorHandler);

// WebSocket setup
setupWebSocket(io);

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`
🎭 Theater Plan Server
=======================
✅ Server running on port ${PORT}
📡 Environment: ${process.env.NODE_ENV || 'development'}
🌐 CORS: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    httpServer.close(() => {
        console.log('HTTP server closed');
    });
});

export { io };
