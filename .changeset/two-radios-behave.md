---
"ledger-live-desktop": minor
"live-mobile": minor
---

fix(wallet-api): apply currency limit logic to legacy account drawer

Fixes the swap live-app by ensuring the legacy SelectAccountAndCurrencyDrawer
applies the same currency filtering logic as the modular drawer.

Previously, only the modular drawer path checked shouldUseCurrencies
(limiting to 50 currencies when useCase is provided). The legacy drawer
was passing currencyIds directly without this check, causing issues.

Changes:
- Extract shouldUseCurrencies calculation before drawer branching
- Apply filtering consistently to both modular and legacy drawer paths
- Forward useCase parameter through account selection flows (desktop & mobile)
- Pass useCase to useAssetsData hook for proper asset filtering

This ensures consistent behavior across both drawer implementations.
