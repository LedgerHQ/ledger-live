---
"@features/flow-contacts-detail": minor
"@features/flow-contacts": patch
"@features/flow-pay-contact": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

Extract the Contact Detail journey into `@features/flow-contacts-detail` so Desktop and Mobile can reuse it, while the Contacts aggregate keeps cross-journey orchestration
