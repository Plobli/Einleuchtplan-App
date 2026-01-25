# API-Beispiele für Theater-Einleuchtplan

## Setup für Tests

```bash
# Login und Token erhalten
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  | jq -r '.token')

echo $TOKEN
```

## Authentication

### Registrierung
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "max@theater.de",
    "password": "geheim123",
    "name": "Max Mustermann"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "max@theater.de",
    "password": "geheim123"
  }'
```

### Profil abrufen
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

## Shows

### Alle Shows abrufen
```bash
curl -X GET http://localhost:3000/api/shows \
  -H "Authorization: Bearer $TOKEN"
```

### Neue Show erstellen
```bash
curl -X POST http://localhost:3000/api/shows \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Der Kaufmann von Venedig",
    "venue": "Stadttheater München",
    "date": "2026-03-15"
  }'
```

### Show aktualisieren
```bash
curl -X PUT http://localhost:3000/api/shows/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Der Kaufmann von Venedig - Premiere"
  }'
```

### Show löschen
```bash
curl -X DELETE http://localhost:3000/api/shows/1 \
  -H "Authorization: Bearer $TOKEN"
```

## Channels

### Channels einer Show abrufen
```bash
curl -X GET http://localhost:3000/api/channels/show/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Channels importieren
```bash
curl -X POST http://localhost:3000/api/shows/1/import \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channels": [
      {
        "kanal": "1",
        "adresse": "121",
        "geraet": "VK Bühne unten Lks",
        "farbe": "NC",
        "beschreibung": "",
        "aktiv": false,
        "position": 1
      },
      {
        "kanal": "2",
        "adresse": "122",
        "geraet": "VK Bühne unten Lks",
        "farbe": "NC",
        "beschreibung": "",
        "aktiv": false,
        "position": 2
      }
    ]
  }'
```

### Channel aktualisieren
```bash
curl -X PUT http://localhost:3000/api/channels/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "adresse": "123",
    "geraet": "S4 LED S2 Lustr QS General",
    "farbe": "200",
    "beschreibung": "Portal links oben",
    "aktiv": true
  }'
```

### Channel-Historie abrufen
```bash
curl -X GET http://localhost:3000/api/channels/1/history \
  -H "Authorization: Bearer $TOKEN"
```

### Show als JSON exportieren
```bash
curl -X GET http://localhost:3000/api/shows/1/export/json \
  -H "Authorization: Bearer $TOKEN" \
  > export.json
```

## WebSocket-Test (mit wscat)

```bash
# wscat installieren
npm install -g wscat

# Verbinden (mit Token)
wscat -c "ws://localhost:3000?token=$TOKEN"

# Show beitreten
{"type": "show:join", "showId": 1}

# Channel-Update senden
{"type": "channel:update", "showId": 1, "channelId": 1, "field": "geraet", "value": "Test"}
```

## Health Check

```bash
curl http://localhost:3000/health
```

## Bulk-Test: 100 Channels importieren

```bash
# Generiere JSON mit 100 Channels
python3 << EOF
import json

channels = []
for i in range(1, 101):
    channels.append({
        "kanal": str(i),
        "adresse": str(100 + i),
        "geraet": f"VK Kanal {i}",
        "farbe": "NC",
        "beschreibung": "",
        "aktiv": False,
        "position": i
    })

print(json.dumps({"channels": channels}))
EOF > channels_100.json

# Importieren
curl -X POST http://localhost:3000/api/shows/1/import \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @channels_100.json
```
