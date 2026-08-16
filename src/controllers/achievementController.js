import {fetchAllAchievements, fetchUserAchievements, fetchUserAchievementById, fetchAchievementById, unlockAchievement, claimAchievement, addPackToUser,} from '../models/achievementModel.js';
import { fetchUserByUsername } from '../models/userModel.js';
import { fetchCollectionByUserId } from '../models/collectionModel.js';
import { fetchUltimateCollectionByUserId } from '../models/discoveryModel.js';

const RARITY_ORDER = ['Gold', 'Emerald', 'Sapphire', 'Ruby', 'Amethyst', 'Diamond', 'Pink Diamond', 'Galaxy Opal', 'Dark Matter'];

const meetsCondition = (conditionType, conditionValue, stats) => {
  if (conditionType === 'packs_opened') {
    return stats.packsOpened >= Number(conditionValue);
  }
  if (conditionType === 'coins_spent') {
    return stats.coinsSpent >= Number(conditionValue);
  }
  if (conditionType === 'collection_size') {
    return stats.collectionSize >= Number(conditionValue);
  }
  if (conditionType === 'rarity_pulled') {
    const minIndex = RARITY_ORDER.indexOf(conditionValue);
    return stats.highestRarityIndex >= minIndex;
  }
  if (conditionType === 'ultimate_collection') {
    return stats.discoveredCount >= stats.totalCards;
  }
  return false;
};

const getAchievementStats = async (user) => {
  const collection = await fetchCollectionByUserId(user.user_id);
  const ultimateCollection = await fetchUltimateCollectionByUserId(user.user_id);
  const discoveredCards = ultimateCollection.filter((entry) => entry.user_discovered_cards);

  const highestRarityIndex = discoveredCards.reduce((max, row) => {
    const idx = RARITY_ORDER.indexOf(row.cards.rarity);
    return idx > max ? idx : max;
  }, -1);

  return {
    packsOpened: user.total_packs_opened,
    coinsSpent: user.total_coins_spent,
    collectionSize: collection.length,
    discoveredCount: discoveredCards.length,
    totalCards: ultimateCollection.length,
    highestRarityIndex,
  };
};

export const getAllAchievements = async (req, res) => {
  try {
    const achievements = await fetchAllAchievements();
    res.status(200).json(achievements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserAchievements = async (req, res) => {
  try {
    const user = await fetchUserByUsername(req.params.username);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const userAchievements = await fetchUserAchievements(user.user_id);
    res.status(200).json(userAchievements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/** Returns achievements, unlocks, and progress values for the current user. */
export const getAchievementProgress = async (req, res) => {
  try {
    const user = await fetchUserByUsername(req.params.username);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const [achievements, userAchievements, stats] = await Promise.all([
      fetchAllAchievements(),
      fetchUserAchievements(user.user_id),
      getAchievementStats(user),
    ]);

    res.status(200).json({ achievements, userAchievements, stats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const checkAchievements = async (req, res) => {
  try {
    const user = await fetchUserByUsername(req.params.username);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const allAchievements = await fetchAllAchievements();
    const stats = await getAchievementStats(user);

    const newlyUnlocked = [];

    for (const achievement of allAchievements) {
      const existing = await fetchUserAchievementById(user.user_id, achievement.achievement_id);
      if (existing) continue;

      if (meetsCondition(achievement.condition_type, achievement.condition_value, stats)) {
        const unlocked = await unlockAchievement(user.user_id, achievement.achievement_id);
        newlyUnlocked.push({ ...achievement, ...unlocked });
      }
    }

    res.status(200).json({
      message: newlyUnlocked.length > 0
        ? `${newlyUnlocked.length} new achievement(s) unlocked!`
        : 'No new achievements unlocked',
      newlyUnlocked,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const claimAchievementReward = async (req, res) => {
  try {
    const { username, achievementId } = req.params;

    const user = await fetchUserByUsername(username);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const userAchievement = await fetchUserAchievementById(user.user_id, achievementId);
    if (!userAchievement) return res.status(404).json({ error: 'Achievement not unlocked yet' });
    if (userAchievement.claimed) return res.status(400).json({ error: 'Reward already claimed' });

    const achievement = await fetchAchievementById(achievementId);
    if (!achievement) return res.status(404).json({ error: 'Achievement not found' });

    await claimAchievement(user.user_id, achievementId);
    const updatedPacks = await addPackToUser(user.user_id, achievement.reward_pack_id, achievement.reward_pack_quantity);

    res.status(200).json({
      message: `Claimed ${achievement.name}! You received ${achievement.reward_pack_quantity}x ${achievement.reward_pack_id}`,
      packs: updatedPacks,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

