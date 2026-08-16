import { fetchAllCards, fetchCardById, fetchCardsByRarity, fetchCardsByPosition } from '../models/cardModel.js';

export const getAllCards = async (req, res) => {
  try {
    const { rarity, position } = req.query;
    if (rarity) {
      const cards = await fetchCardsByRarity(rarity);
      return res.status(200).json(cards);
    }
    if (position) {
      const cards = await fetchCardsByPosition(position);
      return res.status(200).json(cards);
    }
    const cards = await fetchAllCards();
    res.status(200).json(cards);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCardById = async (req, res) => {
  try {
    const card = await fetchCardById(req.params.id);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    res.status(200).json(card);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};