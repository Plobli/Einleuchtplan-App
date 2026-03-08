import { Router } from 'express';
import { getPhotos, getPhotosFull, createPhoto, updatePhoto, deletePhoto } from '../controllers/photoController.js';

const router = Router();

router.get('/shows/:id/photos', getPhotos);
router.get('/shows/:id/photos/full', getPhotosFull);
router.post('/shows/:id/photos', createPhoto);
router.put('/photos/:id', updatePhoto);
router.delete('/photos/:id', deletePhoto);

export default router;
