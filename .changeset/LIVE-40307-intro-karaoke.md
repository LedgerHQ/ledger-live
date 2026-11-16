---
"live-mobile": minor
"@features/platform-device-onboarding": minor
---

Show the intro karaoke to a new (unseeded) device before the checks. Each tap shows the next phrase. On a Nano S, Nano S Plus or Nano X with the counterfeit flag on, the last button opens the counterfeit warning first.

`send` from `useDeviceOnboardingActor` now returns whether the machine took the event, so a caller can let the user retry (for example after a device lock).
