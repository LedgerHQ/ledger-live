---
"ledger-live-desktop": patch
"live-mobile": patch
---

Fix a second account drawer opening in Swap when the receive token is a token the user does not hold yet. The parent account is now sent with `toTokenId` instead of the unresolvable synthetic token account, so the Swap live app builds the token account itself.
