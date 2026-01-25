# Einleucht-Aufbauplan für Theater - GitHub Copilot Fortsetzung

## Projektkontext

Ich arbeite an einem **Einleucht- und Aufbauplan-Tool für Theatertechnik**. Es ist derzeit eine standalone HTML-Datei mit JavaScript, die:

- **316 Channels** aus einem ETC Eos Lichtpult verwaltet
- Dimmer, LED-Fixtures (S4 LED, NanoPix, Titan Tubes, etc.) unterstützt
- DMX-Adressen, Gerätetypen, Farben (NC/200/201/202) und Positionen erfasst
- Als JSON speichern/laden kann
- PDF-Export unterstützt

## Aktueller Stand

Die HTML-Datei (`einleucht_aufbauplan.html`) enthält:

### Features
- Editierbare Tabelle mit allen Channels
- Auto-Aktivierung von Zeilen beim Eingeben
- Filter-Funktion nach Kanal/Gerät
- Alle Felder (Adresse, Gerät, Farbe, Beschreibung) editierbar
- JSON-Import/Export für Datenpersistenz
- PDF-Export mit jsPDF

### Datenstruktur
```javascript
const scheinwerferData = [
    {
        kanal: "1",           // Channel-Nummer
        adresse: "121",       // DMX-Adresse (z.B. "121" oder "3/283-285")
        geraet: "VK Bühne unten Lks",  // Gerätetyp oder Label
        farbe: "NC",          // Farbfilter
        beschreibung: ""      // Position/Notizen
    },
    // ... 316 Einträge total
];
```

### Datenquelle
Die Patch-Daten kommen aus **ETC Eos Show Files** (PDF-Export):
- Dimmer: Labels werden als Gerät übernommen (z.B. "VK Bühne unten Lks", "5 KW", "1,2kW Profil")
- LED-Fixtures: Fixture-Type als Gerät (z.B. "S4 LED S2 Lustr QS General", "Titan Tube 1: RGB 1 Pixel")

## Ziel: Server-basierte Lösung

Ich möchte das Tool in eine **gehostete, kollaborative Web-Anwendung** umwandeln mit:

### Kern-Features (MVP)
1. **Multi-User-Bearbeitung**: Mehrere Nutzer können gleichzeitig am selben Plan arbeiten
2. **Echtzeit-Synchronisation**: Änderungen werden live bei allen Nutzern sichtbar
3. **Zentrale Datenspeicherung**: PostgreSQL-Datenbank statt lokaler JSON-Dateien
4. **Show-Verwaltung**: Mehrere Shows/Produktionen verwalten können
5. **User-Authentication**: Einfaches Login-System
6. **Versionsverlauf**: Änderungen nachverfolgen können

### Nice-to-have Features (später)
- ETC Eos .esf2 direkter Import (ohne PDF-Export)
- Rollenbasierte Zugriffsrechte
- Venue-Templates (fest installierte Geräte)
- Mobile-optimierte Version
- Offline-Modus mit Sync
- Attachment-Upload (Fotos, Pläne)

## Tech-Stack Vorschlag

**Frontend:**
- React oder Vue.js (oder aktuelles Framework beibehalten + API-Anbindung)
- WebSocket für Realtime-Updates (Socket.io)
- TailwindCSS oder Material-UI für modernes Design

**Backend:**
- Node.js + Express (oder Python + FastAPI)
- Socket.io für Realtime
- PostgreSQL für Daten
- Redis für Session-Management + Realtime-Cache

**Deployment:**
- Docker + Docker Compose für lokale Entwicklung
- Vercel/Railway/Render für einfaches Hosting

## Technische Anforderungen

### Datenbank-Schema (Vorschlag)
```sql
-- Shows/Produktionen
CREATE TABLE shows (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    venue VARCHAR(255),
    date DATE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Channels
CREATE TABLE channels (
    id SERIAL PRIMARY KEY,
    show_id INTEGER REFERENCES shows(id),
    kanal VARCHAR(10) NOT NULL,
    adresse VARCHAR(50),
    geraet VARCHAR(255),
    farbe VARCHAR(10),
    beschreibung TEXT,
    aktiv BOOLEAN DEFAULT false,
    position INTEGER,  -- Reihenfolge
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Änderungshistorie
CREATE TABLE channel_history (
    id SERIAL PRIMARY KEY,
    channel_id INTEGER REFERENCES channels(id),
    user_id INTEGER,
    field_name VARCHAR(50),
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMP
);

-- Users (einfach)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'technician'
);
```

### API-Endpoints (Vorschlag)
```
# Shows
GET    /api/shows                  # Liste aller Shows
POST   /api/shows                  # Neue Show erstellen
GET    /api/shows/:id              # Show-Details
PUT    /api/shows/:id              # Show aktualisieren
DELETE /api/shows/:id              # Show löschen

# Channels
GET    /api/shows/:id/channels     # Alle Channels einer Show
POST   /api/shows/:id/channels     # Neuen Channel hinzufügen
PUT    /api/channels/:id           # Channel aktualisieren
DELETE /api/channels/:id           # Channel löschen
POST   /api/shows/:id/import       # Patch aus ETC Eos importieren

# Realtime
WS     /ws/shows/:id               # WebSocket für Live-Updates

# Export
GET    /api/shows/:id/export/json  # JSON-Export
GET    /api/shows/:id/export/pdf   # PDF-Export
```

### Realtime-Events (WebSocket)
```javascript
// Client -> Server
{
    type: 'channel_update',
    channelId: 123,
    field: 'geraet',
    value: 'VK Bühne unten Lks'
}

// Server -> Clients
{
    type: 'channel_updated',
    channelId: 123,
    field: 'geraet',
    value: 'VK Bühne unten Lks',
    userId: 456,
    userName: 'Max Mustermann'
}
```

## Bestehender Code

Die aktuelle HTML-Datei ist verfügbar. Wichtige Code-Teile:

- **Tabellen-Rendering**: `renderTable()` Funktion erstellt die editierbare Tabelle
- **Auto-Aktivierung**: `autoActivateRow()` aktiviert Zeilen beim Eingeben
- **JSON-Export**: `saveAsJSON()` / `loadFromJSON()` für Datenpersistenz
- **PDF-Export**: `exportToPDF()` mit jsPDF + autoTable

## Erste Schritte / Was ich brauche

1. **Projekt-Setup**: Hilf mir ein modernes Full-Stack-Projekt aufzusetzen
2. **Backend-API**: Grundgerüst für Node.js/Express Server mit PostgreSQL
3. **Realtime**: Socket.io Integration für Live-Updates
4. **Migration**: Wie migriere ich die bestehende Frontend-Logik?
5. **Deployment**: Docker-Setup für einfaches Deployment

## Spezifische Fragen

- Wie strukturiere ich am besten die Migration von standalone HTML zu Client-Server?
- Welche Strategie für Conflict Resolution bei gleichzeitigen Edits?
- Wie implementiere ich effizientes Realtime ohne Performance-Probleme bei 316+ Channels?
- Beste Practices für Offline-Modus + Sync?

## Constraints

- Das Tool wird primär von **Lichttechnikern im Theater** genutzt
- Muss **stabil und zuverlässig** sein (Show-Betrieb!)
- **Einfache Bedienung** wichtiger als fancy Features
- Sollte auch **offline/lokal** lauffähig sein (Backup-Lösung)
- **Datenschutz**: Keine Show-Daten in Cloud wenn nicht gewünscht

---

**Bitte hilf mir, dieses Projekt aufzusetzen. Beginne mit dem grundlegenden Setup und einer einfachen API für Show- und Channel-Verwaltung.**
