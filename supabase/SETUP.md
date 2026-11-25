# THE NIKAH MATRIMONY — Supabase first-time setup

This branch adds the app login gate, persistent Supabase Auth session, cloud profile/photo sync, and a Realtime refresh. Existing local browser/app records are retained; on the first successful login, local profiles are uploaded and merged with cloud profiles.

## One-time Supabase setup

1. Open the Supabase project for `https://yexmnedkkkfdtatyolhz.supabase.co`.
2. Open **SQL Editor**, create a new query, paste the complete contents of `supabase/setup.sql`, and Run it.
3. Open **Authentication → Users → Add user**.
4. Create the user with email **thenikahmatrimony@gmail.com** and choose the password that all admins will share. Confirm/verify the user if the dashboard asks.
5. In **Authentication → Providers → Email**, keep Email/Password enabled. Since all admins share one login, share the password only with trusted admins.

## App login

- Login ID shown in the app: `thenikahmatrimony`
- Supabase email used internally: `thenikahmatrimony@gmail.com`
- Password: the one created in Supabase Auth (not stored in source code).
- Login screen appears before any biodata or dashboard. Session persists until Logout.
- The Sync control and Logout control are inside the app.

## Data safety and sync notes

- The first login merges device-local profiles into the cloud; it does not clear local data.
- Photos are uploaded to a private Storage bucket and downloaded for the app when syncing.
- Profile data is protected by authenticated-user RLS. All users authenticated to this shared admin account have equal access, including delete.
- Realtime changes trigger a background refresh while the app is open; the Sync control is also available for manual refresh.
- Keep a separate backup before using this with live sensitive biodata. Test with a few sample profiles on two devices first.
- The publishable key is designed for client apps; never put a Supabase secret/service-role key in the APK.
