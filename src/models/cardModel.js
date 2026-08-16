import { db } from '../db/connection.js';
import { cards } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export const fetchAllCards = async () => {
  return await db.select().from(cards);
};

export const fetchCardById = async (id) => {
  const rows = await db.select().from(cards).where(eq(cards.card_id, id));
  return rows[0];
};

export const fetchCardsByRarity = async (rarity) => {
  const rows = await db.select().from(cards).where(eq(cards.rarity, rarity));
  return rows;
};

export const fetchCardsByPosition = async (position) => {
  const rows = await db.select().from(cards).where(eq(cards.position, position));
  return rows;
};