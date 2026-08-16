import express from 'express';
import { getAllUsers, getUserByUsername, searchUserByUsername, createNewUser, updateExistingUser, deleteExistingUser } from '../controllers/userController.js';
import { getUserPacks, openFreePack, openFreePackAll } from '../controllers/packController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { verifyOwnership } from '../middlewares/ownershipMiddleware.js';

const router = express.Router();

router.get('/', (req, res) => {
  if (req.query.username) return searchUserByUsername(req, res);
  return getAllUsers(req, res);
});

router.get('/:username', authMiddleware, verifyOwnership, getUserByUsername);
router.post('/', createNewUser);
router.put('/:username', authMiddleware, verifyOwnership, updateExistingUser);
router.delete('/:username', authMiddleware, verifyOwnership, deleteExistingUser);
router.get('/:username/packs', authMiddleware, verifyOwnership, getUserPacks);
router.post('/:username/packs/:packId/open', authMiddleware, verifyOwnership, openFreePack);
router.post('/:username/packs/open-all', authMiddleware, verifyOwnership, openFreePackAll);

export default router;