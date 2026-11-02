---
"@features/flow-contacts-add-contact": minor
"@features/flow-pay-contact": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

`ContactsAddContactContent` of `@features/flow-contacts-add-contact` has one props contract on both platforms: `ContactsAddContactContentProps` gains the native-only `autoFocus`, and `ContactsAddContactContentNativeProps` is gone. The mobile content renders `ContactNameDisclaimer`. `ContactsAddContactDialog` moves to the `./web` entry, and `ContactsAddContactFooter` with `ContactsAddContactFooterProps` to the `./native` entry. The `.` entry has no `react-native` condition.
