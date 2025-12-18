# 🎮 TicTacToe Arena

**A Modern, Real-Time Multiplayer TicTacToe Platform with Competitive Matchmaking**

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Python](https://img.shields.io/badge/python-3.10+-green)
![React](https://img.shields.io/badge/react-18.2-61dafb)
![Flask](https://img.shields.io/badge/flask-3.0-black)
![Architecture](https://img.shields.io/badge/architecture-microservices-orange)
![Status](https://img.shields.io/badge/status-MVP%20Complete-brightgreen)

---

## 📋 Table of Contents

1. [What is TicTacToe Arena?](#-what-is-tictactoe-arena)
2. [Current Project Status](#-current-project-status)
3. [Architecture Overview](#-architecture-overview)
4. [Technology Stack](#-technology-stack)
5. [Project Structure](#-project-structure)
6. [Prerequisites](#-prerequisites)
7. [Quick Start Guide](#-quick-start-guide)
8. [Running Each Service](#-running-each-service)
9. [Service Details](#-service-details)
10. [Frontend Application](#-frontend-application)
11. [Database Schema](#-database-schema)
12. [API Reference](#-api-reference)
13. [Environment Variables](#-environment-variables)
14. [Common Development Tasks](#-common-development-tasks)
15. [Troubleshooting](#-troubleshooting)
16. [Future Features Roadmap](#-future-features-roadmap)
17. [Contributing](#-contributing)

---

## 🎯 What is TicTacToe Arena?

TicTacToe Arena is a **full-stack, real-time multiplayer online game platform** that transforms the classic TicTacToe game into a competitive experience. The platform is built using a **microservices architecture** where each service handles a specific domain of functionality.

### Key Features (Currently Implemented)

| Feature                 | Description                                         | Status      |
| ----------------------- | --------------------------------------------------- | ----------- |
| **User Authentication** | Register, login, email verification, password reset | ✅ Complete |
| **User Profiles**       | View/edit profile, avatar, game statistics          | ✅ Complete |
| **Real-Time Gameplay**  | WebSocket-powered live game updates                 | ✅ Complete |
| **ELO Matchmaking**     | Skill-based opponent matching (starts at 1200 ELO)  | ✅ Complete |
| **Global Leaderboards** | Rankings by ELO, searchable players                 | ✅ Complete |
| **Game Dashboard**      | View stats, recent games, quick actions             | ✅ Complete |
| **Responsive UI**       | Works on desktop, tablet, and mobile                | ✅ Complete |

### How It Works

1. **User registers** → Creates account with email/password
2. **User logs in** → Receives JWT access token
3. **User clicks "Find Opponent"** → Joins matchmaking queue
4. **Matchmaking service** → Pairs players with similar ELO ratings
5. **Game created** → Both players connected via WebSocket
6. **Real-time moves** → Each move broadcast instantly to opponent
7. **Game ends** → ELO ratings updated, statistics recorded
8. **Leaderboard updates** → Rankings reflect new ratings

---

## 📊 Current Project Status

**Version**: 1.0.0 (MVP Complete)  
**Last Updated**: December 2024

### Services Status

| Service              | Port | Status     | Database      | Description                          |
| -------------------- | ---- | ---------- | ------------- | ------------------------------------ |
| Auth Service         | 5001 | ✅ Running | PostgreSQL    | User registration, login, JWT tokens |
| User Profile Service | 5006 | ✅ Running | PostgreSQL    | Profile management, statistics       |
| Game Service         | 5002 | ✅ Running | PostgreSQL    | Game logic, move validation          |
| Matchmaking Service  | 5003 | ✅ Running | Redis         | Queue management, ELO pairing        |
| Leaderboard Service  | 5004 | ✅ Running | Redis Cache   | Rankings, player search              |
| WebSocket Gateway    | 5005 | ✅ Running | Redis Pub/Sub | Real-time communication              |

### Frontend Status

| Component               | Status      | Description               |
| ----------------------- | ----------- | ------------------------- |
| User Login Page         | ✅ Complete | `/user-login`             |
| User Registration Page  | ✅ Complete | `/user-registration`      |
| Email Verification Page | ✅ Complete | `/verify-email`           |
| Game Dashboard          | ✅ Complete | `/game-dashboard` (Home)  |
| Matchmaking Lobby       | ✅ Complete | `/matchmaking-game-lobby` |
| Active Game Board       | ✅ Complete | `/active-game-board`      |
| Rankings Leaderboard    | ✅ Complete | `/rankings-leaderboard`   |
| User Profile Page       | ✅ Complete | `/user-profile`           |

---

## 🏗 Architecture Overview

TicTacToe Arena uses a **microservices architecture** where each service is:

- **Independent**: Can be deployed and scaled separately
- **Single-purpose**: Handles one domain (auth, games, etc.)
- **Containerized**: Runs in its own Docker container
- **Stateless**: State stored in databases/Redis, not in memory

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React + Vite)                        │
│                              Port 4028                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │
│  │ Login/Reg   │ │  Dashboard  │ │  Game Board │ │    Leaderboard      │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘ │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │
          HTTP REST API     │        WebSocket (Socket.IO)
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND SERVICES                                 │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │    Auth      │  │    Game      │  │ Matchmaking  │  │ Leaderboard  │ │
│  │   Service    │  │   Service    │  │   Service    │  │   Service    │ │
│  │   :5001      │  │   :5002      │  │   :5003      │  │   :5004      │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                 │                 │                 │          │
│  ┌──────────────┐  ┌──────────────┐                                     │
│  │ User Profile │  │  WebSocket   │                                     │
│  │   Service    │  │   Gateway    │                                     │
│  │   :5006      │  │   :5005      │                                     │
│  └──────┬───────┘  └──────┬───────┘                                     │
│         │                 │                                              │
└─────────┼─────────────────┼──────────────────────────────────────────────┘
          │                 │
          ▼                 ▼
┌─────────────────┐  ┌─────────────────┐
│   PostgreSQL    │  │     Redis       │
│   Database      │  │  Cache/Pub-Sub  │
│    :5432        │  │    :6379        │
└─────────────────┘  └─────────────────┘
```

### Data Flow Example: Making a Move

```
1. Player clicks cell on game board
        │
        ▼
2. Frontend sends WebSocket event: 'make_move' { game_id, position }
        │
        ▼
3. WebSocket Gateway receives event
        │
        ▼
4. Gateway calls Game Service: POST /games/{id}/move
        │
        ▼
5. Game Service validates move, updates game state in PostgreSQL
        │
        ▼
6. Game Service returns new state (or winner if game ended)
        │
        ▼
7. Gateway broadcasts 'game_update' to both players via WebSocket
        │
        ▼
8. Both frontends update their UI instantly
```

---

## 🛠 Technology Stack

### Backend (Python)

| Technology             | Version | Purpose                                  |
| ---------------------- | ------- | ---------------------------------------- |
| **Flask**              | 3.0.0   | Web framework for REST APIs              |
| **Flask-SocketIO**     | 5.3+    | WebSocket support for real-time features |
| **Flask-JWT-Extended** | 4.6.0   | JWT token authentication                 |
| **Flask-SQLAlchemy**   | 3.1.1   | ORM for database operations              |
| **Flask-Migrate**      | 4.0.5   | Database schema migrations               |
| **Flask-CORS**         | 4.0.0   | Cross-Origin Resource Sharing            |
| **Flask-Bcrypt**       | 1.0.1   | Password hashing                         |
| **PostgreSQL**         | 14+     | Primary relational database              |
| **Redis**              | 6+      | Caching, pub/sub, session storage        |
| **Gunicorn**           | 21.2.0  | Production WSGI server                   |
| **Gevent**             | 23+     | Async support for WebSockets             |
| **python-dotenv**      | 1.0.0   | Environment variable management          |
| **PyJWT**              | 2.8+    | JWT token encoding/decoding              |

### Frontend (JavaScript)

| Technology           | Version | Purpose                      |
| -------------------- | ------- | ---------------------------- |
| **React**            | 18.2.0  | UI component library         |
| **Vite**             | 5.4+    | Build tool and dev server    |
| **React Router**     | 6.0.2   | Client-side routing          |
| **Redux Toolkit**    | 2.6.1   | Global state management      |
| **TailwindCSS**      | 3.4.6   | Utility-first CSS framework  |
| **Axios**            | 1.8.4   | HTTP client for API requests |
| **Socket.IO Client** | 4.8.1   | WebSocket client             |
| **React Hook Form**  | 7.55.0  | Form state management        |
| **Framer Motion**    | 10.16.4 | UI animations                |
| **Lucide React**     | 0.484.0 | Icon library                 |
| **Recharts**         | 2.15.2  | Charts for statistics        |
| **date-fns**         | 4.1.0   | Date formatting utilities    |

### Infrastructure

| Technology         | Purpose                            |
| ------------------ | ---------------------------------- |
| **Docker**         | Container runtime                  |
| **Docker Compose** | Multi-container orchestration      |
| **Supabase**       | (Optional) Cloud PostgreSQL + Auth |

---

## 📁 Project Structure

```
TikTacToe-Arena/
│
├── 📄 README.md                    # This file - project documentation
├── 📄 .gitignore                   # Git ignore rules
├── 📄 PROJECT_PROPOSAL.md          # Original project proposal
├── 📄 PROJECT_REPORT.md            # Technical documentation
│
├── 📁 be/                          # BACKEND (Python/Flask)
│   ├── 📄 .env.example             # Example environment variables
│   ├── 📄 verify_all_services.py   # Script to verify all services
│   │
│   └── 📁 services/                # All microservices
│       │
│       ├── 📁 authServices/        # PORT 5001 - Authentication
│       │   ├── 📄 main.py          # Service entry point
│       │   ├── 📄 routes.py        # API endpoints
│       │   ├── 📄 config.py        # Configuration
│       │   ├── 📄 extensions.py    # Flask extensions (JWT, Bcrypt)
│       │   ├── 📄 requirements.txt # Python dependencies
│       │   ├── 📄 Dockerfile       # Container definition
│       │   ├── 📄 docker-compose.yml
│       │   ├── 📄 .env             # Environment variables (not in git)
│       │   ├── 📄 .env.example     # Example env vars
│       │   ├── 📁 db/              # Database models and connection
│       │   ├── 📁 migrations/      # Alembic migrations
│       │   ├── 📁 test/            # Unit tests
│       │   └── 📁 logs/            # Application logs
│       │
│       ├── 📁 userProfileServices/ # PORT 5006 - User Profiles
│       │   ├── 📄 app.py           # Service entry point
│       │   ├── 📄 routes.py        # API endpoints
│       │   ├── 📄 config.py        # Configuration
│       │   ├── 📄 extensions.py    # Flask extensions
│       │   ├── 📄 requirements.txt
│       │   ├── 📄 Dockerfile
│       │   ├── 📄 docker-compose.yml
│       │   ├── 📁 db/              # Database models
│       │   └── 📁 migrations/      # Schema migrations
│       │
│       ├── 📁 gameServices/        # PORT 5002 - Game Logic
│       │   ├── 📄 main.py          # Service entry point
│       │   ├── 📄 routes.py        # API endpoints
│       │   ├── 📄 config.py        # Configuration
│       │   ├── 📄 requirements.txt
│       │   ├── 📄 Dockerfile
│       │   ├── 📄 docker-compose.yml
│       │   ├── 📁 db/              # Game models
│       │   └── 📁 state/           # Game state files
│       │
│       ├── 📁 matchMakingServices/ # PORT 5003 - Matchmaking
│       │   ├── 📄 main.py          # Service entry point
│       │   ├── 📄 routes.py        # API endpoints
│       │   ├── 📄 matcher.py       # ELO matching algorithm
│       │   ├── 📄 config.py        # Configuration
│       │   ├── 📄 requirements.txt
│       │   ├── 📄 Dockerfile
│       │   ├── 📄 docker-compose.yml
│       │   └── 📁 db/              # Queue models
│       │
│       ├── 📁 leaderBoardServices/ # PORT 5004 - Leaderboards
│       │   ├── 📄 main.py          # Service entry point
│       │   ├── 📄 routes.py        # API endpoints
│       │   ├── 📄 listener.py      # Redis event listener
│       │   ├── 📄 config.py        # Configuration
│       │   ├── 📄 requirements.txt
│       │   ├── 📄 Dockerfile
│       │   └── 📄 docker-compose.yml
│       │
│       └── 📁 websocketGateway/    # PORT 5005 - Real-Time Gateway
│           ├── 📄 main.py          # Service entry point + Socket.IO
│           ├── 📄 events.py        # WebSocket event handlers
│           ├── 📄 auth.py          # Token validation for sockets
│           ├── 📄 config.py        # Configuration
│           ├── 📄 requirements.txt
│           ├── 📄 Dockerfile
│           └── 📄 docker-compose.yml
│
├── 📁 fe/                          # FRONTEND (React/Vite)
│   ├── 📄 index.html               # HTML entry point
│   ├── 📄 package.json             # Node.js dependencies
│   ├── 📄 vite.config.mjs          # Vite configuration
│   ├── 📄 tailwind.config.js       # TailwindCSS configuration
│   ├── 📄 postcss.config.js        # PostCSS configuration
│   ├── 📄 jsconfig.json            # JavaScript path aliases
│   ├── 📄 .env                     # Frontend environment variables
│   ├── 📄 .gitignore               # Frontend git ignore
│   │
│   ├── 📁 public/                  # Static assets
│   │   ├── 📄 manifest.json        # PWA manifest
│   │   └── 📁 assets/images/       # Image assets
│   │
│   └── 📁 src/                     # Source code
│       ├── 📄 index.jsx            # React entry point
│       ├── 📄 App.jsx              # Main App component
│       ├── 📄 Routes.jsx           # Route definitions
│       │
│       ├── 📁 pages/               # Page components
│       │   ├── 📁 user-login/      # Login page
│       │   ├── 📁 user-registration/ # Registration page
│       │   ├── 📁 verify-email/    # Email verification
│       │   ├── 📁 game-dashboard/  # Main dashboard
│       │   ├── 📁 matchmaking-game-lobby/ # Find opponent
│       │   ├── 📁 active-game-board/ # Game play
│       │   ├── 📁 rankings-leaderboard/ # Leaderboards
│       │   ├── 📁 user-profile/    # User profile
│       │   └── 📄 NotFound.jsx     # 404 page
│       │
│       ├── 📁 components/          # Reusable components
│       │   ├── 📁 ui/              # UI primitives
│       │   ├── 📄 ErrorBoundary.jsx
│       │   └── 📄 ScrollToTop.jsx
│       │
│       ├── 📁 contexts/            # React contexts
│       │   └── 📄 AuthContext.jsx  # Authentication state
│       │
│       ├── 📁 utils/               # Utility functions
│       │   ├── 📄 authService.js   # Auth API calls
│       │   ├── 📄 gameService.js   # Game API calls
│       │   ├── 📄 leaderboardService.js # Leaderboard API
│       │   └── 📄 supabase.js      # Supabase client (legacy)
│       │
│       └── 📁 styles/              # Global styles
│           └── 📄 index.css        # Main stylesheet
│
└── 📁 snapshots/                   # Development snapshots (ignored)
```

---

## 📋 Prerequisites

Before running TicTacToe Arena, ensure you have the following installed:

### Required Software

| Software           | Version | Purpose          | Installation                                                  |
| ------------------ | ------- | ---------------- | ------------------------------------------------------------- |
| **Python**         | 3.10+   | Backend services | [python.org](https://www.python.org/downloads/)               |
| **Node.js**        | 18+     | Frontend build   | [nodejs.org](https://nodejs.org/)                             |
| **npm**            | 9+      | Package manager  | Comes with Node.js                                            |
| **Docker**         | 24+     | Containers       | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **Docker Compose** | 2+      | Multi-container  | Comes with Docker Desktop                                     |
| **Git**            | 2.30+   | Version control  | [git-scm.com](https://git-scm.com/)                           |

### Verify Installation

Run these commands to verify your setup:

```powershell
# Check Python
python --version
# Expected: Python 3.10.x or higher

# Check Node.js
node --version
# Expected: v18.x.x or higher

# Check npm
npm --version
# Expected: 9.x.x or higher

# Check Docker
docker --version
# Expected: Docker version 24.x.x or higher

# Check Docker Compose
docker compose version
# Expected: Docker Compose version v2.x.x
```

---

## 🚀 Quick Start Guide

Follow these steps to get the entire project running locally:

### Step 1: Clone the Repository

```powershell
git clone https://github.com/your-org/TikTacToe-Arena.git
cd TikTacToe-Arena
```

### Step 2: Start Infrastructure (Database + Redis)

Each service has its own Docker Compose file. Start the databases:

```powershell
# Start Auth Service database (PostgreSQL)
cd be/services/authServices
docker compose up -d

# Start User Profile database
cd ../userProfileServices
docker compose up -d

# Start Game Service database
cd ../gameServices
docker compose up -d

# Start Matchmaking Redis
cd ../matchMakingServices
docker compose up -d

# Start Leaderboard Redis
cd ../leaderBoardServices
docker compose up -d

# Start WebSocket Gateway Redis
cd ../websocketGateway
docker compose up -d
```

**Alternative: Start all at once (if you have a root docker-compose.yml)**

### Step 3: Configure Environment Variables

Each service needs its own `.env` file. Copy the examples:

```powershell
# Auth Service
cd be/services/authServices
copy .env.example .env
# Edit .env with your database credentials

# User Profile Service
cd ../userProfileServices
copy .env.example .env

# (Repeat for other services as needed)
```

### Step 4: Create Python Virtual Environments

Each service should have its own virtual environment:

```powershell
# Auth Service
cd be/services/authServices
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# User Profile Service
cd ../userProfileServices
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Game Service
cd ../gameServices
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Matchmaking Service
cd ../matchMakingServices
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Leaderboard Service
cd ../leaderBoardServices
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# WebSocket Gateway
cd ../websocketGateway
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Step 5: Run Database Migrations

```powershell
# Auth Service migrations
cd be/services/authServices
.\venv\Scripts\Activate.ps1
flask db upgrade

# User Profile Service migrations
cd ../userProfileServices
.\venv\Scripts\Activate.ps1
flask db upgrade
```

### Step 6: Start All Backend Services

Open **6 separate terminal windows** and run each service:

**Terminal 1 - Auth Service (Port 5001)**

```powershell
cd e:\Projects\TikTacToe-Arena\be\services\authServices
.\venv\Scripts\Activate.ps1
python main.py
```

**Terminal 2 - User Profile Service (Port 5006)**

```powershell
cd e:\Projects\TikTacToe-Arena\be\services\userProfileServices
.\venv\Scripts\Activate.ps1
python app.py
```

**Terminal 3 - Game Service (Port 5002)**

```powershell
cd e:\Projects\TikTacToe-Arena\be\services\gameServices
.\venv\Scripts\Activate.ps1
python main.py
```

**Terminal 4 - Matchmaking Service (Port 5003)**

```powershell
cd e:\Projects\TikTacToe-Arena\be\services\matchMakingServices
.\venv\Scripts\Activate.ps1
python main.py
```

**Terminal 5 - Leaderboard Service (Port 5004)**

```powershell
cd e:\Projects\TikTacToe-Arena\be\services\leaderBoardServices
.\venv\Scripts\Activate.ps1
python main.py
```

**Terminal 6 - WebSocket Gateway (Port 5005)**

```powershell
cd e:\Projects\TikTacToe-Arena\be\services\websocketGateway
.\venv\Scripts\Activate.ps1
python main.py
```

### Step 7: Start the Frontend

**Terminal 7 - React Frontend (Port 4028)**

```powershell
cd e:\Projects\TikTacToe-Arena\fe
npm install
npm start
```

### Step 8: Access the Application

Open your browser and navigate to:

| URL                              | Description               |
| -------------------------------- | ------------------------- |
| **http://localhost:4028**        | Frontend application      |
| **http://localhost:5001/health** | Auth Service health check |
| **http://localhost:5002/health** | Game Service health check |
| **http://localhost:5003/health** | Matchmaking health check  |
| **http://localhost:5004/health** | Leaderboard health check  |
| **http://localhost:5005**        | WebSocket Gateway         |

---

## 🔧 Running Each Service

### Service Port Reference

| Service           | Port | Entry File | Run Command      |
| ----------------- | ---- | ---------- | ---------------- |
| Auth Service      | 5001 | `main.py`  | `python main.py` |
| User Profile      | 5006 | `app.py`   | `python app.py`  |
| Game Service      | 5002 | `main.py`  | `python main.py` |
| Matchmaking       | 5003 | `main.py`  | `python main.py` |
| Leaderboard       | 5004 | `main.py`  | `python main.py` |
| WebSocket Gateway | 5005 | `main.py`  | `python main.py` |
| Frontend          | 4028 | -          | `npm start`      |

### Running with Docker (Production Mode)

Each service can run in Docker:

```powershell
# Build and run Auth Service
cd be/services/authServices
docker compose up --build -d

# Check logs
docker compose logs -f
```

### Running with Gunicorn (Production)

```powershell
# From service directory
gunicorn -w 4 -b 0.0.0.0:5001 main:app

# For WebSocket Gateway (needs gevent)
gunicorn -k geventwebsocket.gunicorn.workers.GeventWebSocketWorker -w 1 -b 0.0.0.0:5005 main:app
```

---

## 📡 Service Details

### 1. Auth Service (Port 5001)

**Purpose**: Handles all authentication-related operations.

**Key Files**:

- `main.py` - Flask app initialization
- `routes.py` - API endpoints
- `extensions.py` - JWT, Bcrypt, CORS setup

**Endpoints**:

| Method | Endpoint                       | Description               | Auth Required       |
| ------ | ------------------------------ | ------------------------- | ------------------- |
| POST   | `/auth/register`               | Create new user account   | No                  |
| POST   | `/auth/login`                  | Login and receive JWT     | No                  |
| POST   | `/auth/refresh`                | Refresh access token      | Yes (Refresh Token) |
| POST   | `/auth/logout`                 | Invalidate tokens         | Yes                 |
| GET    | `/auth/profile`                | Get current user profile  | Yes                 |
| PUT    | `/auth/profile`                | Update user profile       | Yes                 |
| POST   | `/auth/password-reset`         | Request password reset    | No                  |
| POST   | `/auth/password-reset/confirm` | Confirm password reset    | No                  |
| POST   | `/auth/verify-email`           | Verify email address      | No                  |
| POST   | `/auth/resend-verification`    | Resend verification email | Yes                 |

**Database Tables**: `user_profiles` (shared with User Profile Service)

---

### 2. User Profile Service (Port 5006)

**Purpose**: Manages user profiles and game statistics.

**Key Files**:

- `app.py` - Flask app initialization
- `routes.py` - API endpoints
- `db/models.py` - Database models

**Endpoints**:

| Method | Endpoint                    | Description              | Auth Required |
| ------ | --------------------------- | ------------------------ | ------------- |
| GET    | `/profile/<user_id>`        | Get user profile by ID   | Yes           |
| PUT    | `/profile/<user_id>`        | Update user profile      | Yes           |
| GET    | `/profile/<user_id>/stats`  | Get user game statistics | Yes           |
| PUT    | `/profile/<user_id>/avatar` | Update avatar            | Yes           |

---

### 3. Game Service (Port 5002)

**Purpose**: Handles all game logic, move validation, and game state.

**Key Files**:

- `main.py` - Flask app initialization
- `routes.py` - API endpoints

**Endpoints**:

| Method | Endpoint            | Description            | Auth Required |
| ------ | ------------------- | ---------------------- | ------------- |
| POST   | `/games`            | Create a new game      | Yes           |
| GET    | `/games`            | List user's games      | Yes           |
| GET    | `/games/<id>`       | Get game by ID         | Yes           |
| POST   | `/games/<id>/join`  | Join an existing game  | Yes           |
| POST   | `/games/<id>/move`  | Make a move            | Yes           |
| GET    | `/games/<id>/state` | Get current game state | Yes           |
| DELETE | `/games/<id>`       | Abandon game           | Yes           |

**Game State Format**:

```json
{
  "board": ["X", null, "O", null, "X", null, null, null, null],
  "current_player": "player1_id",
  "status": "active",
  "winner": null,
  "moves_count": 3
}
```

**Board Positions**:

```
 0 | 1 | 2
-----------
 3 | 4 | 5
-----------
 6 | 7 | 8
```

---

### 4. Matchmaking Service (Port 5003)

**Purpose**: Manages matchmaking queue and pairs players based on ELO.

**Key Files**:

- `main.py` - Flask app initialization
- `routes.py` - API endpoints
- `matcher.py` - ELO matching algorithm

**Endpoints**:

| Method | Endpoint              | Description            | Auth Required |
| ------ | --------------------- | ---------------------- | ------------- |
| POST   | `/matchmaking/queue`  | Join matchmaking queue | Yes           |
| DELETE | `/matchmaking/queue`  | Leave queue            | Yes           |
| GET    | `/matchmaking/status` | Get queue status       | Yes           |

**ELO Matching Algorithm**:

1. Player joins queue with their current ELO
2. Every few seconds, matcher scans queue for compatible pairs
3. Players within ±100 ELO are considered compatible
4. If no match found, ELO range expands over time
5. When match found, game is created and both players notified via WebSocket

---

### 5. Leaderboard Service (Port 5004)

**Purpose**: Provides global rankings and player statistics.

**Key Files**:

- `main.py` - Flask app initialization
- `routes.py` - API endpoints
- `listener.py` - Redis event listener for real-time updates

**Endpoints**:

| Method | Endpoint                   | Description                     | Auth Required |
| ------ | -------------------------- | ------------------------------- | ------------- |
| GET    | `/leaderboard`             | Get global rankings (paginated) | No            |
| GET    | `/leaderboard/top/<n>`     | Get top N players               | No            |
| GET    | `/leaderboard/search?q=`   | Search players by username      | No            |
| GET    | `/leaderboard/player/<id>` | Get player rank and stats       | No            |

**Caching**: Uses Redis with 5-minute TTL for frequently-accessed leaderboard data.

---

### 6. WebSocket Gateway (Port 5005)

**Purpose**: Real-time communication hub for live game updates.

**Key Files**:

- `main.py` - Flask-SocketIO app
- `events.py` - WebSocket event handlers
- `auth.py` - Socket authentication

**WebSocket Events (Client → Server)**:

| Event          | Payload                 | Description         |
| -------------- | ----------------------- | ------------------- |
| `connect`      | -                       | Initial connection  |
| `authenticate` | `{ token: "jwt" }`      | Authenticate socket |
| `join_game`    | `{ game_id: "uuid" }`   | Join game room      |
| `leave_game`   | `{ game_id: "uuid" }`   | Leave game room     |
| `make_move`    | `{ game_id, position }` | Make a move         |
| `chat_message` | `{ game_id, message }`  | Send chat message   |

**WebSocket Events (Server → Client)**:

| Event             | Payload                          | Description                |
| ----------------- | -------------------------------- | -------------------------- |
| `authenticated`   | `{ success: true }`              | Auth confirmed             |
| `game_update`     | `{ board, current_player, ... }` | Game state changed         |
| `opponent_joined` | `{ opponent: {...} }`            | Opponent joined game       |
| `opponent_left`   | -                                | Opponent disconnected      |
| `chat_message`    | `{ sender, message }`            | Received chat              |
| `match_found`     | `{ game_id, opponent }`          | Matchmaking found opponent |
| `error`           | `{ message }`                    | Error occurred             |

---

## 💻 Frontend Application

### Route Structure

| Route                     | Component              | Description                      |
| ------------------------- | ---------------------- | -------------------------------- |
| `/`                       | `GameDashboard`        | Home page with stats and actions |
| `/user-login`             | `UserLogin`            | Login form                       |
| `/user-registration`      | `UserRegistration`     | Registration form                |
| `/verify-email`           | `VerifyEmail`          | Email verification page          |
| `/game-dashboard`         | `GameDashboard`        | Main dashboard                   |
| `/matchmaking-game-lobby` | `MatchmakingGameLobby` | Find opponent                    |
| `/active-game-board`      | `ActiveGameBoard`      | Play game                        |
| `/rankings-leaderboard`   | `RankingsLeaderboard`  | View rankings                    |
| `/user-profile`           | `UserProfile`          | View/edit profile                |

### State Management

**AuthContext** (`src/contexts/AuthContext.jsx`):

- Manages user authentication state
- Stores JWT tokens in localStorage
- Provides login/logout functions
- Auto-refreshes tokens before expiry

**Service Files** (`src/utils/`):

- `authService.js` - Auth API calls
- `gameService.js` - Game API calls
- `leaderboardService.js` - Leaderboard API calls

### Frontend Environment Variables

Create `fe/.env`:

```env
# API URLs
VITE_AUTH_API_URL=http://localhost:5001
VITE_GAME_API_URL=http://localhost:5002
VITE_MATCHMAKING_API_URL=http://localhost:5003
VITE_LEADERBOARD_API_URL=http://localhost:5004
VITE_WS_URL=http://localhost:5005

# Supabase (if using for additional features)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🗄 Database Schema

### user_profiles Table

```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    avatar_url TEXT,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'player',  -- 'admin', 'player', 'moderator'

    -- ELO and Statistics
    elo_rating INTEGER DEFAULT 1200,
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    games_lost INTEGER DEFAULT 0,
    games_drawn INTEGER DEFAULT 0,
    win_streak INTEGER DEFAULT 0,
    best_win_streak INTEGER DEFAULT 0,

    -- Account Status
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### games Table

```sql
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player1_id UUID REFERENCES user_profiles(id),
    player2_id UUID REFERENCES user_profiles(id),
    current_player_id UUID REFERENCES user_profiles(id),
    winner_id UUID REFERENCES user_profiles(id),

    -- Game State
    game_state JSONB DEFAULT '[]',  -- Array of 9: null, "X", or "O"
    status VARCHAR(20) DEFAULT 'waiting',  -- 'waiting', 'active', 'completed', 'abandoned'
    moves_count INTEGER DEFAULT 0,

    -- Timestamps
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### game_results Table

```sql
CREATE TABLE game_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id),
    player_id UUID REFERENCES user_profiles(id),

    result VARCHAR(10) NOT NULL,  -- 'win', 'loss', 'draw'
    elo_before INTEGER NOT NULL,
    elo_after INTEGER NOT NULL,
    elo_change INTEGER NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### matchmaking_queue Table

```sql
CREATE TABLE matchmaking_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES user_profiles(id),
    elo_rating INTEGER NOT NULL,
    preferences JSONB DEFAULT '{}',  -- { "min_elo": 1000, "max_elo": 1400 }
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📚 API Reference

### Authentication Flow

#### 1. Register New User

```http
POST http://localhost:5001/auth/register
Content-Type: application/json

{
  "email": "player@example.com",
  "password": "SecurePass123!",
  "username": "player1",
  "full_name": "John Doe"
}
```

**Response (201)**:

```json
{
  "message": "Registration successful. Please verify your email.",
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### 2. Login

```http
POST http://localhost:5001/auth/login
Content-Type: application/json

{
  "email": "player@example.com",
  "password": "SecurePass123!"
}
```

**Response (200)**:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "player@example.com",
    "username": "player1",
    "elo_rating": 1200
  }
}
```

#### 3. Use Access Token

Include the token in the `Authorization` header for protected endpoints:

```http
GET http://localhost:5001/auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Game Flow

#### 1. Join Matchmaking Queue

```http
POST http://localhost:5003/matchmaking/queue
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "preferences": {
    "elo_range": 200
  }
}
```

#### 2. Receive Match via WebSocket

```javascript
// Client-side Socket.IO
socket.on("match_found", (data) => {
  console.log("Match found!", data.game_id, data.opponent);
  // Navigate to game board
});
```

#### 3. Make a Move

```http
POST http://localhost:5002/games/550e8400.../move
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "position": 4  // Center cell (0-8)
}
```

**Response (200)**:

```json
{
  "success": true,
  "board": [null, null, null, null, "X", null, null, null, null],
  "current_player": "opponent_id",
  "status": "active",
  "winner": null
}
```

---

## 🔐 Environment Variables

### Auth Service (.env)

```env
# Flask
FLASK_APP=main.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-here-change-in-production

# JWT
JWT_SECRET_KEY=your-jwt-secret-key-change-in-production
JWT_ACCESS_TOKEN_EXPIRES=900  # 15 minutes
JWT_REFRESH_TOKEN_EXPIRES=604800  # 7 days

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/tictactoe_auth
# OR individual params:
DB_USER=admin
DB_PASSWORD=admin
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tictactoe_auth

# Supabase (optional, for email delivery)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key

# CORS
CORS_ORIGINS=http://localhost:4028,http://localhost:3000

# Logging
LOG_LEVEL=DEBUG
```

### Frontend (.env)

```env
# API Endpoints
VITE_AUTH_API_URL=http://localhost:5001
VITE_PROFILE_API_URL=http://localhost:5006
VITE_GAME_API_URL=http://localhost:5002
VITE_MATCHMAKING_API_URL=http://localhost:5003
VITE_LEADERBOARD_API_URL=http://localhost:5004
VITE_WS_URL=http://localhost:5005
```

---

## 🔨 Common Development Tasks

### Run Database Migrations

```powershell
cd be/services/authServices
.\venv\Scripts\Activate.ps1

# Create a new migration
flask db migrate -m "Add email_verified column"

# Apply migrations
flask db upgrade

# Rollback last migration
flask db downgrade
```

### Run Tests

```powershell
# Backend tests
cd be/services/authServices
.\venv\Scripts\Activate.ps1
pytest

# With coverage
pytest --cov=. --cov-report=html

# Frontend tests
cd fe
npm test
```

### Verify All Services Running

```powershell
cd be
python verify_all_services.py
```

### Check Service Health

```powershell
# Quick health check all services
curl http://localhost:5001/health
curl http://localhost:5002/health
curl http://localhost:5003/health
curl http://localhost:5004/health
curl http://localhost:5005/health
```

### View Docker Logs

```powershell
cd be/services/authServices
docker compose logs -f
```

### Rebuild Docker Container

```powershell
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Port already in use"

```powershell
# Find process using port (e.g., 5001)
netstat -ano | findstr :5001

# Kill process by PID
taskkill /PID <pid> /F
```

#### 2. "CORS error in browser"

Check that the service has CORS configured for your frontend URL:

```python
# In config.py or main.py
CORS(app, origins=["http://localhost:4028"])
```

#### 3. "Database connection failed"

- Verify Docker container is running: `docker ps`
- Check connection string in `.env`
- Ensure database exists: `docker compose exec db psql -U admin -c '\l'`

#### 4. "JWT token expired"

The frontend should auto-refresh tokens. If issues persist:

- Clear localStorage in browser
- Login again
- Check `JWT_ACCESS_TOKEN_EXPIRES` in backend `.env`

#### 5. "WebSocket connection failed"

- Verify WebSocket Gateway is running on port 5005
- Check browser console for CORS errors
- Verify `VITE_WS_URL` in frontend `.env`

#### 6. "Module not found" in Python

```powershell
# Ensure venv is activated
.\venv\Scripts\Activate.ps1

# Reinstall dependencies
pip install -r requirements.txt
```

#### 7. "npm install" fails

```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

---

## 🔮 Future Features Roadmap

### Phase 2: Enhanced Authentication (Q1 2025)

- [ ] Google OAuth login
- [ ] Facebook OAuth login
- [ ] Two-factor authentication (2FA)
- [ ] Email delivery for verification and password reset

### Phase 3: AI Bot System (Q1 2025)

- [ ] 8 difficulty levels (Easy → Impossible)
- [ ] Bot matchmaking option
- [ ] AI play analysis/suggestions
- [ ] Practice mode against bots

### Phase 4: Spectator & Replay (Q2 2025)

- [ ] Watch live games
- [ ] Recorded game replays
- [ ] Commentary/annotation system
- [ ] Share replay links

### Phase 5: Tournaments (Q2 2025)

- [ ] Tournament brackets
- [ ] Seasonal ladders
- [ ] Group stage competitions
- [ ] Tournament rewards/badges

### Phase 6: Social Features (Q3 2025)

- [ ] Friends list
- [ ] Direct game challenges
- [ ] Player messaging
- [ ] Block/report functionality

### Phase 7: Mobile & PWA (Q3 2025)

- [ ] Progressive Web App
- [ ] Push notifications
- [ ] Offline mode
- [ ] Mobile-optimized UI

### Phase 8: Advanced Features (Q4 2025)

- [ ] Anti-cheat detection
- [ ] Anomaly detection
- [ ] Multi-region deployment
- [ ] Rate limiting dashboard

---

## 🤝 Contributing

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `pytest` (backend) / `npm test` (frontend)
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Coding Standards

**Python**:

- Follow PEP 8 style guide
- Use type hints
- Write docstrings for functions
- Max line length: 100 characters

**JavaScript**:

- Use ESLint configuration
- Prefer functional components
- Use React hooks
- Write PropTypes or TypeScript types

### Commit Message Format

```
<type>(<scope>): <short summary>

<body - optional>

<footer - optional>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:

```
feat(auth): add email verification endpoint

- Added POST /auth/verify-email endpoint
- Sends verification email via Supabase
- Includes resend functionality
```

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 📞 Support

- **Issues**: Open an issue on GitHub
- **Documentation**: Check `/be/docs/` for additional guides
- **Team Lead**: Contact the engineering lead

---

**Made with ❤️ by the EoCi Solution Team**

_Last Updated: December 2024_
