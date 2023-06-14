---
"ledger-live-desktop": patch
---

feat: LLD new architecture of the sync onboarding for the ESC

This PR is implementing the new architecture on LLD for the sync onboarding:

- a new SyncOnboardingCompanion component getting (almost) all the logic that existed directly in the screen
- an empty EarlySecurityCheck component that directly notifies (for now) that everything is good
- a "screen" that orchestrate which of the 2 components should be rendered by checking the onboarding state of the device, and calling the new device action toggleOnboardingEarlyCheckAction when needed0k
