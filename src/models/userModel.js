import { db } from '../db/connection.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export const fetchAllUsers = async () => {
  return await db.select().from(users);
};

export const fetchUserByUsername = async (username) => {
  const rows = await db.select().from(users).where(eq(users.username, username));
  return rows[0];
};

export const createUser = async (userData) => {
  const rows = await db.insert(users).values(userData).returning();
  return rows[0];
};

export const updateUser = async (username, userData) => {
  const rows = await db.update(users).set(userData).where(eq(users.username, username)).returning();
  return rows[0];
};

export const deleteUser = async (username) => {
  const rows = await db.delete(users).where(eq(users.username, username)).returning();
  return rows[0];
};

export const incrementPackStats = async (username, coinCost, quantity = 1) => {
  const user = await fetchUserByUsername(username);
  if (!user) return;
  const rows = await db.update(users).set({
    total_packs_opened: user.total_packs_opened + quantity,
    total_coins_spent: user.total_coins_spent + coinCost,
  }).where(eq(users.username, username)).returning();
  return rows[0];
};