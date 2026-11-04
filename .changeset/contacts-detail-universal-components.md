---
"@features/flow-contacts-detail": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

`ContactDetailActionsMenu` moves to the native platform entry `@features/flow-contacts-detail/native` and reads its bottom inset from the sheet context; `ContactDetailActions` becomes internal. The universal entry is one unconditioned `src/index.ts`, `ContactAddressDetailDialog` and `ContactsEditSignerMismatchDialog` each have one props contract, `ContactDetailView` takes `onOpenLedgerWalletAccounts` and `onOpenAddressDetail`, and the web address detail dialog shows a Share tile when `onShareAddress` is set.
