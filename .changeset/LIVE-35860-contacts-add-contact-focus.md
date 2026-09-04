---
"@shared/ui-queued-bottom-sheet": minor
"@features/platform-contacts": minor
"@features/flow-contacts-add-contact": minor
"live-mobile": minor
---

Fix the odd Add contact transition on Mobile by focusing the contact name field only once the drawer has finished opening, so the keyboard no longer resizes the dynamically sized drawer mid-animation. Adds an onOpened callback to QueuedBottomSheet and makes ContactNameInput focus reactively rather than only on mount.
