---
"ledger-live-desktop": patch
---

fix(desktop): defer Modals when Wallet V4 tour is active

- Only mount IsNewVersion, IsTermOfUseUpdated and IsSystemLanguageAvailable when tour is off or user had already seen tour at app mount
- Use ref to freeze hasSeenTour at mount so closing the tour in the same session does not open those modals
