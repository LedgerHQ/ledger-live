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

On mobile, `setup()` now memoises its success only. Both readers await it, so a rejection kept in
that memo was handed to `fetchRemoteFlags` too and took remote config off the network for the rest
of the session. Both of its calls are idempotent, so dropping the memo on failure simply lets the
next caller retry. The pre-migration code latched the same way, through
`skip: !initResult.isSuccess` on a mutation fired once, but it cost only freshness back then
because reads still went through the SDK and the config it holds on disk.

`whenReady()` is removed from both modules. It had no consumers.
