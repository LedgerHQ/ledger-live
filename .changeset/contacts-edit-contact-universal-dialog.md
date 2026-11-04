---
"@features/flow-contacts-edit-contact": minor
"live-mobile": minor
---

`ContactsRenameContactDialog` is one universal component with one props contract, `ContactsRenameContactDialogProps`, which gains the native-only `autoFocus`. On mobile it renders the sheet content that `ContactsRenameContactDrawer` rendered: `ContactsRenameContactDrawer`, `ContactsRenameContactDrawerProps` and `bottomInset` are gone, the content reads the footer inset from its sheet and renders `ContactNameDisclaimer`. `ContactsRenameContactFooter` with `ContactsRenameContactFooterProps` moves to the `./native` entry. The `.` entry is one `src/index.ts`, with no `react-native` condition, and the package gets a `lint` script.
