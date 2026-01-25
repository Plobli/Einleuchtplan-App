import { Show } from '../models/Show.js';
import { Channel } from '../models/Channel.js';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
        const { name, venue, date, createDefaultChannels } = req.body;

        if (!name) {
            return res.status(400).json({ 
                error: 'Missing required field',
                message: 'Show name is required' 
            });
        }

        // Convert empty strings to null for optional fields
        const show = await Show.create(
            name, 
            venue || null, 
            date || null, 
            req.user.id
        );

        // Create default channels if requested
        if (createDefaultChannels) {
            try {
                const defaultChannelsPath = join(__dirname, '../data/default-channels.json');
                const channelsData = JSON.parse(await readFile(defaultChannelsPath, 'utf-8'));
                
                for (const channelData of channelsData) {
                    await Channel.create(show.id, channelData);
                }
            } catch (error) {
                console.error('Error creating default channels:', error);
                // Continue even if channel creation fails
            }
        }

        res.status(201).json(show);
    } catch (error) {
        next(error);
    }
};

export const updateShow = async (req, res, next) => {
    try {
        const { name, venue, date, portalbruecke, portale, sbtor, zuege, aufbau } = req.body;
        
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (venue !== undefined) updateData.venue = venue || null;
        if (date !== undefined) updateData.date = date || null;
        if (portalbruecke !== undefined) updateData.portalbruecke = portalbruecke || null;
        if (portale !== undefined) updateData.portale = portale || null;
        if (sbtor !== undefined) updateData.sbtor = sbtor || null;
        if (zuege !== undefined) updateData.zuege = zuege || null;
        if (aufbau !== undefined) updateData.aufbau = aufbau || null;
        
        const show = await Show.update(req.params.id, updateData);
        
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
        await Show.softDelete(req.params.id);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

export const getTrashedShows = async (req, res, next) => {
    try {
        const shows = await Show.findTrashed(req.user.id);
        res.json(shows);
    } catch (error) {
        next(error);
    }
};

export const restoreShow = async (req, res, next) => {
    try {
        await Show.restore(req.params.id);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

export const permanentDeleteShow = async (req, res, next) => {
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
