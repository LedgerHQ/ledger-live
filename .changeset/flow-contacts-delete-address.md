---
"@features/flow-contacts-delete-address": minor
"@features/flow-contacts-detail": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Extract address deletion into `@features/flow-contacts-delete-address` so Desktop and Mobile can reuse it without going through Contact Detail. Confirmation UI stays in `@features/platform-contacts`. Apps still own modal mounting, navigation, translations, and analytics.
