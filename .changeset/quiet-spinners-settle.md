---
"@ledgerhq/live-countervalues": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Fix the global synchronization spinner spinning indefinitely when the portfolio contains only empty accounts (LIVE-32175). Empty accounts are never tracked for countervalues, so `getPortfolio` reported `balanceAvailable: false` forever, which kept `isColdStart`/`isBalanceLoading` true and the sync lifecycle stuck on `"syncing"`. `getPortfolio` now reports the balance as available when every still-unpriced account is empty (the total is a known 0), so the spinner settles and the balance shows instead of a permanent placeholder.
