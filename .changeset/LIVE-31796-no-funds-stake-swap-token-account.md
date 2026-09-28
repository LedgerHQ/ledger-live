---
"ledger-live-desktop": patch
"live-mobile": patch
---

Fix the Swap receive field staying empty when reaching Swap from the Earn no-funds screen. Desktop now always identifies a token by `toTokenId` (plus its `toToken` alias), which `toCurrencyId` alone could not do; mobile passed no parameters at all and now forwards the asset. On both, an account the Earn live app synthesised for a token the user does not hold is no longer sent as an unresolvable id
