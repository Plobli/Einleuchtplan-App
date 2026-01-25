import pool from '../config/database.js';

export const User = {
    async create(email, password_hash, name, role = 'technician') {
        const result = await pool.query(
            'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at',
            [email, password_hash, name, role]
        );
        return result.rows[0];
    },

    async findByEmail(email) {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        return result.rows[0];
    },

    async findById(id) {
        const result = await pool.query(
            'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0];
    },

    async update(id, data) {
        const fields = [];
        const values = [];
        let paramCount = 1;

        if (data.name) {
            fields.push(`name = $${paramCount++}`);
            values.push(data.name);
        }
        if (data.email) {
            fields.push(`email = $${paramCount++}`);
            values.push(data.email);
        }
        if (data.password_hash) {
            fields.push(`password_hash = $${paramCount++}`);
            values.push(data.password_hash);
        }

        values.push(id);

        const result = await pool.query(
            `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING id, email, name, role`,
            values
        );
        return result.rows[0];
    }
};
