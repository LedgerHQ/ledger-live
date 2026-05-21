---
"ledger-live-desktop": patch
---

Reduce desktop Jest noise and flakiness: silence console output by default, enable `clearMocks`/`restoreMocks` globally for better isolation, memoize the `notificationsContentCard` and `language` selectors, stabilize the `dismissedBanners` empty array reference, and harden affected tests.
