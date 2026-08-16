import { fetchAllPacks, fetchPackById, deductAllUserPacks } from '../models/packModel.js';
import { fetchAllCards } from '../models/cardModel.js';
import { addCardToCollection, fetchExistingStack, incrementStackQuantity } from '../models/collectionModel.js';
import { fetchUserByUsername, updateUser, incrementPackStats } from '../models/userModel.js';
import { fetchUserPacks, fetchUserPackByPackId, deductUserPack } from '../models/achievementModel.js';
import { recordDiscoveredCard } from '../models/discoveryModel.js';

const RARITY_ORDER = [
  "Gold", "Emerald", "Sapphire", "Ruby", "Amethyst",
  "Diamond", "Pink Diamond", "Galaxy Opal", "Dark Matter",
];

const PACK_WEIGHTS = {
  'starter-pack': { 'Gold': 50, 'Emerald': 32, 'Sapphire': 18 },
  'pro-pack': { 'Sapphire': 55, 'Ruby': 30, 'Amethyst': 15 },
  'elite-pack': { 'Amethyst': 50, 'Diamond': 30, 'Pink Diamond': 17, 'Galaxy Opal': 2.5, 'Dark Matter': 0.5 },
  'legend-pack': { 'Diamond': 50, 'Pink Diamond': 30, 'Galaxy Opal': 15, 'Dark Matter': 5 },
  'welcome-pack': { 'Gold': 16, 'Emerald': 16, 'Sapphire': 16, 'Ruby': 16, 'Amethyst': 16, 'Diamond': 5, 'Pink Diamond': 5, 'Galaxy Opal': 5, 'Dark Matter': 5 },
};

const getRandomCard = (cards, packId) => {
  const weights = PACK_WEIGHTS[packId];
  const eligibleRarities = Object.keys(weights);
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;

  for (const rarity of eligibleRarities) {
    random -= weights[rarity];
    if (random <= 0) {
      const cardsOfRarity = cards.filter((card) => card.rarity === rarity);
      return cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)];
    }
  }

  const fallbackRarity = eligibleRarities[eligibleRarities.length - 1];
  return cards.find((card) => card.rarity === fallbackRarity);
};

export const getAllPacks = async (req, res) => {
  try {
    const packs = await fetchAllPacks();
    res.status(200).json(packs.map((pack) => ({ ...pack, odds: PACK_WEIGHTS[pack.pack_id] })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const openPack = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "username is required" });

    const pack = await fetchPackById(req.params.packId);
    if (!pack) return res.status(404).json({ error: "Pack not found" });

    const user = await fetchUserByUsername(username);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (req.params.packId === 'welcome-pack' && user.welcome_packs_bought >= 3) {
      return res.status(400).json({ error: 'All 3 Welcome Packs have already been purchased' });
    }

    if (user.coins < pack.cost) return res.status(400).json({ error: "Not enough coins to open this pack" });

    const allCards = await fetchAllCards();
    const drawnCard = getRandomCard(allCards, req.params.packId);

    await updateUser(username, {
      coins: user.coins - pack.cost,
      welcome_packs_bought: req.params.packId === 'welcome-pack' ? user.welcome_packs_bought + 1 : user.welcome_packs_bought,
    });
    await incrementPackStats(username, pack.cost, 1);

    const existingStack = await fetchExistingStack(user.user_id, drawnCard.card_id);
    await recordDiscoveredCard(user.user_id, drawnCard.card_id);
    let newQuantity;
    if (existingStack) {
      const updated = await incrementStackQuantity(user.user_id, drawnCard.card_id, existingStack.quantity + 1);
      newQuantity = updated.quantity;
    } else {
      await addCardToCollection({
        user_id: user.user_id,
        card_id: drawnCard.card_id,
        quantity: 1,
        acquired_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      });
      newQuantity = 1;
    }

    res.status(201).json({
      message: `You opened a ${pack.pack_name} and got ${drawnCard.player_name}!`,
      card: drawnCard,
      quantity_owned: newQuantity,
      remaining_coins: user.coins - pack.cost,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const openPackBulk = async (req, res) => {
  try {
    const { username, quantity } = req.body;
    const { packId } = req.params;

    if (!username) return res.status(400).json({ error: 'username is required' });
    const amount = parseInt(quantity) || 1;
    if (amount < 1 || amount > 50) return res.status(400).json({ error: 'Quantity must be between 1 and 50' });

    const pack = await fetchPackById(packId);
    if (!pack) return res.status(404).json({ error: 'Pack not found' });

    const user = await fetchUserByUsername(username);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const totalCost = pack.cost * amount;
    if (user.coins < totalCost) return res.status(400).json({ error: `Not enough coins. Need ${totalCost.toLocaleString()} coins` });
    if (packId === 'welcome-pack' && user.welcome_packs_bought + amount > 3) {
      const remaining = 3 - user.welcome_packs_bought;
      return res.status(400).json({ error: `You can only buy ${remaining} more Welcome Pack${remaining === 1 ? '' : 's'}` });
    }

    const allCards = await fetchAllCards();
    const drawnCards = [];

    for (let i = 0; i < amount; i++) {
      const drawnCard = getRandomCard(allCards, packId);
      drawnCards.push(drawnCard);

      const existingStack = await fetchExistingStack(user.user_id, drawnCard.card_id);
      await recordDiscoveredCard(user.user_id, drawnCard.card_id);
      if (existingStack) {
        await incrementStackQuantity(user.user_id, drawnCard.card_id, existingStack.quantity + 1);
      } else {
        await addCardToCollection({
          user_id: user.user_id,
          card_id: drawnCard.card_id,
          quantity: 1,
          acquired_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
        });
      }
    }

    await updateUser(username, {
      coins: user.coins - totalCost,
      welcome_packs_bought: packId === 'welcome-pack' ? user.welcome_packs_bought + amount : user.welcome_packs_bought,
    });
    await incrementPackStats(username, totalCost, amount);

    res.status(201).json({
      message: `Opened ${amount}x ${pack.pack_name}!`,
      cards: drawnCards,
      remaining_coins: user.coins - totalCost,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserPacks = async (req, res) => {
  try {
    const user = await fetchUserByUsername(req.params.username);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const packs = await fetchUserPacks(user.user_id);
    res.status(200).json(packs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const openFreePack = async (req, res) => {
  try {
    const { username, packId } = req.params;

    const user = await fetchUserByUsername(username);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const userPack = await fetchUserPackByPackId(user.user_id, packId);
    if (!userPack || userPack.quantity < 1) return res.status(400).json({ error: 'No packs of this type available' });

    const pack = await fetchPackById(packId);
    if (!pack) return res.status(404).json({ error: 'Pack not found' });

    const allCards = await fetchAllCards();
    const drawnCard = getRandomCard(allCards, packId);

    await deductUserPack(user.user_id, packId);

    const existingStack = await fetchExistingStack(user.user_id, drawnCard.card_id);
    await recordDiscoveredCard(user.user_id, drawnCard.card_id);
    if (existingStack) {
      await incrementStackQuantity(user.user_id, drawnCard.card_id, existingStack.quantity + 1);
    } else {
      await addCardToCollection({
        user_id: user.user_id,
        card_id: drawnCard.card_id,
        quantity: 1,
        acquired_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      });
    }

    await incrementPackStats(username, 0, 1);

    res.status(201).json({
      message: `You opened a ${pack.pack_name} and got ${drawnCard.player_name}!`,
      card: drawnCard,
      remaining_coins: user.coins,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const openFreePackAll = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await fetchUserByUsername(username);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const userPacks = await fetchUserPacks(user.user_id);
    if (!userPacks || userPacks.length === 0) return res.status(400).json({ error: 'No free packs available' });

    const allCards = await fetchAllCards();
    const drawnCards = [];
    let totalPacks = 0;

    for (const userPack of userPacks) {
      totalPacks += userPack.quantity;
      for (let i = 0; i < userPack.quantity; i++) {
        const drawnCard = getRandomCard(allCards, userPack.pack_id);
        drawnCards.push(drawnCard);

        const existingStack = await fetchExistingStack(user.user_id, drawnCard.card_id);
        await recordDiscoveredCard(user.user_id, drawnCard.card_id);
        if (existingStack) {
          await incrementStackQuantity(user.user_id, drawnCard.card_id, existingStack.quantity + 1);
        } else {
          await addCardToCollection({
            user_id: user.user_id,
            card_id: drawnCard.card_id,
            quantity: 1,
            acquired_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
          });
        }
      }
      await deductAllUserPacks(user.user_id, userPack.pack_id);
    }

    await incrementPackStats(username, 0, totalPacks);

    res.status(201).json({
      message: `Opened ${drawnCards.length} free packs!`,
      cards: drawnCards,
      remaining_coins: user.coins,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
