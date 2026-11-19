---
"@shared/storage": minor
"@shared/storage-electron": minor
"@shared/storage-mmkv": minor
"@shared/storage-node-file": minor
"@shared/persistence": minor
"@features/platform-persistence": minor
"@features/platform-persistence-accounts": minor
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/live-cli": minor
"@ledgerhq/live-e2e-shared": minor
---

Move `history` and `accounts` to persistence in desktop, mobile (MMKV installs), the CLI and the e2e seeds, with no change to the stored keys, shapes or versions; an account that the app cannot read or does not support stays stored as it is.
