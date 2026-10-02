---
"ledger-live-desktop": minor
---

fix(desktop): build nightlies against the production Firebase project

Desktop nightlies compiled the whole `.env.staging`, so they read feature flags from the Firebase
staging project while mobile nightlies read production. Nightlies keep the staging services (Braze,
Segment, Earn, Card, Datadog) but now take their `FIREBASE_*` values from `.env.production`.
