# AGENTS Notes

## Verified workflow
- Use `npm` in this repo (`package-lock.json` is present and README uses `npm install` / `npm run dev`).
- Main scripts: `npm run dev`, `npm run build`, `npm run start`, `npm run lint`.
- `npm run lint` is **TypeScript typecheck only** (`tsc --noEmit`), not ESLint.
- There is no test runner config in the repo (no Jest/Vitest/Playwright scripts or config files).

## Runtime/env assumptions that break features if missing
- Mongo-backed routes require `MONGODB_URI` and (effectively) `TENANT_DB_NAME` (`lib/db.ts`).
- Many server/client data fetches depend on `NEXT_PUBLIC_API_BASE_URL` and tenant header vars like `NEXT_PUBLIC_TENANT_ID`.
- Proxy routes use `FASTAPI_URL` (fallback `http://127.0.0.1:8000`) via `lib/apiProxy.ts`.
- Auth uses `JWT_SECRET`; if missing, code falls back to a weak default string in multiple files.

## App wiring that is easy to miss
- Real shell is `app/[locale]/layout.tsx`; `app/layout.tsx` only returns `children`.
- **Single-language mode (English only)** — `middleware.ts` hardcodes `["en"]`; no MongoDB lookup. Non-English locale prefixes (`/hi`, `/fr`, etc.) are redirected to clean URLs. The `en` prefix is never shown in the URL.
- Admin auth gate is in `app/[locale]/admin/(dashboard)/layout.tsx` and checks `auth_token` cookie; unauthenticated users are redirected to `/login`.
- Catch-all API proxy lives at `app/api/[[...slug]]/route.ts` and forwards to FastAPI (`/commerce/*` gets `/api` prefix on backend).

## Data boundaries
- Next API routes under `app/api/ecommerce/*` directly query Mongo through `connectTenantDB()`.
- Redux store is initialized by `app/StoreProvider.tsx`, and global prefetch side effects run from `components/Providers.tsx`.
- Branding/business blueprint bootstrap happens in `app/[locale]/layout.tsx` before rendering page content.

## Practical verification order for most changes
- Run `npm run lint` first (fast type safety gate used as lint).
- Then run `npm run build` for App Router/runtime integration issues.
- If your change touches API/proxy/auth/localization, verify with `npm run dev` and hit the affected route flow manually.
