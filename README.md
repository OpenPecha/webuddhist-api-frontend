# OpenPecha Admin

A Next.js admin frontend for the [OpenPecha API v2](http://13.250.189.160/redoc) — manage Buddhist text records, editions, contributors, categories, tags, languages, applications, segments, and annotations.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui (Radix base)
- TanStack Query v5
- API types generated from `openapi/openapi.json` via `openapi-typescript`

## Getting started

1. **Install deps**
   ```
   npm install
   ```

2. **(Optional) Create `.env.local`** — no env vars are required out of the box. Copy from `.env.local.example` only if you want to override the upstream URL or set a default application id.
   ```
   # OPENPECHA_API_BASE=http://13.250.189.160
   # OPENPECHA_DEFAULT_APPLICATION=<optional default application id>
   ```

3. **Run the dev server**
   ```
   npm run dev
   ```
   Open http://localhost:3000.

4. **Enter your API key** via the Settings dialog in the sidebar footer. It is stored in your browser's `localStorage` and sent as `X-API-Key` on every request.

5. **Create an Application** at `/applications` if you don't have one, then click "Use" to make it active. Most write endpoints (texts, categories, tags, segments) require an `X-Application` header.

## How auth works

Each user enters their own API key in the in-app Settings dialog. The key is kept in `localStorage` and sent on the request as `X-API-Key`. All API calls go to a same-origin route at `/api/proxy/...`, which forwards the request to the upstream API — this avoids CORS and mixed-content issues (the upstream is HTTP, not HTTPS).

The upstream base URL defaults to `http://13.250.189.160` and can be overridden with `OPENPECHA_API_BASE`.

Source: `src/app/api/proxy/[...path]/route.ts`.

## Regenerating API types

If the upstream OpenAPI spec changes, replace `openapi/openapi.json` and run:

```
npx openapi-typescript openapi/openapi.json -o src/lib/api/types.ts
```
