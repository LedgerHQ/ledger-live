---
"@domain/entity-account-receive": minor
"@domain/entity-account-data": patch
"@domain/entity-account-descriptor": minor
"@domain/entity-account-operation": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Add the `receive` account data kind: whether an account can receive an asset (its native coin or one of its tokens), on which address, and how the device confirms it, read by the full-sync source. The branded `Address` moves from `@domain/entity-account-operation` to `@domain/entity-account-descriptor`, next to the new `DerivationPathSchema`
