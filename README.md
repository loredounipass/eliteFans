# EliteFans

EliteFans is an exclusive content platform built with Next.js, Supabase, and TypeScript. This README explains how to install, configure, and run the project locally, how to set up Supabase (including Auth, Database and Storage), and how to ensure the site logo/favicon appears correctly in the browser.

---

## Table of Contents

- Prerequisites
- Installation
- Environment Variables
- Supabase Setup
	- Create project
	- Database migrations / schema
	- Storage bucket (elitebucket) & RLS
	- Service role / API keys
- Local development
- Favicon / logo instructions
- Build & Deploy (short notes)
- Troubleshooting
- Useful links

---

## Prerequisites

Make sure you have the following installed on your machine:

- Node.js (>= 18) — https://nodejs.org/
- pnpm (recommended) or npm/yarn
	- Install pnpm: `npm i -g pnpm`
- A Supabase account — https://supabase.com/
- An editor (VS Code recommended)

---

## Installation

1. Clone the repository:

	 ```bash
	 git clone <your-repo-url>
	 cd eliteFans
	 ```

2. Install dependencies (pnpm recommended):

	 ```bash
	 pnpm install
	 # or
	 npm install
	 ```

---

## Environment Variables

Create a `.env.local` file at the project root and set the following variables (values come from your Supabase project):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (optional; only for server-side privileged actions)
NEXTAUTH_URL=http://localhost:3000 (if used)
```

Notes:
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are required for both client and server usage.
- `SUPABASE_SERVICE_ROLE_KEY` should be kept secret and used only on server-side code or CI.

---

## Supabase Setup

Follow these steps inside your Supabase project dashboard.

### 1) Create a Project

- Create a new project in Supabase and note the project URL and anon/service role keys.

### 2) Database schema

- If you have SQL scripts in `scripts/` (this repo includes several), you can run them in Supabase SQL Editor to create tables, triggers, and seed data. For example:

	- `00_create_media_tables.sql`
	- `01_create_profiles_table.sql`
	- `02_create_posts_table.sql`
	- `03_create_subscriptions_table.sql`
	- `04_create_likes_table.sql`
	- `05_create_comments_table.sql`
	- `06_create_transactions_table.sql`
	- `07_create_messages_table.sql`
	- `08_seed_sample_data.sql`
	- `09_fix_profile_trigger.sql`
	- `10_storage_policies.sql` (contains suggested storage RLS; you must review/execute)

Run these in order via the Supabase SQL editor.

### 3) Storage (media uploads)

- Create a Storage bucket named `elitebucket` (or use the name in your code).
- If you want to allow authenticated browser uploads, configure the RLS policies on `storage.objects` appropriately. A typical policy to allow authenticated users to INSERT with their user id as `metadata->>'owner'` is included in `scripts/10_storage_policies.sql`. Run it from the SQL editor after reviewing.

Important: you must adapt RLS to your security requirements. If you prefer, make the bucket public for testing, but for production you should implement signed URLs or server-signed access for private media.

### 4) Auth

- Enable Email/Password provider in Supabase Auth settings.
- Optionally configure SMTP settings for email confirmations.

---

## Local development

Start the dev server:

```bash
pnpm dev
# or npm run dev
```

Open http://localhost:3000 in your browser.

If you change the favicon/logo and it doesn't show up, follow the Favicon / logo instructions below.

---

## Favicon / logo instructions

This repo serves static assets from the `public/` folder. The project expects the following files in `public/`:

- `favicon.ico` — the browser favicon
- `elitfans-logo.png` — brand wordmark / logo (used in headers)

If you want the tab icon (favicon) to appear next to the URL and inside the navbar as in the UI, ensure:

1. `public/favicon.ico` exists. You can replace it with your own `.ico` file.
2. The app includes explicit head links in `app/head.tsx`:

```tsx
<link rel="icon" href="/favicon.ico" />
<link rel="shortcut icon" href="/favicon.ico" />
<link rel="apple-touch-icon" href="/favicon.ico" />
```

3. In some parts of the app we add a cache-busting query param (e.g. `/favicon.ico?v=2`). When you replace the file, increase the version to force browsers to reload the asset.

4. Hard-refresh the browser or open in an incognito window to avoid cached favicons.

To display the brand wordmark in the navbar use `public/elitfans-logo.png` and reference it as `/elitfans-logo.png` in an `<img>` tag. The repo already contains a header component that uses that path.

---

## Build & Deploy (short notes)

- For deployment you can use Vercel, Netlify, or any platform that supports Next.js. On Vercel, set the same environment variables in the project settings.
- Make sure to keep the `SUPABASE_SERVICE_ROLE_KEY` out of client-side bundles.

---

## Troubleshooting

- Favicon not updating: browser cache — use version query param or incognito window.
- Storage upload RLS errors: run `scripts/10_storage_policies.sql` and adapt it to your schema. For uploads from the browser you must allow authenticated inserts or use signed uploads from server.
- Auth errors: verify `NEXT_PUBLIC_SUPABASE_URL` and anon key are correct.

---

## Useful links

- Next.js: https://nextjs.org/
- Supabase docs: https://supabase.com/docs
- Tailwind CSS (used for styles): https://tailwindcss.com/

---

If you want, I can also:

- Add a `docs/` folder with step-by-step screenshots for Supabase setup.
- Generate optimized favicons in multiple sizes and add a `site.webmanifest`.
- Provide a small script to run the SQL scripts in order if you want CLI automation.

