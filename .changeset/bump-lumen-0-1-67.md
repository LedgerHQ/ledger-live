---
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/web-tools": minor
"@devtools/account-data": minor
"@devtools/account-descriptor": minor
"@devtools/account-name": minor
"@devtools/app-config": minor
"@devtools/cloud-sync": minor
"@devtools/device-onboarding": minor
"@devtools/feature-flags": minor
"@devtools/pay-card": minor
"@devtools/shell": minor
"@devtools/transport-panel": minor
"@devtools/trustchain": minor
"@features/flow-account-detail-hero": minor
"@features/flow-contacts": minor
"@features/flow-contacts-add-contact": minor
"@features/flow-contacts-introduction": minor
"@features/flow-contacts-list": minor
"@features/flow-large-screen-upsell": minor
"@features/flow-pay-balance": minor
"@features/flow-pay-card-details": minor
"@features/platform-style": minor
"@shared/ui-info-state": minor
---

Bump Lumen to lumen-design-core 0.1.34, lumen-ui-react 0.1.67, lumen-ui-rnative 0.1.70, lumen-utils-shared 0.1.18 and lumen-lint-plugin 0.1.1. `cn` now comes from `@ledgerhq/lumen-design-core/cn` (the local helpers re-export it), the `Apex` icon is renamed `NanoGen5`, the removed `BellNotification` and `ShieldCheckNotification` icons are replaced by the plain icon inside a red `DotIndicator`, `FormattedValue` is imported from `@ledgerhq/lumen-ui-react` instead of `@ledgerhq/lumen-utils-shared`, Tailwind font classes that produce no CSS under the Lumen preset are dropped, and the `clsx`, `tailwind-merge`, `@radix-ui/react-switch` and `@radix-ui/react-checkbox` declarations Lumen no longer needs are removed.
