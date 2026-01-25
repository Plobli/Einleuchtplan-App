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

            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    async delete(id) {
        await pool.query('DELETE FROM channels WHERE id = $1', [id]);
    }
};
