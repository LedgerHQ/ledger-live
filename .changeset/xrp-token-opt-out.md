---
"@ledgerhq/live-common": minor
"@ledgerhq/ledger-wallet-framework": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

XRP: add the `optOut` transaction mode, which removes a token with a pending `OPT_OUT` row and reviews its flags, qualities and fields on the device, and drop a stored XRP token that a sync no longer finds. Add the opt-out error and reserve strings. A family sets `dropsMissingTokens` on its bridge to drop missing tokens
