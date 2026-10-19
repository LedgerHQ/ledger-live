---
"@features/flow-account-detail-settings": minor
"ledger-live-desktop": minor
---

Open the Account settings dialog from the Crypto addresses rows when the Account Detail page is enabled for the account's currency; other rows keep the Edit name button. New `AccountSettings` component (web): the settings logic lives in the package and the app only provides an `AccountSettingsAdapter` (account name, rename, sync state, locale, derivation tag).
