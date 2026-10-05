---
"@ledgerhq/live-common": minor
"ledger-live-desktop": patch
---

Resolve the Perps `custom.perps.deposit` request with the swap ID and quoted amount once the deposit is broadcast, and reject it when the user cancels. The deposit request now lives in `wallet-api/Perps/depositRequest` and is shared by desktop and mobile
