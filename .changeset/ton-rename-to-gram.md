---
"@ledgerhq/cryptoassets": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

Rename the native TON cryptocurrency to Gram (ticker `GRAM`) following Toncoin's official rebrand. Updates the currency `name`, `ticker`, unit name/code and explorer (now `gramscan.org`) in `@ledgerhq/cryptoassets`, plus the related account sub-header label and swap/error copy in the desktop and mobile apps. The currency `id` (`ton`), `family`, `scheme`, color and manager app name are intentionally unchanged, so accounts, balances and addresses are unaffected.
