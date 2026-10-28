---
"@features/flow-account-detail-hero": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

The account hero balance comes from a shared `useAccountCountervalue` hook in `@features/flow-account-detail-hero`: the apps only inject their countervalue callback. On LWM, an account whose assets are all empty now shows `$0.00`, like LWD, and a funded asset without a quote no longer counts as a known zero.
