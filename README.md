# Mike-local (the second fork of Mike)

This is the second fork, so let me give some background information here, and fully explain how this came about.

**THE ORIGINAL GITHUB BY WILL CHEN**

The original Github was Mike by willchen96. (https://github.com/willchen96/mike) — All credit to Will for the original project.   What was the original project?  Former Latham & Watkins lawyer Will Chen created an open-source version of Harvey named "Mike".    If you are inclined, please check out Will's work.   There's an excellent interview with Will Chen that you can watch here:

https://www.artificiallawyer.com/2026/05/04/mike-the-open-source-legal-ai-platform-will-chen-interview/

Additionally, if you want more background, check out Will's website for Mike here:

https://mikeoss.com/

The challenge with Will Chen's original version of Mike was that you needed a lot of things to use it -- Supabase Postgres, Supabase Auth, Cloudflare R2, etc -- and I did not have any of that.

**THE FIRST FORK OF THE ORIGINAL GITHUB**

The first fork of Mike was by Mike Brown, who goes by the Github handle "mikeOnBreeze".   His fork strips out all of the cloud dependences for local equivalents -- a JSON file for state and the local filesystem for document storage.  All credit to Mike Brown for his fork, which is here:

https://github.com/mikeOnBreeze/mike-oss

If you are inclined, please check out Mike Brown's work!

**THE FIRST FORK OF MIKEONBREEZE'S GITHUB**

So, that brings us to my fork -- what does my fork do?

My fork adds some additional options in the model select tab to allow for offline, local AI to process the questions instead of cloud AI such as Claude or Google Gemini.

Specifically, my fork adds three additional options, all using Ollama:

(1) Google Gemma 4 (local)

(2) Google Gemma 3: 4B (local)

(3) Meta Llama 3.2: 3B (local)

Why did I create this fork?

Two reasons.  One was I wanted to run this program offline, without connecting to the internet.  Second reason was that I feel that the big cloud AI companies -- Anthropic, OpenAI, Google, and xAI -- are all going to move to token-based billing in either 2026 or 2027, and subsequently jack up the price of each token.  When that happens, people are going to want options to run AI locally.

Licensed AGPL-3.0 (same as upstream).

---

Open-source release containing the Mike frontend and backend.

## Contents

- `frontend/` - Next.js application
- `backend/` - Express API, local persistence, local document storage, and document processing
- `backend/migrations/000_one_shot_schema.sql` - historical Supabase schema kept for reference

## Setup

Install dependencies:

```bash
npm install --prefix backend
npm install --prefix frontend
```

Create local env files from the examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

Add your Anthropic API key to `backend/.env`:

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

Start the backend:

```bash
npm run dev --prefix backend
```

Start the frontend:

```bash
npm run dev --prefix frontend
```

Open `http://localhost:3000`.

#### Local Data

- JSON database: `backend/data/local-db.json`
- Document bytes: `backend/data/storage/`
- Default local user: `local@mike.local`

No Supabase database, Supabase Auth project, or R2/S3 bucket is required.

#### Required Services

- Ollama (if you want to run local AI)
- LibreOffice for DOC/DOCX to PDF conversion

#### Optional Services

- Optional Anthropic API key for Claude models (if you don't want to run local AI)
- Optional Gemini API key for Google Gemini (if you don't want to run local AI)

#### Checks

```bash
npm run build --prefix backend
npm run build --prefix frontend
npm run lint --prefix frontend
```

#### License

AGPL-3.0-only. See `LICENSE`.
