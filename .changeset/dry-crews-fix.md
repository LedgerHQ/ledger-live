---
"live-mobile": minor
"@features/flow-account-detail-settings": minor
---

XRP: add a "Manage assets" entry to the account settings that lists the IOU and MPT tokens of the account and opens "Edit details" (balance limit and rippling) for an IOU, reviewed before signing, and show a bridge failure on the add-token settings screen. `AccountSettingsSheet` and `AccountSettingsMenu` take an optional `onManageAssets` that adds the row on mobile
