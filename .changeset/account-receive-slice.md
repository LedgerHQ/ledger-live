---
"@domain/entity-account-receive": minor
"@domain/entity-account-data": minor
"@domain/entity-account-descriptor": minor
"@domain/entity-account-operation": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Add the `receive` account data kind: on which address an account receives and how the device confirms it, read by the full-sync source. The branded `Address` moves from `@domain/entity-account-operation` to `@domain/entity-account-descriptor`, next to the new `DerivationPathSchema`
