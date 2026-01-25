import express from 'express';
import {
    getAllShows,
    getShowById,
    createShow,
    updateShow,
    deleteShow,
    importChannels,
    exportShowAsJSON
} from '../controllers/showController.js';

const router = express.Router();

router.get('/', getAllShows);
router.get('/:id', getShowById);
router.post('/', createShow);
router.put('/:id', updateShow);
router.delete('/:id', deleteShow);
router.post('/:id/import', importChannels);
router.get('/:id/export/json', exportShowAsJSON);

export default router;
