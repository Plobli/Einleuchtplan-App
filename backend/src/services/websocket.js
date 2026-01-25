import jwt from 'jsonwebtoken';
import redisClient from '../config/redis.js';

export const setupWebSocket = (io) => {
    // Authentication middleware for WebSocket
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        
        if (!token) {
            return next(new Error('Authentication required'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (error) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`✅ User connected: ${socket.user.email} (${socket.id})`);

        // Join show room
        socket.on('show:join', async (showId) => {
            socket.join(`show-${showId}`);
            console.log(`User ${socket.user.email} joined show ${showId}`);

            // Store active user in Redis
            await redisClient.sAdd(`show:${showId}:users`, JSON.stringify({
                id: socket.user.id,
                email: socket.user.email,
                name: socket.user.name,
                socketId: socket.id
            }));

            // Notify others
            const activeUsers = await getActiveUsers(showId);
            io.to(`show-${showId}`).emit('show:users', activeUsers);
        });

        // Leave show room
        socket.on('show:leave', async (showId) => {
            socket.leave(`show-${showId}`);
            
            // Remove from Redis
            const members = await redisClient.sMembers(`show:${showId}:users`);
            for (const member of members) {
                const user = JSON.parse(member);
                if (user.socketId === socket.id) {
                    await redisClient.sRem(`show:${showId}:users`, member);
                }
            }

            // Notify others
            const activeUsers = await getActiveUsers(showId);
            io.to(`show-${showId}`).emit('show:users', activeUsers);
        });

        // Real-time channel update
        socket.on('channel:update', async (data) => {
            const { showId, channelId, field, value } = data;

            // Broadcast to all users in the show except sender
            socket.to(`show-${showId}`).emit('channel:updated', {
                channelId,
                field,
                value,
                userId: socket.user.id,
                userName: socket.user.name,
                timestamp: new Date().toISOString()
            });

            // Store in Redis for conflict resolution
            await redisClient.set(
                `channel:${channelId}:${field}`,
                JSON.stringify({ value, userId: socket.user.id, timestamp: Date.now() }),
                { EX: 300 } // Expire after 5 minutes
            );
        });

        // Typing indicator
        socket.on('channel:typing', (data) => {
            const { showId, channelId, field } = data;
            socket.to(`show-${showId}`).emit('channel:typing', {
                channelId,
                field,
                userId: socket.user.id,
                userName: socket.user.name
            });
        });

        // Disconnect
        socket.on('disconnect', async () => {
            console.log(`❌ User disconnected: ${socket.user.email} (${socket.id})`);

            // Remove from all show rooms
            const rooms = Array.from(socket.rooms);
            for (const room of rooms) {
                if (room.startsWith('show-')) {
                    const showId = room.replace('show-', '');
                    const members = await redisClient.sMembers(`show:${showId}:users`);
                    for (const member of members) {
                        const user = JSON.parse(member);
                        if (user.socketId === socket.id) {
                            await redisClient.sRem(`show:${showId}:users`, member);
                        }
                    }
                    const activeUsers = await getActiveUsers(showId);
                    io.to(`show-${showId}`).emit('show:users', activeUsers);
                }
            }
        });
    });
};

async function getActiveUsers(showId) {
    const members = await redisClient.sMembers(`show:${showId}:users`);
    return members.map(m => {
        const user = JSON.parse(m);
        return {
            id: user.id,
            email: user.email,
            name: user.name
        };
    });
}
