---
"@shared/ui-info-state": minor
"@features/flow-account-detail-settings": minor
"@features/flow-pay-card-auth": minor
"ledger-live-desktop": minor
---

`InfoState` takes one props contract, `InfoStateProps` from `InfoState.types.ts`, on web and native, and the native `spot` preset now honors `backgroundTone` on its bottom sheet. `DialogBackgroundToneProvider` moves to the web platform entry `@shared/ui-info-state/web`; the gradient, context and tone hooks become internal. The universal entry is one unconditioned `src/index.ts`, imports carry no platform suffix, and the package gets a `lint` script.
