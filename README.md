# Snake Game

A browser-based Snake game with session persistence and global leaderboard.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vanilla JS + HTML5 Canvas + CSS3 |
| Backend | Node.js + Express |
| Database | Redis (sessions + sorted-set leaderboard) |
| Proxy | Nginx |
| Containers | Docker + Docker Compose |
| Tests | Jest + Supertest |

## Quick start

```bash
# Clone the repo
git clone <repo-url>
cd snake-game

# Start everything (first run builds images)
docker-compose up --build
```

Open **http://localhost** in your browser.

## How to play

1. Enter your name and click **Play**.
2. Use **Arrow keys** or **WASD** to steer the snake.
3. Eat red food to grow and increase your score.
4. Don't run into yourself — game over!
5. After dying, view the **Leaderboard** to see top 10 scores.

Your session is remembered between visits (httpOnly cookie, 24 h TTL). Only your personal best is kept on the leaderboard.

## Key commands

```bash
# Start full stack
docker-compose up --build

# Stop all containers
docker-compose down

# Run backend tests (requires running Redis)
docker-compose run --rm backend npm test

# Follow logs
docker-compose logs -f
```

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/session` | Create or restore a session |
| GET | `/api/session/:id` | Get session data |
| POST | `/api/scores` | Save score after game over |
| GET | `/api/scores/top` | Get top 10 highscores |

## Project structure

```
snake-game/
├── frontend/        # Static game files served by Nginx
│   ├── index.html
│   ├── game.js
│   ├── style.css
│   └── Dockerfile
├── backend/         # Express API
│   ├── server.js
│   ├── redis.js
│   ├── routes/
│   │   ├── session.js
│   │   └── scores.js
│   ├── tests/
│   │   ├── session.test.js
│   │   └── scores.test.js
│   └── Dockerfile
├── nginx/
│   └── nginx.conf
├── docker-compose.yml
├── .env.example
└── ARCHITECTURE.md
```
