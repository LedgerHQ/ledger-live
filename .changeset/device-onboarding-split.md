---
"@features/platform-device-onboarding": minor
"@devtools/bindings": minor
"@devtools/device-onboarding": minor
"live-mobile": minor
"ledger-live-desktop": minor
---

Split device onboarding by job: `@features/platform-device-onboarding` runs the actor with `useDeviceOnboardingActor`, and `@devtools/bindings` builds the devtool's log, context and next states with `useDeviceOnboardingToolState` and `useDeviceOnboardingToolProps`. The mobile funnel no longer imports `@devtools/*`, and the desktop device onboarding code moves under DevTools
