// ✏️ EDIT THIS FILE — add seed data for your own tables below the example tasks.

/**
 * Seed data and database reset script. Run with: npm run db
 *
 * To add your own seed data:
 *   1. Import your table schema from './schema.js'
 *   2. Add a sample data array
 *   3. Insert it inside the seed() function with db.insert()
 */

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import 'dotenv/config';

// Import your table schemas here
import { tasks, cards, packs, users, achievements } from './schema.js';

// --- Seed data ---

const seedCards = [
  // Gold
  { card_id: 'gold-tacko-fall', player_name: 'Tacko Fall', team: 'Celtics', position: 'C', overall_rating: 72, rarity: 'Gold', sell_value: 500 },
  { card_id: 'gold-bronny-james', player_name: 'Bronny James', team: 'Lakers', position: 'PG', overall_rating: 74, rarity: 'Gold', sell_value: 500 },
  { card_id: 'gold-ben-simmons', player_name: 'Ben Simmons', team: 'Nets', position: 'PF', overall_rating: 77, rarity: 'Gold', sell_value: 500 },
  { card_id: 'gold-lonzo-ball', player_name: 'Lonzo Ball', team: 'Bulls', position: 'PG', overall_rating: 75, rarity: 'Gold', sell_value: 500 },
  { card_id: 'gold-dalton-knecht', player_name: 'Dalton Knecht', team: 'Lakers', position: 'SG', overall_rating: 73, rarity: 'Gold', sell_value: 500 },
  { card_id: 'gold-alex-caruso', player_name: 'Alex Caruso', team: 'Thunder', position: 'SG', overall_rating: 79, rarity: 'Gold', sell_value: 500 },
  // Emerald
  { card_id: 'emerald-zach-lavine', player_name: 'Zach LaVine', team: 'Kings', position: 'SG', overall_rating: 80, rarity: 'Emerald', sell_value: 1000 },
  { card_id: 'emerald-aaron-gordon', player_name: 'Aaron Gordon', team: 'Nuggets', position: 'PF', overall_rating: 81, rarity: 'Emerald', sell_value: 1000 },
  { card_id: 'emerald-vj-edgecombe', player_name: 'VJ Edgecombe', team: '76ers', position: 'SG', overall_rating: 82, rarity: 'Emerald', sell_value: 1000 },
  { card_id: 'emerald-kon-knueppel', player_name: 'Kon Knueppel', team: 'Hornets', position: 'SG', overall_rating: 83, rarity: 'Emerald', sell_value: 1000 },
  { card_id: 'emerald-yao-ming', player_name: 'Yao Ming', team: 'Timberwolves', position: 'C', overall_rating: 83, rarity: 'Emerald', sell_value: 1000 },
  // Sapphire
  { card_id: 'sapphire-dylan-harper', player_name: 'Dylan Harper', team: 'Spurs', position: 'PG', overall_rating: 84, rarity: 'Sapphire', sell_value: 1800 },
  { card_id: 'sapphire-austin-reaves', player_name: 'Austin Reaves', team: 'Lakers', position: 'SG', overall_rating: 85, rarity: 'Sapphire', sell_value: 1800 },
  { card_id: 'sapphire-cooper-flagg', player_name: 'Cooper Flagg', team: 'Mavericks', position: 'SF', overall_rating: 86, rarity: 'Sapphire', sell_value: 1800 },
  { card_id: 'sapphire-kristaps-porzingis', player_name: 'Kristaps Porzingis', team: 'Celtics', position: 'C', overall_rating: 86, rarity: 'Sapphire', sell_value: 1800 },
  // Ruby
  { card_id: 'ruby-cade-cunningham', player_name: 'Cade Cunningham', team: 'Pistons', position: 'PG', overall_rating: 87, rarity: 'Ruby', sell_value: 3000 },
  { card_id: 'ruby-jaylen-brown', player_name: 'Jaylen Brown', team: 'Celtics', position: 'SF', overall_rating: 88, rarity: 'Ruby', sell_value: 3000 },
  { card_id: 'ruby-anthony-edwards', player_name: 'Anthony Edwards', team: 'Timberwolves', position: 'SG', overall_rating: 89, rarity: 'Ruby', sell_value: 3000 },
  { card_id: 'ruby-victor-wembanyama', player_name: 'Victor Wembanyama', team: 'Spurs', position: 'C', overall_rating: 89, rarity: 'Ruby', sell_value: 3000 },
  // Amethyst
  { card_id: 'amethyst-shai-gilgeous-alenxander', player_name: 'Shai Gilgeous-Alexander', team: 'Thunder', position: 'PG', overall_rating: 90, rarity: 'Amethyst', sell_value: 5000 },
  { card_id: 'amethyst-kyrie-irving', player_name: 'Kyrie Irving', team: 'Mavericks', position: 'PG', overall_rating: 90, rarity: 'Amethyst', sell_value: 5000 },
  { card_id: 'amethyst-jayson-tatum', player_name: 'Jayson Tatum', team: 'Celtics', position: 'SF', overall_rating: 91, rarity: 'Amethyst', sell_value: 5000 },
  { card_id: 'amethyst-jalen-brunson', player_name: 'Jalen Brunson', team: 'Knicks', position: 'PG', overall_rating: 91, rarity: 'Amethyst', sell_value: 5000 },
  // Diamond
  { card_id: 'diamond-anthony-davis', player_name: 'Anthony Davis', team: 'Lakers', position: 'PF', overall_rating: 92, rarity: 'Diamond', sell_value: 8000 },
  { card_id: 'diamond-luka-doncic', player_name: 'Luka Doncic', team: 'Lakers', position: 'PG', overall_rating: 93, rarity: 'Diamond', sell_value: 8000 },
  { card_id: 'diamond-giannis-antetokounmpo', player_name: 'Giannis Antetokounmpo', team: 'Bucks', position: 'PF', overall_rating: 94, rarity: 'Diamond', sell_value: 8000 },
  { card_id: 'diamond-nikola-jokic', player_name: 'Nikola Jokic', team: 'Nuggets', position: 'C', overall_rating: 94, rarity: 'Diamond', sell_value: 8000 },
  // Pink Diamond
  { card_id: 'pink-diamond-kevin-durant', player_name: 'Kevin Durant', team: 'Rockets', position: 'SF', overall_rating: 95, rarity: 'Pink Diamond', sell_value: 15000 },
  { card_id: 'pink-diamond-kareem-abdul-jabbar', player_name: 'Kareem Abdul-Jabbar', team: 'Bucks', position: 'C', overall_rating: 96, rarity: 'Pink Diamond', sell_value: 15000 },
  { card_id: 'pink-diamond-tim-duncan', player_name: 'Tim Duncan', team: 'Spurs', position: 'PF', overall_rating: 96, rarity: 'Pink Diamond', sell_value: 15000 },
  // Galaxy Opal
  { card_id: 'galaxy-opal-shaquille-oneal', player_name: "Shaquille O'Neal", team: 'Heat', position: 'C', overall_rating: 97, rarity: 'Galaxy Opal', sell_value: 30000 },
  { card_id: 'galaxy-opal-kobe-bryant', player_name: 'Kobe Bryant', team: 'Lakers', position: 'SG', overall_rating: 97, rarity: 'Galaxy Opal', sell_value: 30000 },
  { card_id: 'galaxy-opal-stephen-curry', player_name: 'Stephen Curry', team: 'Warriors', position: 'PG', overall_rating: 98, rarity: 'Galaxy Opal', sell_value: 30000 },
  // Dark Matter
  { card_id: 'dark-matter-michael-jordan', player_name: 'Michael Jordan', team: 'Bulls', position: 'SG', overall_rating: 99, rarity: 'Dark Matter', sell_value: 45000 },
  { card_id: 'dark-matter-lebron-james', player_name: 'LeBron James', team: 'Cavaliers', position: 'SF', overall_rating: 99, rarity: 'Dark Matter', sell_value: 45000 },
];

const seedPacks = [
  { pack_id: 'starter-pack', pack_name: 'Starter Pack', cost: 1000, description: 'Basic pack, all rarities possible', min_rarity: 'Gold' },
  { pack_id: 'pro-pack', pack_name: 'Pro Pack', cost: 2500, description: 'Guaranteed Sapphire or above', min_rarity: 'Sapphire' },
  { pack_id: 'elite-pack', pack_name: 'Elite Pack', cost: 6000, description: 'Guaranteed Amethyst or above', min_rarity: 'Amethyst' },
  { pack_id: 'legend-pack', pack_name: 'Legend Pack', cost: 17500, description: 'Guaranteed Diamond or above', min_rarity: 'Diamond' },
  { pack_id: 'welcome-pack', pack_name: 'Welcome Pack', cost: 300, description: 'Available for your first 3 packs only', min_rarity: 'Gold' },
];

const seedAchievements = [
  { achievement_id: 'first-pull', name: 'First Pull', description: 'Open your first pack', condition_type: 'packs_opened', condition_value: '1', reward_pack_id: 'starter-pack', reward_pack_quantity: 2 },
  { achievement_id: 'pack-addict', name: 'Pack Addict', description: 'Open 20 packs', condition_type: 'packs_opened', condition_value: '20', reward_pack_id: 'pro-pack', reward_pack_quantity: 2 },
  { achievement_id: 'grinder', name: 'Grinder', description: 'Open 50 packs', condition_type: 'packs_opened', condition_value: '50', reward_pack_id: 'elite-pack', reward_pack_quantity: 2 },
  { achievement_id: 'diamond-hunt', name: 'Diamond Hunt', description: 'Pull a Diamond or higher', condition_type: 'rarity_pulled', condition_value: 'Diamond', reward_pack_id: 'elite-pack', reward_pack_quantity: 1 },
  { achievement_id: 'pink-rarity', name: 'Pink Rarity', description: 'Pull a Pink Diamond or higher', condition_type: 'rarity_pulled', condition_value: 'Pink Diamond', reward_pack_id: 'elite-pack', reward_pack_quantity: 2 },
  { achievement_id: 'opal-dreams', name: 'Opal Dreams', description: 'Pull a Galaxy Opal or higher', condition_type: 'rarity_pulled', condition_value: 'Galaxy Opal', reward_pack_id: 'legend-pack', reward_pack_quantity: 1 },
  { achievement_id: 'dark-matter', name: 'Dark Matter', description: 'Pull a Dark Matter card', condition_type: 'rarity_pulled', condition_value: 'Dark Matter', reward_pack_id: 'legend-pack', reward_pack_quantity: 2 },
  { achievement_id: 'big-spender', name: 'Big Spender', description: 'Spend 50,000 coins on packs', condition_type: 'coins_spent', condition_value: '50000', reward_pack_id: 'pro-pack', reward_pack_quantity: 2 },
  { achievement_id: 'collector', name: 'Collector', description: 'Own at least 10 unique cards', condition_type: 'collection_size', condition_value: '10', reward_pack_id: 'pro-pack', reward_pack_quantity: 2 },
  { achievement_id: 'goat-collector', name: 'GOAT Collector', description: 'Discover every card in the Ultimate Collection', condition_type: 'ultimate_collection', condition_value: 'all', reward_pack_id: 'legend-pack', reward_pack_quantity: 3 },
];

const seedUsers = [
  { username: 'admin', password: await bcrypt.hash('admin123', 10), coins: 1000000 },
  { username: 'player1', password: await bcrypt.hash('player1pass', 10), coins: 10000 },
  { username: 'player2', password: await bcrypt.hash('player2pass', 10), coins: 10000 },
  { username: 'player3', password: await bcrypt.hash('player3pass', 10), coins: 10000 },
];

/** Sample tasks inserted when the database is reset. */
const sampleTasks = [
  { title: 'Buy groceries', completed: false },
  { title: 'Read a book', completed: true },
  { title: 'Go for a walk', completed: false },
];

// --- Seed function ---

/** Insert seed data into the database. */
export const seed = async (db) => {
  await db.insert(tasks).values(sampleTasks);
  console.log(`  Inserted ${sampleTasks.length} tasks`);
  await db.insert(users).values(seedUsers);
  console.log(`  Inserted ${seedUsers.length} users`);
  await db.insert(cards).values(seedCards);
  console.log(`  Inserted ${seedCards.length} cards`);
  await db.insert(packs).values(seedPacks);
  console.log(`  Inserted ${seedPacks.length} packs`);
  await db.insert(achievements).values(seedAchievements);
  console.log(`  Inserted ${seedAchievements.length} achievements`);
};

// --- Database reset (no need to modify below) ---

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const dbUrl = process.env.DATABASE_URL || 'file:local.db';
const dbPath = dbUrl.replace('file:', '');
const absoluteDbPath = path.resolve(projectRoot, dbPath);

const resetDatabase = async () => {
  try {
    // Step 1 — Delete the old database file
    if (fs.existsSync(absoluteDbPath)) {
      fs.unlinkSync(absoluteDbPath);
      console.log(`Deleted old database: ${dbPath}`);
    }

    // Step 2 — Recreate tables from schema.js
    console.log('Creating tables from schema...');
    execSync('npx drizzle-kit push', {
      cwd: projectRoot,
      stdio: 'inherit',
    });

    // Step 3 — Insert seed data
    console.log('Seeding database...');
    const { db } = await import('./connection.js');
    await seed(db);

    console.log('Done! Database is ready.');
  } catch (error) {
    console.error('Failed to reset database:', error.message);
    process.exit(1);
  }
};

resetDatabase();
