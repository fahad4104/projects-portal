**Project Overview**
- **Type:** Next.js (App Router) + TypeScript + Prisma (SQLite)
- **UI:** RTL Arabic, Tailwind CSS. Root layout sets `dir="rtl"` in `src/app/layout.tsx`.
- **Purpose:** A lightweight boundary/communication portal for projects, tasks and drawings.

**Where to look first**
- `package.json` — dev/build scripts (`dev`, `build` runs `prisma db push && next build`) and `postinstall: prisma generate`.
- `prisma/schema.prisma` — canonical data model (Project, Task, Drawing, enums Role / TaskStatus).
- `src/lib/prisma.ts` — shared Prisma client singleton pattern (important to reuse in Node dev server).
- `src/app/api/**` — API surface (App Router route handlers returning `NextResponse`). Examples: `src/app/api/projects/route.ts`, `.../drawings/route.ts`.
- `src/app` — UI pages: `page.tsx`, `projects/page.tsx`, `projects/[id]/page.tsx` (client components use `"use client"`).

**Agent Guidance / Patterns to follow**
- App Router routes are server files under `src/app/api/*` returning `NextResponse`. Use the same style and status handling as existing handlers (see `src/app/api/projects/route.ts`).
- Frontend uses client components (`"use client"`) and fetches the JSON APIs via `fetch('/api/...')`. When updating API contracts, update callers in `src/app/projects/page.tsx` and `src/app/projects/[id]/page.tsx`.
- Keep messages and logs in Arabic when they match existing strings (errors returned in Arabic in API routes).
- Follow the Prisma client pattern in `src/lib/prisma.ts`: export a singleton named `prisma` and avoid creating multiple clients in dev. Prefer `import { prisma } from '@/lib/prisma'`.

**Important Gotchas discovered in code (do not change lightly)**
- The dev seed route at `src/app/api/dev/seed/route.ts` currently imports `prisma` as a default export (`import prisma from '@/lib/prisma'`) but `src/lib/prisma.ts` exports a named `prisma` constant. This will throw at runtime — use `import { prisma } from '@/lib/prisma'` or change the export. Before touching the seed route, confirm intended shape of data in `prisma/schema.prisma`.
- `src/app/api/dev/seed/route.ts` contains field names that don't match the current `schema.prisma` (e.g., `name`, `ownerRole`, `visibleToRoles`). Treat the seed file as out-of-sync; prefer `prisma db push` with a validated migration and/or update the seed to match the schema.

**Database / Migrations / Local dev**
- Local DB uses SQLite via `DATABASE_URL` env. Inspect `prisma/schema.prisma` for the authoritative model.
- Dev flow: `npm install` (triggers `prisma generate`), `npm run dev` starts Next dev server. For building CI: `npm run build` runs `prisma db push && next build`.
- When changing Prisma models: create a migration and run `prisma generate` (postinstall runs it automatically). Prefer `prisma migrate dev` locally if you want generated SQL and versioned migrations.

**API conventions & examples**
- Error responses use `NextResponse.json({ message: '...', error }, { status: 500 })` and log with `console.error`. Mirror this style when adding endpoints.
- Limit fields returned where useful: `src/app/api/projects/route.ts` returns recent non-DONE tasks using `include` + `where` + `take` — follow similar selective include patterns to keep payloads small.

**Frontend conventions**
- UI is Arabic/RTL. All new layouts/components should set `dir="rtl"` or inherit from `src/app/layout.tsx`.
- Client components must include `"use client"` at top. Keep heavy DB interactions in server routes, not client components.

**Coding style & small rules for AI edits**
- Keep translations and strings in Arabic when modifying error messages or UI labels unless fixing obvious typos.
- Use existing filenames & routes — prefer adding new API routes under `src/app/api/` following current folder structure.
- Maintain TypeScript typings in route handlers (use `NextRequest`, typed `params` objects) as seen in `src/app/api/projects/[id]/route.ts`.

**When to ask the human**
- If you need to change the Prisma schema or seed data, ask before applying migrations.
- If you want to change the `prisma` export shape (default vs named), confirm to avoid breaking imports.
- If you need to introduce new environment variables (e.g. external storage for drawings), request values and update README and `next.config.mjs` accordingly.

**Quick examples**
- Returning 404 in a route (pattern):
  - See `src/app/api/projects/[id]/route.ts` — return `NextResponse.json({ message: '...'}, { status: 404 })` when not found.
- Using Prisma singleton (pattern):
  - `import { prisma } from '@/lib/prisma'` then `await prisma.project.findUnique({ where: { id } })`.

If anything here is unclear or you want more detailed examples (tests, CI, or a corrected dev-seed), tell me which area to expand and I will iterate.
