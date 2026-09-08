---
"@ledgerhq/live-currency-format": patch
"@ledgerhq/ledger-wallet-framework": patch
"ledger-live-desktop": patch
"live-mobile": patch
"@ledgerhq/live-cli": patch
"@shared/env": patch
---

Migrate `BIG_NUMBER_DECIMAL_PLACES` off `@ledgerhq/live-env`: every call site now inlines the constant and the definition is removed. `@ledgerhq/live-currency-format` drops its `@ledgerhq/live-env` dependency altogether.
