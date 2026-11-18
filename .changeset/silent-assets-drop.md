---
"live-mobile": minor
"@ledgerhq/live-dmk-shared": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
---

XRP: delete a token from Manage assets on mobile

- Block the delete while the token balance is above 0, a removal is pending or the token is frozen
- Confirm, sign on the device, then show success or error
- Add the `manage_assets` source flow to device intent tracking
- Share `hasPendingXrpTokenRemoval` between desktop and mobile
