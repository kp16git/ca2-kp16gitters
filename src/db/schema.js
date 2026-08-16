// ✏️ EDIT THIS FILE — add your own table schemas below the example `tasks` table.
// After adding a new table, run `npm run db` to recreate the database.

/**
 * All table schemas live here. Add new tables below and run `npm run db` to apply.
 */

import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const users = sqliteTable('users', {
  user_id: integer('user_id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  password: text('password'),
  coins: integer('coins').notNull().default(10000),
  total_packs_opened: integer('total_packs_opened').notNull().default(0),
  total_coins_spent: integer('total_coins_spent').notNull().default(0),
  welcome_packs_bought: integer('welcome_packs_bought').notNull().default(0),
});

export const cards = sqliteTable('cards', {
  card_id: text('card_id').primaryKey(),
  player_name: text('player_name').notNull(),
  team: text('team').notNull(),
  position: text('position').notNull(),
  overall_rating: integer('overall_rating').notNull(),
  rarity: text('rarity').notNull(),
  sell_value: integer('sell_value').notNull(),
});

export const packs = sqliteTable('packs', {
  pack_id: text('pack_id').primaryKey(),
  pack_name: text('pack_name').notNull(),
  cost: integer('cost').notNull(),
  description: text('description'),
  min_rarity: text('min_rarity').notNull(),
});

export const user_collection = sqliteTable('user_collection', {
  user_id: integer('user_id').notNull().references(() => users.user_id),
  card_id: text('card_id').notNull().references(() => cards.card_id),
  quantity: integer('quantity').notNull().default(1),
  acquired_at: text('acquired_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => ({
  pk: primaryKey({ columns: [table.user_id, table.card_id] }),
}));

export const achievements = sqliteTable('achievements', {
  achievement_id: text('achievement_id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  condition_type: text('condition_type').notNull(),
  condition_value: text('condition_value').notNull(),
  reward_pack_id: text('reward_pack_id').notNull().references(() => packs.pack_id),
  reward_pack_quantity: integer('reward_pack_quantity').notNull(),
});

export const user_achievements = sqliteTable('user_achievements', {
  user_id: integer('user_id').notNull().references(() => users.user_id),
  achievement_id: text('achievement_id').notNull().references(() => achievements.achievement_id),
  unlocked_at: text('unlocked_at').notNull(),
  claimed: integer('claimed', { mode: 'boolean' }).notNull().default(false),
}, (table) => ({
  pk: primaryKey({ columns: [table.user_id, table.achievement_id] }),
}));

export const user_packs = sqliteTable('user_packs', {
  user_id: integer('user_id').notNull().references(() => users.user_id),
  pack_id: text('pack_id').notNull().references(() => packs.pack_id),
  quantity: integer('quantity').notNull().default(1),
}, (table) => ({
  pk: primaryKey({ columns: [table.user_id, table.pack_id] }),
}));

export const user_discovered_cards = sqliteTable('user_discovered_cards', {
  user_id: integer('user_id').notNull().references(() => users.user_id),
  card_id: text('card_id').notNull().references(() => cards.card_id),
  discovered_at: text('discovered_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => ({
  pk: primaryKey({ columns: [table.user_id, table.card_id] }),
}));
