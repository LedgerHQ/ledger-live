---
"@ledgerhq/live-common": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

Send the user back to the perps deposit form when they retry after a "not enough balance" error. Retrying re-ran the same deposit, which could only fail again; the form now reopens with the draft amount and funding account so the amount can be lowered. Other errors still retry in place
