# 🏔️ Pahad — Mental Health Monitoring PWA

A production-ready Progressive Web App for FCHVs (Female Community Health Volunteers) in Nepal to monitor household mental health risk.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Auth | Supabase Auth |
| Database | Supabase PostgreSQL |
| Offline Storage | IndexedDB via `idb` |
| Maps | Leaflet.js |
| AI Explanation | Google Gemini API |
| PWA | next-pwa + custom service worker |
| Language | TypeScript |

---

## Project Structure

```
pahad/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── offline.html           # Offline fallback page
│   ├── sw-custom.js           # Custom service worker
│   └── icons/                 # PWA icons (generate with your tool)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout + AuthProvider
│   │   ├── page.tsx           # Redirect to /login or /dashboard
│   │   ├── login/
│   │   │   ├── page.tsx       # Login page
│   │   │   └── login.module.css
│   │   ├── dashboard/
│   │   │   ├── layout.tsx     # Dashboard shell + bottom nav
│   │   │   ├── layout.module.css
│   │   │   ├── page.tsx       # Dashboard home (stats + logs)
│   │   │   ├── page.module.css
│   │   │   └── map/
│   │   │       ├── page.tsx   # Map view
│   │   │       └── map.module.css
│   │   ├── form/
│   │   │   ├── layout.tsx     # Auth guard
│   │   │   ├── page.tsx       # 3-step survey form
│   │   │   └── form.module.css
│   │   └── api/
│   │       ├── sync/route.ts  # Batch sync endpoint
│   │       └── risk/route.ts  # Risk score endpoint
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── SyncBadge.tsx  # Online/offline + sync status
│   │   │   └── SyncBadge.module.css
│   │   └── map/
│   │       └── MapView.tsx    # Leaflet map (dynamic import)
│   │
│   ├── hooks/
│   │   ├── useAuth.tsx        # Supabase auth context
│   │   ├── useSyncStatus.ts   # Sync state + triggers
│   │   └── useGeolocation.ts  # GPS location
│   │
│   ├── lib/
│   │   ├── supabase.ts        # Supabase client
│   │   ├── db.ts              # IndexedDB CRUD (idb)
│   │   ├── risk.ts            # Rule-based risk scoring
│   │   ├── gemini.ts          # Gemini API + fallback
│   │   └── sync.ts            # Sync engine + notifications
│   │
│   ├── types/
│   │   └── index.ts           # TypeScript types
│   │
│   └── styles/
│       └── globals.css        # Global CSS variables + base styles
│
├── supabase/
│   └── schema.sql             # Full PostgreSQL schema + RLS policies
│
├── next.config.js             # Next.js + PWA config
├── tsconfig.json
└── package.json
```

---

## Setup

### 1. Clone and Install

```bash
git clone <your-repo>
cd pahad
npm install
```

### 2. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the entire `supabase/schema.sql` file
3. In **Authentication > Settings**, disable "Enable email confirmations" (for easier admin user creation)
4. Create FCHV users via **Authentication > Users > Add User**

### 3. Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
```

**Gemini API Key**: Get from [Google AI Studio](https://aistudio.google.com/app/apikey)

### 4. Generate PWA Icons

Use [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator) or [RealFaviconGenerator](https://realfavicongenerator.net/) to create all icon sizes and place them in `public/icons/`.

Required sizes: 72, 96, 128, 144, 152, 192, 384, 512 (PNG).

### 5. Run Development Server

```bash
npm run dev
```

### 6. Build for Production

```bash
npm run build
npm start
```

---

## Risk Scoring Logic

| Factor | Weight |
|--------|--------|
| Self-harm ideation | 30 |
| Hopelessness | 20 |
| Trauma | 15 |
| Daily activity stopped | 12 |
| Social withdrawal | 10 |
| Substance use | 7 |
| Sleep change | 3 |
| Appetite change | 3 |
| **Total** | **100** |

Score = (sum of active weights / 100) × 100

Special rule: If `self_harm = true`, minimum score is 60.

| Score | Level | Action |
|-------|-------|--------|
| 0–24 | 🟢 Low | Monitor normally |
| 25–49 | 🟡 Medium | Follow up visit |
| 50–69 | 🟠 High | Report to health office |
| 70–100 | 🔴 Critical | Immediate action + notification |

---

## Offline-First Architecture

1. **All form submissions** are saved to IndexedDB immediately
2. A **sync queue** tracks unsynced records
3. **Auto-sync** triggers every 30 seconds when online
4. **Online event** triggers immediate sync
5. The `SyncBadge` component shows real-time sync status
6. If Gemini API is unavailable offline, a **rule-based fallback** explanation is used

---

## Admin: Creating FCHV Users

No self-registration is allowed. Admins create users via:

**Option A: Supabase Dashboard**
- Go to Authentication > Users > Add User
- Enter email + password
- The profile is auto-created via trigger

**Option B: Supabase Admin API**
```bash
curl -X POST https://your-project.supabase.co/auth/v1/admin/users \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "fchv1@pahad.np", "password": "securepassword", "email_confirm": true}'
```

---

## PWA Installation

On Android Chrome: tap the "Add to Home Screen" banner or use the browser menu.  
On iOS Safari: tap Share → "Add to Home Screen".

The app installs as a standalone app with the Pahad icon.

---

## Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```
Set environment variables in Vercel project settings.

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run build
EXPOSE 3000
CMD ["npm", "start"]
```
