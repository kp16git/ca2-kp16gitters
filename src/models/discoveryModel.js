import { db } from '../db/connection.js';
import { cards, user_discovered_cards } from '../db/schema.js';
import { and, eq } from 'drizzle-orm';

/** Records a card as permanently discovered by a user. */
export const recordDiscoveredCard = async (userId, cardId) => {
  await db.insert(user_discovered_cards).values({
    user_id: userId,
    card_id: cardId,
  }).onConflictDoNothing();
};

/** Returns every card and whether the user has discovered it before. */
export const fetchUltimateCollectionByUserId = async (userId) => {
  return await db.select()
    .from(cards)
    .leftJoin(
      user_discovered_cards,
      and(
        eq(cards.card_id, user_discovered_cards.card_id),
        eq(user_discovered_cards.user_id, userId),
      ),
    );
};
