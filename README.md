# Campus Desk – University Student Support Chatbot

React (Vite) + Express + MongoDB + Gemini API. No Docker.

```
campus-desk/
  server/   Express API, MongoDB models, Gemini chat route
  client/   React app (chat, report a problem, staff pages)
```

## What it does
- **Chat**: students ask about deadlines, exam schedules, events, faculty, FAQs. The server loads all "campus data" from MongoDB and gives it to Gemini as context, so answers come from your data.
- **Report a problem**: students submit an issue (saved in MongoDB).
- **Staff page** (protected by an admin key): full CRUD for campus data, plus view / update status / delete student reports.

## Setup (about 10 minutes)

### 1. Prerequisites
- Node.js 18 or newer
- MongoDB: either installed locally (`mongodb://127.0.0.1:27017`) or a free MongoDB Atlas cluster (use its connection string)

### 2. Get a Gemini API key
1. Open https://aistudio.google.com/apikey and sign in with a Google account.
2. Click **Create API key** (pick or create a Google Cloud project when asked).
3. Copy the key. Treat it like a password.

### 3. Backend
```bash
cd server
npm install
cp .env.example .env        # Windows: copy .env.example .env
```
Edit `server/.env`:
```
GEMINI_API_KEY=your key from step 2
MONGODB_URI=your MongoDB connection string
ADMIN_KEY=any long random string (this is the staff password)
UNIVERSITY_NAME=Your University
```
Then load sample data (optional) and start:
```bash
npm run seed
npm run dev
```
API runs on http://localhost:5000 (`/api/health` should return `{"ok":true}`).

### 4. Frontend (new terminal)
```bash
cd client
npm install
npm run dev
```
Open http://localhost:5173.

### 5. Use it
1. Go to **Staff**, enter your `ADMIN_KEY`, and replace the sample data with real deadlines, exam dates, events and faculty details.
2. Go to **Ask a question** and try: "What's the last date to pay fees?"

## API summary
| Method | Path | Who |
|---|---|---|
| POST | `/api/chat` | public |
| GET | `/api/knowledge` | public |
| POST / PUT / DELETE | `/api/knowledge[/:id]` | admin key |
| POST | `/api/issues` | public |
| GET / PUT / DELETE | `/api/issues[/:id]` | admin key |

Admin routes expect the header `x-admin-key: <ADMIN_KEY>`.

## Notes for going live
- Keep `GEMINI_API_KEY` only on the server. Never put it in the React code.
- Build the client with `npm run build`, host the `dist/` folder, and set `VITE_API_URL` to your API URL and `CLIENT_ORIGIN` in `server/.env` to your site URL.
- Chat sends all campus data to Gemini on each request. That's fine for a few hundred entries; for much more, add search so only relevant entries are sent.
- Add rate limiting (for example `express-rate-limit`) to `/api/chat` and `/api/issues` before opening it to the public.
- The admin key is a simple shared password. For real staff accounts, add proper login (for example JWT) later.
