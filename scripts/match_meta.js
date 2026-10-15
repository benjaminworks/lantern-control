const fs = require('fs');
const path = require('path');

/**
 * Compares an imported Lantern deck list against the modern metagame snapshot.
 * Calculates Sideboard Coverage Indices, a weighted preparedness score, and ranks missing card gaps.
 * 
 * Usage: node scripts/match_meta.js [deck_json_path] [meta_json_path]
 */

function main() {
    const args = process.argv.slice(2);

    // Default paths
    const defaultDeckPath = path.join(__dirname, '../decks/imported_lantern.json');
    const defaultMetaPath = path.join(__dirname, '../metagame/modern_meta.json');

    const deckPath = args[0] ? path.resolve(args[0]) : defaultDeckPath;
    const metaPath = args[1] ? path.resolve(args[1]) : defaultMetaPath;

    if (!fs.existsSync(deckPath)) {
        console.error(`Error: Deck JSON file not found at: ${deckPath}`);
        console.log('Please run the importer first: node scripts/import_deck.js');
        process.exit(1);
    }

    if (!fs.existsSync(metaPath)) {
        console.error(`Error: Metagame JSON snapshot not found at: ${metaPath}`);
        process.exit(1);
    }

    const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
    const metaList = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

    // Create a map of card counts in the deck
    const deckAll = {};
    const deckMB = {};
    const deckSB = {};

    deck.mainboard.cards.forEach(c => {
        const name = c.name.toLowerCase();
        deckMB[name] = (deckMB[name] || 0) + c.count;
        deckAll[name] = (deckAll[name] || 0) + c.count;
    });

    deck.sideboard.cards.forEach(c => {
        const name = c.name.toLowerCase();
        deckSB[name] = (deckSB[name] || 0) + c.count;
        deckAll[name] = (deckAll[name] || 0) + c.count;
    });

    console.log(`\n================================================================================`);
    console.log(`              METAGAME MATCHING & PREPAREDNESS ANALYSIS`);
    console.log(`================================================================================`);
    console.log(`Deck:       ${deck.name} (${deck.version})`);
    console.log(`Mainboard:  ${deck.mainboard.cards.reduce((s, c) => s + c.count, 0)} cards`);
    console.log(`Sideboard:  ${deck.sideboard.cards.reduce((s, c) => s + c.count, 0)} cards`);
    console.log(`--------------------------------------------------------------------------------\n`);

    let totalMetaShare = 0;
    let absoluteWeightedScore = 0; // Sum of (meta_share * coverage)

    const archetypeReports = [];
    const missingCardWeights = {}; // Tracks priority cards we are missing, weighted by the archetype share

    metaList.forEach(arch => {
        totalMetaShare += arch.meta_share;
        const priorityCards = arch.priority_sideboard || [];
        
        let coveredCount = 0;
        const cardDetails = [];

        priorityCards.forEach(cardName => {
            const normalizedName = cardName.toLowerCase();
            const mbCount = deckMB[normalizedName] || 0;
            const sbCount = deckSB[normalizedName] || 0;
            const totalCount = mbCount + sbCount;
            const isCovered = totalCount > 0;

            if (isCovered) {
                coveredCount++;
                let locationStr = "";
                if (mbCount > 0 && sbCount > 0) locationStr = `MB:${mbCount}, SB:${sbCount}`;
                else if (mbCount > 0) locationStr = `MB:${mbCount}`;
                else locationStr = `SB:${sbCount}`;

                cardDetails.push({ cardName, status: `Yes (${locationStr})`, isCovered: true });
            } else {
                cardDetails.push({ cardName, status: "Missing", isCovered: false });
                
                // Track missing weight for recommendations
                missingCardWeights[cardName] = (missingCardWeights[cardName] || 0) + arch.meta_share;
            }
        });

        const coverageRatio = priorityCards.length > 0 ? (coveredCount / priorityCards.length) : 1;
        absoluteWeightedScore += (arch.meta_share * coverageRatio);

        archetypeReports.push({
            archetype: arch.archetype,
            metaShare: arch.meta_share,
            classification: arch.classification,
            coveredCount,
            totalCount: priorityCards.length,
            coveragePct: (coverageRatio * 100).toFixed(1) + "%",
            cardDetails
        });
    });

    const normalizedWeightedScore = totalMetaShare > 0 ? (absoluteWeightedScore / totalMetaShare) : 0;

    // Output Archetype Table
    console.log(String.prototype.concat(
        "ARCHETYPE                     | META % | CLASS            | COV %   | STATUS\n",
        "------------------------------+--------+------------------+---------+----------------------------------"
    ));

    archetypeReports.forEach(r => {
        const archPad = r.archetype.padEnd(29, ' ');
        const sharePad = r.metaShare.toFixed(1).padStart(5, ' ') + "%";
        const classPad = r.classification.substring(0, 16).padEnd(16, ' ');
        const covPctPad = r.coveragePct.padStart(7, ' ');
        
        const coveredNames = r.cardDetails
            .filter(c => c.isCovered)
            .map(c => c.cardName)
            .join(', ');
        
        const missingNames = r.cardDetails
            .filter(c => !c.isCovered)
            .map(c => `[MISSING: ${c.cardName}]`)
            .join(', ');

        const statusStr = coveredNames + (coveredNames && missingNames ? " | " : "") + missingNames;
        
        console.log(`${archPad} | ${sharePad} | ${classPad} | ${covPctPad} | ${statusStr}`);
    });

    console.log(`\n================================================================================`);
    console.log(`                           SUMMARY STATISTICS`);
    console.log(`================================================================================`);
    console.log(`Total Represented Metagame:       ${totalMetaShare.toFixed(1)}%`);
    console.log(`Absolute Format Preparedness:      ${absoluteWeightedScore.toFixed(2)}% (Weighted across full format)`);
    console.log(`Normalized Slice Preparedness:    ${(normalizedWeightedScore * 100).toFixed(2)}% (Coverage of top archetypes)`);
    console.log(`--------------------------------------------------------------------------------\n`);

    // Top Sideboard Gaps
    const sortedGaps = Object.entries(missingCardWeights)
        .sort((a, b) => b[1] - a[1]);

    console.log(`--- HIGH-PRIORITY SIDEBOARD GAPS (Ranked by Metagame Impact) ---`);
    if (sortedGaps.length === 0) {
        console.log(`Excellent! Your current 75 has 100% coverage against the priority lists of all top archetypes.`);
    } else {
        console.log(`Adding these cards to your sideboard will address the largest gaps in your matchups:`);
        sortedGaps.forEach(([cardName, weight], index) => {
            console.log(` ${index + 1}. ${cardName.padEnd(24, ' ')} -> Addresses ${weight.toFixed(1)}% of the active metagame`);
        });
    }
    console.log(`================================================================================\n`);
}

if (require.main === module) {
    main();
}
