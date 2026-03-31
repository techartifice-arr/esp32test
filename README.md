# ESP32 DHT11 Realtime Dashboard

This project contains:
- `esp32/DHT11_supabase.ino`: ESP32 sketch for reading DHT11 sensor data and sending it to Supabase.
- `web/`: Next.js dashboard for realtime data, device management, account login, and CSV/Excel export.

## Features
- realtime temperature/humidity logging
- Supabase-backed device table and readings table
- user sign-up / sign-in with Supabase Auth
- device management UI
- bar chart visualization
- CSV / Excel export per device
- deployable to Vercel

## Setup

1. Create a Supabase project.
2. Run the provided `supabase.sql` script in the SQL editor to create:
   - `profiles` for role-based users
   - `devices` for ESP32 units
   - `readings` for sensor telemetry
   - policies for RLS and admin/user access
3. In Supabase settings, copy the project URL and anon key.
4. Create `web/.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

5. Install the dashboard dependencies and start locally:

```bash
cd web
npm install
npm run dev
```

6. Deploy to Vercel:
   - Import this repository into Vercel.
   - Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables.
   - Build command: `npm run build`
   - Output directory: `.next`

7. Update `esp32/DHT11_supabase.ino` with your Wi-Fi credentials, Supabase URL, anon key, and `deviceId`.

8. Use the dashboard at `/{locale}` (for example, `/en`) to log in, manage users, assign devices, view realtime data, and export reports.

## ESP32 Sketch

The ESP32 sketch sends sensor data to the Supabase REST API every 30 seconds. Use the `DHT11` sensor on the assigned GPIO pin.

## Notes

- For secure production access, consider using Supabase Edge Functions or a secure gateway instead of storing secret keys on the ESP32.
- Use Supabase authentication and row-level security for user account and device management.
