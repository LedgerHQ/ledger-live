---
"ledger-live-desktop": minor
---

Fix NoFundsStake modal passing raw currency object to Swap live-app instead of expected `{ toCurrencyId }` format, causing the Receive field to not be pre-filled when navigating from Earn zero-balance account flow
