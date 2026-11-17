# SmartPark – Smart Parking Availability and Reservation System

A Next.js + TypeScript + Supabase starter project with customer registration/login, parking search, reservations, booking history, cancellation, and an admin dashboard.

## Requirements
- Node.js 20.9 or newer
- A Supabase project
- Your Supabase Project URL and publishable/anon key

## Setup
1. Extract this ZIP.
2. Open the extracted `SmartPark_Complete_Project` folder in VS Code.
3. Open a terminal in that folder and run `npm install`.
4. Copy `.env.example` to a new file named `.env.local`.
5. Fill `.env.local` with your Supabase Project URL and publishable key. Never put a `service_role` or secret key in a `NEXT_PUBLIC_` variable.
6. In Supabase → SQL Editor, run `supabase/schema.sql` if this is a **new/empty database**. If you already have the SmartPark tables and policies from your earlier work, do not rerun the whole schema blindly; compare the SQL first.
7. In Supabase → Authentication → URL Configuration, set Site URL to `http://localhost:3000` while developing.
8. For easy local testing, turn off email confirmation temporarily in Authentication → Providers → Email. Turn it back on and configure email delivery before public deployment.
9. Run `npm run dev` and open `http://localhost:3000`.

## Make an admin account
1. Register a normal account through `/register`.
2. In Supabase → Table Editor → `profiles`, find that account's row.
3. Change only its `role` value from `customer` to `admin`.
4. Sign out and sign in again, then open `/admin`.

Do not expose admin role editing to customers. Promote admins only from the Supabase dashboard.

## Important notes
- Booking uses a database RPC function to validate the time window and prevent overlapping confirmed bookings.
- This version supports same-day reservations (entry and exit on the same date).
- The slot's `current_status` is an operational status (Available/Occupied). It is not a calendar availability indicator. The reservation RPC checks overlapping bookings separately.
- The admin reserved statistic counts confirmed bookings, not a subtraction from available/occupied counts. It is a count of reservations, not necessarily unique physical spaces.
- This is a development/college-project baseline. Before real public use, review security, configure email confirmation and SMTP, add server-side authorization, monitoring, backups, and production deployment settings.
