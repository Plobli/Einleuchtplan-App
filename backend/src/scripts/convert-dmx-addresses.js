import pool from '../config/database.js';

// DMX hat 512 Kanäle pro Universum
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

async function convertAllAddresses() {
    const client = await pool.connect();
    
    try {
        console.log('🚀 Starte DMX-Adress-Konvertierung...');
        
        // Alle Channels laden
        const result = await client.query('SELECT id, adresse FROM channels');
        const channels = result.rows;
        
        console.log(`📊 Gefundene Channels: ${channels.length}`);
        
        let converted = 0;
        let skipped = 0;
        
        await client.query('BEGIN');
        
        for (const channel of channels) {
            const oldAddress = channel.adresse;
            const newAddress = convertDMXAddress(oldAddress);
            
            if (oldAddress !== newAddress) {
                await client.query(
                    'UPDATE channels SET adresse = $1 WHERE id = $2',
                    [newAddress, channel.id]
                );
                converted++;
                console.log(`✓ ID ${channel.id}: "${oldAddress}" → "${newAddress}"`);
            } else {
                skipped++;
            }
        }
        
        await client.query('COMMIT');
        
        console.log('\n✅ Konvertierung abgeschlossen!');
        console.log(`   Konvertiert: ${converted}`);
        console.log(`   Übersprungen: ${skipped}`);
        console.log(`   Gesamt: ${channels.length}`);
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Fehler bei der Konvertierung:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

convertAllAddresses();
