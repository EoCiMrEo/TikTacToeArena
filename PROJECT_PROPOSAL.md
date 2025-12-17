# TicTacToe Arena — Project Proposal

Date: October 18, 2025

Version: 1.0 (Draft for review)

Stakeholders: Product Owner, Engineering Lead, Backend Team, Frontend Team, DevOps, Security


## 1) Executive Summary

TicTacToe Arena is a real-time, competitive multiplayer web application that modernizes the classic TicTacToe game with matchmaking, rankings, and social features. The system will be built using a microservices architecture to maximize scalability, reliability, and independent deployability. The frontend is a React 18/Vite app; the backend comprises independent Flask-based services (Auth, Game, Matchmaking, Leaderboard) communicating over REST and WebSockets with Redis pub/sub. The database for the MVP will run on MySQL (via Docker Compose), with a migration path to PostgreSQL where advantageous (mirroring the prior Supabase schema).

This proposal outlines the scope, architecture, data model, delivery plan, security controls, and success metrics for shipping an MVP in ~6–8 weeks, with a roadmap for production hardening and scale-out.


## 2) Goals and Objectives

- Deliver an engaging online TicTacToe experience with competitive matchmaking and leaderboards.
- Adopt microservices to enable independent development/deployments of Auth, Game, Matchmaking, and Leaderboard services.
- Provide real-time gameplay using WebSockets (Socket.IO) and expose REST APIs for core operations.
- Implement secure, standards-based authentication with JWT and strong password hashing (Argon2).
- Ensure observability, rate limiting, and basic resilience patterns from day one.

Key Outcomes (MVP):
- Users can register, log in, and manage their profiles.
- Users can create/join games and play in real-time with valid move logic and win/draw detection.
- Matchmaking queues players by ELO for fair matches.
- Leaderboard shows global/friends rankings with cached reads.


## 3) Scope

In Scope (MVP):
- Frontend: React app (existing UI) integrated with new Flask APIs + WebSocket gateway.
- Backend: Flask services for Auth, Game, Matchmaking, and Leaderboard.
- Database: MySQL (Dockerized) and SQLAlchemy ORM models; Alembic/Flask-Migrate for schema management.
- Realtime: Flask-SocketIO gateway for game events.
- Security: JWT auth, password hashing (Argon2), CORS, rate limiting, basic security headers.
- DevOps: Docker Compose for DB; local development scripts; environment configuration via .env files.

Out of Scope (MVP, defer to Phase 2+):
- Social OAuth providers (Google, Facebook) beyond placeholders.
- Multi-region deployment, advanced CDNs, or full SRE automation.
- In-depth analytics and A/B experimentation.


## 4) Architecture Overview (Microservices)

Style: Independent Flask services communicating via REST + WebSocket events; Redis for pub/sub and caching. Database per service or shared schema (MVP: shared MySQL schema with clear ownership of tables by service).

Services:
- Auth Service (Port 5001)
  - Registration, login, refresh, profile CRUD
  - JWT token generation/validation; password reset tokens
  - Owns user_profiles table
- Game Service (Port 5002)
  - Create/join game, make moves, validate rules, detect winner/draw
  - Owns games and game_results tables
  - Emits/consumes WebSocket events via Gateway
- Matchmaking Service (Port 5003)
  - Queue join/leave, ELO-based pairing, match creation
  - Owns matchmaking_queue table, uses Redis for queue/locks
- Leaderboard Service (Port 5004)
  - Global/friends rankings, player stats
  - Uses Redis cache (TTL ~5 min) for hot rankings
- WebSocket Gateway (Port 5005)
  - Socket.IO hub (rooms per game), broadcasting moves/status/chat
  - Horizontal scalability using Redis message queue

API Gateway (Optional, Port 5000):
- Reverse proxy + rate limiting + documentation aggregation (future optimization). For MVP, services may be accessed directly.

Data Flow (Game Move - Redis-First):
1) Frontend: POST /games/:id/move (JWT) or Socket.IO 'make_move' -> Game Service
2) Validate move -> update Redis state atomically (Lua/MULTI) -> compute winner/draw in-memory
3) If terminal or every N moves, enqueue async snapshot to SQL and ELO update; otherwise keep hot state in Redis
4) Emit event to WebSocket Gateway -> broadcast to both players’ rooms


## 5) Technology Stack

Frontend:
- React 18, Vite, React Router, Redux Toolkit, TailwindCSS, Axios, Socket.IO Client, React Hook Form, Framer Motion

Backend:
- Flask, Flask-RESTX (Swagger), Flask-CORS, SQLAlchemy, Flask-Migrate, MySQL connector, Flask-JWT-Extended, Argon2/Flask-Bcrypt, Flask-SocketIO, Redis, Eventlet

Infrastructure:
- Docker Compose (MySQL service available), Redis (local/dev), Nginx+Gunicorn (production), optional Celery/APScheduler for background tasks

Note: The repository contains prior Supabase migrations and frontend Supabase client. The migration plan replaces Supabase calls with Flask APIs and Socket.IO, leveraging the existing SQL schema as reference.


## 6) Data Model (MVP)

Tables (MySQL):
- user_profiles
  - id (UUID), email (unique), username (unique), full_name, avatar_url, role (ENUM: admin/player/moderator), password_hash, elo_rating (int, default 1200), stats fields (played/won/lost/drawn), last_active, created_at, updated_at
- games
  - id (UUID), player1_id, player2_id, current_player_id, winner_id
  - game_state (JSON), status (ENUM: waiting/active/completed/abandoned), moves_count, started_at, ended_at, created_at, updated_at
- game_results
  - id (UUID), game_id (FK), player_id (FK), result (ENUM: win/loss/draw), elo_before, elo_after, elo_change, created_at
- matchmaking_queue
  - id (UUID), player_id (FK), elo_rating, preferences (JSON), created_at

Indexes:
- user_profiles: username, elo_rating DESC, last_active DESC
- games: status, (player1_id, player2_id), created_at DESC
- game_results: player_id, created_at DESC
- matchmaking_queue: elo_rating


## 7) API Surface (High-Level)

Auth Service (5001):
- POST /auth/register
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout
- GET /auth/profile
- PUT /auth/profile
- POST /auth/password-reset
- POST /auth/password-reset/confirm

Game Service (5002):
- POST /games
- GET /games
- GET /games/:id
- POST /games/:id/move
- GET /games/:id/history
- DELETE /games/:id

Matchmaking Service (5003):
- POST /matchmaking/queue (join)
- DELETE /matchmaking/queue (leave)
- GET /matchmaking/status

Leaderboard Service (5004):
- GET /leaderboard/global
- GET /leaderboard/friends
- GET /leaderboard/search?q=<term>
- GET /leaderboard/stats/:userId

WebSocket Gateway (5005):
- Events: join_game, leave_game, make_move, chat_message, game_update, match_found


## 8) Non-Functional Requirements (NFRs)

- Security: JWT-based auth, Argon2 hashing, rate limiting, security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options), input validation (Marshmallow/Pydantic), parameterized queries via ORM.
- Performance: P95 API latency < 200ms for read operations; WebSocket event propagation < 200ms for local dev.
- Availability: 99.5% (MVP single-node), roadmap to 99.9% with HA for production (multi-node, Redis cluster, managed DB).
- Scalability: Horizontal scale via stateless services; Redis-backed Socket.IO for scaling WebSockets.
- Observability: Structured logging (JSON), request correlation IDs, metrics endpoints (future), error tracking (Sentry) in Phase 2.
- Privacy: Store minimal PII (email, username); protect secrets via environment variables.


## 9) Security Plan

- AuthN/AuthZ: Flask-JWT-Extended with access/refresh tokens; role-based authorization (admin/player/moderator) as needed.
- Passwords: Argon2 hashing, strong password policy, no plaintext storage/logging.
- Transport: HTTPS in production via Nginx + TLS; HSTS enabled.
- Input Validation: Marshmallow schemas for request payloads; reject invalid types and ranges.
- Rate Limiting: Flask-Limiter defaults (e.g., global 100 RPM per IP; login 5 RPM per IP).
- Secrets Management: .env for dev; production via environment variables/secret manager.
- Database: Principle of least privilege; parameterized ORM usage; RLS emulation in services.
- Realtime: Namespaced Socket.IO events; auth token validation on connect and each critical event; per-room ACLs.


## 10) Delivery Plan & Milestones (Tentative 6–8 Weeks)

Week 1: Foundations
- Finalize schemas and service contracts (OpenAPI via Flask-RESTX)
- Stand up MySQL (docker-compose) and Redis in dev
- Implement shared DB engine and health checks (already started)

Week 2: Authentication Service (5001)
- Registration, login, refresh, logout, profile GET/PUT
- Argon2 hashing, JWT issuance and verification
- Minimal unit tests and Swagger docs
- Frontend: switch `authService.js` to use Flask endpoints

Week 3: Game Service (5002)
- Models: Game, GameState, GameResult; move validation and end-state detection
- REST endpoints and WebSocket event hooks
- Frontend: replace Supabase calls in `gameService.js` with REST + Socket.IO

Week 4: WebSocket Gateway (5005)
- Implement Socket.IO server, rooms per game, event broadcasting
- Redis-based message queue for scale-out
- Frontend: integrate Socket.IO client, in-game chat, connection status

Week 5: Matchmaking Service (5003)
- Queue join/leave, ELO-based pairing, game creation handoff
- Optional background tasks (Celery/APScheduler) if needed
- Frontend: matchmaking lobby integration

Week 6: Leaderboard Service (5004)
- Aggregations for global/friends rankings and player stats
- Redis caching with TTL; endpoints for search and stats
- Frontend: leaderboard pages wired to new APIs

Week 7–8: Hardening & Launch Prep
- Load testing, rate limiting tuning, error handling, retries
- Security review, logging, metrics, dashboards (where feasible)
- Production deployment docs; optional API Gateway/Nginx config


## 11) Risks & Mitigations

- Realtime Latency: Use Socket.IO with Redis scaling; reduce payload sizes; optimize broadcast logic.
- Data Consistency: Single DB schema in MVP with clear ownership; evolve to per-service schemas if needed; wrap writes in transactions.
- Migration from Supabase: Provide compatibility layer and phased frontend cutover; maintain SQL semantics similar to prior design.
- Security Misconfiguration: Enforce CORS, rate limits, and security headers; add integration tests; run dependency checks.
- Scope Creep: Fix MVP scope; track Phase 2 features separately; use acceptance criteria per milestone.
- Environment Drift: Document .env, Docker, and Windows dev steps; use consistent versions via requirements.txt and package.json.


## 12) Acceptance Criteria (MVP)

- A new user can register, log in, and view/update their profile.
- A logged-in user can create a game, invite/join an opponent, make valid moves, and finish games.
- Matchmaking can pair two waiting users within ELO range and create a game automatically.
- Leaderboard shows ordered rankings and returns within 300ms for cached reads.
- Real-time updates arrive for the opponent within 200ms in local environment.
- All REST endpoints documented via Swagger (Flask-RESTX) per service.
- Basic rate limiting enabled; security headers present in responses.


## 13) Team & Responsibilities

- Product Owner: Requirements, prioritization, acceptance
- Engineering Lead: Architecture, code reviews, technical decisions
- Backend Engineers: Implement services, models, APIs, WebSocket gateway
- Frontend Engineer(s): Replace Supabase calls with Flask APIs; Socket.IO integration
- DevOps: Local Docker setup; production deployment scripts; monitoring hooks
- Security: Threat modeling, secure defaults, review


## 14) Observability & Quality

- Logging: JSON logs with request IDs; sensitive data excluded; log aggregation in prod
- Metrics: Basic request latency and error rates (Phase 2); health endpoints per service
- Testing: Unit tests (pytest), smoke tests for APIs, frontend component tests (Jest/RTL)
- CI (Phase 2): Linting, tests, container builds on PRs; vulnerability scans


## 15) Deployment Strategy

- Dev: Docker Compose for MySQL; local Flask services run individually
- Staging/Prod: Nginx reverse proxy; Gunicorn + eventlet for Flask services; managed DB (RDS) and Redis (ElastiCache)
- Blue/Green or rolling deployments per service; canary optional (future)


## 16) Budget & Resources (Indicative)

- Engineering: 2–3 backend engineers, 1–2 frontend engineers over 6–8 weeks
- Infrastructure: Dev via Docker (minimal cost); Production via cloud provider (DB/Redis/VMs)
- Tools: Sentry (optional), monitoring/logging stack (optional Phase 2)


## 17) Roadmap (Beyond MVP)

- Social OAuth (Google/Facebook) and email delivery for reset links
- Spectator mode and replays
- Tournaments and seasonal ladders
- Push notifications and PWA enhancements
- Advanced anti-cheat and anomaly detection
- Multi-region active/active WebSocket deployment


## 18) Immediate Next Steps

- Finalize database configuration for MySQL (docker-compose up -d)
- Implement Auth Service endpoints and wire frontend `authService.js`
- Implement Game Service endpoints and move logic; integrate Socket.IO
- Replace remaining Supabase usage (`gameService.js`, `leaderboardService.js`) with REST + WS
- Stand up WebSocket Gateway and rooms per game


## 19) References (in repo)

- `README.md` (project summary and setup)
- `be/docs/ARCHITECTURE.md` (architecture details)
- `be/docs/MICROSERVICES_GUIDE.md` (service breakdown)
- `be/docs/STACK_DIAGRAM.md` (stack diagram)
- `be/docs/LIBRARIES_GUIDE.md` (libraries and installs)
- `docker-compose.yml` (MySQL service)
- `be/services/authServices/db/mysql_db_connect.py` (DB engine utilities)


— End of Proposal —
