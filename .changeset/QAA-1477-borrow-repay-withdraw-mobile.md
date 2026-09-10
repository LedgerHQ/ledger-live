---
"ledger-live-mobile-e2e-tests": patch
"ledger-live-desktop-e2e-tests": patch
"@ledgerhq/live-e2e-shared": patch
---

Add mobile Borrow E2E coverage for full repay (B2CQA-6073) and withdraw collateral (B2CQA-6080),
closing the LLD/LLM parity gap on those keys, and fix the shared Speculos driver defects that
blocked every borrow flow: blind signing is now enabled, the collateral spender is resolved from
the live app's own action, API failures carry their response body, and the transaction-check wait
ends on the blind-signing screen instead of spending its full 30s budget (QAA-1477).
