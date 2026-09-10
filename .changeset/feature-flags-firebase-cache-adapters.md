---
"ledger-live-desktop": minor
"live-mobile": minor
---

fix(feature-flags): serve the flags cached on the device at boot

Both apps read their Firebase feature flags with `getAll()` placed behind
`await fetchAndActivate()`, so a rejected or still-pending fetch never reached it and every flag
resolved to its compiled default. Meanwhile the Firebase SDK was holding the config it activated
in an earlier session on disk, unread.

Each app now exposes `readCachedFlags()`, which serves that activated config with no network
access, and the feature-flags middleware primes from it before the first fetch. A device that has
been online at least once now boots on the values the backend actually sent, even offline.

Entries the SDK serves from the seeded defaults are excluded from both reads, so a flag missing
from the Firebase template is no longer recorded as if it had come from the backend. The resolved
value is unchanged, since the slice falls back to those same defaults.

`whenReady()` is removed from both modules. It had no consumers.
