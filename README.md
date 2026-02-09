# Restaurant QR Order (Angular + Supabase)

This project is a production-oriented Angular frontend that uses Supabase directly (database, realtime, auth, RLS) without a custom backend.

## Features

- Customer menu page with QR/table query parameter support (`/menu?table=<id>`)
- Live kitchen dashboard with realtime order inserts
- Admin panel for menu management and daily summary
- Supabase auth guard for kitchen/admin routes
- SQL schema + RLS policies included

## Setup

1. Update `src/environments/environment.ts` and `src/environments/environment.prod.ts` with your Supabase project URL and anon key.
2. Run SQL from `supabase/schema.sql` in Supabase SQL Editor.
3. Install dependencies and run:

```bash
npm install
npm run start
```

## Route map

- `/menu` customer ordering page
- `/kitchen` kitchen operations (authenticated)
- `/admin` admin controls (authenticated)

## Architecture

```text
src/
 ├── app/
 │   ├── core/
 │   │   ├── services/
 │   │   │   ├── supabase.service.ts
 │   │   │   ├── order.service.ts
 │   │   │   └── menu.service.ts
 │   │   └── guards/
 │   │       └── admin.guard.ts
 │   ├── pages/
 │   │   ├── menu/
 │   │   ├── kitchen/
 │   │   └── admin/
 │   ├── shared/
 │   │   ├── components/
 │   │   └── models/
 │   └── app-routing.module.ts
 └── environments/
```
