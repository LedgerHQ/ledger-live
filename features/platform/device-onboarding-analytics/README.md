# @features/platform-device-onboarding-analytics

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

Tracking plan of the seeded device onboarding funnel, from the
[tracking spec](https://ledgerhq.atlassian.net/wiki/spaces/CN/pages/7520583694/TRACKING+Seeded+device+flow).

The app owns the screens and decides when to track. This package owns what is sent:

- `seededPages`, `seededButtons`: the page and button names.
- `seededProps`: the properties every seeded event carries.
- `trackSeededPage`, `trackSeededClick`, `trackSeededStarted`, `trackSeededDone`, `trackSeededAborted`: the events, sent with `@shared/analytics`.
- `toSeededResult`, `toFirmwareUpdateAvailability`: the funnel result read from the onboarding machine context.
- `deviceOnboardingTraits`: the `deviceOnboarding` flag (`enabled` and each param) sent as user properties.

Consumer: Ledger Wallet Mobile (`apps/ledger-live-mobile/src/mvvm/features/DeviceOnboarding`).
