---
"@ledgerhq/wallet-cli": minor
---

feat(wallet-cli): add ledger-sync enroll/import/destroy command group

`ledger-sync enroll` registers this machine as a Ledger Sync member (device required, its own LKRP
application, separate from `ring`), `ledger-sync import` pulls the synchronized accounts into the
session (additive and idempotent; unsupported currency families are reported as skipped), and
`ledger-sync destroy` deactivates it. All three write `session.yaml` through the shared session lock
against a fresh read, so they never overwrite changes another command saved meanwhile.
