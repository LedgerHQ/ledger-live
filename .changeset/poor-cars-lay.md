---
"@ledgerhq/live-common": patch
---

fix: wrong error when user tries to install apps when device is locked

The bug was due to a wrong implementation of the rxjs operator `retry`.

The `bot/engine.ts` retry mechanism has been updated too.
