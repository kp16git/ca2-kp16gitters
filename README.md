# HoopVault 🏀

## Game Theme Description

HoopVault is a basketball trading card collector inspired by NBA 2K MyTeam. Players register and log in, then start with 10,000 coins to use on card packs, each with a chance of pulling players ranging from common Gold cards all the way up to ultra-rare Dark Matter cards. Every card pulled is added to the player's personal collection, where duplicate pulls stack as a quantity rather than cluttering the collection with repeated entries. Players can browse their collection, filter it by rarity and/or position, sort it by overall rating, and sell off cards they don't want back for coins — which can then be reinvested into better packs that guarantee a higher minimum rarity.

The game features an **Ultimate Collection** (discovery/completion tracker) showing all possible cards in the game, with visual indicators for which cards have been discovered. Players can also earn **Achievements** for reaching milestones (packs opened, coins spent, collection size, rarity milestones), and claim reward packs upon unlocking achievements. **Free Packs** can be earned through achievements and opened without spending coins. Welcome Packs are limited to 3 total per user and reward players for starting their journey.

The loop is simple: register, earn coins, open packs, build your collection, unlock achievements, and grind toward pulling a Dark Matter card.

## Setup & Run Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd HoopVault
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your `.env` file in the project root:
   ```
   DATABASE_URL=file:local.db
   PORT=3000
   ```

4. Set up and seed the database:
   ```bash
   npm run db
   ```
   This deletes any existing database, recreates all tables from the schema, and seeds the `cards` and `packs` tables with starting data.

5. Run the server:
   ```bash
   npm run dev
   ```
   The server will start at `http://localhost:3000`. Visit `http://localhost:3000` for the game interface, `http://localhost:3000/api-docs` for the auto-generated Swagger documentation, or `http://localhost:3000/api/health` to confirm the server is running.

6. Run tests (optional):
   ```bash
   npm test
   ```

## Features

### Game Mechanics
- **User Registration & Authentication** — Register with username/password, log in to receive JWT tokens for secure gameplay
- **Card Packs** — Multiple pack tiers with varying costs and guaranteed minimum rarities
- **Card Collection** — Collect, browse, filter, and sort cards by rarity and position
- **Selling Cards** — Liquidate cards individually or in batches to earn coins for reinvestment
- **Ultimate Collection** — Discover all possible cards in the game as you pull them
- **Free Reward Packs** — Earn packs by unlocking achievements and open them without spending coins
- **Welcome Packs** — Special introductory packs limited to 3 per user at a reduced cost

### Achievements
- Track progress on 10 different achievements
- Unlock achievements by reaching milestones (packs opened, coins spent, card pulls, collection size, discovery)
- Claim reward packs upon unlocking achievements
- View achievement progress with visual progress bars

### Frontend
- **Responsive Dashboard** — Overview of coins, collection size, achievements to claim, and featured promo packs
- **Collection Browser** — Browse, filter, and sort your cards with visual card displays
- **Pack Opening Interface** — Animated card flip reveals with batch loading for multi-pack opens
- **Ultimate Collection Tracker** — Visual grid showing discovered vs undiscovered cards
- **Achievement System UI** — View achievements, track progress, and claim rewards
- **Custom Popup System** — Alert, confirm, and quantity selector modals with keyboard support

## Assumptions

- Users must register with a username and password, and log in to access the game. Tokens are issued on successful login and required for all protected endpoints.
- Each user can only own one row per unique card in their collection — `user_id` and `card_id` together form a composite primary key on `user_collection`. Pulling a duplicate card increases that row's `quantity` instead of creating a new row, similar to how MyTeam stacks duplicate cards. As a result, no separate `collection_id` is needed — cards are referenced directly by `card_id` within a user's collection.
- Selling supports partial quantities (e.g. sell 2 of 5 owned) via a `?quantity=` query parameter, `?quantity=all` to sell an entire stack at once, or a `/sell-all` route to liquidate the whole collection in one request.
- Card rarity determines both the chance of being pulled from a pack and its sell-back value. Higher-cost packs guarantee a minimum rarity floor, so the more expensive the pack, the better the guaranteed pull.
- Welcome Packs are limited to 3 per user total. After purchasing 3, no more Welcome Packs can be opened.
- Deleting a user automatically deletes their entire card collection first, to avoid foreign key constraint errors, rather than blocking deletion or requiring the collection to be emptied manually beforehand.
- All seeded cards use real NBA player names for flavour, but stats, ratings, and rarities are fictional and created for gameplay purposes only — they don't reflect real player performance or in-game NBA 2K ratings.
- Card catalog (`cards` table) and the user's owned cards (`user_collection` table) are kept separate, since the catalog is static reference data and the collection is what changes per user during gameplay.
- Collection and card browsing both support combining `rarity` and `position` filters in the same request, rather than only supporting one filter at a time.
- **Ultimate Collection** is a discovery tracker showing all cards in the catalog. Cards appear as "discovered" once a user has pulled them at least once.
- **Achievements** track milestone progress (packs opened, coins spent, collection size, rarity pulls). Unlocked achievements can be claimed to receive free reward packs.
- **Free Packs** are awarded through achievements and can be opened without spending coins. They use the same card pull logic as paid packs but don't deduct coins.

## API Routes

### Authentication

| Method | Route | Request Body | Description | Status Codes |
|---|---|---|---|---|
| POST | `/api/auth/register` | `{ "username": "xxx", "password": "xxx" }` | Register a new user with 10,000 starting coins | 201, 400, 409 |
| POST | `/api/auth/login` | `{ "username": "xxx", "password": "xxx" }` | Log in and receive a JWT token | 200, 400, 401 |

### Users

| Method | Route | Request Body | Description | Status Codes | Auth Required |
|---|---|---|---|---|---|
| GET | `/api/users` | N/A | Get all users | 200 | No |
| GET | `/api/users?username=xxx` | N/A | Search user by username | 200, 400, 404 | No |
| GET | `/api/users/:username` | N/A | Get one user by username (returns coins and stats) | 200, 404 | Yes |
| POST | `/api/users` | `{ "username": "xxx" }` | Create a user with 10,000 starting coins | 201, 400, 409 | No |
| PUT | `/api/users/:username` | `{ "username": "xxx" }` | Update a user's username | 200, 400, 404 | Yes |
| DELETE | `/api/users/:username` | N/A | Delete a user (also deletes their entire collection) | 200, 404 | Yes |

### Cards

| Method | Route | Request Body | Description | Status Codes |
|---|---|---|---|---|
| GET | `/api/cards` | N/A | Get all cards in the catalog | 200 |
| GET | `/api/cards?rarity=Gold` | N/A | Filter cards by rarity | 200 |
| GET | `/api/cards?position=PG` | N/A | Filter cards by position | 200 |
| GET | `/api/cards?rarity=Gold&position=PG` | N/A | Filter cards by rarity and position together | 200 |
| GET | `/api/cards/:id` | N/A | Get one card by ID | 200, 404 |

### Packs (Purchased Packs)

| Method | Route | Request Body | Description | Status Codes | Auth Required |
|---|---|---|---|---|---|
| GET | `/api/packs` | N/A | Get all available packs for purchase | 200 | No |
| POST | `/api/packs/open/:packId` | `{ "username": "xxx" }` | Open a single pack — deducts coins, adds a randomly weighted card to the user's collection | 201, 400, 404 | Yes |
| POST | `/api/packs/open/:packId/bulk` | `{ "username": "xxx", "quantity": 5 }` | Open multiple packs at once | 201, 400, 404 | Yes |

### Free Packs (Reward Packs)

| Method | Route | Request Body | Description | Status Codes | Auth Required |
|---|---|---|---|---|---|
| GET | `/api/users/:username/packs` | N/A | Get all free reward packs a user has earned | 200, 404 | Yes |
| POST | `/api/users/:username/packs/:packId/open` | N/A | Open one free reward pack (no coins deducted) | 201, 400, 404 | Yes |
| POST | `/api/users/:username/packs/open-all` | N/A | Open all free reward packs at once | 201, 400, 404 | Yes |

### Collection

| Method | Route | Request Body | Description | Status Codes | Auth Required |
|---|---|---|---|---|---|
| GET | `/api/users/:username/collection` | N/A | View a user's full collection | 200, 404 | Yes |
| GET | `/api/users/:username/collection?rarity=Gold` | N/A | Filter collection by rarity | 200, 404 | Yes |
| GET | `/api/users/:username/collection?position=PG` | N/A | Filter collection by position | 200, 404 | Yes |
| GET | `/api/users/:username/collection?rarity=Gold&position=PG` | N/A | Filter collection by rarity and position together | 200, 404 | Yes |
| GET | `/api/users/:username/collection?sort=asc` / `?sort=desc` | N/A | Sort collection by overall rating | 200, 404 | Yes |
| GET | `/api/users/:username/ultimate-collection` | N/A | View the Ultimate Collection discovery tracker (all cards with discovered status) | 200, 404 | Yes |
| DELETE | `/api/users/:username/collection/sell/:cardId` | N/A | Sell 1 copy of a card (default) | 200, 400, 404 | Yes |
| DELETE | `/api/users/:username/collection/sell/:cardId?quantity=2` | N/A | Sell a specific quantity of a card | 200, 400, 404 | Yes |
| DELETE | `/api/users/:username/collection/sell/:cardId?quantity=all` | N/A | Sell the entire stack of a card | 200, 400, 404 | Yes |
| DELETE | `/api/users/:username/collection/sell-all` | N/A | Sell every card in the user's collection | 200, 404 | Yes |

### Achievements

| Method | Route | Request Body | Description | Status Codes | Auth Required |
|---|---|---|---|---|---|
| GET | `/api/achievements` | N/A | Get all achievements in the game | 200 | No |
| GET | `/api/users/:username/achievements` | N/A | Get user's personal achievement data | 200, 404 | Yes |
| GET | `/api/users/:username/achievements/progress` | N/A | Get achievement progress and statistics (unlocked status, progress toward each achievement) | 200, 404 | Yes |
| POST | `/api/users/:username/achievements/check` | N/A | Check for newly unlocked achievements based on current progress | 200, 404 | Yes |
| POST | `/api/users/:username/achievements/:achievementId/claim` | N/A | Claim an unlocked achievement and receive reward packs | 200, 400, 404 | Yes |

## Pack Types

| Pack ID | Pack | Cost | Minimum Rarity | Special Notes |
|---|---|---|---|---|
| `starter-pack` | Starter Pack | 1,000 coins | Gold | Gold 50% · Emerald 32% · Sapphire 18% |
| `pro-pack` | Pro Pack | 2,500 coins | Sapphire | Sapphire 55% · Ruby 30% · Amethyst 15% |
| `elite-pack` | Elite Pack | 6,000 coins | Amethyst | Amethyst 50% · Diamond 30% · Pink Diamond 17% · Galaxy Opal 2.5% · Dark Matter 0.5% |
| `legend-pack` | Legend Pack | 17,500 coins | Diamond | Diamond 50% · Pink Diamond 30% · Galaxy Opal 15% · Dark Matter 5% |
| `welcome-pack` | Welcome Pack | 300 coins | Gold | Limited to 3 packs per user (special starter offer) · Gold/Emerald/Sapphire/Ruby/Amethyst 16% each · Diamond/Pink Diamond/Galaxy Opal/Dark Matter 5% each |

## Achievements

Players can unlock achievements by reaching milestones. Unlocked achievements grant reward packs that can be claimed and opened without spending coins.

| Achievement ID | Achievement Name | Condition | Reward |
|---|---|---|---|
| `first-pull` | First Pull | Open 1 pack | 2x Starter Pack |
| `pack-addict` | Pack Addict | Open 20 packs | 2x Pro Pack |
| `grinder` | Grinder | Open 50 packs | 2x Elite Pack |
| `diamond-hunt` | Diamond Hunt | Pull a Diamond or higher | 1x Elite Pack |
| `pink-rarity` | Pink Rarity | Pull a Pink Diamond or higher | 2x Elite Pack |
| `opal-dreams` | Opal Dreams | Pull a Galaxy Opal or higher | 1x Legend Pack |
| `dark-matter` | Dark Matter | Pull a Dark Matter card | 2x Legend Pack |
| `big-spender` | Big Spender | Spend 50,000 coins on packs | 2x Pro Pack |
| `collector` | Collector | Own at least 10 unique cards | 2x Pro Pack |
| `goat-collector` | GOAT Collector | Discover every card in the Ultimate Collection | 3x Legend Pack |
