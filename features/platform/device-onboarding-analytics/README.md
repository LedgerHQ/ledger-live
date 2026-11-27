# @features/platform-device-onboarding-analytics

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

Tracking plan of the device onboarding funnels, from the tracking specs:
[seeded device](https://ledgerhq.atlassian.net/wiki/spaces/CN/pages/7520583694/TRACKING+Seeded+device+flow)
and [unseeded device](https://ledgerhq.atlassian.net/wiki/spaces/CN/pages/7625670710/TRACKING+-+Unseeded+flow).

The app owns the screens and decides when to track. This package owns what is sent:

- `onboardingPages`, `onboardingButtons`: the page and button names of both funnels.
- `seededProps`, `unseededProps`: the properties every event of a funnel carries (`FunnelProps`).
  An unseeded device adds `seedConfiguration` once it reports the setup path.
- `trackOnboardingPage`, `trackOnboardingClick`, `onboardingScreen`: pages and clicks, for any funnel.
- `trackSeededStarted`, `trackSeededDone`, `trackSeededAborted`: the seeded milestones.
- `trackUnseededStarted`, `trackUnseededSetupFinished`, `trackRecoverOffered`: the unseeded milestones.
- `karaokes`, `karaokeScreen`, `trackKaraokePage`, `trackKaraokeAdvanced`, `trackKaraokeCompleted`:
  the karaoke events.
- `setupPage`, `setupSuccessPages`: the device setup pages read from the onboarding machine state.
- `toSeededResult`, `toFirmwareUpdateAvailability`: the funnel result read from the onboarding machine context.
- `deviceOnboardingTraits`: the `deviceOnboarding` flag (`enabled` and each param) sent as user properties.

All events are sent with `@shared/analytics`.

Consumer: Ledger Wallet Mobile (`apps/ledger-live-mobile/src/mvvm/features/DeviceOnboarding`).
