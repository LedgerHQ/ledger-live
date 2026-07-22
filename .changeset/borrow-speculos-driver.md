---
"ledger-live-desktop-e2e-tests": minor
---

Add a headless Borrow driver (Borrow API + Speculos) exposed via `pnpm e2e borrow <open|close|repay|withdraw>` to create/tear down real on-chain loan state, plus reusable E2E setup/teardown hooks (`ensureLoanOpen` / `resetLoanState`), an `afterAll` reset for the open-loan spec, and a `pnpm e2e` subcommand dispatcher. (QAA-1401)
