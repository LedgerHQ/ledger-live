---
"@features/flow-contacts-delete-address": minor
"live-mobile": minor
---

`ContactsDeleteAddressDialog` takes one props contract, `ContactsDeleteAddressDialogProps`, on both platforms. `ContactsDeleteAddressDrawerProps` and its unused `bottomInset` are gone: the native content reads the inset from its sheet. The `.` entry is one `src/index.ts`, with no `react-native` condition.
