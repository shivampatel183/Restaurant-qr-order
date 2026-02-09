# Restaurant QR Order (Angular + Supabase)

Complete QR ordering system with:

- Customer menu ordering flow (`/menu?table=12`)
- Kitchen live order board (`/kitchen`)
- Admin panel for menu + order operations (`/admin`)
- Responsive UI for mobile/tablet/desktop
- Supabase Postgres + Realtime + Auth + RLS
- No custom backend
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
npm run starthttps://github.com/shivampatel183/Restaurant-qr-order/pull/2/conflict?name=README.md&base_oid=3c517d92acd7293a2971ac07f781d7adf5da3ad6&head_oid=1c78603ef2f77f2652f04c7cff4de28affa72bcf
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
 │   │   │   ├── menu.service.ts
 │   │   │   └── order.service.ts
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

## Supabase setup

1. Open Supabase SQL editor.
2. Run `supabase/schema.sql`.
3. In Auth, create admin users (email/password).
4. Put project credentials in:
   - `src/environments/environment.ts`
   - `src/environments/environment.prod.ts`

## Run app

```bash
npm install
npm run start
```

## Notes

- Menu page resolves table from query parameter and validates against active tables.
- Kitchen page listens to realtime inserts + updates.
- Admin can log in, manage menu item availability, and track order summary.
