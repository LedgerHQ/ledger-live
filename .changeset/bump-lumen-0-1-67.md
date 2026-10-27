---
"ledger-live-desktop": patch
"live-mobile": patch
"@ledgerhq/web-tools": patch
"@devtools/account-data": patch
"@devtools/account-descriptor": patch
"@devtools/account-name": patch
"@devtools/app-config": patch
"@devtools/cloud-sync": patch
"@devtools/device-onboarding": patch
"@devtools/feature-flags": patch
"@devtools/pay-card": patch
"@devtools/shell": patch
"@devtools/transport-panel": patch
"@devtools/trustchain": patch
"@features/flow-account-detail-hero": patch
"@features/flow-contacts": patch
"@features/flow-contacts-add-contact": patch
"@features/flow-contacts-introduction": patch
"@features/flow-contacts-list": patch
"@features/flow-large-screen-upsell": patch
"@features/flow-pay-balance": patch
"@features/flow-pay-card-details": patch
"@features/platform-style": patch
"@shared/ui-info-state": patch
---

Bump Lumen to lumen-design-core 0.1.34, lumen-ui-react 0.1.67, lumen-ui-rnative 0.1.70, lumen-utils-shared 0.1.18 and lumen-lint-plugin 0.1.1. `cn` now comes from `@ledgerhq/lumen-design-core/cn` (the local helpers re-export it), the `Apex` icon is renamed `NanoGen5`, the removed `BellNotification` and `ShieldCheckNotification` icons are replaced by the plain icon inside a red `DotIndicator`, `FormattedValue` is imported from `@ledgerhq/lumen-ui-react` instead of `@ledgerhq/lumen-utils-shared`, Tailwind font classes that produce no CSS under the Lumen preset are dropped, and the `clsx`, `tailwind-merge`, `@radix-ui/react-switch` and `@radix-ui/react-checkbox` declarations Lumen no longer needs are removed.
