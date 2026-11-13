---
"@features/platform-device-onboarding": minor
"live-mobile": minor
---

Apply the Nano firmware rules to device onboarding. Every Nano S, an unseeded Nano X below 2.2.0 and an unseeded Nano S Plus below 1.1.0 go to the legacy flow. An unseeded Nano X from 2.2.0 to 2.7.0 or Nano S Plus from 1.1.0 to 1.6.0 runs the genuine check, then gets its firmware update once it is seeded, in the new `postSetupFirmware` state.
