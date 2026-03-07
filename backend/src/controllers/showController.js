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
        const { name, venue, date, channelTemplate } = req.body;

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

        // Create channels from template if requested
        if (channelTemplate && channelTemplate !== 'none') {
            try {
                let channelsPath;
                if (channelTemplate === 'k1') {
                    channelsPath = join(__dirname, '../data/k1-channels.json');
                } else if (channelTemplate === 'kasino') {
                    channelsPath = join(__dirname, '../data/kasino-channels.json');
                } else {
                    throw new Error('Unknown template: ' + channelTemplate);
                }

                const channelsData = JSON.parse(await readFile(channelsPath, 'utf-8'));

                for (const channelData of channelsData) {
                    await Channel.create(show.id, channelData);
                }
            } catch (error) {
                console.error('Error creating channels from template:', error);
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
        
        const show = await Show.update(req.params.id, updateData, req.user.id);
        
        if (!show) {
            return res.status(404).json({ error: 'Show not found' });
        }
        
        res.json(show);
    } catch (error) {
        next(error);
    }
};

export const getShowBySlug = async (req, res, next) => {
    try {
        const show = await Show.findBySlug(req.params.slug);
        if (!show) {
            return res.status(404).json({ error: 'Show not found' });
        }
        res.json(show);
    } catch (error) {
        next(error);
    }
};

export const getShowHistory = async (req, res, next) => {
    try {
        const history = await Show.getHistory(req.params.id, 50);
        res.json(history);
    } catch (error) {
        next(error);
    }
};

export const revertShowChange = async (req, res, next) => {
    try {
        await Show.revert(req.params.historyId);
        res.status(204).send();
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

export const getArchivedShows = async (req, res, next) => {
    try {
        const shows = await Show.findArchived(req.user.id);
        res.json(shows);
    } catch (error) {
        next(error);
    }
};

export const archiveShow = async (req, res, next) => {
    try {
        await Show.archive(req.params.id);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

export const unarchiveShow = async (req, res, next) => {
    try {
        await Show.unarchive(req.params.id);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

export const restoreBackup = async (req, res, next) => {
    try {
        const entries = req.body;
        if (!Array.isArray(entries)) {
            return res.status(400).json({ error: 'Invalid format', message: 'Expected an array of show entries' });
        }

        const results = { created: 0, skipped: 0, errors: [] };

        for (const entry of entries) {
            const { show, channels } = entry;
            if (!show?.name) { results.errors.push('Entry missing show name'); continue; }

            try {
                // Skip if show with same name already exists
                const existing = await Show.findBySlug(Show.toSlug(show.name));
                if (existing) { results.skipped++; continue; }

                const newShow = await Show.create(show.name, show.venue || null, show.date || null, req.user.id);

                if (Array.isArray(channels) && channels.length > 0) {
                    await Channel.bulkCreate(newShow.id, channels);
                }

                // Restore text fields
                const fields = ['portalbruecke', 'portale', 'sbtor', 'zuege', 'aufbau'];
                const updateData = {};
                for (const f of fields) { if (show[f] != null) updateData[f] = show[f]; }
                if (Object.keys(updateData).length > 0) {
                    await Show.update(newShow.id, updateData, req.user.id);
                }

                results.created++;
            } catch (err) {
                results.errors.push(`${show.name}: ${err.message}`);
            }
        }

        res.json(results);
    } catch (error) {
        next(error);
    }
};

export const backupAll = async (req, res, next) => {
    try {
        const data = await Show.backupAll();
        const filename = `backup_${new Date().toISOString().split('T')[0]}.json`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.json(data);
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
        const showId = req.params.id;
        
        // Check if it's a single channel or bulk import
        if (Array.isArray(req.body)) {
            // Bulk import (array of channels)
            const channels = req.body;
            
            // Delete existing channels
            const existingChannels = await Channel.findByShowId(showId);
            for (const channel of existingChannels) {
                await Channel.delete(channel.id);
            }

            // Import new channels
            const imported = await Channel.bulkCreate(showId, channels);
            return res.json({ 
                message: 'Channels imported successfully',
                count: imported.length 
            });
        } else if (req.body.channels) {
            // Legacy format: { channels: [...] }
            const channels = req.body.channels;
            
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
            return res.json({ 
                message: 'Channels imported successfully',
                count: imported.length 
            });
        } else {
            // Single channel creation
            const channelData = req.body;
            const newChannel = await Channel.create(showId, channelData);
            return res.status(201).json(newChannel);
        }
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
