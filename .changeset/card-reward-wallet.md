---
"@domain/api-card-management": minor
---

Read the wallet the card's rewards are paid into.

- `getRewardWallet` calls `GET /v1/wallet/reward` and answers the holder's single reward wallet: id, balance, currency and whether the funds can be withdrawn.
- The balance stays a string, so a decimal that survived the wire is not rounded on the way in.
- `type` is dropped: the endpoint always answers `"REWARD"`, so it says nothing a caller could use.
