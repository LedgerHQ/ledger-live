---
"@shared/ui-queued-bottom-sheet": minor
"@features/platform-contacts": minor
"@features/flow-contacts-add-contact": minor
"@features/flow-contacts-edit-contact": minor
"@features/flow-contacts-edit-address": minor
"@features/flow-contacts-add-address": patch
"live-mobile": minor
---

Fix keyboard handling in the mobile Contacts add, edit, and send flows. Input sheets now open at full height with the keyboard, primary actions remain visible in a keyboard-aware `QueuedBottomSheet` footer, and name fields focus immediately and capitalize each word.
