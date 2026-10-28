---
"ledger-live-desktop": minor
"live-mobile": minor
"@features/flow-account-detail-hero": minor
"@features/platform-quick-actions": minor
---

LWD Account Detail shows the account hero: the account balance (native and token sub-accounts countervalue) and the Receive · Send · Buy · Sell · Earn quick actions. The hero package exposes web views through a new `./web` entry, including an account-scoped asset picker dialog. On desktop, Sell is now hidden when the currency is not on the ramp, like Buy. Both apps now build the hero port with shared `useAvailableAssetsByAction` and `useAccountHeroStatus` hooks from the hero package.
