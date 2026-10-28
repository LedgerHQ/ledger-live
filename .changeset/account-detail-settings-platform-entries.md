---
"@features/flow-account-detail-settings": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

`AccountSettings` moves to the web platform entry `@features/flow-account-detail-settings/web` and `AccountSettingsSheet` to the native platform entry `@features/flow-account-detail-settings/native`; `AccountSettingsDialog` becomes internal. The universal entry is one unconditioned `src/index.ts` holding the menu, advanced logs and remove contents and `buildAdvancedLogs`, and imports carry no platform suffix.
