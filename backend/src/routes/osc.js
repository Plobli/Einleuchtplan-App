import { Router } from 'express';
import { getSettings, saveSettings, triggerOsc } from '../controllers/oscController.js';

const router = Router();

router.get('/osc/settings/:venue', getSettings);
router.put('/osc/settings/:venue', saveSettings);
router.post('/osc/trigger', triggerOsc);

export default router;
