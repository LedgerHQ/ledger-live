---
"@ledgerhq/coin-tester-tron": minor
"@ledgerhq/ledger-wallet-framework": minor
"@ledgerhq/coin-tron": minor
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/live-common": minor
---

Migrate Tron to the generic coin framework (LIVE-34994).

Adds a per-family pending-operation `extra` to the generic framework: `OptimisticOperationDescriptor` gains an optional `extra` bag and `describeOptimisticOperation` receives the transaction it describes, with framework-reserved keys stripped so a family cannot shadow them.
