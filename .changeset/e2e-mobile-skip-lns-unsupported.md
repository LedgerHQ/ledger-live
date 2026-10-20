---
"ledger-live-desktop-e2e-tests": minor
"ledger-live-mobile-e2e-tests": minor
"@ledgerhq/live-e2e-shared": minor
---

Skip on Nano S the mobile E2E tests that Desktop already skips there: SUI, VET, HBAR and ALEO tests, plus EGLD and SEI delegate, CELO lock and vote and CCD send. Desktop and Mobile now read the currencies with no Nano S coverage from one list in `@ledgerhq/live-e2e-shared`.
