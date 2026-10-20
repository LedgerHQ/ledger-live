---
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/web-tools": minor
"@devtools/pay-card": minor
"@devtools/shell": minor
"@features/flow-account-detail-settings": minor
"@features/flow-contacts": minor
"@features/flow-fear-and-greed": minor
"@features/flow-contacts-detail": minor
"@features/flow-contacts-introduction": minor
"@features/flow-contacts-list": minor
"@features/flow-pay-balance": minor
"@features/flow-pay-card-assets": minor
"@features/flow-pay-card-details": minor
"@features/flow-pay-card-transactions": minor
"@features/flow-pay-card-widget": minor
"@features/flow-pay-contact": minor
"@features/flow-pay-deposit": minor
"@features/flow-pay-request": minor
"@features/platform-contacts": minor
"@shared/ui-app-unavailable": minor
"@shared/ui-info-state": minor
"@support/jest-devtools": minor
---

Bump Lumen to lumen-design-core 0.1.32, lumen-ui-react 0.1.64, lumen-ui-rnative 0.1.67 and lumen-utils-shared 0.1.16, and migrate `Spot` to its palette API (`icon` required, `appearance="icon"` dropped, `check`/`info`/`error`/`warning`/`loader` mapped to explicit icons, `number` moved to `SpotNumber`). The devtools native jest preset now mocks `react-native-gesture-handler`, which the new lumen `Toaster` imports.
