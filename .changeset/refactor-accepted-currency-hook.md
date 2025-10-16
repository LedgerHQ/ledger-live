---
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/live-common": minor
---

Fix a bug where you could select unsupported coins (like NEO) in the Add Accounts flow of Modular Assets Drawer.
Refactor currency acceptance logic by introducing useAcceptedCurrency hook. This new hook encapsulates the logic for determining if a currency or token is accepted based on platform support and feature flags, replacing direct access to deactivatedCurrencyIds.

