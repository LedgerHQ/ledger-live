---
"@ledgerhq/devices": minor
"ledger-live-desktop": patch
"live-mobile": patch
---

Add `getProductName` to `@ledgerhq/devices` returning the plain, canonical device product name (e.g. "Ledger Flex"), and deprecate the app-level `getProductName` utils that strip the "Ledger" prefix.
