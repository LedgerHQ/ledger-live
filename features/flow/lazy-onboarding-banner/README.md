# @features/flow-lazy-onboarding-banner

> [!CAUTION]
> **Status: UNSTABLE** — Initial shared banner flow; platform views may change.

Cross-platform business logic for the lazy onboarding device banner.

## Exports

- `getLazyOnboardingBannerDecision` evaluates normalized user and feature state.
- `buildLazyOnboardingBannerLink` produces a safe Shop URL with campaign attribution.
- `useLazyOnboardingBannerSession` keeps dismissal in memory until the application restarts.

Tests can reset that singleton through the explicit
`@features/flow-lazy-onboarding-banner/testing` subpath.

Mobile and Desktop own their Redux adapters, translations, URL opening, analytics and screen
composition.

## Validation

```sh
pnpm test
pnpm typecheck
pnpm unimported
```
