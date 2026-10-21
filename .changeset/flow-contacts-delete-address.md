---
"@features/flow-contacts-delete-address": minor
"@features/flow-contacts-detail": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

Extract address deletion into `@features/flow-contacts-delete-address` so Desktop and Mobile can reuse it without going through Contact Detail. Confirmation UI stays in `@features/platform-contacts`. Apps still own modal mounting, navigation, translations, and analytics.
