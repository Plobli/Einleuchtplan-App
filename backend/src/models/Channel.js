import pool from '../config/database.js';

export const Channel = {
    async create(showId, channelData) {
        const { kanal, adresse, geraet, farbe, beschreibung, kategorie, aktiv, position } = channelData;
        const result = await pool.query(
            `INSERT INTO channels (show_id, kanal, adresse, geraet, farbe, beschreibung, kategorie, aktiv, position)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [showId, kanal, adresse, geraet, farbe, beschreibung, kategorie, aktiv || false, position]
        );
        return result.rows[0];
    },

    async bulkCreate(showId, channels) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const insertedChannels = [];

            for (const channel of channels) {
                const result = await client.query(
                    `INSERT INTO channels (show_id, kanal, adresse, geraet, farbe, beschreibung, kategorie, aktiv, position)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
                    [showId, channel.kanal, channel.adresse, channel.geraet, channel.farbe, 
                     channel.beschreibung, channel.kategorie, channel.aktiv || false, channel.position]
                );
                insertedChannels.push(result.rows[0]);
            }

            await client.query('COMMIT');
            return insertedChannels;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    async findByShowId(showId) {
        const result = await pool.query(
            'SELECT * FROM channels WHERE show_id = $1 ORDER BY position ASC, kanal ASC',
            [showId]
        );
        return result.rows;
    },

    async findById(id) {
        const result = await pool.query(
            'SELECT * FROM channels WHERE id = $1',
            [id]
        );
        return result.rows[0];
    },

    async update(id, data, userId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Get current values for history
            const current = await client.query('SELECT * FROM channels WHERE id = $1', [id]);
            const currentChannel = current.rows[0];

            // Build update query
            const fields = [];
            const values = [];
            let paramCount = 1;

            const updatableFields = ['adresse', 'geraet', 'farbe', 'beschreibung', 'aktiv'];

            for (const field of updatableFields) {
                if (data[field] !== undefined) {
                    fields.push(`${field} = $${paramCount++}`);
                    values.push(data[field]);
                }
            }

            values.push(id);

            const result = await client.query(
                `UPDATE channels SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
                values
            );

            // Record history for changed fields
            for (const field of updatableFields) {
                if (data[field] !== undefined) {
                    const oldVal = currentChannel ? String(currentChannel[field] ?? '') : '';
                    const newVal = String(data[field] ?? '');
                    if (oldVal !== newVal) {
                        await client.query(
                            `INSERT INTO channel_history (channel_id, user_id, field_name, old_value, new_value)
                             VALUES ($1, $2, $3, $4, $5)`,
                            [id, userId || null, field, oldVal, newVal]
                        );
                    }
                }
            }

            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    async getHistoryByShowId(showId, limit = 50) {
        const result = await pool.query(
            `SELECT h.*, c.kanal, u.name as user_name
             FROM channel_history h
             JOIN channels c ON h.channel_id = c.id
             LEFT JOIN users u ON h.user_id = u.id
             WHERE c.show_id = $1
             ORDER BY h.changed_at DESC
             LIMIT $2`,
            [showId, limit]
        );
        return result.rows;
    },

    async revert(historyId) {
        const histResult = await pool.query(
            'SELECT * FROM channel_history WHERE id = $1', [historyId]
        );
        const entry = histResult.rows[0];
        if (!entry) throw new Error('History entry not found');

        const allowedFields = ['adresse', 'geraet', 'farbe', 'beschreibung', 'aktiv'];
        if (!allowedFields.includes(entry.field_name)) throw new Error('Invalid field');

        const result = await pool.query(
            `UPDATE channels SET ${entry.field_name} = $1 WHERE id = $2 RETURNING *`,
            [entry.old_value, entry.channel_id]
        );
        return result.rows[0];
    },

    async delete(id) {
        await pool.query('DELETE FROM channels WHERE id = $1', [id]);
    }
};
