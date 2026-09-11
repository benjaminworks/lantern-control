const fs = require('fs');
const path = require('path');

// Combinations: n Cr
function choose(n, r) {
    if (r < 0 || r > n) return 0;
    if (r === 0 || r === n) return 1;
    if (r > n / 2) r = n - r;
    let res = 1;
    for (let i = 1; i <= r; i++) {
        res = res * (n - i + 1) / i;
    }
    return res;
}

// Hypergeometric Cumulative Probability: P(X >= k)
function hypergeometricCumulative(N, K, n, k) {
    let prob = 0;
    for (let i = k; i <= Math.min(n, K); i++) {
        prob += (choose(K, i) * choose(N - K, n - i)) / choose(N, n);
    }
    return prob;
}

// Probability of drawing at least one card of Group A AND at least one card of Group B
// in a sample of size n from deck size N.
// Since groups can overlap or not, this is a multivariate hypergeometric logic.
// If Group A and Group B are disjoint:
// We can find P(A >= 1 and B >= 1) = 1 - P(A = 0) - P(B = 0) + P(A = 0 and B = 0)
function jointProbabilityDisjoint(N, K_A, K_B, n) {
    const p_A_zero = choose(N - K_A, n) / choose(N, n);
    const p_B_zero = choose(N - K_B, n) / choose(N, n);
    const p_both_zero = choose(N - K_A - K_B, n) / choose(N, n);
    return 1 - p_A_zero - p_B_zero + p_both_zero;
}

function analyzeDeck(deckPath) {
    if (!fs.existsSync(deckPath)) {
        console.error(`Deck file not found: ${deckPath}`);
        return;
    }

    const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
    const mainboard = deck.mainboard.cards;

    // Calculate total mainboard size
    let N = 0;
    const cardCounts = {};
    mainboard.forEach(card => {
        N += card.count;
        cardCounts[card.name] = card.count;
    });

    console.log(`\n==================================================`);
    console.log(`   DECK PROBABILITY ANALYSIS: ${deck.name}`);
    console.log(`==================================================`);
    console.log(`Total Mainboard Size: ${N} cards\n`);

    // Define Key Card Groups
    const lanterns = ["Lantern of Insight"];
    const millRocks = ["Codex Shredder", "Ghoulcaller's Bell", "Pixis of Pandemonium"];
    const bridges = ["Ensnaring Bridge"];
    const tutors = ["Profane Tutor"];
    const sagas = ["Urza's Saga"];

    // Count copies
    const countGroup = (group) => group.reduce((sum, name) => sum + (cardCounts[name] || 0), 0);

    const K_lanterns = countGroup(lanterns);
    const K_mill = countGroup(millRocks);
    const K_bridges = countGroup(bridges);
    const K_tutors = countGroup(tutors);
    const K_sagas = countGroup(sagas);

    // Opening Hand Analysis (7 cards)
    const openingHand = 7;
    const p_at_least_1_lantern = hypergeometricCumulative(N, K_lanterns, openingHand, 1);
    const p_at_least_1_mill = hypergeometricCumulative(N, K_mill, openingHand, 1);
    const p_at_least_1_bridge = hypergeometricCumulative(N, K_bridges, openingHand, 1);
    
    // Joint probability of getting Lantern + Mill Rock in opening hand (disjoint groups)
    const p_lock = jointProbabilityDisjoint(N, K_lanterns, K_mill, openingHand);

    console.log(`--- OPENING HAND CONSISTENCY (7 Cards) ---`);
    console.log(`Lantern of Insight (Qty: ${K_lanterns}): ${(p_at_least_1_lantern * 100).toFixed(2)}%`);
    console.log(`Any Mill Rock (Qty: ${K_mill}): ${(p_at_least_1_mill * 100).toFixed(2)}%`);
    console.log(`Ensnaring Bridge (Qty: ${K_bridges}): ${(p_at_least_1_bridge * 100).toFixed(2)}%`);
    console.log(`COMPLETE LOCK (Lantern + Mill Rock): ${(p_lock * 100).toFixed(2)}%`);
    console.log();

    // Turn 4 Analysis (10 cards seen: 7 opening + 3 draw steps or tutors)
    const cardsSeenTurn4 = 10;
    const p_bridge_t4_natural = hypergeometricCumulative(N, K_bridges, cardsSeenTurn4, 1);
    
    // With Profane Tutors / Sagas, finding a Bridge by Turn 4 is much higher.
    // Let's calculate probability of seeing Bridge, Saga, or Profane Tutor by Turn 4.
    // Since Saga can't tutor Bridge directly (Saga only grabs 0 or 1-mana artifacts, while Bridge is 3-mana),
    // Saga doesn't help find Bridge. But Profane Tutor does.
    // So the group of cards that represent "Bridge or a way to get it (Profane Tutor)" is:
    const bridgeEnablers = K_bridges + K_tutors;
    const p_bridge_or_tutor_t4 = hypergeometricCumulative(N, bridgeEnablers, cardsSeenTurn4, 1);

    console.log(`--- TURN 4 SURVIVABILITY ---`);
    console.log(`Natural Ensnaring Bridge (Turn 4, 10 cards seen): ${(p_bridge_t4_natural * 100).toFixed(2)}%`);
    console.log(`Bridge OR Profane Tutor (Turn 4, 10 cards seen): ${(p_bridge_or_tutor_t4 * 100).toFixed(2)}%`);
    console.log(`Note: Profane Tutor suspended on Turn 2 resolves on Turn 4, serving as a virtual Bridge.`);
    console.log(`==================================================\n`);
}

// Run the analysis on the imported deck
const defaultDeck = path.join(__dirname, '../decks/imported_lantern.json');
analyzeDeck(defaultDeck);
