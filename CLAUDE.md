cat > CLAUDE.md << 'EOF'
# Snake Game Project

## Project goal
Browser-based Snake game built with Vanilla JS + HTML5 Canvas.
Remembers user sessions and scores between visits.

## Stack
- Frontend: Vanilla JS, HTML5 Canvas, CSS3
- Backend: Node.js + Express
- Database: Redis (sessions + highscores as sorted set)
- Proxy: Nginx (serves static files + proxies /api/*)
- Containers: Docker + Docker Compose
- Tests: Jest (backend)

## Project structure
snake-game/
├── CLAUDE.md
├── README.md
├── ARCHITECTURE.md
├── docker-compose.yml
├── .env.example
├── .gitignore
├── frontend/
│   ├── Dockerfile
│   ├── index.html
│   ├── game.js
│   └── style.css
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   ├── routes/
│   │   ├── session.js
│   │   └── scores.js
│   └── tests/
│       ├── session.test.js
│       └── scores.test.js
└── nginx/
    └── nginx.conf

## Key commands
- `docker-compose up --build` — start the full stack
- `docker-compose down` — stop all containers
- `docker-compose run backend npm test` — run backend tests
- `docker-compose logs -f` — follow logs

## API endpoints
- POST /api/session — create or restore session
- GET  /api/session/:id — get session data
- POST /api/scores — save score after game over
- GET  /api/scores/top — get top 10 highscores

## Architecture decisions
- Session is created on first game load using UUID v4
- sessionId stored in httpOnly cookie with 24h TTL
- Redis stores: session:{id} → player name, created date
- Redis stores: highscores → sorted set with scores
- Frontend communicates only through /api/* endpoints
- Game does NOT pause on window blur

## Code style
- ESLint + Prettier
- JSDoc comments for all functions
- All variable names, comments, and docs in English
- Commits: feat/fix/docs/test/chore: description in English
- Write tests immediately after each new feature

## Definition of done
- Code is written and works
- Tests are written and passing
- Docker Compose starts everything on first try
- README contains screenshot and launch instructions
EOF