import { db } from '../db/connection.js';
import { achievements, user_achievements, user_packs } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

export const fetchAllAchievements = async () => {
  return await db.select().from(achievements);
};

export const fetchUserAchievements = async (userId) => {
  const rows = await db.select().from(user_achievements).innerJoin(achievements, eq(user_achievements.achievement_id, achievements.achievement_id)).where(eq(user_achievements.user_id, userId));
  return rows;
};

export const fetchUserAchievementById = async (userId, achievementId) => {
  const rows = await db.select().from(user_achievements).where(and(eq(user_achievements.user_id, userId), eq(user_achievements.achievement_id, achievementId)));
  return rows[0];
};

export const fetchAchievementById = async (achievementId) => {
  const rows = await db.select().from(achievements).where(eq(achievements.achievement_id, achievementId));
  return rows[0];
};

export const unlockAchievement = async (userId, achievementId) => {
  const rows = await db.insert(user_achievements).values({
    user_id: userId,
    achievement_id: achievementId,
    unlocked_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    claimed: false,
  }).returning();
  return rows[0];
};

export const claimAchievement = async (userId, achievementId) => {
  const rows = await db.update(user_achievements).set({ claimed: true }).where(and(eq(user_achievements.user_id, userId), eq(user_achievements.achievement_id, achievementId))).returning();
  return rows[0];
};

export const fetchUserPacks = async (userId) => {
  const rows = await db.select().from(user_packs).where(eq(user_packs.user_id, userId));
  return rows;
};

export const fetchUserPackByPackId = async (userId, packId) => {
  const rows = await db.select().from(user_packs).where(and(eq(user_packs.user_id, userId), eq(user_packs.pack_id, packId)));
  return rows[0];
};

export const addPackToUser = async (userId, packId, quantity) => {
  const existing = await fetchUserPackByPackId(userId, packId);
  if (existing) {
    const rows = await db.update(user_packs).set({ quantity: existing.quantity + quantity }).where(and(eq(user_packs.user_id, userId), eq(user_packs.pack_id, packId))).returning();
    return rows[0];
  } else {
    const rows = await db.insert(user_packs).values({ user_id: userId, pack_id: packId, quantity }).returning();
    return rows[0];
  }
};

export const deductUserPack = async (userId, packId) => {
  const existing = await fetchUserPackByPackId(userId, packId);
  if (!existing) return null;
  if (existing.quantity === 1) {
    await db.delete(user_packs).where(and(eq(user_packs.user_id, userId), eq(user_packs.pack_id, packId)));
    return { quantity: 0 };
  }
  const rows = await db.update(user_packs).set({ quantity: existing.quantity - 1 }).where(and(eq(user_packs.user_id, userId), eq(user_packs.pack_id, packId))).returning();
  return rows[0];
};