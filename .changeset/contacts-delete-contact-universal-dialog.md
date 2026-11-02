---
"@features/flow-contacts-delete-contact": minor
"live-mobile": minor
---

`ContactsDeleteContactDialog` takes one props contract, `ContactsDeleteContactDialogProps`, on both platforms. `ContactsDeleteContactDrawerProps` and its unused `bottomInset` are gone: the native content reads the inset from its sheet. The `.` entry is one `src/index.ts`, with no `react-native` condition, and the package gets a `lint` script.
