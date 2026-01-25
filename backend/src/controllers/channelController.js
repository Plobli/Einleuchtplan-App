import { Channel } from '../models/Channel.js';
import { io } from '../server.js';

export const getChannelsByShow = async (req, res, next) => {
    try {
        const channels = await Channel.findByShowId(req.params.showId);
        res.json(channels);
    } catch (error) {
        next(error);
    }
};

export const getChannelById = async (req, res, next) => {
    try {
        const channel = await Channel.findById(req.params.id);
        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }
        res.json(channel);
    } catch (error) {
        next(error);
    }
};

export const createChannel = async (req, res, next) => {
    try {
        const channelData = req.body;
        const channel = await Channel.create(req.params.showId, channelData);
        
        // Broadcast to other clients
        io.to(`show-${req.params.showId}`).emit('channel:created', {
            channel,
            userId: req.user.id,
            userName: req.user.name
        });

        res.status(201).json(channel);
    } catch (error) {
        next(error);
    }
};

export const updateChannel = async (req, res, next) => {
    try {
        const updates = req.body;
        const channel = await Channel.update(req.params.id, updates, req.user.id);
        
        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        // Broadcast to other clients
        io.to(`show-${channel.show_id}`).emit('channel:updated', {
            channel,
            userId: req.user.id,
            userName: req.user.name,
            updates
        });

        res.json(channel);
    } catch (error) {
        next(error);
    }
};

export const deleteChannel = async (req, res, next) => {
    try {
        const channel = await Channel.findById(req.params.id);
        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        await Channel.delete(req.params.id);

        // Broadcast to other clients
        io.to(`show-${channel.show_id}`).emit('channel:deleted', {
            channelId: req.params.id,
            userId: req.user.id,
            userName: req.user.name
        });

        res.status(204).send();
    } catch (error) {
        next(error);
    }
};
