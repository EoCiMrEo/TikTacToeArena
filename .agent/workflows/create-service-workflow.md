---
description: This is a workflow for creating a new service in our applications
---

## TikTacToe Arena - Create New Microservice Workflow

### Table of Contents

1. [Pre-Setup Checklist](https://www.google.com/search?q=%231-pre-setup-checklist)
2. [Service Planning Phase](https://www.google.com/search?q=%232-service-planning-phase)
3. [Step-by-Step Implementation Guide](https://www.google.com/search?q=%233-step-by-step-implementation-guide)
4. [Code Templates](https://www.google.com/search?q=%234-code-templates)
5. [Common Patterns Reference](https://www.google.com/search?q=%235-common-patterns-reference)
6. [Troubleshooting Guide](https://www.google.com/search?q=%236-troubleshooting-guide)
7. [Best Practices Checklist](https://www.google.com/search?q=%237-best-practices-checklist)
8. [Example Walkthrough: Notification Service](https://www.google.com/search?q=%238-example-walkthrough-notification-service)

---

### 1. Pre-Setup Checklist

Before starting, ensure your environment meets the Arena standards:

- [ ] **Python 3.10+** installed.
- [ ] **Docker & Docker Compose V2** installed and running.
- [ ] **Postman/Insomnia** for API testing.
- [ ] Access to the main repository to update the root `docker-compose.yml`.

---

### 2. Service Planning Phase

**Service Purpose Template**

- **Name**: `[Service Name]Service` (e.g., `AchievementService`)
- **Primary Responsibility**: What single problem does this solve?
- **Dependencies**: Does it need Auth? (Yes/No), Does it need Redis? (Yes/No).

---

### 3. Step-by-Step Implementation Guide

#### Phase 1: Project Structure Setup

Run the following commands in the project root:

**Bash:**

```bash
mkdir -p notificationService/{db,migrations,test,logs}
touch notificationService/{main.py,config.py,extensions.py,routes.py,requirements.txt,Dockerfile,.env.example}

```

**PowerShell:**

```powershell
New-Item -ItemType Directory -Path "notificationService/db", "notificationService/migrations", "notificationService/test", "notificationService/logs"
New-Item -ItemType File -Path "notificationService/main.py", "notificationService/config.py", "notificationService/extensions.py", "notificationService/routes.py", "notificationService/requirements.txt", "notificationService/Dockerfile", "notificationService/.env.example"

```

---

### 4. Code Templates

#### Template 1: `main.py`

```python
from flask import Flask, jsonify
from flask_cors import CORS
from extensions import jwt, db, migrate
from routes import notification_bp
import logging

def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')

    # Initialize Extensions
    CORS(app)
    jwt.init_app(app)
    db.init_app(app)
    migrate.init_app(app, db)

    # Register Blueprints
    app.register_blueprint(notification_bp, url_prefix='/api/notifications')

    # Global Error Handler
    @app.errorhandler(Exception)
    def handle_exception(e):
        logging.error(f"Unhandled Exception: {str(e)}")
        return jsonify({"error": "Internal Server Error", "code": "SERVER_ERROR"}), 500

    @app.route('/health')
    def health_check():
        return jsonify({"status": "healthy", "service": "notification-service"}), 200

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5007)

```

#### Template 5: `Dockerfile`

```dockerfile
# Stage 1: Build
FROM python:3.10-slim as builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Stage 2: Runtime
FROM python:3.10-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY . .

ENV PATH=/root/.local/bin:$PATH
ENV FLASK_APP=main.py

# Security: Run as non-root user
RUN useradd -m arena_user
USER arena_user

EXPOSE 5007
CMD ["gunicorn", "--bind", "0.0.0.0:5007", "main:create_app()"]

```

---

### 5. Common Patterns Reference

**Standard Success Response**

```json
{
  "success": true,
  "data": { "id": 1, "status": "sent" },
  "message": "Notification processed successfully"
}
```

**Standard Error Response**

```json
{
  "error": "Unauthorized access",
  "code": "AUTH_REQUIRED",
  "details": { "missing_token": true }
}
```

---

### 8. Example Walkthrough: Notification Service

To create the **Notification Service**:

1. **Define Models**: In `db/models.py`, create a `NotificationLog` table.
2. **Auth Check**: Use `@jwt_required()` in `routes.py` to ensure only logged-in users can view history.
3. **Cross-Service**: When a game ends in `GameService`, it sends a POST request to `NotificationService:5007/api/notifications/send`.
