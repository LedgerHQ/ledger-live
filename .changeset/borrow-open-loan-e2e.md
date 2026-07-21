---
"ledger-live-desktop-e2e-tests": minor
---

Add Playwright E2E for Borrow cold-start (B2CQA-6062, LIVE-33746) and open-loan with
Speculos signing on ETH 4 (B2CQA-6065, LIVE-34606) in `borrow.spec.ts`.

Run cold-start: `pnpm e2e:desktop test:playwright borrow --grep "Introducing Crypto Loan"`.
Run open-loan (manual E2E, `enable_broadcast`): `pnpm e2e:desktop test:playwright borrow --grep "open-loan execution"`.
