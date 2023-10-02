---
"ledger-live-desktop": patch
"live-mobile": patch
---

fix(wallet-api): request account was not showing token accounts in some cases

The issue was only visible on mobile but is also prevented on desktop now
The issue was only reproducible when omitting the parent account currency from the currencyIds of the request account query
