import express from 'express';
import {
    getAllShows,
    getShowById,
    getShowBySlug,
    createShow,
    updateShow,
    deleteShow,
    getTrashedShows,
    restoreShow,
    permanentDeleteShow,
    importChannels,
    exportShowAsJSON,
    getShowHistory,
    revertShowChange,
    getArchivedShows,
    archiveShow,
    unarchiveShow,
    backupAll,
    restoreBackup
} from '../controllers/showController.js';

const router = express.Router();

router.get('/slug/:slug', getShowBySlug);
router.get('/trash', getTrashedShows);
router.get('/archived', getArchivedShows);
router.get('/backup', backupAll);
router.post('/restore-backup', restoreBackup);
router.get('/', getAllShows);
router.get('/:id', getShowById);
router.post('/', createShow);
router.put('/:id', updateShow);
router.delete('/:id', deleteShow);
router.post('/:id/restore', restoreShow);
router.post('/:id/archive', archiveShow);
router.post('/:id/unarchive', unarchiveShow);
router.delete('/:id/permanent', permanentDeleteShow);
router.post('/:id/import', importChannels);
router.post('/:id/channels', importChannels); // Alias für Channel-Erstellung
router.get('/:id/export/json', exportShowAsJSON);
router.get('/:id/history', getShowHistory);
router.post('/:id/revert/:historyId', revertShowChange);

export default router;
