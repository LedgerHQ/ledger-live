---
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Support `allowManager` in wallet-api `device.transport` / `device.select` so wallet apps can request a Manager-ready transport (BOLOS dashboard) and issue Manager APDUs.

Also fixes an inverted version check in `device.transport` / `device.select` that rejected app versions satisfying `appVersionRange` (and accepted ones that didn't).
