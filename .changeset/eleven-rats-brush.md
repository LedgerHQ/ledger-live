---
"@ledgerhq/live-common": patch
"@ledgerhq/coin-bitcoin": patch
"ledger-live-desktop": patch
---

Sentry: disable capture of "performance spans", which were not actually in use, but still causing a stop of the internal process on LLD Windows
