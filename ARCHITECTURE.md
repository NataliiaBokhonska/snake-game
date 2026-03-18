# Architecture

## System diagram

```
Browser
  │
  │  HTTP :80
  ▼
┌─────────────────────────────────┐
│            Nginx                │
│  ┌───────────────────────────┐  │
│  │  Static files             │  │
│  │  /usr/share/nginx/html    │  │
│  │  index.html, game.js,     │  │
│  │  style.css                │  │
│  └───────────────────────────┘  │
│  location /api/ → proxy_pass    │
└────────────┬────────────────────┘
             │  HTTP :3000
             ▼
┌────────────────────────┐
│   Node.js / Express    │
│                        │
│  POST /api/session     │
│  GET  /api/session/:id │
│  POST /api/scores      │
│  GET  /api/scores/top  │
└────────────┬───────────┘
             │  ioredis
             ▼
┌────────────────────────┐
│         Redis          │
│                        │
│  session:{uuid}        │  ← JSON, TTL 24 h
│  highscores            │  ← sorted set
└────────────────────────┘
```

## Request flows

### New player loads the page

```
Browser → GET /          → Nginx → index.html + game.js + style.css
Browser → POST /api/session  → Express → Redis SET session:{uuid}
                              ← 201 { sessionId, name }
Express → Set-Cookie: sessionId=<uuid>; HttpOnly
```

### Player finishes a game

```
Browser → POST /api/scores { sessionId, name, score }
        → Express → Redis ZADD highscores score member
        ← 201 { saved: true }
```

### Player views leaderboard

```
Browser → GET /api/scores/top
        → Express → Redis ZREVRANGE highscores 0 9 WITHSCORES
        ← 200 [{ name, score }, …]
```

### Returning player

```
Browser sends Cookie: sessionId=<uuid>
POST /api/session → Express reads cookie
                  → Redis GET session:{uuid}  (hit)
                  ← 200 { sessionId, name }   (no new session created)
```

## Data model

### Redis: session hash

Key pattern: `session:{uuid}`
Type: string (serialized JSON)
TTL: 86 400 s (24 h)

```json
{
  "name": "Alice",
  "createdAt": "2026-03-18T12:00:00.000Z"
}
```

### Redis: highscores sorted set

Key: `highscores`
Member: `{sessionId}:{playerName}`
Score: integer (number of food items eaten)

Only the highest score per member is stored. The set is read with
`ZREVRANGE … WITHSCORES` to return the global top 10.

## Design decisions

| Decision | Rationale |
|----------|-----------|
| httpOnly cookie for sessionId | Prevents XSS token theft |
| UUID v4 as session ID | Collision-proof, no guessable sequence |
| Sorted set for leaderboard | O(log N) insert, O(log N + K) range query |
| Nginx as reverse proxy | Single ingress point; serves static files efficiently |
| Docker Compose | Reproducible local dev with one command |
| Game does NOT pause on blur | Intentional — keeps physics simple |
