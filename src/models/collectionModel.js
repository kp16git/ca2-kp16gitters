import { db } from '../db/connection.js';
import { user_collection, cards } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

export const fetchCollectionByUserId = async (userId) => {
  const rows = await db.select().from(user_collection).innerJoin(cards, eq(user_collection.card_id, cards.card_id)).where(eq(user_collection.user_id, userId));
  return rows;
};

export const fetchCollectionByUserIdAndRarity = async (userId, rarity) => {
  const rows = await db.select().from(user_collection).innerJoin(cards, eq(user_collection.card_id, cards.card_id)).where(and(eq(user_collection.user_id, userId), eq(cards.rarity, rarity)));
  return rows;
};

export const fetchCollectionByUserIdAndPosition = async (userId, position) => {
  const rows = await db.select().from(user_collection).innerJoin(cards, eq(user_collection.card_id, cards.card_id)).where(and(eq(user_collection.user_id, userId), eq(cards.position, position)));
  return rows;
};

export const fetchCollectionByUserIdRarityAndPosition = async (userId, rarity, position) => {
  const rows = await db.select().from(user_collection).innerJoin(cards, eq(user_collection.card_id, cards.card_id)).where(and(eq(user_collection.user_id, userId), eq(cards.rarity, rarity), eq(cards.position, position)));
  return rows;
};

export const fetchExistingStack = async (userId, cardId) => {
  const rows = await db.select().from(user_collection).where(and(eq(user_collection.user_id, userId), eq(user_collection.card_id, cardId)));
  return rows[0];
};

export const addCardToCollection = async (collectionData) => {
  const rows = await db.insert(user_collection).values(collectionData).returning();
  return rows[0];
};

export const incrementStackQuantity = async (userId, cardId, newQuantity) => {
  const rows = await db.update(user_collection).set({ quantity: newQuantity }).where(and(eq(user_collection.user_id, userId), eq(user_collection.card_id, cardId))).returning();
  return rows[0];
};

export const removeCardFromCollection = async (userId, cardId) => {
  const rows = await db.delete(user_collection).where(and(eq(user_collection.user_id, userId), eq(user_collection.card_id, cardId))).returning();
  return rows[0];
};

export const removeAllCardsFromUser = async (userId) => {
  const rows = await db.delete(user_collection).where(eq(user_collection.user_id, userId)).returning();
  return rows;
};