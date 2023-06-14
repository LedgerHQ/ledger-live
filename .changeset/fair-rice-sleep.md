---
"@ledgerhq/live-common": minor
"@ledgerhq/live-cli": patch
---

feat: new toggleOnboardingEarlyCheckAction device action

Introducing a new device action (implemented in the device SDK): toggleOnboardingEarlyCheckAction with

- its associated new command and task
- its associated new onboarding state
- a hook useToggleOnboardingEarlyCheck for simple usage on LLM and LLD
- unit tests
- its associated cli command deviceSDKToggleOnboardingEarlyCheck

This new action uses a new APDU to enter and exit the "early security check" blocking step during the onboarding of Stax.
