# Registration System — የተመዝጋቢ ምዝገባ ሥርዓት

An Amharic-first online registration platform. Participants register, receive a
unique registration number, and download a PDF certificate carrying a QR code
that anyone can scan to verify the certificate's authenticity.

Built as a single Next.js App Router application deployed to Vercel, with
PostgreSQL for data and Vercel Blob for participant photos.

---

## Status

The project is being built in phases. **Phase 1 is complete.**

| Phase | Scope | Status |
| ----- | ----- | ------ |
| 1 | Project setup, Tailwind theme, Ethiopic typography, i18n, Amharic homepage | ✅ Done |
| 2 | PostgreSQL, Prisma schema, migrations | ⬜ Next |
| 3 | — folded into Phase 1: i18n shipped with the foundation | ✅ Done |
| 4 | Registration form, validation, photo upload, ID generation, persistence | ⬜ |
| 5 | Certificate design, PDF generation, download | ⬜ |
| 6 | QR code, public verification page | ⬜ |
| 7 | Rate limiting, secure uploads, hardening | ⬜ |
| 8 | GitHub, production database, Vercel deployment | ⬜ |

Sections below marked _(Phase N)_ describe work that is planned but not yet
implemented.

---

## Features

- **Amharic by default.** `/` serves Amharic; English is available at `/en`.
- **Locale-free public URLs.** Certificate verification links never carry a
  language prefix, so a printed QR code stays valid forever.
- **Correct Ethiopic typography** via self-hosted Noto Sans Ethiopic.
- **Sensitive data isolation.** Bank account and identification numbers never
  appear on certificates, public pages, or public URLs.
- **Stateless.** No local filesystem or in-memory state — safe on serverless.

## Technology Stack

| Layer | Technology |
| ----- | ---------- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| UI | React 19, Tailwind CSS v4 |
| Fonts | `next/font/google` — Inter + Noto Sans Ethiopic |
| Database | PostgreSQL + Prisma 7 _(Phase 2)_ |
| Photo storage | Vercel Blob _(Phase 4)_ |
| PDF | `@react-pdf/renderer` _(Phase 5)_ |
| QR codes | `qrcode` _(Phase 6)_ |
| Hosting | Vercel |

## Prerequisites

- Node.js 20.9 or newer
- npm 10+
- Git
- A PostgreSQL database _(Phase 2)_

## Local Setup

```bash
git clone https://github.com/YOUR_USERNAME/registration-system.git
cd registration-system
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:3000 — the homepage renders in Amharic.

## Environment Variables

Copy `.env.example` to `.env` and fill in real values. **Never commit `.env`.**

| Variable | Required from | Purpose |
| -------- | ------------- | ------- |
| `NEXT_PUBLIC_APP_URL` | Phase 1 | Public origin used to build the QR verification link. Must be the real domain in production, or scanned QR codes point at localhost. |
| `DATABASE_URL` | Phase 2 | PostgreSQL connection string. Use the **pooled** URL on Vercel. |
| `BLOB_READ_WRITE_TOKEN` | Phase 4 | Vercel Blob write token. Server-side only. |

Only variables prefixed `NEXT_PUBLIC_` are exposed to the browser. Everything
else stays server-side — do not add that prefix to a secret.

## Internationalization

All pages live under `app/[lang]/`, but Amharic is served from unprefixed URLs.
`proxy.ts` (Next.js 16's replacement for `middleware.ts`) resolves the locale:

| Request | Result |
| ------- | ------ |
| `/register` | rewritten to `/am/register`; the address bar still shows `/register` |
| `/en/register` | passthrough — matches `[lang]` with `lang=en` |
| `/am/register` | redirected to `/register` so each page has one canonical URL |

To add a language:

1. Add the code to `LOCALES`, `LOCALE_NAMES` and `LOCALE_TAGS` in
   `lib/i18n/config.ts`.
2. Create `lib/i18n/dictionaries/<code>.ts` typed as `Dictionary`. TypeScript
   will list every string still missing.
3. Register a loader in `lib/i18n/index.ts`.

The `Dictionary` type is derived from the Amharic dictionary, so adding a key to
`am.ts` turns every other locale into a compile error until it is translated.

## Typography

Inter and Noto Sans Ethiopic are both self-hosted through `next/font/google`.
The font stack lists Inter first and Noto Sans Ethiopic second; browsers fall
back **per glyph**, so Latin text renders in Inter while Amharic renders in Noto
Sans Ethiopic, with no layout shift and no request to Google.

## Development Commands

```bash
npm run dev      # development server
npm run build    # production build (also typechecks)
npm start        # serve the production build
npm run lint     # ESLint
npx tsc --noEmit # typecheck only
```

## PostgreSQL and Prisma _(Phase 2)_

```bash
npx prisma generate        # generate the Prisma client
npx prisma migrate dev     # create and apply a migration locally
npx prisma migrate deploy  # apply migrations in production
npx prisma studio          # browse data
```

## Photo Storage _(Phase 4)_

Photos are uploaded to Vercel Blob; PostgreSQL stores only the resulting URL and
metadata. Uploaded images are never written to the local filesystem — Vercel's
serverless filesystem is ephemeral and read-only in production.

## Certificate Generation _(Phase 5)_

`GET /api/certificate/[registrationId]` loads the registration through a
narrowed Prisma `select` that cannot return the bank account number, renders a
PDF with `@react-pdf/renderer`, and returns it as a download. Noto Sans Ethiopic
is registered explicitly with the PDF renderer — without a registered Ethiopic
font, Amharic text renders as blank boxes.

## QR Verification _(Phase 6)_

Each certificate embeds a QR code encoding
`${NEXT_PUBLIC_APP_URL}/verify/CERT-YYYY-NNNNNN`. That page is public and shows
only the participant name, registration number, certificate number and issue
date. If the certificate number does not exist it shows **ይህ ሰርተፊኬት አልተገኘም።**

## GitHub Setup

```bash
git init                      # already initialized
git add .
git commit -m "feat: initialize Next.js registration system"
git remote add origin https://github.com/YOUR_USERNAME/registration-system.git
git branch -M main
git push -u origin main
```

Confirm no secrets are staged before the first push:

```bash
git status --short
git ls-files | grep -E '^\.env' || echo "no .env files tracked"
```

Only `.env.example` should ever appear.

## Vercel Deployment _(Phase 8)_

1. Push to GitHub.
2. In Vercel, **Add New → Project** and import the repository. Vercel detects
   Next.js automatically; no build settings need changing.
3. Add environment variables under **Settings → Environment Variables**, scoped
   per environment:

   | Environment | `NEXT_PUBLIC_APP_URL` | `DATABASE_URL` |
   | ----------- | --------------------- | -------------- |
   | Development (local `.env`) | `http://localhost:3000` | local or dev database |
   | Preview | the Vercel preview URL | a **separate** database — never production |
   | Production | `https://your-domain.com` | production pooled URL |

4. Ensure the database accepts connections from Vercel (`sslmode=require`, and
   a pooled connection URL — serverless functions open many short-lived
   connections).

Preview deployments must not point at the production database: every pull
request would otherwise write live rows and consume registration numbers.

## Security

- Validation runs on the server for every request; client-side validation is a
  convenience, never a control.
- Bank account numbers and identification numbers are excluded from
  certificates, public verification pages, API responses, and logs.
- Public identifiers are `registrationId` / `certificateNumber` — never raw
  database IDs.
- Uploads are checked for MIME type, extension, and size, and are stored in
  object storage outside the application.
- Secrets live only in environment variables. `.gitignore` blocks all `.env*`
  files except `.env.example`.
- HTTPS is enforced by Vercel in production.

## Project Structure

```
registration-system/
├── proxy.ts                  # locale rewrite/redirect (v16 middleware)
├── app/
│   ├── globals.css           # Tailwind v4 theme tokens
│   └── [lang]/
│       ├── layout.tsx        # root layout, fonts, header/footer
│       ├── page.tsx          # Amharic homepage
│       └── register/page.tsx
├── components/               # SiteHeader, SiteFooter, LanguageSwitcher, Logo
├── lib/i18n/
│   ├── config.ts             # locales, localePath()
│   ├── types.ts              # Dictionary contract
│   ├── index.ts              # getDictionary(), formatDate()
│   └── dictionaries/{am,en}.ts
├── prisma/schema.prisma
├── .env.example
└── README.md
```

> The upstream spec placed source under `src/`. This project was scaffolded with
> `app/` at the repository root and the `@/*` path alias mapped to `./*`;
> keeping that layout avoids breaking the alias. The structure is otherwise
> identical.
