# 🎭 Theater-Einleuchtplan - Kollaborative Web-Anwendung

Eine moderne, server-basierte Webanwendung für Theater-Einleucht- und Aufbaupläne mit Echtzeit-Synchronisation und Multi-User-Unterstützung.

## ✨ Features

### MVP (implementiert)
- ✅ **Multi-User-Bearbeitung**: Mehrere Nutzer können gleichzeitig am selben Plan arbeiten
- ✅ **Echtzeit-Synchronisation**: Änderungen werden live bei allen Nutzern sichtbar
- ✅ **Zentrale Datenspeicherung**: PostgreSQL-Datenbank statt lokaler Dateien
- ✅ **Show-Verwaltung**: Mehrere Shows/Produktionen verwalten
- ✅ **User-Authentication**: Login-System mit JWT-Tokens
- ✅ **Versionsverlauf**: Änderungen werden nachverfolgt
- ✅ **JSON Import/Export**: Daten-Migration von alter HTML-Version
- ✅ **PDF-Export**: Professionelle PDF-Generierung
- ✅ **316+ Channels**: Unterstützung für große Produktionen

### Technische Features
- 🔄 WebSocket (Socket.io) für Realtime-Updates
- 🔐 JWT-basierte Authentifizierung
- 🗄️ PostgreSQL Datenbank mit automatischen Timestamps
- 💾 Redis für Session-Management
- 🐳 Docker-Setup für einfaches Deployment
- 🎨 Original Design-System beibehalten

## 🏗️ Architektur

```
theaterplan/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── config/      # Datenbank, Redis, Migration
│   │   ├── controllers/ # Business Logic
│   │   ├── models/      # Datenbank-Models
│   │   ├── routes/      # API-Endpunkte
│   │   ├── middleware/  # Auth, Error Handling
│   │   ├── services/    # WebSocket-Handler
│   │   └── server.js    # Express-Server
│   ├── Dockerfile
│   └── package.json
├── frontend/            # Vue.js 3 + Vite
│   ├── src/
│   │   ├── api/        # API-Client, WebSocket
│   │   ├── stores/     # Pinia State Management
│   │   ├── views/      # Pages (Login, Shows, ShowDetail)
│   │   ├── App.vue
│   │   └── main.js
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml   # Orchestrierung aller Services
└── README.md
```

## 🚀 Quick Start

### Voraussetzungen
- Docker & Docker Compose installiert
- Git

### Installation

```bash
cd /home/christopher/theaterplan

# Einmalig: .env erstellen
cp backend/.env.example backend/.env

# Starten
docker compose up -d
```

Das war's! Die Anwendung ist jetzt verfügbar:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

Die Datenbank-Migration läuft automatisch beim ersten Start.

## 📖 Verwendung

### Erster Start

1. Browser öffnen: http://localhost:5173
2. Account registrieren (erster User)
3. Einloggen
4. Neue Show erstellen
5. Channels importieren (JSON aus alter HTML-Version)

### Daten von alter HTML-Version importieren

1. In der alten HTML-Datei: "Als JSON speichern"
2. In neuer Web-App: Show öffnen → "Import" klicken
3. JSON-Inhalt einfügen → "Importieren"

### Multi-User-Bearbeitung

- Mehrere Browser-Fenster mit unterschiedlichen Accounts öffnen
- Änderungen eines Users werden sofort bei allen angezeigt
- Aktive User werden oben rechts angezeigt
- Änderungshistorie pro Channel verfügbar

## 🔧 Entwicklung

### Backend lokal starten (ohne Docker)

```bash
cd backend
npm install

# PostgreSQL und Redis müssen laufen
npm run db:migrate
npm run dev
```

### Frontend lokal starten (ohne Docker)

```bash
cd frontend
npm install
npm run dev
```

### Nützliche Befehle

```bash
# Logs anzeigen
docker-compose logs -f

# Backend-Logs
docker-compose logs -f backend

# Container neu starten
docker-compose restart backend

# Datenbank-Shell öffnen
docker-compose exec postgres psql -U postgres -d theaterplan

# Redis-Shell öffnen
docker-compose exec redis redis-cli
```

## 📡 API-Dokumentation

### Authentication

```bash
# Registrieren
POST /api/auth/register
Body: { "email": "...", "password": "...", "name": "..." }

# Login
POST /api/auth/login
Body: { "email": "...", "password": "..." }

# Profil abrufen
GET /api/auth/profile
Headers: { "Authorization": "Bearer <token>" }
```

### Shows

```bash
# Alle Shows
GET /api/shows

# Show erstellen
POST /api/shows
Body: { "name": "...", "venue": "...", "date": "2026-01-25" }

# Show aktualisieren
PUT /api/shows/:id
Body: { "name": "..." }

# Show löschen
DELETE /api/shows/:id

# Channels importieren
POST /api/shows/:id/import
Body: { "channels": [...] }

# JSON exportieren
GET /api/shows/:id/export/json
```

### Channels

```bash
# Alle Channels einer Show
GET /api/channels/show/:showId

# Channel aktualisieren
PUT /api/channels/:id
Body: { "adresse": "121", "geraet": "VK Bühne", ... }

# Channel löschen
DELETE /api/channels/:id

# Änderungshistorie
GET /api/channels/:id/history
```

## 🔌 WebSocket-Events

### Client → Server

```javascript
// Show beitreten
socket.emit('show:join', showId)

// Channel-Update senden
socket.emit('channel:update', {
  showId,
  channelId,
  field: 'geraet',
  value: 'VK Bühne unten'
})

// Typing-Indikator
socket.emit('channel:typing', { showId, channelId, field })
```

### Server → Client

```javascript
// Aktive User-Liste
socket.on('show:users', (users) => { ... })

// Channel wurde aktualisiert
socket.on('channel:updated', (data) => {
  // data: { channelId, field, value, userId, userName }
})

// Channel erstellt/gelöscht
socket.on('channel:created', ...)
socket.on('channel:deleted', ...)
```

## 🗄️ Datenbank-Schema

### users
- id, email, password_hash, name, role
- created_at, updated_at

### shows
- id, name, venue, date
- created_by (→ users)
- created_at, updated_at

### channels
- id, show_id (→ shows), kanal, adresse
- geraet, farbe, beschreibung, aktiv
- position, created_at, updated_at

### channel_history
- id, channel_id (→ channels)
- user_id (→ users), field_name
- old_value, new_value, changed_at

## 🔒 Sicherheit

- Passwörter werden mit bcrypt gehasht (10 Rounds)
- JWT-Tokens mit Ablaufdatum (7 Tage)
- CORS auf Frontend-URL beschränkt
- Helmet.js für HTTP-Security-Headers
- SQL-Injection-Schutz durch Prepared Statements
- WebSocket-Authentifizierung erforderlich

## 🚢 Produktion-Deployment

### Environment-Variablen anpassen

```bash
# backend/.env für Produktion
NODE_ENV=production
JWT_SECRET=<sicherer-random-key>
DB_PASSWORD=<sicheres-passwort>
CORS_ORIGIN=https://your-domain.com
```

### Docker Compose für Produktion

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Hosting-Optionen

**Einfache Optionen:**
- Railway.app (PostgreSQL + Redis inklusive)
- Render.com
- Fly.io
- DigitalOcean App Platform

**Self-Hosted:**
- VPS mit Docker
- Kubernetes
- Docker Swarm

## 🐛 Troubleshooting

### Backend startet nicht
```bash
# Logs prüfen
docker-compose logs backend

# Datenbank erreichbar?
docker-compose exec backend npm run db:migrate
```

### WebSocket verbindet nicht
- CORS_ORIGIN in .env prüfen
- Firewall/Reverse-Proxy für WebSocket konfiguriert?

### Channels werden nicht synchronisiert
- Browser-Console auf Fehler prüfen
- WebSocket-Verbindung aktiv? (Devtools → Network → WS)

## 📝 Migration von alter HTML-Version

### Schritt-für-Schritt

1. **Alte HTML-Datei öffnen**
2. Tabelle ausfüllen wie gewohnt
3. "Als JSON speichern" klicken
4. JSON-Datei herunterladen

5. **Neue Web-App öffnen**
6. Neue Show erstellen
7. Show öffnen
8. "Import" Button → JSON-Inhalt einfügen
9. Fertig!

### JSON-Format

```json
{
  "show": {
    "name": "Produktionsname",
    "venue": "Theater XY",
    "date": "2026-01-25"
  },
  "channels": [
    {
      "kanal": "1",
      "adresse": "121",
      "geraet": "VK Bühne unten Lks",
      "farbe": "NC",
      "beschreibung": "",
      "aktiv": false
    }
  ]
}
```

## 🎯 Nächste Schritte / Roadmap

### Phase 2 (Nice-to-have)
- [ ] ETC Eos .esf2 direkter Import
- [ ] Rollenbasierte Zugriffsrechte (Admin, Techniker, Read-only)
- [ ] Venue-Templates für fest installierte Geräte
- [ ] Mobile-optimierte Version
- [ ] Offline-Modus mit Sync
- [ ] Attachment-Upload (Fotos, Riggpläne)
- [ ] Collaboration-Features (Kommentare, Markierungen)
- [ ] Dark Mode

### Phase 3 (Erweitert)
- [ ] DMX-Patcher-Integration
- [ ] Visualisierung der Positionen
- [ ] Automatische Patch-Vorschläge
- [ ] Team-Management
- [ ] Audit-Log

## 📄 Lizenz

MIT License - Siehe LICENSE-Datei

## 🤝 Support

Bei Fragen oder Problemen:
1. README.md nochmal lesen
2. Logs prüfen: `docker-compose logs`
3. GitHub Issues erstellen (falls Repository vorhanden)

---

**Entwickelt für Lichttechniker im Theater** 🎭💡
