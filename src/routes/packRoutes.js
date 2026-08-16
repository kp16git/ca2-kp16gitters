import express from 'express';
import { getAllPacks, openPack, openPackBulk } from '../controllers/packController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { verifyBodyOwnership } from '../middlewares/ownershipMiddleware.js';

const router = express.Router();

router.get('/', getAllPacks);
router.post('/open/:packId', authMiddleware, verifyBodyOwnership, openPack);
router.post('/open/:packId/bulk', authMiddleware, verifyBodyOwnership, openPackBulk);

export default router;