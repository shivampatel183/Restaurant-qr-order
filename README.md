# Restaurant QR Order (Angular + Supabase)

Complete QR ordering system with:

- Customer menu ordering flow (`/menu?table=12`)
- Kitchen live order board (`/kitchen`)
- Admin panel for menu + order operations (`/admin`)
- Responsive UI for mobile/tablet/desktop
- Supabase Postgres + Realtime + Auth + RLS
- No custom backend

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
