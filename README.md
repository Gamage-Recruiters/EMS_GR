
# EMS — Employee Management System

Deploy **backend on Render (free)** and **frontend on Vercel (free)**.

---

## Quick architecture

```
Browser  →  Vercel (React/Vite frontend)
              ↓  HTTPS API + WebSocket
           Render (Node/Express + Socket.IO)
              ↓
           MongoDB Atlas (free M0 cluster)
```

---

## Part 1 — MongoDB Atlas (free database)

1. Go to [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register) and create an account.
2. Create a **free M0 cluster** (Shared, any cloud region close to you).
3. **Database Access** → Add Database User → username + password → save credentials.
4. **Network Access** → Add IP Address → **Allow Access from Anywhere** (`0.0.0.0/0`) so Render can connect.
5. **Database** → Connect → **Drivers** → copy the connection string.
6. Replace `<password>` with your user password and set the database name, e.g.:

   ```
   mongodb+srv://myuser:MyP%40ssword@cluster0.xxxxx.mongodb.net/ems?retryWrites=true&w=majority
   ```

   (URL-encode special characters in the password, e.g. `@` → `%40`)

---

## Part 2 — Google OAuth (optional, for Sign in with Google)

1. Open [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.
2. Create **OAuth client ID** → type **Web application**.
3. **Authorized JavaScript origins** — add:
   - `http://localhost:5173` (local dev)
   - `https://YOUR-APP.vercel.app` (after Vercel deploy)
4. Copy the **Client ID** — use the same value for:
   - Backend: `GOOGLE_CLIENT_ID`
   - Frontend: `VITE_GOOGLE_CLIENT_ID`

---

## Part 3 — Push code to GitHub

Render and Vercel deploy from Git. If the repo is not on GitHub yet:

```bash
git add .
git commit -m "Prepare for Render + Vercel deployment"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

---

## Part 4 — Deploy backend on Render (free)

### Option A — Manual (recommended first time)

1. Go to [https://dashboard.render.com](https://dashboard.render.com) → sign up (GitHub login works).
2. **New +** → **Web Service** → connect your GitHub repo.
3. Settings:

   | Field | Value |
   |-------|-------|
   | **Name** | `ems-backend` (or any name) |
   | **Region** | closest to you |
   | **Branch** | `main` |
   | **Root Directory** | `backend` |
   | **Runtime** | Node |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Instance Type** | **Free** |

4. **Environment Variables** → Add:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `MONGO_URI` | your Atlas connection string |
   | `JWT_SECRET` | long random string (e.g. 32+ chars) |
   | `JWT_REFRESH_SECRET` | different long random string |
   | `JWT_EXPIRES_IN` | `15m` |
   | `JWT_REFRESH_EXPIRES_IN` | `7d` |
   | `GOOGLE_CLIENT_ID` | your Google OAuth client ID |
   | `CLIENT_URLS` | `https://YOUR-APP.vercel.app` (update after Vercel deploy) |

5. Click **Create Web Service** → wait for deploy (~2–5 min).
6. Copy your backend URL, e.g. `https://ems-backend.onrender.com`.
7. Test: open `https://ems-backend.onrender.com/health` → should return `{"status":"ok"}`.

### Option B — Blueprint (`render.yaml` in repo root)

1. Render → **New +** → **Blueprint** → select repo.
2. Fill in secret env vars when prompted (`MONGO_URI`, `GOOGLE_CLIENT_ID`, `CLIENT_URLS`).
3. Deploy.

### Render free tier notes

- Service **sleeps after ~15 min** of no traffic — first request may take 30–60 seconds.
- **Disk is ephemeral** — uploaded profile images reset on redeploy/restart. For production persistence, use S3/Cloudinary later.

---

## Part 5 — Deploy frontend on Vercel (free)

1. Go to [https://vercel.com](https://vercel.com) → sign up with GitHub.
2. **Add New…** → **Project** → import the same repo.
3. Settings:

   | Field | Value |
   |-------|-------|
   | **Framework Preset** | Vite |
   | **Root Directory** | `frontend` (click Edit → set to `frontend`) |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `dist` |

4. **Environment Variables** → Add (Production):

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://ems-backend.onrender.com/api` |
   | `VITE_API_BASE_URL` | `https://ems-backend.onrender.com/api` |
   | `VITE_SOCKET_URL` | `https://ems-backend.onrender.com` |
   | `VITE_GOOGLE_CLIENT_ID` | same as backend `GOOGLE_CLIENT_ID` |

   Replace `ems-backend.onrender.com` with your actual Render URL.

5. Click **Deploy** → wait for build (~1–3 min).
6. Copy your Vercel URL, e.g. `https://ems-frontend.vercel.app`.

---

## Part 6 — Connect frontend ↔ backend

1. **Render** → your web service → **Environment** → set:

   ```
   CLIENT_URLS=https://ems-frontend.vercel.app,http://localhost:5173
   ```

   Use your real Vercel URL. Redeploy if Render does not auto-restart.

2. **Google Cloud Console** → add your Vercel URL to **Authorized JavaScript origins**.

3. Open your Vercel app → try login / API calls. Check browser DevTools → Network if anything fails.

---

## Part 7 — Seed users (first-time setup)

Run seed scripts **locally** pointing at Atlas:

```bash
cd backend
cp .env.example .env
# Edit .env with your MONGO_URI (same Atlas DB as production)
npm install
node seedUsers.js
```

Then log in on the live Vercel site with seeded credentials.

---

## Local development

**Backend**

```bash
cd backend
cp .env.example .env   # fill in MONGO_URI, JWT secrets, etc.
npm install
npm run dev
```

**Frontend**

```bash
cd frontend
cp .env.example .env   # use localhost URLs (commented in .env.example)
npm install
npm run dev
```

App runs at `http://localhost:5173`, API at `http://localhost:5000`.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| CORS error in browser | Set `CLIENT_URLS` on Render to your exact Vercel URL (no trailing slash). |
| `401 invalid_client` (Google) | Same `GOOGLE_CLIENT_ID` on both sides; add Vercel URL to Google origins. |
| API timeout / slow first load | Render free tier waking from sleep — wait or upgrade. |
| MongoDB connection failed | Atlas Network Access must allow `0.0.0.0/0`; check password encoding in URI. |
| Profile images missing after restart | Expected on free Render — disk is not persistent. |
| Vercel build hangs | `vite.config.js` already forces exit after build; redeploy if needed. |

---

## Environment reference

**Backend (`backend/.env`)**

- `MONGO_URI` — MongoDB Atlas connection string
- `JWT_SECRET`, `JWT_REFRESH_SECRET` — auth tokens
- `GOOGLE_CLIENT_ID` — Google Sign-In
- `CLIENT_URLS` — comma-separated frontend URLs for CORS + Socket.IO

**Frontend (`frontend/.env`)**

- `VITE_API_URL` — REST API base, e.g. `https://xxx.onrender.com/api`
- `VITE_API_BASE_URL` — used for image URLs (usually same as `VITE_API_URL`)
- `VITE_SOCKET_URL` — backend root for WebSocket, e.g. `https://xxx.onrender.com`
- `VITE_GOOGLE_CLIENT_ID` — Google Sign-In
