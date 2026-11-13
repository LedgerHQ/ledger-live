---
"@ledgerhq/live-common": minor
---

Perps: closing the signing modal rejects `custom.perps.signActions` with `UserRefusedOnDevice` instead of a plain error, so the live app can tell a cancel from a failure.
