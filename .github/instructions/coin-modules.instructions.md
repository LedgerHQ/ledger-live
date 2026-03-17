---
applyTo: "libs/coin-modules/**"
---

# Coin Module Conventions

## Test Requirements

- Every coin module must have integration tests validating `/api` endpoints — see `coin-tron/src/logic/listOperations.integ.test.ts` for reference.
- Separate test files by concern: `craftTransaction.test.ts`, `estimateFees.test.ts`, etc. — avoid massive single test files.
- Include tests for both mainnet and testnet only if behavior differs significantly — use `describe.each` for shared coverage.

## Test Coverage

- Test return values explicitly, not just implementation details.
- Include tests for edge cases: empty arrays, non-existing addresses, invalid inputs.
- Test both recipients and senders in transaction tests.
- Be consistent with test patterns from other coin modules (e.g., `coin-polkadot/src/api/index.test.ts`).

## Structure

- Helper functions must be extracted to utils files with dedicated unit tests.
- API logic must be testable via integration tests that validate the full flow.
