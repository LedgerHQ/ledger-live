---
"@features/flow-contacts-edit-address": minor
"live-mobile": minor
---

`ContactsRenameAddressDialog` takes one props contract, `ContactsRenameAddressDialogProps`, on both platforms, with `autoFocus` as its only native prop. `ContactsRenameAddressDrawerProps` and its `bottomInset` are gone: the native content reads the inset from its sheet. The `.` entry is one `src/index.ts`, with no `react-native` condition.
