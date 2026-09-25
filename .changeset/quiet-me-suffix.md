---
"@features/platform-contacts": minor
"@features/flow-contacts-list": minor
"live-mobile": patch
"ledger-live-desktop": patch
---

Always suffix the Me contact name with the translated "(Me)", showing "My addresses (Me)" when it was never renamed, including in the Send recipient contact list. Add `useMeDisplayNameFormatter` so every Me name on mobile and desktop goes through one shared rule.
