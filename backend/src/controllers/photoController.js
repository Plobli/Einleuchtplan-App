import pool from '../config/database.js';

export const getPhotos = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT id, show_id, caption, original_name, width, height, position, created_at FROM show_photos WHERE show_id = $1 ORDER BY position ASC, created_at ASC',
            [id]
        );
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
};

export const getPhotosFull = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT id, show_id, caption, data, original_name, width, height, position, created_at FROM show_photos WHERE show_id = $1 ORDER BY position ASC, created_at ASC',
            [id]
        );
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
};

export const createPhoto = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { data, caption = '', original_name, width, height } = req.body;

        if (!data) {
            return res.status(400).json({ error: 'data is required' });
        }

        const posResult = await pool.query(
            'SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM show_photos WHERE show_id = $1',
            [id]
        );
        const position = posResult.rows[0].next_pos;

        const result = await pool.query(
            `INSERT INTO show_photos (show_id, caption, data, original_name, width, height, position, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, show_id, caption, original_name, width, height, position, created_at`,
            [id, caption, data, original_name || null, width || null, height || null, position, req.user.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
};

export const updatePhoto = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { caption, position } = req.body;

        const fields = [];
        const values = [];
        let idx = 1;

        if (caption !== undefined) { fields.push(`caption = $${idx++}`); values.push(caption); }
        if (position !== undefined) { fields.push(`position = $${idx++}`); values.push(position); }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'Nothing to update' });
        }

        values.push(id);
        const result = await pool.query(
            `UPDATE show_photos SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, show_id, caption, original_name, width, height, position, created_at`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Photo not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
};

export const deletePhoto = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM show_photos WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Photo not found' });
        }
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};
