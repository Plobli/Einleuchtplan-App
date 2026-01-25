import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DMX_CHANNELS_PER_UNIVERSE = 512;

function convertDMXAddress(address) {
    if (!address || address.trim() === '') return address;
    
    // Wenn bereits im Format "X/Y" oder "X/Y-Z" → behalten
    if (address.includes('/')) return address;
    
    // Wenn bereits "-" für Range → nicht umrechnen (z.B. "867-874")
    if (address.includes('-') && !address.includes('/')) {
        const [start, end] = address.split('-').map(n => n.trim());
        const startNum = parseInt(start);
        const endNum = parseInt(end);
        
        if (!isNaN(startNum) && !isNaN(endNum)) {
            const startConverted = convertSingleDMX(startNum);
            const endConverted = convertSingleDMX(endNum);
            return `${startConverted}-${endConverted}`;
        }
    }
    
    // Einfache Zahl → umrechnen
    const num = parseInt(address);
    if (!isNaN(num)) {
        return convertSingleDMX(num);
    }
    
    return address;
}

function convertSingleDMX(channelNumber) {
    if (channelNumber < 1) return String(channelNumber);
    
    // Universum berechnen (1-basiert)
    const universe = Math.floor((channelNumber - 1) / DMX_CHANNELS_PER_UNIVERSE) + 1;
    
    // Kanal innerhalb des Universums (1-basiert)
    const channel = ((channelNumber - 1) % DMX_CHANNELS_PER_UNIVERSE) + 1;
    
    return `${universe}/${channel}`;
}

// JSON-Datei laden
const filePath = path.join(__dirname, '..', 'data', 'default-channels.json');
const channels = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log(`📊 Verarbeite ${channels.length} Channels...`);

let converted = 0;
let skipped = 0;

// Adressen konvertieren
channels.forEach(channel => {
    const oldAddress = channel.adresse;
    const newAddress = convertDMXAddress(oldAddress);
    
    if (oldAddress !== newAddress) {
        channel.adresse = newAddress;
        converted++;
        console.log(`✓ Kanal ${channel.kanal}: "${oldAddress}" → "${newAddress}"`);
    } else {
        skipped++;
    }
});

// Zurückschreiben
fs.writeFileSync(filePath, JSON.stringify(channels, null, 2), 'utf8');

console.log('\n✅ Konvertierung abgeschlossen!');
console.log(`   Konvertiert: ${converted}`);
console.log(`   Übersprungen: ${skipped}`);
console.log(`   Gesamt: ${channels.length}`);
