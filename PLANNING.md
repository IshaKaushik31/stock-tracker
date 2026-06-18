# Stock Tracker — Project Planning

## What We're Building
A stock tracker web app with:
- Watchlist (track stocks you're interested in)
- Holdings + Unrealized P&L tracking
- Price alerts (above/below a target price)
- RAG-powered chatbot (upload earnings transcripts, ask questions)
- Cron job for price updates every 15 minutes

---

## Tech Stack
- **Backend:** Node.js + Express
- **Database:** PostgreSQL (hosted on Supabase)
- **DB Library:** `pg` (raw SQL, no ORM)
- **Auth:** JWT + bcrypt
- **File Upload:** Multer
- **Cron:** node-cron
- **Embeddings:** Gemini API
- **Vector Search:** pgvector (built into Supabase)
- **Frontend:** React + Vite

---

## Database Schema

```sql
users
-----
id              SERIAL PRIMARY KEY
username        VARCHAR(50) NOT NULL
email           VARCHAR(255) UNIQUE NOT NULL
password_hash   TEXT NOT NULL
created_at      TIMESTAMP DEFAULT NOW()

stocks
------
symbol          VARCHAR(10) PRIMARY KEY
current_price   DECIMAL(10, 2)

watchlist
---------
user_id         INT REFERENCES users(id) ON DELETE CASCADE
symbol          VARCHAR(10) REFERENCES stocks(symbol) ON DELETE CASCADE
added_at        TIMESTAMP DEFAULT NOW()
PRIMARY KEY (user_id, symbol)

alerts
------
id              SERIAL PRIMARY KEY
user_id         INT REFERENCES users(id) ON DELETE CASCADE
symbol          VARCHAR(10) REFERENCES stocks(symbol) ON DELETE CASCADE
target_price    DECIMAL(10, 2) NOT NULL
direction       VARCHAR(5) CHECK (direction IN ('above', 'below'))
is_triggered    BOOLEAN DEFAULT FALSE
is_read         BOOLEAN DEFAULT FALSE
created_at      TIMESTAMP DEFAULT NOW()

holdings
--------
id              SERIAL PRIMARY KEY
user_id         INT REFERENCES users(id) ON DELETE CASCADE
symbol          VARCHAR(10) REFERENCES stocks(symbol) ON DELETE CASCADE
price_bought    DECIMAL(10, 2) NOT NULL
quantity        DECIMAL(10, 4) NOT NULL

transcripts
-----------
id              SERIAL PRIMARY KEY
user_id         INT REFERENCES users(id) ON DELETE CASCADE
symbol          VARCHAR(10) REFERENCES stocks(symbol) ON DELETE CASCADE
quarter         VARCHAR(2) CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4'))
year            INT NOT NULL
uploaded_at     TIMESTAMP DEFAULT NOW()

chunks
------
id              SERIAL PRIMARY KEY
transcript_id   INT REFERENCES transcripts(id) ON DELETE CASCADE
chunk_text      TEXT NOT NULL
chunk_vector    vector(1536)
```

---

## API Design

### Auth
```
POST   /auth/register        — register new user
POST   /auth/login           — login, returns JWT
POST   /auth/logout          — logout (handled on frontend)
```

### Watchlist
```
GET    /watchlist            — fetch user's watchlist
POST   /watchlist            — add a stock
DELETE /watchlist/:symbol    — remove a stock
```

### Alerts
```
GET    /alerts               — fetch alerts (query params: ?triggered=true, ?is_read=false)
POST   /alerts               — create an alert
DELETE /alerts/:id           — delete an alert
PATCH  /alerts/:id           — mark alert as read
```

### Holdings
```
GET    /holdings             — fetch all holdings
GET    /holdings/pnl         — P&L (query params: ?symbol=AAPL, ?holding_id=5)
POST   /holdings             — add a holding
PATCH  /holdings/:id         — update a holding
DELETE /holdings/:id         — delete a holding
```

### Transcripts + RAG
```
GET    /transcripts                      — fetch all transcripts (shows symbol, quarter, year)
POST   /transcripts                      — upload a transcript PDF
DELETE /transcripts/:id                  — delete a transcript + its chunks
POST   /transcripts/:id/question         — ask a question (RAG query)
```

---

## Folder Structure

```
stock-tracker/
  src/
    routes/
      auth.js
      watchlist.js
      alerts.js
      holdings.js
      transcripts.js
    controllers/
      auth.controller.js
      watchlist.controller.js
      alerts.controller.js
      holdings.controller.js
      transcripts.controller.js
    middleware/
      auth.middleware.js
    db/
      pool.js
      migrations/
        001_create_users.sql
        002_create_stocks.sql
        003_create_watchlist.sql
        004_create_alerts.sql
        005_create_holdings.sql
        006_create_transcripts.sql
        007_create_chunks.sql
    services/
      cron.js
      rag.js
  index.js
  .env
  package.json
```

---

## Coding Order
1. Project setup (Express + pg + Supabase connection)
2. Auth (register, login, JWT middleware)
3. Watchlist
4. Stocks + cron job (node-cron + 12data/Yahoo Finance API)
5. Alerts
6. Holdings + P&L
7. Transcripts + chunking (Multer + text extraction)
8. RAG chatbot (Gemini embeddings + pgvector similarity search)

---

## Key Decisions
- **No ORM** — raw SQL with `pg` library
- **JWT auth** — stateless, no sessions table needed
- **Supabase** — hosted Postgres with pgvector built in, visual table browser
- **Discard PDFs after chunking** — avoid S3 complexity
- **15 min cron interval** — API rate limit friendly
- **Composite PK on watchlist** — prevents duplicate stocks per user
- **Stocks table is global** — not per user, cron updates one row per symbol
- **P&L uses JOIN** — current_price comes from stocks table at query time, not stored in holdings
- **Alerts have is_triggered + is_read** — triggered by cron, read by user

## Context(about me)
i am a beginner. i know html, css, javascript. i need to learn backend and i intend to learn it by building this project. i don't need you to build it for me. i just need your guidance. we'll take everything up one by one. for each thing tell me the what i need to learn i'll do that and then try to implement it on my own if i get stuck i'll take your help. so this is a student teacher relationship.
