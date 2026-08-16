import { db } from '../db/connection.js';
import { packs, user_packs } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

export const fetchAllPacks = async () => {
  return await db.select().from(packs);
};

export const fetchPackById = async (id) => {
  const rows = await db.select().from(packs).where(eq(packs.pack_id, id));
  return rows[0];
};

export const deductAllUserPacks = async (userId, packId) => {
  await db.delete(user_packs).where(and(eq(user_packs.user_id, userId), eq(user_packs.pack_id, packId)));
};