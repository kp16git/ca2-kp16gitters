import express from 'express';
import { getAllCards, getCardById } from '../controllers/cardController.js';

const router = express.Router();

router.get('/', getAllCards);
router.get('/:id', getCardById);

export default router;