---
"@ledgerhq/live-common": patch
---

Rebuild the typed device errors that `@zondax/ledger-casper` flattens into a raw return code, so a Casper transaction or address rejected on device shows the "Action rejected" copy and a locked device shows the unlock screen, instead of a raw `27014 - ...` / `21781 - Unknown Status Code` error.
