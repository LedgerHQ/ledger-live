# @features/flow-large-screen-upsell

Single eligibility + frequency-throttle check for the large-screen upsell modal, consulted by all
upsell surfaces (modal now, banners/profile CTAs and debug "would show" indicator later).

Ports mobile's shipped logic (`apps/ledger-live-mobile/.../LargeScreenUpsell/hooks/useLargeScreenUpsellEligibility.ts`
and `libs/ledger-live-common`'s `isCooldownElapsed`/`shouldThrottle`) 1:1, so a future reconciliation
pass can point mobile at this package with no behavioral change.

## Exports

- `getLargeScreenUpsellDecision(userState, context)`: pure, audience + cooldown eligibility
  combined with the frequency-throttle. `userState` is what the user has seen/done
  (`seenNanoModelIds`, `hasSeenTouchscreenDevice`, `onboardingDate`, `frequency`); `context` is the
  `largeScreenUpsell` feature flag's resolved params plus `now`.
- `useLargeScreenUpsellDecision(...)`: hook composing `useFeature("largeScreenUpsell")`,
  `@domain/entity-large-screen-upsell-modal`'s selectors, and the pure function above

This PR does not implement persistence, UI, or analytics. UI lands in a follow-up PR, composed on
top of `useLargeScreenUpsellDecision`. Nothing inside this package's `internal/` folder is exported.

## Testing

```sh
pnpm test
pnpm typecheck
```
