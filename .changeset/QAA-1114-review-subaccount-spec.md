---
"ledger-live-desktop-e2e-tests": minor
---

Review and refactor `subAccount.spec` (QAA-1114): mark the legacy send-flow tests with a `legacy -` prefix and drop that prefix + the `newSendFlow` feature-flag override from the non-send-flow blocks (add account, receive, token visible), add a Solana (SOL_GIGA) sub-account to the add-account coverage, remove the redundant `ETH_LIDO` receive case, and consolidate the SOL + ETH true-e2e sends into a single parameterized `transactionE2E` loop.
