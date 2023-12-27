---
"live-mobile": patch
---

fix: Genuine check not skipped during onboarding with Nano X via USB

During the last step of the onboarding, filters USB device by their id and
not their device model, using the same flows for Nano X, Nano SP, Nano S
and Blue when connected via USB OTG.
