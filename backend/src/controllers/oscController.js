import pool from '../config/database.js';
import { sendOscAddress } from '../osc.js';

const DEFAULT_CMD_ON  = '/eos/chan/{kanal}/full';
const DEFAULT_CMD_OFF = '/eos/chan/{kanal}/out';

export const getSettings = async (req, res, next) => {
    try {
        const { venue } = req.params;
        const result = await pool.query(
            'SELECT venue, osc_ip, osc_port, cmd_on, cmd_off FROM venue_osc_settings WHERE venue = $1',
            [venue]
        );
        if (result.rows.length === 0) {
            return res.json({ venue, osc_ip: '', osc_port: 8000, cmd_on: DEFAULT_CMD_ON, cmd_off: DEFAULT_CMD_OFF });
        }
        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
};

export const saveSettings = async (req, res, next) => {
    try {
        const { venue } = req.params;
        const { osc_ip, osc_port, cmd_on, cmd_off } = req.body;

        const result = await pool.query(
            `INSERT INTO venue_osc_settings (venue, osc_ip, osc_port, cmd_on, cmd_off, updated_at)
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
             ON CONFLICT (venue) DO UPDATE SET
               osc_ip = EXCLUDED.osc_ip,
               osc_port = EXCLUDED.osc_port,
               cmd_on = EXCLUDED.cmd_on,
               cmd_off = EXCLUDED.cmd_off,
               updated_at = CURRENT_TIMESTAMP
             RETURNING venue, osc_ip, osc_port, cmd_on, cmd_off`,
            [venue, osc_ip || '', osc_port || 8000, cmd_on || DEFAULT_CMD_ON, cmd_off || DEFAULT_CMD_OFF]
        );
        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
};

export const triggerOsc = async (req, res, next) => {
    try {
        const { show_id, kanal, action } = req.body;

        if (!show_id || !kanal || !['on', 'off'].includes(action)) {
            return res.status(400).json({ error: 'show_id, kanal and action (on|off) are required' });
        }

        // Get venue for this show
        const showResult = await pool.query('SELECT venue FROM shows WHERE id = $1', [show_id]);
        if (showResult.rows.length === 0) {
            return res.status(404).json({ error: 'Show not found' });
        }
        const venue = showResult.rows[0].venue;

        if (!venue) {
            return res.status(400).json({ error: 'Show has no venue configured' });
        }

        // Get OSC settings for this venue
        const settingsResult = await pool.query(
            'SELECT osc_ip, osc_port, cmd_on, cmd_off FROM venue_osc_settings WHERE venue = $1',
            [venue]
        );

        if (settingsResult.rows.length === 0 || !settingsResult.rows[0].osc_ip) {
            return res.status(400).json({ error: 'No OSC settings configured for this venue' });
        }

        const { osc_ip, osc_port, cmd_on, cmd_off } = settingsResult.rows[0];
        const template = action === 'on' ? cmd_on : cmd_off;
        const address = template.replace(/{kanal}/g, kanal);

        sendOscAddress(osc_ip, parseInt(osc_port), address);

        res.json({ success: true, address, ip: osc_ip, port: osc_port });
    } catch (error) {
        next(error);
    }
};
