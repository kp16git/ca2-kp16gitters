import express from 'express';
import {getAllAchievements, getUserAchievements, getAchievementProgress, checkAchievements, claimAchievementReward,} from '../controllers/achievementController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { verifyOwnership } from '../middlewares/ownershipMiddleware.js';

const router = express.Router();

router.get('/', getAllAchievements);
router.get('/:username/achievements', authMiddleware, verifyOwnership, getUserAchievements);
router.get('/:username/achievements/progress', authMiddleware, verifyOwnership, getAchievementProgress);
router.post('/:username/achievements/check', authMiddleware, verifyOwnership, checkAchievements);
router.post('/:username/achievements/:achievementId/claim', authMiddleware, verifyOwnership, claimAchievementReward);

export default router;
