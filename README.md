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
| 9 | Payment, admin approval and gated certificate download | ✅ Done |

Sections below marked _(Phase N)_ describe work that is planned but not yet
implemented.

---

## Features

- **Amharic by default.** `/` serves Amharic; English is available at `/en`.
- **Locale-free public URLs.** Certificate verification links never carry a
  language prefix, so a printed QR code stays valid forever.
- **Correct Ethiopic typography** via self-hosted Noto Sans Ethiopic.
- **Sensitive data isolation.** The bank account number never appears on
  certificates, public pages or public URLs. The identification number appears
  only on the certificate its holder downloads, never on a public page.
- **Payment before certificate.** A registration is `Pending payment` until the
  registrant submits proof of payment and an administrator approves it. The
  certificate endpoint refuses everything else.
- **Administrator dashboard** with statistics, search, filters, receipt review
  and an audited approve/reject decision.
- **Stateless.** No local filesystem or in-memory state — safe on serverless.

## Registration Workflow

```
1. Registrant fills the form            -> status: Pending payment
2. Success page shows payment details
3. Registrant pays, then submits a receipt and/or a reference number
                                        -> status: Payment submitted
4. Administrator reviews the receipt in the dashboard
5. Administrator approves               -> status: Approved
6. Registrant looks their ID number up at /status
7. Certificate PDF downloads
```

A registration can also be **rejected**, with a reason the registrant sees on
the status page. Re-submitting payment proof after a rejection puts the
registration back into review.

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
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | Phase 9 | Read **only** by `npm run admin:create`. Never read by the running app. |
| `PAYMENT_*` | Phase 9 | Initial payment instructions, used until an administrator saves them in the dashboard. See below. |

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

### Migrations and seeding

```bash
npx prisma migrate deploy        # apply migrations (production and CI)
npm run admin:create             # create the default administrator
npm run admin:create -- --reset-password   # reset an existing one
```

`npm run admin:create` is the seeder. It reads `ADMIN_EMAIL`, `ADMIN_PASSWORD`
and `ADMIN_NAME` from the environment (falling back to `admin@example.com` /
`Admin@123456` / `Administrator`), hashes the password with scrypt and inserts
one `AdminUser` row. It is idempotent: an existing account is left alone unless
`--reset-password` is passed.

The account is always created with **must change password** set, so the
dashboard shows a banner until the password is replaced under
**Admin → Change password**. Set a real `ADMIN_PASSWORD` in production; the
documented default is a bootstrap credential only.

## Photo and Receipt Storage _(Phase 4, extended in Phase 9)_

Photos and payment receipts are uploaded to Vercel Blob; PostgreSQL stores only
the resulting URL and metadata. Nothing is written to the local filesystem in
production — Vercel's serverless filesystem is ephemeral and read-only. Without
Blob credentials (local development only) files fall back to `.uploads/`, and
that driver refuses to run in production so a missing token fails loudly at
deploy time instead of silently losing every upload.

Receipts are held to the same rules as photos plus PDF: at most 4 MB, and the
accepted type is decided by sniffing the leading bytes, never by the declared
MIME type.

Vercel Blob has no private access mode — every blob is public at an unguessable
URL. Receipt URLs are therefore treated as secrets: they are never rendered into
a page or an API response. The bytes are proxied through
`GET /api/admin/registrations/[registrationId]/receipt`, which requires an admin
session and serves them with `nosniff` and a restrictive CSP.

## Payment Information _(Phase 9)_

Payment instructions live in a single `PaymentSetting` row that an administrator
edits under **Admin → Payment information**, so bank details change without a
deployment. Until that row exists the `PAYMENT_*` environment variables supply
the values; if neither is set, registrants are told payment details have not
been published yet rather than shown placeholder dashes.

## Certificate Generation _(Phase 5, gated in Phase 9)_

`GET /api/certificate/[registrationId]` **refuses any registration whose status
is not `APPROVED`**, answering 403 with the "not yet approved" message. This is
the control — hiding the download button is only a courtesy, and changing the
URL by hand gets you nowhere.

For an approved registration it loads the record through a narrowed Prisma
`select` that cannot return the bank account number, renders a PDF with
`@react-pdf/renderer`, and returns it as a download. Noto Sans Ethiopic is
registered explicitly with the PDF renderer — without a registered Ethiopic
font, Amharic text renders as blank boxes.

The certificate carries the organization name, the holder's full name and
identification number, the registration and certificate numbers, the
registration date, the approval date as the issue date, the authorized
signature, the stamp and the verification QR code.

## Administration _(Phase 9)_

| Page | Path |
| ---- | ---- |
| Login | `/admin/login` |
| Dashboard (statistics, search, filters, table) | `/admin` |
| Registration details, receipt review, approve/reject | `/admin/registrations/[registrationId]` |
| Payment information | `/admin/settings` |
| Change password | `/admin/password` |

Sessions are rows in `AdminSession`, keyed by the SHA-256 hash of a random token
held in an `httpOnly`, `sameSite=lax`, `secure`-in-production cookie for 12
hours. Because the session is server-side, logging out and changing a password
revoke access immediately; a changed password invalidates every other session
for that account.

`app/[lang]/admin/(protected)/layout.tsx` guards the pages, and every admin
route handler re-checks the session itself — a layout cannot protect an API
endpoint.

## API

| Method | Route | Auth |
| ------ | ----- | ---- |
| `POST` | `/api/register` | public, rate limited |
| `POST` | `/api/registration/[registrationId]/payment` | knowledge of the registration number; refuses once verified or approved |
| `GET` | `/api/certificate/[registrationId]` | approved registrations only |
| `POST` | `/api/admin/login` · `/api/admin/logout` | public / session |
| `POST` | `/api/admin/password` · `/api/admin/settings` | admin session |
| `POST` | `/api/admin/registrations/[registrationId]/approve` · `/reject` | admin session |
| `GET` | `/api/admin/registrations/[registrationId]/receipt` | admin session |

Registration status is read through the page at `/status?id=<ID number>` rather
than a public JSON endpoint.

## Testing the Workflow

```bash
npx prisma migrate deploy
npm run admin:create
npm run dev
```

1. Register at `/register`. You land on the success page: status **Pending
   payment**, payment details, and the receipt form.
2. Submit a reference number, a receipt (JPG/PNG/WebP/PDF), or both. Status
   becomes **Payment submitted**.
3. Confirm the certificate is still refused:
   `curl -i http://localhost:3000/api/certificate/REG-2026-000001` → `403`.
4. Log in at `/admin/login` with `admin@example.com` / `Admin@123456`.
5. Open the registration, review the receipt, click **Approve registration** and
   confirm.
6. Visit `/status`, enter the ID number, and download the certificate. The same
   `curl` from step 3 now returns a PDF.

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
- Bank account numbers are excluded from certificates, public pages, API
  responses and logs. Identification numbers are excluded from every public page
  and API response; they appear only on the certificate its holder downloads,
  which is served `private, no-store` to approved registrations only.
- Public identifiers are `registrationId` / `certificateNumber` — never raw
  database IDs.
- Uploads are checked for declared type, size, **and leading bytes**, and are
  stored in object storage outside the application. Receipts are served only
  through an admin-authenticated route, with `nosniff` and a restrictive CSP.
- Certificate downloads are authorized on the server by registration status.
- Admin passwords are scrypt hashes with a per-account salt, compared in
  constant time. Login answers with one message for a wrong password, an unknown
  email and a disabled account alike, and hashes even for unknown emails so
  timing does not reveal which addresses are administrators.
- Admin sessions are server-side rows referenced by a hashed random token in an
  `httpOnly` cookie; logout and password changes revoke them immediately.
- State-changing endpoints check the `Origin` header and ride on a `sameSite`
  cookie, so a cross-site form post carries no session and is refused.
- Login, registration and payment submission are rate limited per IP.
- Duplicate registrations are prevented by unique constraints on the
  identification number and the phone number.
- Secrets live only in environment variables. `.gitignore` blocks all `.env*`
  files except `.env.example`.
- HTTPS is enforced by Vercel in production.

> **Known limitation.** The rate limiter is in-process (see `lib/rate-limit.ts`),
> so on serverless the effective limit multiplies by the number of warm
> instances. Move it to a shared store (Upstash Redis / Vercel KV) before
> treating it as a real control.

## Project Structure

```
registration-system/
├── proxy.ts                  # locale rewrite/redirect (v16 middleware)
├── app/
│   ├── globals.css           # Tailwind v4 theme tokens
│   ├── [lang]/
│   │   ├── layout.tsx        # root layout, fonts, header/footer
│   │   ├── page.tsx          # Amharic homepage
│   │   ├── register/page.tsx
│   │   ├── success/[registrationId]/page.tsx   # status + payment + certificate
│   │   ├── status/page.tsx                     # lookup by ID number
│   │   ├── verify/[certificateNumber]/page.tsx
│   │   └── admin/
│   │       ├── login/page.tsx                  # public
│   │       └── (protected)/                    # session-guarded layout
│   │           ├── page.tsx                    # dashboard
│   │           ├── registrations/[registrationId]/page.tsx
│   │           ├── settings/page.tsx
│   │           └── password/page.tsx
│   └── api/
│       ├── register/route.ts
│       ├── registration/[registrationId]/payment/route.ts
│       ├── certificate/[registrationId]/route.ts
│       └── admin/…                              # login, logout, password,
│                                                # settings, approve, reject,
│                                                # receipt
├── components/               # shared UI + components/admin/*
├── lib/
│   ├── auth.ts               # scrypt hashing, sessions, admin guards
│   ├── status.ts             # status literals, badges, download rule
│   ├── payment-settings.ts   # payment instructions (row, env fallback)
│   ├── storage.ts            # photo/receipt storage drivers
│   ├── validation.ts         # zod schemas shared by client and server
│   └── i18n/
│       ├── config.ts         # locales, localePath()
│       ├── types.ts          # Dictionary contract
│       ├── index.ts          # getDictionary(), formatDate()
│       └── dictionaries/{am,en}.ts
├── prisma/schema.prisma
├── scripts/create-admin.mjs  # administrator seeder
├── .env.example
└── README.md
```

> The upstream spec placed source under `src/`. This project was scaffolded with
> `app/` at the repository root and the `@/*` path alias mapped to `./*`;
> keeping that layout avoids breaking the alias. The structure is otherwise
> identical.
