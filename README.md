# Mailtrack Clone

A self-hosted, production-ready **Email Tracking and Analytics Platform** built as a monorepo. It captures two high-signal engagement events with low latency:

1. **Email Opens** — via a hidden 1×1 tracking pixel embedded in HTML email bodies
2. **Link Clicks** — via masked redirect URLs that log the click before forwarding to the destination

The stack is a **FastAPI** backend (REST + public tracking endpoints) and a **Next.js** frontend (campaign generator + live analytics dashboard). SQLite is used for local development; PostgreSQL is supported for production.

---

## Table of Contents

- [Features](#features)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Repository Structure](#repository-structure)
- [Tech Stack](#tech-stack)
- [Data Model](#data-model)
- [API Reference](#api-reference)
- [Frontend Application](#frontend-application)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Production Deployment](#production-deployment)
- [Embedding Tracking in Real Emails](#embedding-tracking-in-real-emails)
- [Analytics Calculations](#analytics-calculations)
- [Error Handling](#error-handling)
- [Limitations and Considerations](#limitations-and-considerations)
- [Troubleshooting](#troubleshooting)

---

## Features

| Area | Capability |
|------|------------|
| **Open tracking** | Transparent 1×1 GIF pixel; records IP, User-Agent, and timestamp on every load |
| **Click tracking** | Short-code redirect URLs; 302 to original destination after logging |
| **Campaign creation** | Web UI to register emails and generate copy-paste tracking snippets |
| **Analytics dashboard** | Total sent, open rate, click-through rate, and live activity feed |
| **Client intelligence** | User-Agent parsing (browser + OS) in the activity feed |
| **Theming** | Light/dark mode with system preference support |
| **Database flexibility** | SQLite for dev, PostgreSQL-compatible schema for prod |
| **Container-ready** | Individual Dockerfiles + optional `docker-compose.yml` |

---

## How It Works

### Email Open Tracking

When a recipient opens an HTML email, their mail client requests the tracking pixel image. The backend:

1. Validates the email UUID
2. Captures `User-Agent` and client IP (including `X-Forwarded-For` when behind a proxy)
3. Inserts a `TrackingEvent` with `event_type = "open"`
4. Upgrades the parent `Email.status` from `"sent"` → `"opened"` (never downgrades from `"clicked"`)
5. Returns a valid transparent GIF immediately with `Cache-Control: no-store`

### Link Click Tracking

Tracked links use the format `{BASE_URL}/track/click/{short_code}`. When clicked:

1. The backend looks up the short code in the `links` table
2. Captures IP and User-Agent
3. Inserts a `TrackingEvent` with `event_type = "click"`
4. Sets the parent `Email.status` to `"clicked"`
5. Returns an HTTP **302 Found** redirect to the original URL

```mermaid
sequenceDiagram
  participant Sender as CampaignCreator
  participant UI as Next.jsFrontend
  participant API as FastAPIBackend
  participant DB as Database
  participant Mail as RecipientMailClient
  participant Browser as RecipientBrowser

  Sender->>UI: Fill campaign form
  UI->>API: POST /api/emails
  API->>DB: INSERT Email, Link rows
  API-->>UI: tracking_pixel + tracked_links
  Sender->>Mail: Send HTML email with pixel + masked links
  Mail->>API: GET /track/pixel/{uuid}
  API->>DB: INSERT open event
  API-->>Mail: 200 transparent GIF
  Browser->>API: GET /track/click/{short_code}
  API->>DB: INSERT click event
  API-->>Browser: 302 redirect to original URL
  UI->>API: GET /api/analytics (poll every 5s)
  API->>DB: Aggregate metrics + event feed
  API-->>UI: Dashboard data
```

---

## Architecture

```mermaid
flowchart TB
  subgraph frontend [Next.js Frontend :3000]
    Home["/ Campaign Generator"]
    Dash["/dashboard Analytics"]
    Lib["src/lib/api.ts"]
  end

  subgraph backend [FastAPI Backend :8000]
    Emails["POST /api/emails"]
    Analytics["GET /api/analytics"]
    Pixel["GET /track/pixel/{email_id}"]
    Click["GET /track/click/{short_code}"]
    Health["GET /health"]
  end

  subgraph persistence [Database]
    EmailTable[(emails)]
    LinkTable[(links)]
    EventTable[(tracking_events)]
  end

  Home --> Lib --> Emails
  Dash --> Lib --> Analytics
  Emails --> EmailTable
  Emails --> LinkTable
  Pixel --> EventTable
  Pixel --> EmailTable
  Click --> EventTable
  Click --> LinkTable
  Click --> EmailTable
  Analytics --> EmailTable
  Analytics --> EventTable
```

**Request routing:**

| Route prefix | Auth | Purpose |
|--------------|------|---------|
| `/api/*` | None (internal UI) | Campaign creation and analytics |
| `/track/*` | None (public) | Called by mail clients and browsers |
| `/health` | None | Health check for load balancers |

CORS is restricted to a single origin configured via `FRONTEND_URL`. Tracking endpoints (`/track/*`) are intentionally public so email clients can load pixels and browsers can follow redirects without authentication.

---

## Repository Structure

```
mailtrack-clone/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py          # pydantic-settings: DATABASE_URL, FRONTEND_URL, BASE_URL
│   │   │   └── database.py        # SQLAlchemy engine, SessionLocal, get_db, init_db
│   │   ├── models/
│   │   │   ├── email.py           # Email ORM model
│   │   │   ├── link.py            # Link ORM model (short-code PK)
│   │   │   └── tracking_event.py  # TrackingEvent ORM model
│   │   ├── schemas/
│   │   │   ├── email.py           # EmailCreate, EmailCreateResponse (Pydantic v2)
│   │   │   └── analytics.py       # AnalyticsResponse, EventFeedItem
│   │   ├── routers/
│   │   │   ├── emails.py          # POST /api/emails
│   │   │   ├── track.py           # GET /track/pixel, GET /track/click
│   │   │   └── analytics.py       # GET /api/analytics
│   │   └── main.py                # FastAPI app, CORS, lifespan, router registration
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx         # Root layout, nav, theme provider, toasts
│   │   │   ├── page.tsx           # Campaign generator (/)
│   │   │   ├── dashboard/page.tsx # Analytics dashboard (/dashboard)
│   │   │   └── globals.css        # Tailwind v4 + shadcn CSS variables
│   │   ├── components/
│   │   │   ├── ui/                # shadcn/ui primitives (Button, Card, Table, …)
│   │   │   ├── campaign-form.tsx
│   │   │   ├── snippet-display.tsx
│   │   │   ├── metric-cards.tsx
│   │   │   ├── activity-feed.tsx
│   │   │   ├── theme-provider.tsx
│   │   │   └── theme-toggle.tsx
│   │   └── lib/
│   │       ├── api.ts             # Shared fetch wrapper + ApiError
│   │       ├── emails.ts          # createEmail()
│   │       ├── analytics.ts       # fetchAnalytics()
│   │       └── utils.ts           # cn() helper
│   ├── package.json
│   ├── next.config.ts             # output: "standalone" for Docker
│   ├── components.json            # shadcn/ui configuration
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Tech Stack

### Backend

| Package | Role |
|---------|------|
| **FastAPI** | HTTP API framework |
| **Uvicorn** | ASGI server |
| **SQLAlchemy 2** | ORM and query builder |
| **Pydantic v2** | Request/response validation |
| **pydantic-settings** | Environment-based configuration |
| **psycopg2-binary** | PostgreSQL driver (production) |

### Frontend

| Package | Role |
|---------|------|
| **Next.js 16** | App Router, SSR/SSG, standalone output |
| **React 19** | UI runtime |
| **Tailwind CSS v4** | Utility-first styling |
| **shadcn/ui** | Accessible component primitives |
| **next-themes** | Light/dark/system theme switching |
| **date-fns** | Relative timestamps ("2 mins ago") |
| **ua-parser-js** | Browser/OS detection from User-Agent |
| **sonner** | Toast notifications (copy feedback) |
| **lucide-react** | Icons |

---

## Data Model

Three related tables power all tracking logic.

### Entity Relationship

```mermaid
erDiagram
  Email ||--o{ Link : has
  Email ||--o{ TrackingEvent : has

  Email {
    uuid id PK
    string subject
    string recipient
    string status
    datetime created_at
  }

  Link {
    string id PK
    uuid email_id FK
    string original_url
  }

  TrackingEvent {
    int id PK
    uuid email_id FK
    string event_type
    string ip_address
    string user_agent
    datetime timestamp
  }
```

### `emails`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | Auto-generated `uuid4` |
| `subject` | String(500), nullable | Campaign subject line |
| `recipient` | String(320), indexed | Validated email address |
| `status` | String(20) | Lifecycle: `sent` → `opened` → `clicked` |
| `created_at` | DateTime (TZ) | Server default: current timestamp |

**Status rules:**

- New emails start as `"sent"`
- First pixel load upgrades to `"opened"` (only if currently `"sent"`)
- Any click sets status to `"clicked"` (even if never opened)
- Status never downgrades (e.g., `"clicked"` is not reset to `"opened"`)

### `links`

| Column | Type | Notes |
|--------|------|-------|
| `id` | String(12) (PK) | Short code from `secrets.token_urlsafe(8)[:12]` |
| `email_id` | UUID (FK) | References `emails.id`, cascade delete |
| `original_url` | String(2048) | Destination URL for redirect |

### `tracking_events`

| Column | Type | Notes |
|--------|------|-------|
| `id` | Integer (PK) | Auto-increment |
| `email_id` | UUID (FK) | References `emails.id`, cascade delete |
| `event_type` | String(10) | `"open"` or `"click"` |
| `ip_address` | String(45), nullable | IPv4/IPv6; first hop of `X-Forwarded-For` if present |
| `user_agent` | String(512), nullable | Raw `User-Agent` header |
| `timestamp` | DateTime (TZ) | Server default: current timestamp |

**Note:** Multiple events of the same type can exist per email (e.g., re-opens, re-clicks). Analytics rates use **distinct email counts**, not raw event counts.

---

## API Reference

Base URL (development): `http://localhost:8000`

Interactive docs are available at:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

### `GET /health`

Health check for load balancers and orchestrators.

**Response `200 OK`:**

```json
{ "status": "ok" }
```

---

### `POST /api/emails`

Register a new tracked email campaign and receive embeddable tracking assets.

**Request body:**

```json
{
  "recipient": "user@example.com",
  "subject": "Product Launch Announcement",
  "links": ["https://example.com/landing-page"]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `recipient` | string (email) | Yes | Target recipient address |
| `subject` | string | No | Campaign subject line |
| `links` | string[] (URLs) | No | Destination URLs to wrap with click tracking |

**Response `200 OK`:**

```json
{
  "email_id": "b3d35b4d-d22f-4c0e-881f-87f9b77179c4",
  "tracking_pixel": "<img src=\"http://localhost:8000/track/pixel/b3d35b4d-d22f-4c0e-881f-87f9b77179c4\" width=\"1\" height=\"1\" style=\"display:none;\" alt=\"\" />",
  "tracked_links": {
    "https://example.com/landing-page": "http://localhost:8000/track/click/BujrX4Jhs-0"
  }
}
```

| Field | Description |
|-------|-------------|
| `email_id` | UUID for this campaign record |
| `tracking_pixel` | Complete HTML `<img>` tag to paste into email body |
| `tracked_links` | Map of original URL → masked tracking URL |

**Errors:**

| Status | Cause |
|--------|-------|
| `422` | Invalid email format or malformed URL in `links` |
| `500` | Database failure (transaction rolled back) |

**Example:**

```bash
curl -X POST http://localhost:8000/api/emails \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "user@example.com",
    "subject": "Product Launch",
    "links": ["https://example.com/landing"]
  }'
```

---

### `GET /track/pixel/{email_id}`

Public tracking endpoint called by mail clients when loading the embedded pixel.

**Path parameter:** `email_id` — UUID of the email record

**Behavior:**

1. Records an `"open"` event with client metadata
2. Upgrades email status `"sent"` → `"opened"` if applicable
3. Returns a 1×1 transparent GIF

**Response `200 OK`:**

- **Content-Type:** `image/gif`
- **Cache-Control:** `no-store`
- **Body:** Raw GIF bytes (43-byte transparent GIF89a)

**Errors:**

| Status | Cause |
|--------|-------|
| `404` | Email UUID not found |
| `422` | Malformed UUID |
| `500` | Database failure |

**Example:**

```bash
curl -v "http://localhost:8000/track/pixel/b3d35b4d-d22f-4c0e-881f-87f9b77179c4" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome/120.0"
```

---

### `GET /track/click/{short_code}`

Public redirect endpoint for masked click-tracking links.

**Path parameter:** `short_code` — 12-character link ID from the `links` table

**Behavior:**

1. Records a `"click"` event with client metadata
2. Sets parent email status to `"clicked"`
3. Redirects browser to `original_url`

**Response `302 Found`:**

- **Location:** Original destination URL

**Errors:**

| Status | Cause |
|--------|-------|
| `404` | Short code not found |
| `500` | Database failure |

**Example:**

```bash
curl -v "http://localhost:8000/track/click/BujrX4Jhs-0" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0) Chrome/121.0"
# Expect: HTTP/1.1 302 Found
#         Location: https://example.com/landing-page
```

---

### `GET /api/analytics`

Returns aggregated campaign metrics and a chronological activity feed.

**Response `200 OK`:**

```json
{
  "total_emails": 42,
  "open_rate": 71.4,
  "click_rate": 23.8,
  "events": [
    {
      "recipient": "user@example.com",
      "event_type": "click",
      "timestamp": "2026-06-15T10:48:31",
      "ip_address": "127.0.0.1",
      "user_agent": "Mozilla/5.0 (Windows NT 10.0) Chrome/121.0"
    },
    {
      "recipient": "user@example.com",
      "event_type": "open",
      "timestamp": "2026-06-15T10:48:30",
      "ip_address": "127.0.0.1",
      "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome/120.0"
    }
  ]
}
```

| Field | Description |
|-------|-------------|
| `total_emails` | Count of all registered email campaigns |
| `open_rate` | Percentage (1 decimal) of emails with at least one open |
| `click_rate` | Percentage (1 decimal) of emails with at least one click |
| `events` | Up to 100 most recent events, newest first |

**Example:**

```bash
curl http://localhost:8000/api/analytics | python3 -m json.tool
```

---

## Frontend Application

### Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `page.tsx` + `CampaignForm` + `SnippetDisplay` | Create campaigns and copy tracking snippets |
| `/dashboard` | `dashboard/page.tsx` + `MetricCards` + `ActivityFeed` | View metrics and live event feed |

### Campaign Generator (`/`)

The home page provides a form with three fields:

1. **Recipient Email** (required) — validated on both client and server
2. **Subject Line** (optional)
3. **Click-Tracking Link Destination** (optional) — a single URL to wrap

On submit, the frontend calls `POST /api/emails` and displays:

- A success card with the full tracking pixel HTML in a code block
- A **Copy** button (clipboard + toast notification)
- Masked tracking URL(s) with individual copy buttons when links were provided

### Analytics Dashboard (`/dashboard`)

Three metric cards in a responsive grid:

1. **Total Emails Dispatched** — raw count from `total_emails`
2. **Open Rate** — percentage with a visual progress bar
3. **Link Click-Through Rate** — percentage with a visual progress bar

Below the cards, a **Live Activity Feed** table polls `/api/analytics` every **5 seconds** and displays:

| Column | Source |
|--------|--------|
| Recipient | Joined from `emails.recipient` |
| Event | Badge: green for Open, blue for Click |
| When | Relative time via `date-fns` (e.g., "2 mins ago") |
| Client | Parsed from User-Agent (e.g., "Chrome on macOS") |

### Theming

The app supports **light**, **dark**, and **system** themes via `next-themes`. A toggle in the navigation header switches between light and dark mode. Theme preference persists in the browser.

### API Client

All frontend API calls go through `src/lib/api.ts`:

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
```

Non-2xx responses throw an `ApiError` with a parsed message from the backend `detail` field.

---

## Environment Variables

### Backend

Configure via environment variables or a `backend/.env` file (loaded by pydantic-settings).

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./mailtrack.db` | SQLAlchemy connection string. Use `postgresql://user:pass@host:5432/dbname` in production |
| `FRONTEND_URL` | `http://localhost:3000` | Allowed CORS origin for the Next.js app |
| `BASE_URL` | `http://localhost:8000` | Public URL prefix embedded in pixel and click tracking links |

**Example `backend/.env`:**

```env
DATABASE_URL=sqlite:///./mailtrack.db
FRONTEND_URL=http://localhost:3000
BASE_URL=http://localhost:8000
```

**Production example:**

```env
DATABASE_URL=postgresql://mailtrack:secret@db:5432/mailtrack
FRONTEND_URL=https://track.example.com
BASE_URL=https://api.example.com
```

> **Important:** `BASE_URL` must be the publicly reachable URL of your backend. Recipients' mail clients and browsers load tracking URLs from this address. If it points to `localhost`, tracking will fail for external recipients.

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API base URL (baked in at build time for Docker) |

**Example:**

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Local Development

### Prerequisites

- **Python 3.12+**
- **Node.js 20+** and npm
- (Optional) **Docker** and **Docker Compose**

### 1. Start the backend

```bash
cd backend

# Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate        # Linux/macOS
# .venv\Scripts\activate           # Windows

pip install -r requirements.txt

# Run with hot reload
PYTHONPATH=. uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API is available at [http://localhost:8000](http://localhost:8000). On first startup, tables are created automatically via SQLAlchemy `create_all`.

Verify:

```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

### 2. Start the frontend

In a separate terminal:

```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

Open:

- **Campaign generator:** [http://localhost:3000](http://localhost:3000)
- **Analytics dashboard:** [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

### 3. End-to-end smoke test

```bash
# Create a campaign
RESP=$(curl -s -X POST http://localhost:8000/api/emails \
  -H "Content-Type: application/json" \
  -d '{"recipient":"test@example.com","subject":"Hello","links":["https://example.com"]}')

echo "$RESP" | python3 -m json.tool

# Extract IDs (requires python)
EMAIL_ID=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['email_id'])")
SHORT=$(echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(list(d['tracked_links'].values())[0].split('/')[-1])")

# Simulate open
curl -s -o /dev/null -w "Pixel: HTTP %{http_code}\n" \
  "http://localhost:8000/track/pixel/$EMAIL_ID"

# Simulate click
curl -s -o /dev/null -w "Click: HTTP %{http_code}\n" \
  "http://localhost:8000/track/click/$SHORT"

# Check analytics
curl -s http://localhost:8000/api/analytics | python3 -m json.tool
```

---

## Docker Deployment

### Docker Compose (recommended)

From the repository root:

```bash
docker compose up --build
```

| Service | URL | Notes |
|---------|-----|-------|
| Backend | [http://localhost:8000](http://localhost:8000) | SQLite persisted in `backend_data` volume |
| Frontend | [http://localhost:3000](http://localhost:3000) | Standalone Next.js build |

Compose environment (from `docker-compose.yml`):

```yaml
backend:
  DATABASE_URL: sqlite:////app/data/mailtrack.db
  FRONTEND_URL: http://localhost:3000
  BASE_URL: http://localhost:8000

frontend:
  NEXT_PUBLIC_API_URL: http://localhost:8000  # build arg
```

### Individual containers

**Backend:**

```bash
docker build -t mailtrack-backend ./backend

docker run -p 8000:8000 \
  -e DATABASE_URL=sqlite:///./mailtrack.db \
  -e FRONTEND_URL=http://localhost:3000 \
  -e BASE_URL=http://localhost:8000 \
  mailtrack-backend
```

**Frontend:**

```bash
docker build -t mailtrack-frontend \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:8000 \
  ./frontend

docker run -p 3000:3000 mailtrack-frontend
```

---

## Production Deployment

### Checklist

1. **Database:** Switch `DATABASE_URL` to PostgreSQL
2. **Public URLs:** Set `BASE_URL` to your backend's public HTTPS URL
3. **CORS:** Set `FRONTEND_URL` to your frontend's public HTTPS origin
4. **Frontend build:** Set `NEXT_PUBLIC_API_URL` to the public backend URL at build time
5. **TLS:** Terminate HTTPS at a reverse proxy (nginx, Caddy, Traefik)
6. **Proxy headers:** Ensure `X-Forwarded-For` is passed so IP capture works behind the proxy

### Example nginx reverse proxy

```nginx
server {
    listen 443 ssl;
    server_name api.example.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### PostgreSQL connection string

```env
DATABASE_URL=postgresql://mailtrack_user:strong_password@postgres:5432/mailtrack
```

Tables are auto-created on startup. For schema migrations in production, consider adding Alembic.

---

## Embedding Tracking in Real Emails

### Step-by-step workflow

1. **Create a campaign** on the home page (`/`) or via `POST /api/emails`
2. **Copy the tracking pixel** HTML snippet
3. **Paste the pixel** at the bottom of your HTML email body (before `</body>`)
4. **Replace links** in your email with the masked tracking URLs from `tracked_links`
5. **Send the email** through your ESP (SendGrid, Mailgun, SMTP, etc.)
6. **Monitor results** on the dashboard (`/dashboard`)

### Example HTML email body

```html
<html>
  <body>
    <h1>Welcome to our product!</h1>
    <p>Click below to learn more:</p>
    <a href="http://localhost:8000/track/click/BujrX4Jhs-0">
      Visit our landing page
    </a>

    <!-- Tracking pixel — invisible to recipients -->
    <img src="http://localhost:8000/track/pixel/b3d35b4d-d22f-4c0e-881f-87f9b77179c4"
         width="1" height="1" style="display:none;" alt="" />
  </body>
</html>
```

Replace `localhost:8000` with your production `BASE_URL` in real deployments.

---

## Analytics Calculations

| Metric | Formula |
|--------|---------|
| **Total Emails Sent** | `COUNT(*)` from `emails` |
| **Open Rate** | `COUNT(DISTINCT email_id WHERE event_type='open') / total_emails × 100`, rounded to 1 decimal |
| **Click Rate** | `COUNT(DISTINCT email_id WHERE event_type='click') / total_emails × 100`, rounded to 1 decimal |
| **Activity Feed** | Join `tracking_events` → `emails`, ordered by `timestamp DESC`, limited to 100 rows |

When `total_emails = 0`, both rates return `0.0` and the events array is empty.

**Distinct vs. total events:** A recipient who opens an email three times generates three `"open"` events in the feed, but counts as **one** opened email for the open rate calculation.

---

## Error Handling

| Scenario | HTTP Status | Behavior |
|----------|-------------|----------|
| Invalid email in POST body | `422` | Pydantic validation error with field details |
| Malformed UUID on pixel endpoint | `422` | FastAPI path validation |
| Email UUID not found (pixel) | `404` | `"Email not found"` |
| Short code not found (click) | `404` | `"Tracking link not found"` |
| Database commit failure | `500` | Session rolled back, error logged server-side |
| Empty analytics (no campaigns) | `200` | Zeros and empty events array |
| Frontend API failure | — | `ApiError` thrown with parsed backend message; toast shown to user |

All database write endpoints wrap commits in `try/except SQLAlchemyError` with explicit rollback. Endpoints do not fail silently.

---

## Limitations and Considerations

| Topic | Detail |
|-------|--------|
| **Open accuracy** | Apple Mail Privacy Protection, Gmail image proxy, and corporate firewalls can pre-fetch pixels or block them, affecting open counts |
| **No authentication** | API and tracking endpoints are unauthenticated; deploy behind network controls or add auth for production multi-tenant use |
| **Single CORS origin** | Only one `FRONTEND_URL` is allowed; multiple origins require code changes |
| **No email sending** | This platform generates tracking assets only; integrate with your own mail delivery service |
| **Repeated events** | Re-opens and re-clicks create additional events (by design for audit trails) |
| **SQLite concurrency** | Suitable for development; use PostgreSQL under concurrent production load |
| **Build-time API URL** | `NEXT_PUBLIC_API_URL` is embedded at frontend build time; changing it requires a rebuild |

---

## Troubleshooting

### CORS errors in the browser

Ensure `FRONTEND_URL` on the backend exactly matches the origin serving the Next.js app (including scheme and port):

```env
FRONTEND_URL=http://localhost:3000
```

### Tracking pixel not recording opens

1. Verify `BASE_URL` is publicly reachable (not `localhost`) for external recipients
2. Confirm the email is HTML (plain-text emails cannot embed images)
3. Check that the mail client loads remote images (some block by default)
4. Inspect backend logs for 404/500 on `/track/pixel/{uuid}`

### Click redirect not working

1. Confirm the short code exists: check the `links` table or re-create the campaign
2. Verify the masked URL uses the correct `BASE_URL`
3. Test with `curl -v` to see the 302 `Location` header

### Dashboard shows no data

1. Confirm the backend is running and reachable at `NEXT_PUBLIC_API_URL`
2. Open browser DevTools → Network tab and check `/api/analytics` responses
3. Create a test campaign and simulate open/click with curl (see smoke test above)

### Database errors on startup

For SQLite, ensure the process has write permissions in the working directory. For Docker Compose, the database file is stored in the `backend_data` volume at `/app/data/mailtrack.db`.

### Frontend build fails

Ensure Node.js 20+ is installed. Run `npm ci` for a clean install. The build requires `output: "standalone"` in `next.config.ts` for the Docker runner stage.

---

## License

This project is provided as-is for self-hosted email tracking. Review privacy regulations (GDPR, CAN-SPAM, etc.) before tracking recipients in production.
