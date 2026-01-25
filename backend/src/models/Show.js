import pool from '../config/database.js';

export const Show = {
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
            GROUP BY s.id, u.name
            ORDER BY s.created_at DESC
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

    async update(id, data) {
        const fields = [];
        const values = [];
        let paramCount = 1;

        if (data.name !== undefined) {
            fields.push(`name = $${paramCount++}`);
            values.push(data.name);
        }
        if (data.venue !== undefined) {
            fields.push(`venue = $${paramCount++}`);
            values.push(data.venue);
        }
        if (data.date !== undefined) {
            fields.push(`date = $${paramCount++}`);
            values.push(data.date);
        }

        values.push(id);

        const result = await pool.query(
            `UPDATE shows SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );
        return result.rows[0];
    },

    async delete(id) {
        await pool.query('DELETE FROM shows WHERE id = $1', [id]);
    }
};
