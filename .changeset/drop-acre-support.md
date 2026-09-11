---
"@ledgerhq/live-common": major
"ledger-live-desktop": minor
"live-mobile": minor
---

feat: drop ACRE support

Nothing consumes ACRE anymore: the live-app catalog serves no `acre` manifest and the mobile BTC stake action pointed at a missing live app.

Removed:

- the `@ledgerhq/wallet-api-acre-module` package
- `wallet-api/ACRE` (server + tracking) and `families/bitcoin/ACRESetup.ts` in live-common
- the `@blooo/hw-app-acre` dependency
- every `isACRE` branch in the desktop and mobile sign message / sign transaction flows
- `useACRECustomHandlers` on both apps
- the mobile Bitcoin `accountActions` stake entry point
