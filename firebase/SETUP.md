# Firebase setup for THE NIKAH MATRIMONY

This app's cloud sync groundwork is prepared. It cannot sync until the project configuration and user approvals are completed.

## Free-plan setup (Firestore sync)
1. Firebase Console > your project > Project settings > General > register a Web app, then copy its config into `firebase/firebase-config.js`.
2. Authentication > Sign-in method > enable Email/Password.
3. Create Firestore database (Spark/free plan).
4. In Authentication, create accounts for each teammate.
5. For each teammate UID, create `authorizedUsers/{UID}` in Firestore with fields: `active: true`, `owner: false`. For the main owner account set `owner: true`. Do this only in Console; clients cannot edit their authorization records.
6. Publish `firestore.rules`. These allow approved accounts to read/create/update profiles; only an approved account marked `owner: true` may delete profiles.

## Photos
Firebase Storage billing/availability requirements may vary by Firebase plan. The current app uploads photos through Storage, so confirm Storage can be enabled for your project before relying on photo sync. Do not upload sensitive profile photos until rules and access are verified.

## Important
- Never put service-account/private keys in this app.
- The web API config is client-side configuration, not a private key.
- Login and sync buttons require config, approved accounts, and published rules.
- Test with dummy profiles first. Firestore is not yet a substitute for a tested live shared database until these steps are completed.