---
"ledger-live-mobile-e2e-tests": patch
"live-mobile": patch
---

Let the mobile Ledger Sync e2e suites run against the PROD trustchain during a release validation. The environment now reaches the app as a Detox launch arg, which the e2e bridge applies before the app tree mounts — the only point where the trustchain SDK singleton can still be pinned — so it no longer has to be refused outright.
