import { Show } from '../models/Show.js';
import { Channel } from '../models/Channel.js';

export const getAllShows = async (req, res, next) => {
    try {
        const shows = await Show.findAll(req.user.id);
        res.json(shows);
    } catch (error) {
        next(error);
    }
};

export const getShowById = async (req, res, next) => {
    try {
        const show = await Show.findById(req.params.id);
        if (!show) {
            return res.status(404).json({ error: 'Show not found' });
        }
        res.json(show);
    } catch (error) {
        next(error);
    }
};

export const createShow = async (req, res, next) => {
    try {
        const { name, venue, date } = req.body;

        if (!name) {
            return res.status(400).json({ 
                error: 'Missing required field',
                message: 'Show name is required' 
            });
        }

        const show = await Show.create(name, venue, date, req.user.id);
        res.status(201).json(show);
    } catch (error) {
        next(error);
    }
};

export const updateShow = async (req, res, next) => {
    try {
        const { name, venue, date } = req.body;
        const show = await Show.update(req.params.id, { name, venue, date });
        
        if (!show) {
            return res.status(404).json({ error: 'Show not found' });
        }
        
        res.json(show);
    } catch (error) {
        next(error);
    }
};

export const deleteShow = async (req, res, next) => {
    try {
        await Show.delete(req.params.id);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

export const importChannels = async (req, res, next) => {
    try {
        const { channels } = req.body;
        const showId = req.params.id;

        if (!Array.isArray(channels)) {
            return res.status(400).json({ 
                error: 'Invalid format',
                message: 'Channels must be an array' 
            });
        }

        // Delete existing channels
        const existingChannels = await Channel.findByShowId(showId);
        for (const channel of existingChannels) {
            await Channel.delete(channel.id);
        }

        // Import new channels
        const imported = await Channel.bulkCreate(showId, channels);
        res.json({ 
            message: 'Channels imported successfully',
            count: imported.length 
        });
    } catch (error) {
        next(error);
    }
};

export const exportShowAsJSON = async (req, res, next) => {
    try {
        const show = await Show.findById(req.params.id);
        if (!show) {
            return res.status(404).json({ error: 'Show not found' });
        }

        const channels = await Channel.findByShowId(req.params.id);

        res.json({
            show: {
                name: show.name,
                venue: show.venue,
                date: show.date
            },
            channels: channels.map(c => ({
                kanal: c.kanal,
                adresse: c.adresse,
                geraet: c.geraet,
                farbe: c.farbe,
                beschreibung: c.beschreibung,
                aktiv: c.aktiv
            }))
        });
    } catch (error) {
        next(error);
    }
};
