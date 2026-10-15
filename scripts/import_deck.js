const fs = require('fs');
const path = require('path');

/**
 * Parses a plain-text MTG decklist and saves it as a structured JSON file.
 * 
 * Usage: node scripts/import_deck.js [input_txt_path] [output_json_path]
 */

function cleanCardName(rawName) {
    // Remove set symbols and collector numbers like (MH3) 123 or [ELD]
    // Also trims extra spacing.
    return rawName
        .replace(/\s*[\(\[].*$/, '') // remove bracketed/parenthesized tags
        .replace(/\s+\d+\s*$/, '')    // remove trailing collector numbers if any
        .trim();
}

function parseDecklist(txtContent) {
    const mainboard = [];
    const sideboard = [];
    let inSideboard = false;

    const lines = txtContent.split(/\r?\n/);

    for (let line of lines) {
        line = line.trim();
        
        // Skip empty lines or comment lines
        if (!line || line.startsWith('//') || line.startsWith('#')) {
            continue;
        }

        // Detect sideboard transition
        const lowerLine = line.toLowerCase();
        if (lowerLine === 'sideboard' || lowerLine === 'sideboard:' || lowerLine === 'sb' || lowerLine === 'sb:') {
            inSideboard = true;
            continue;
        }

        // Regex to parse "QTY CARD_NAME" (e.g. "4 Ensnaring Bridge")
        const match = line.match(/^(\d+)\s+(.+)$/);
        if (match) {
            const count = parseInt(match[1], 10);
            const rawName = match[2];
            const name = cleanCardName(rawName);

            if (name) {
                const targetList = inSideboard ? sideboard : mainboard;
                // If card already exists in the list, combine counts
                const existing = targetList.find(c => c.name.toLowerCase() === name.toLowerCase());
                if (existing) {
                    existing.count += count;
                } else {
                    targetList.push({ name, count });
                }
            }
        }
    }

    return { mainboard, sideboard };
}

function main() {
    const args = process.argv.slice(2);
    
    // Default file paths
    const defaultInput = path.join(__dirname, '../decks/lantern_list.txt');
    const defaultOutput = path.join(__dirname, '../decks/imported_lantern.json');

    const inputPath = args[0] ? path.resolve(args[0]) : defaultInput;
    const outputPath = args[1] ? path.resolve(args[1]) : defaultOutput;

    if (!fs.existsSync(inputPath)) {
        console.error(`Error: Input decklist file not found at: ${inputPath}`);
        console.log('Usage: node scripts/import_deck.js [input_txt_path] [output_json_path]');
        process.exit(1);
    }

    console.log(`Reading decklist from: ${inputPath}`);
    const txtContent = fs.readFileSync(inputPath, 'utf8');
    const { mainboard, sideboard } = parseDecklist(txtContent);

    // Build the final deck object
    const deckName = path.basename(inputPath, path.extname(inputPath))
        .replace(/[-_]/g, ' ')
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

    const deckJson = {
        name: deckName || "Imported Deck",
        archetype: "Lantern Control",
        version: "Imported",
        mainboard: { cards: mainboard },
        sideboard: { cards: sideboard }
    };

    fs.writeFileSync(outputPath, JSON.stringify(deckJson, null, 2), 'utf8');
    console.log(`Successfully imported deck!`);
    console.log(`Mainboard: ${mainboard.reduce((s, c) => s + c.count, 0)} cards (${mainboard.length} unique)`);
    console.log(`Sideboard: ${sideboard.reduce((s, c) => s + c.count, 0)} cards (${sideboard.length} unique)`);
    console.log(`Saved structured JSON to: ${outputPath}\n`);
}

if (require.main === module) {
    main();
}
