import pool from './database.js';

const migrations = `
-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'technician',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shows/Produktionen Table
CREATE TABLE IF NOT EXISTS shows (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    venue VARCHAR(255),
    date DATE,
    portalbruecke VARCHAR(255),
    portale VARCHAR(255),
    sbtor VARCHAR(255),
    zuege TEXT,
    aufbau TEXT,
    created_by INTEGER REFERENCES users(id),
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Channels Table
CREATE TABLE IF NOT EXISTS channels (
    id SERIAL PRIMARY KEY,
    show_id INTEGER REFERENCES shows(id) ON DELETE CASCADE,
    kanal VARCHAR(10) NOT NULL,
    adresse VARCHAR(50),
    geraet VARCHAR(255),
    farbe VARCHAR(10),
    beschreibung TEXT,
    kategorie VARCHAR(255),
    aktiv BOOLEAN DEFAULT false,
    position INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(show_id, kanal)
);

-- Channel History Table
CREATE TABLE IF NOT EXISTS channel_history (
    id SERIAL PRIMARY KEY,
    channel_id INTEGER REFERENCES channels(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    field_name VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_channels_show_id ON channels(show_id);
CREATE INDEX IF NOT EXISTS idx_channels_kanal ON channels(kanal);
CREATE INDEX IF NOT EXISTS idx_channel_history_channel_id ON channel_history(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_history_changed_at ON channel_history(changed_at);

-- Add deleted_at column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='shows' AND column_name='deleted_at') THEN
        ALTER TABLE shows ADD COLUMN deleted_at TIMESTAMP;
    END IF;
    
    -- Add aufbau fields if not exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='shows' AND column_name='portalbruecke') THEN
        ALTER TABLE shows ADD COLUMN portalbruecke VARCHAR(255);
        ALTER TABLE shows ADD COLUMN portale VARCHAR(255);
        ALTER TABLE shows ADD COLUMN sbtor VARCHAR(255);
        ALTER TABLE shows ADD COLUMN zuege TEXT;
        ALTER TABLE shows ADD COLUMN aufbau TEXT;
    END IF;
    
    -- Add kategorie to channels if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='channels' AND column_name='kategorie') THEN
        ALTER TABLE channels ADD COLUMN kategorie VARCHAR(255);
    END IF;

    -- Add show_history table if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                   WHERE table_name='show_history') THEN
        CREATE TABLE show_history (
            id SERIAL PRIMARY KEY,
            show_id INTEGER REFERENCES shows(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id),
            field_name VARCHAR(50) NOT NULL,
            old_value TEXT,
            new_value TEXT,
            changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX idx_show_history_show_id ON show_history(show_id);
        CREATE INDEX idx_show_history_changed_at ON show_history(changed_at);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_shows_deleted_at ON shows(deleted_at);

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shows_updated_at ON shows;
CREATE TRIGGER update_shows_updated_at BEFORE UPDATE ON shows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_channels_updated_at ON channels;
CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Show Photos Table
CREATE TABLE IF NOT EXISTS show_photos (
    id SERIAL PRIMARY KEY,
    show_id INTEGER REFERENCES shows(id) ON DELETE CASCADE,
    caption TEXT DEFAULT '',
    data TEXT NOT NULL,
    original_name VARCHAR(255),
    width INTEGER,
    height INTEGER,
    position INTEGER NOT NULL DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_show_photos_show_id ON show_photos(show_id);

-- Venue OSC Settings Table
CREATE TABLE IF NOT EXISTS venue_osc_settings (
    venue VARCHAR(255) PRIMARY KEY,
    osc_ip VARCHAR(255) NOT NULL DEFAULT '',
    osc_port INTEGER NOT NULL DEFAULT 8000,
    cmd_on TEXT NOT NULL DEFAULT 'Chan {kanal} @ Full Time 3',
    cmd_off TEXT NOT NULL DEFAULT 'Chan {kanal} @ 0 Time 0',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

async function migrate() {
    try {
        console.log('🚀 Starting database migration...');
        await pool.query(migrations);
        console.log('✅ Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
