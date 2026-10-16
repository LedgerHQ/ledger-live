---
"ledger-live-desktop": patch
"live-mobile": patch
"@ledgerhq/web-tools": patch
"@devtools/pay-card": patch
"@devtools/shell": patch
"@features/flow-account-detail-settings": patch
"@features/flow-contacts": patch
"@features/flow-fear-and-greed": patch
"@features/flow-contacts-detail": patch
"@features/flow-contacts-introduction": patch
"@features/flow-contacts-list": patch
"@features/flow-pay-balance": patch
"@features/flow-pay-card-assets": patch
"@features/flow-pay-card-details": patch
"@features/flow-pay-card-transactions": patch
"@features/flow-pay-card-widget": patch
"@features/flow-pay-contact": patch
"@features/flow-pay-deposit": patch
"@features/flow-pay-request": patch
"@features/platform-contacts": patch
"@shared/ui-app-unavailable": patch
"@shared/ui-info-state": patch
"@support/jest": patch
---

Bump Lumen to lumen-design-core 0.1.32, lumen-ui-react 0.1.64, lumen-ui-rnative 0.1.67 and lumen-utils-shared 0.1.16, and migrate `Spot` to its palette API (`icon` required, `appearance="icon"` dropped, `check`/`info`/`error`/`warning`/`loader` mapped to explicit icons, `number` moved to `SpotNumber`). The devtools native jest preset now mocks `react-native-gesture-handler`, which the new lumen `Toaster` imports.
