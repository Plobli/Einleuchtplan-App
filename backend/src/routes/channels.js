import express from 'express';
import {
    getChannelsByShow,
    getChannelById,
    createChannel,
    updateChannel,
    deleteChannel,
    getShowHistory,
    revertChannelChange
} from '../controllers/channelController.js';

const router = express.Router();

router.get('/show/:showId', getChannelsByShow);
router.get('/show/:showId/history', getShowHistory);
router.get('/:id', getChannelById);
router.post('/show/:showId', createChannel);
router.put('/:id', updateChannel);
router.post('/revert/:historyId', revertChannelChange);
router.delete('/:id', deleteChannel);

export default router;
