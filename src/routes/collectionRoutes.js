import express from 'express';
import { getUserCollection, getUltimateCollection, sellCard, sellAllCards } from '../controllers/collectionController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { verifyOwnership } from '../middlewares/ownershipMiddleware.js';

const router = express.Router();

router.get('/:username/collection', authMiddleware, verifyOwnership, getUserCollection);
router.get('/:username/ultimate-collection', authMiddleware, verifyOwnership, getUltimateCollection);
router.delete('/:username/collection/sell-all', authMiddleware, verifyOwnership, sellAllCards);
router.delete('/:username/collection/sell/:cardId', authMiddleware, verifyOwnership, sellCard);

export default router;
