import express from 'express';
import {
    getChannelsByShow,
    getChannelById,
    createChannel,
    updateChannel,
    deleteChannel
} from '../controllers/channelController.js';

const router = express.Router();

router.get('/show/:showId', getChannelsByShow);
router.get('/:id', getChannelById);
router.post('/show/:showId', createChannel);
router.put('/:id', updateChannel);
router.delete('/:id', deleteChannel);

export default router;
