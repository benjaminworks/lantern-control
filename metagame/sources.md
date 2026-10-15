# Modern MTG Metagame Sources Directory

This directory registers the high-value online sources used to monitor and analyze the Modern Magic: The Gathering (MTG) metagame, specifically curated to optimize **Lantern Control** mainboard and sideboard choices.

The sources are organized into programmatic configuration (`metagame/sources.json`) and human-readable documentation (this file).

---

## Source Index

### 1. Macro-Level Metagame Aggregators

#### [MTGGoldfish Modern Metagame](https://www.mtggoldfish.com/metagame/modern#paper)
* **Type:** Tournament & League Aggregator
* **Frequency:** Daily
* **Key Use Case:** High-level format mapping.
* **Lantern Control Value:** 
  * Tracks macro-level meta shifts (e.g., spikes in Aggro or Big Mana).
  * Helps calculate the baseline probability of running into specific decks to determine the exact number of *Ensnaring Bridge* and mainboard lock pieces (like *Lantern of Insight* vs. *Codex Shredder* ratios) needed.

#### [MTGTop8 Modern Section](https://www.mtgtop8.com/format?f=MO)
* **Type:** Multi-Format Database
* **Frequency:** Daily
* **Key Use Case:** Clean archetype parsing and bulk decklist downloading.
* **Lantern Control Value:**
  * Categorizes decks strictly (e.g., Aggro, Control, Combo).
  * Ideal for downloading standardized deck lists (`.dec`, `.txt`) to feed directly into simulation and probability modeling scripts.

---

### 2. Hyper-Competitive Tournaments & Platforms

#### [MTGO Official Standings](https://www.mtgo.com/decklists)
* **Type:** Official Digital Standings
* **Frequency:** Weekly (Saturdays/Sundays for Challenges, daily/semi-weekly for Leagues)
* **Key Use Case:** Identifying the bleeding-edge competitive meta.
* **Lantern Control Value:**
  * Magic Online (MTGO) Challenges represent the most competitive regularly scheduled tournaments.
  * Tracks immediate reactions to new card releases and high-level tech adjustments.

#### [Melee.gg](https://melee.gg/Tournament/Search)
* **Type:** Paper Tournament Platform
* **Frequency:** Active on weekends of major events (RCs, RCQs, SCG Con)
* **Key Use Case:** Comprehensive win-rate and Swiss-round performance analysis.
* **Lantern Control Value:**
  * Provides complete registration details, including Swiss records.
  * Essential for distinguishing between highly represented but poor-performing "bait" decks, and underrepresented but highly successful strategies.

#### [Hareruya Modern Decklists](https://www.hareruyamtg.com/en/deck/search)
* **Type:** Paper Tournament Aggregator (Japan)
* **Frequency:** Daily
* **Key Use Case:** Tracking regional paper metagames.
* **Lantern Control Value:**
  * Japanese Modern tournaments have a reputation for brewing highly technical, off-meta control and prison decks. 
  * Uncovers early adaptations or rogue cards that have not yet permeated Western digital platforms.

---

### 3. Community Platforms & Forums

#### [Lantern Control Discord](https://discord.gg/lantern-control-community-link)
* **Type:** Specialized Community
* **Frequency:** Real-time
* **Key Use Case:** Peer-to-peer discussion, card-by-card validation, and archetype troubleshooting.
* **Lantern Control Value:**
  * Directly links you with experienced Lantern pilots.
  * Excellent for reviewing detailed sideboard plans, matchup guides, and finding answers to highly specific rules/interaction questions (e.g., navigating *Urza's Saga* sequencing under pressure).

#### [Moxfield Public Search](https://www.moxfield.com/decks/public?filter=lantern-control)
* **Type:** Deck-Building Platform
* **Frequency:** Weekly
* **Key Use Case:** Finding active primers and brewing experiments.
* **Lantern Control Value:**
  * Tracks how other Lantern pilots are configuring their lists.
  * Spotlights experimental card selections (e.g., testing new cards from upcoming sets) before they win any official tournament.

#### [Reddit ModernMagic](https://www.reddit.com/r/ModernMagic/)
* **Type:** Community Discussion Board
* **Frequency:** Daily
* **Key Use Case:** Assessing overall community sentiment and "hate-card" trends.
* **Lantern Control Value:**
  * Tracks the general format "vibe."
  * Alerts you if players are registering more artifact removal (e.g., *Force of Vigor*, *Haywire Mite*, *Pick Your Poison*) in their sideboards so you can adapt your protection suite.

---

## Technical Integration

These sources are cataloged in `metagame/sources.json`. This structured schema is designed to support:
1. **Automated Scraping:** Future scripts can iterate over this array to query the API or parse raw HTML.
2. **Dynamic Dashboarding:** Facilitates a visual control center tracking when each source was last scanned and what insights were captured.
