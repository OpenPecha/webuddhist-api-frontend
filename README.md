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

2. **Create `.env.local`** (copy from `.env.local.example`)
   ```
   OPENPECHA_API_BASE=http://13.250.189.160
   OPENPECHA_API_KEY=<your api key>
   # OPENPECHA_DEFAULT_APPLICATION=<optional default application id>
   ```

3. **Run the dev server**
   ```
   npm run dev
   ```
   Open http://localhost:3000.

4. **Create an Application** at `/applications` if you don't have one, then click "Use" to make it active. Most write endpoints (texts, categories, tags, segments) require an `X-Application` header.

## How auth works

The browser never sees the API key. All API calls go to a same-origin route at `/api/proxy/...`, and the Next.js server attaches `X-API-Key` from the env var before forwarding to the upstream API. This also avoids CORS and mixed-content (the upstream is HTTP, not HTTPS).

Source: `src/app/api/proxy/[...path]/route.ts`.

## Regenerating API types

If the upstream OpenAPI spec changes, replace `openapi/openapi.json` and run:

```
npx openapi-typescript openapi/openapi.json -o src/lib/api/types.ts
```
