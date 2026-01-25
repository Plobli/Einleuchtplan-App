# 🚀 QUICK START - Theater-Einleuchtplan

## In 2 Schritten zum lauffähigen System

### 1️⃣ Starten
```bash
cd /home/christopher/theaterplan

# Einmalig: .env erstellen (falls nicht vorhanden)
cp backend/.env.example backend/.env

# Starten - fertig!
docker compose up -d
```

Das war's! Docker:
- ✅ Startet PostgreSQL + Redis
- ✅ Installiert Dependencies
- ✅ Führt Datenbank-Migration automatisch aus
- ✅ Startet Backend + Frontend

### 2️⃣ Anwendung öffnen
Browser: **http://localhost:5173**

### 3️⃣ Los geht's!
1. Account registrieren
2. Einloggen
3. Erste Show erstellen
4. Channels importieren (JSON aus alter HTML-Version)

---

## 📋 Was wurde erstellt?

### Backend (Node.js + Express)
```
backend/
├── src/
│   ├── server.js           # Express-Server mit Socket.io
│   ├── config/
│   │   ├── database.js     # PostgreSQL-Verbindung
│   │   ├── redis.js        # Redis-Client
│   │   └── migrate.js      # Datenbank-Schema
│   ├── models/             # User, Show, Channel
│   ├── controllers/        # Business Logic
│   ├── routes/             # API-Endpunkte
│   ├── middleware/         # Auth, Error Handling
│   └── services/           # WebSocket-Handler
```

**API verfügbar unter:** http://localhost:3000

**Endpunkte:**
- `POST /api/auth/register` - Registrierung
- `POST /api/auth/login` - Login
- `GET /api/shows` - Shows abrufen
- `GET /api/channels/show/:id` - Channels abrufen
- `PUT /api/channels/:id` - Channel aktualisieren
- `POST /api/shows/:id/import` - JSON importieren

### Frontend (Vue.js 3 + Vite)
```
frontend/
├── src/
│   ├── views/
│   │   ├── Login.vue       # Login/Register
│   │   ├── Shows.vue       # Show-Übersicht
│   │   └── ShowDetail.vue  # Channel-Tabelle
│   ├── stores/             # Pinia State Management
│   ├── api/                # API-Client + WebSocket
│   └── router.js           # Vue Router
```

**Features:**
- ✅ Editierbare Tabelle (wie Original)
- ✅ Auto-Aktivierung beim Eingeben
- ✅ Echtzeit-Synchronisation
- ✅ Aktive User anzeigen
- ✅ JSON Import/Export
- ✅ PDF-Export
- ✅ Änderungshistorie pro Channel

### Datenbank (PostgreSQL)
```sql
users           # Email, Password, Name
shows           # Name, Venue, Date
channels        # Kanal, Adresse, Gerät, Farbe, Beschreibung
channel_history # Änderungen nachverfolgen
```

### Services (Docker)
- **PostgreSQL** (Port 5432) - Datenbank
- **Redis** (Port 6379) - Session/Cache
- **Backend** (Port 3000) - API + WebSocket
- **Frontend** (Port 5173) - Vue.js App

---

## 🎯 Typische Workflows

### Neue Show mit Channels erstellen

**Option A: Manuell eingeben**
1. Show erstellen
2. Show öffnen
3. Channels einzeln in Tabelle eingeben
4. Auto-Aktivierung beim Tippen

**Option B: JSON importieren**
1. Show erstellen
2. Show öffnen
3. "Import" klicken
4. JSON einfügen (aus alter HTML-Version)
5. Fertig - alle 316 Channels importiert!

### Multi-User-Bearbeitung testen
1. Zwei Browser-Fenster öffnen
2. Verschiedene Accounts einloggen
3. Gleiche Show öffnen
4. In einem Fenster Channel bearbeiten
5. → Andere Fenster sehen Update sofort! ⚡

### PDF erstellen
1. Show öffnen
2. Channels aktivieren (Checkbox)
3. "Export PDF" klicken
4. → PDF mit allen aktiven Channels

---

## 🔧 Entwicklung

### Backend entwickeln
```bash
cd backend
npm install
npm run dev
```

### Frontend entwickeln
```bash
cd frontend
npm install
npm run dev
```

### Logs ansehen
```bash
# Alle Services
docker-compose logs -f

# Nur Backend
docker-compose logs -f backend

# Nur Frontend
docker-compose logs -f frontend
```

### Services neu starten
```bash
docker-compose restart
```

### Alles stoppen
```bash
docker-compose down
```

### Alles löschen (inkl. Datenbank!)
```bash
docker-compose down -v
```

---

## 📊 Datenbank-Zugriff

### PostgreSQL-Shell öffnen
```bash
docker-compose exec postgres psql -U postgres -d theaterplan
```

### Nützliche SQL-Befehle
```sql
-- Alle Tabellen anzeigen
\dt

-- Alle Shows
SELECT * FROM shows;

-- Channels einer Show
SELECT * FROM channels WHERE show_id = 1;

-- Änderungshistorie
SELECT * FROM channel_history ORDER BY changed_at DESC LIMIT 10;

-- Statistik
SELECT show_id, COUNT(*) as channel_count 
FROM channels 
GROUP BY show_id;
```

---

## 🐛 Häufige Probleme

### "Port 5432 bereits belegt"
→ Anderer PostgreSQL-Server läuft
```bash
sudo systemctl stop postgresql
# oder Port in docker-compose.yml ändern
```

### "Cannot connect to backend"
→ Backend-Logs prüfen
```bash
docker-compose logs backend
```

### "WebSocket error"
→ CORS-Einstellung in backend/.env prüfen
```
CORS_ORIGIN=http://localhost:5173
```

### Frontend zeigt nichts
→ API-URL prüfen
```bash
# In frontend/vite.config.js oder .env
VITE_API_URL=http://localhost:3000
```

---

## 📚 Weiterführende Dokumentation

- **README.md** - Vollständige Projektdokumentation
- **API_EXAMPLES.md** - API-Beispiele mit curl
- **anweisungen.md** - Original-Anforderungen

---

## ✅ Checkliste für Produktion

Bevor du das System produktiv einsetzt:

- [ ] `.env` anpassen (sichere Passwörter!)
- [ ] `JWT_SECRET` ändern (random!)
- [ ] PostgreSQL-Backup einrichten
- [ ] HTTPS/SSL aktivieren (z.B. mit nginx)
- [ ] Domain konfigurieren
- [ ] Firewall-Regeln setzen
- [ ] Monitoring einrichten
- [ ] User-Dokumentation erstellen

---

**Viel Erfolg! 🎭💡**

Bei Fragen: README.md lesen oder Logs prüfen!
