# CLAUDE.md — servio-frontend

**API contract:** see [`API_CONTRACT.md`](./API_CONTRACT.md) at the repo root.
Keep it in sync manually when the backend changes (source of truth is `servio-backend/API_CONTRACT.md`).

## Project

**Servio** — auto service aggregator for Moldova. Two apps sharing a common API client and types.

## Structure

```
servio-frontend/
├── apps/
│   ├── web/          Next.js 15 (App Router) — customer & shop web interface
│   └── mobile/       Expo (React Native) — customer & shop mobile app
├── packages/
│   ├── types/        TypeScript interfaces matching API_CONTRACT.md (@servio/types)
│   └── api/          Typed Axios API client — all backend calls live here (@servio/api)
├── turbo.json
└── tsconfig.base.json
```

## Stack

- **Monorepo:** Turborepo + npm workspaces
- **Web:** Next.js 15, App Router, Tailwind CSS
- **Mobile:** Expo (React Native), NativeWind
- **Auth:** Firebase Auth SDK — `getIdToken()` on every request
- **HTTP:** Axios via `@servio/api` (shared package)
- **State/data fetching:** TanStack Query (React Query)
- **Language:** TypeScript throughout

## Commands

```bash
# Install all dependencies
npm install

# Run web app (dev)
npm run dev:web

# Run mobile app
npm run dev:mobile

# Type check everything
npm run typecheck
```

## Auth pattern

Firebase handles login/signup UI. After sign-in, call `setTokenProvider` once at app startup:

```ts
import { setTokenProvider } from "@servio/api";
import { getAuth } from "firebase/auth";

setTokenProvider(() => getAuth().currentUser?.getIdToken() ?? Promise.resolve(null));
```

Then on first launch check `authApi.me()` — if 401, redirect to register flow (`authApi.register(...)`).

## Key conventions

- **All API calls go through `@servio/api`** — never call `fetch`/`axios` directly in app code
- **All types come from `@servio/types`** — never redefine API shapes locally in apps
- When the backend API changes: update `API_CONTRACT.md` → update `packages/types/index.ts` → update `packages/api/index.ts`
- `averageRating` comes as a string from the API (BigDecimal) — parse with `parseFloat()` before display
- Dates come as ISO strings — format with `Intl.DateTimeFormat` or a date library