---
"@ledgerhq/coin-aleo": minor
---

This adds Aleo private record-picking support in `prepareTransaction` with `recordPickingStrategy`, where `manual` keeps the selected `amountRecordCommitment`, `auto` derives it from available private records based on amount (including `useAllAmount`), and both paths are covered by unit tests.
