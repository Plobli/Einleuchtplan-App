import express from 'express';
import {
    getAllShows,
    getShowById,
    createShow,
    updateShow,
    deleteShow,
    getTrashedShows,
    restoreShow,
    permanentDeleteShow,
    importChannels,
    exportShowAsJSON,
    getShowHistory,
    revertShowChange
} from '../controllers/showController.js';

const router = express.Router();

router.get('/trash', getTrashedShows);
router.get('/', getAllShows);
router.get('/:id', getShowById);
router.post('/', createShow);
router.put('/:id', updateShow);
router.delete('/:id', deleteShow);
router.post('/:id/restore', restoreShow);
router.delete('/:id/permanent', permanentDeleteShow);
router.post('/:id/import', importChannels);
router.post('/:id/channels', importChannels); // Alias für Channel-Erstellung
router.get('/:id/export/json', exportShowAsJSON);
router.get('/:id/history', getShowHistory);
router.post('/:id/revert/:historyId', revertShowChange);

export default router;
