import pool from '../config/database.js';

export const Show = {
    toSlug(name) {
        return name.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
    },

    async findBySlug(slug) {
        const result = await pool.query(
            'SELECT * FROM shows WHERE deleted_at IS NULL'
        );
        return result.rows.find(r => this.toSlug(r.name) === slug) || null;
    },

    async create(name, venue, date, createdBy) {
        const result = await pool.query(
            'INSERT INTO shows (name, venue, date, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, venue, date, createdBy]
        );
        return result.rows[0];
    },

    async findAll(userId) {
        const result = await pool.query(`
            SELECT s.*, u.name as creator_name,
                   COUNT(c.id) as channel_count
            FROM shows s
            LEFT JOIN users u ON s.created_by = u.id
            LEFT JOIN channels c ON s.id = c.show_id
            WHERE s.deleted_at IS NULL
            GROUP BY s.id, u.name
            ORDER BY s.created_at DESC
        `);
        return result.rows;
    },

    async findTrashed(userId) {
        const result = await pool.query(`
            SELECT s.*, u.name as creator_name,
                   COUNT(c.id) as channel_count
            FROM shows s
            LEFT JOIN users u ON s.created_by = u.id
            LEFT JOIN channels c ON s.id = c.show_id
            WHERE s.deleted_at IS NOT NULL
            GROUP BY s.id, u.name
            ORDER BY s.deleted_at DESC
        `);
        return result.rows;
    },

    async findById(id) {
        const result = await pool.query(`
            SELECT s.*, u.name as creator_name,
                   COUNT(c.id) as channel_count
            FROM shows s
            LEFT JOIN users u ON s.created_by = u.id
            LEFT JOIN channels c ON s.id = c.show_id
            WHERE s.id = $1
            GROUP BY s.id, u.name
        `, [id]);
        return result.rows[0];
    },

    async update(id, data, userId) {
        const fields = [];
        const values = [];
        let paramCount = 1;

        const allowedFields = ['name', 'venue', 'date', 'portalbruecke', 'portale', 'sbtor', 'zuege', 'aufbau'];

        // Get current values for history
        const current = await pool.query('SELECT * FROM shows WHERE id = $1', [id]);
        const currentShow = current.rows[0];

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                fields.push(`${field} = $${paramCount++}`);
                values.push(data[field]);
            }
        }

        if (fields.length === 0) {
            return this.findById(id);
        }

        values.push(id);

        const result = await pool.query(
            `UPDATE shows SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );

        // Record history for changed fields
        for (const field of allowedFields) {
            if (data[field] !== undefined && currentShow) {
                const oldVal = String(currentShow[field] ?? '');
                const newVal = String(data[field] ?? '');
                if (oldVal !== newVal) {
                    await pool.query(
                        `INSERT INTO show_history (show_id, user_id, field_name, old_value, new_value)
                         VALUES ($1, $2, $3, $4, $5)`,
                        [id, userId || null, field, oldVal, newVal]
                    );
                }
            }
        }

        return result.rows[0];
    },

    async getHistory(showId, limit = 50) {
        const result = await pool.query(
            `SELECT h.*, u.name as user_name
             FROM show_history h
             LEFT JOIN users u ON h.user_id = u.id
             WHERE h.show_id = $1
             ORDER BY h.changed_at DESC
             LIMIT $2`,
            [showId, limit]
        );
        return result.rows;
    },

    async revert(historyId) {
        const histResult = await pool.query(
            'SELECT * FROM show_history WHERE id = $1', [historyId]
        );
        const entry = histResult.rows[0];
        if (!entry) throw new Error('History entry not found');

        const allowedFields = ['name', 'venue', 'date', 'portalbruecke', 'portale', 'sbtor', 'zuege', 'aufbau'];
        if (!allowedFields.includes(entry.field_name)) throw new Error('Invalid field');

        await pool.query(
            `UPDATE shows SET ${entry.field_name} = $1 WHERE id = $2`,
            [entry.old_value, entry.show_id]
        );
        return entry.show_id;
    },

    async delete(id) {
        await pool.query('DELETE FROM shows WHERE id = $1', [id]);
    },

    async softDelete(id) {
        await pool.query('UPDATE shows SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
    },

    async restore(id) {
        await pool.query('UPDATE shows SET deleted_at = NULL WHERE id = $1', [id]);
    }
};
