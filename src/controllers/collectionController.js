import { fetchCollectionByUserId, fetchCollectionByUserIdAndRarity, fetchCollectionByUserIdAndPosition, fetchCollectionByUserIdRarityAndPosition, fetchExistingStack, removeCardFromCollection, removeAllCardsFromUser, incrementStackQuantity } from '../models/collectionModel.js';
import { fetchCardById } from '../models/cardModel.js';
import { fetchUserByUsername } from '../models/userModel.js';
import { updateUser } from '../models/userModel.js';
import { fetchUltimateCollectionByUserId } from '../models/discoveryModel.js';

export const getUserCollection = async (req, res) => {
  try {
    const { username } = req.params;
    const { rarity, position, sort } = req.query;

    const user = await fetchUserByUsername(username);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let collection;
    if (rarity && position) {
      collection = await fetchCollectionByUserIdRarityAndPosition(user.user_id, rarity, position);
    } else if (rarity) {
      collection = await fetchCollectionByUserIdAndRarity(user.user_id, rarity);
    } else if (position) {
      collection = await fetchCollectionByUserIdAndPosition(user.user_id, position);
    } else {
      collection = await fetchCollectionByUserId(user.user_id);
    }

    let flattened = collection.map(entry => ({
      ...entry.cards,
      quantity: entry.user_collection.quantity,
      acquired_at: entry.user_collection.acquired_at,
    }));

    if (sort === 'asc') {
      flattened = flattened.sort((a, b) => a.overall_rating - b.overall_rating);
    } else if (sort === 'desc') {
      flattened = flattened.sort((a, b) => b.overall_rating - a.overall_rating);
    }

    res.status(200).json(flattened);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const sellCard = async (req, res) => {
  try {
    const { username, cardId } = req.params;
    const { quantity } = req.query;

    const user = await fetchUserByUsername(username);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const entry = await fetchExistingStack(user.user_id, cardId);
    if (!entry) return res.status(404).json({ error: 'You do not own this card' });

    const card = await fetchCardById(cardId);
    if (!card) return res.status(404).json({ error: 'Card not found' });

    const requestedQuantity = quantity === 'all' ? entry.quantity : (parseInt(quantity) || 1);

    if (requestedQuantity > entry.quantity) {
      return res.status(400).json({ error: `You only own ${entry.quantity} of this card` });
    }

    const coinsEarned = card.sell_value * requestedQuantity;
    const remainingQuantity = entry.quantity - requestedQuantity;

    if (remainingQuantity === 0) {
      await removeCardFromCollection(user.user_id, cardId);
    } else {
      await incrementStackQuantity(user.user_id, cardId, remainingQuantity);
    }

    await updateUser(username, { coins: user.coins + coinsEarned });

    res.status(200).json({
      message: `Sold ${requestedQuantity}x ${card.player_name} for ${coinsEarned} coins`,
      coins_earned: coinsEarned,
      remaining_quantity: remainingQuantity,
      new_balance: user.coins + coinsEarned,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const sellAllCards = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await fetchUserByUsername(username);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const collection = await fetchCollectionByUserId(user.user_id);
    if (collection.length === 0) return res.status(200).json({ message: 'No cards to sell', coins_earned: 0 });

    let totalEarned = 0;
    for (const entry of collection) {
      totalEarned += entry.cards.sell_value * entry.user_collection.quantity;
    }

    await removeAllCardsFromUser(user.user_id);
    await updateUser(username, { coins: user.coins + totalEarned });

    res.status(200).json({
      message: `Sold ${collection.length} card stacks`,
      coins_earned: totalEarned,
      new_balance: user.coins + totalEarned,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/** Returns every available card and the user's permanent discovery status. */
export const getUltimateCollection = async (req, res) => {
  try {
    const user = await fetchUserByUsername(req.params.username);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const collection = await fetchUltimateCollectionByUserId(user.user_id);
    const rarityOrder = ['Gold', 'Emerald', 'Sapphire', 'Ruby', 'Amethyst', 'Diamond', 'Pink Diamond', 'Galaxy Opal', 'Dark Matter'];
    const cards = collection.map((entry) => ({
      ...entry.cards,
      discovered: Boolean(entry.user_discovered_cards),
    })).sort((firstCard, secondCard) => {
      const rarityDifference = rarityOrder.indexOf(secondCard.rarity) - rarityOrder.indexOf(firstCard.rarity);
      return rarityDifference || secondCard.overall_rating - firstCard.overall_rating;
    });

    res.status(200).json(cards);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
