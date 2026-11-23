# Firebase cloud sync setup (initial groundwork)

1. Create a Firebase project and register a Web app in Firebase Console.
2. Enable Authentication > Email/Password.
3. Create Firestore Database and Storage.
4. Copy the Web app config into `firebase/firebase-config.js` (this is public client config, not a service-account key).
5. Deploy the rules in `firestore.rules` and `storage.rules` after reviewing them.
6. Add each approved device/user in Authentication. Then create `authorizedUsers/{uid}` in Firestore with `active: true`. Do not allow clients to create authorization records.

The rules restrict profile data to authenticated users with an active authorization record. Test rules in the Firebase Rules Playground before storing real biodata/photos. This groundwork does not yet enable cloud sync in the app; app integration is the next stage.
