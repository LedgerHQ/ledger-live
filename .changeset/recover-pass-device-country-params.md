---
"@ledgerhq/live-common": minor
"live-mobile": minor
"ledger-live-desktop": minor
---

feat(recover): pass hasConnectedNanoS and countryCode params to Recover webapp

- Add new `getCountryCodeFromLocale` utility in `@ledgerhq/live-common/locale`
- Pass `hasConnectedNanoS` boolean to indicate if user has ever connected a Nano S
- Pass `countryCode` (ISO 3166-1 alpha-2, lowercase) extracted from user's locale setting
