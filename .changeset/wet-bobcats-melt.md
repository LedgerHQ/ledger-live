---
"@ledgerhq/ledger-wallet-framework": minor
---

Declare `@ledgerhq/wallet-framework-test-setup` as a devDependency of `@ledgerhq/ledger-wallet-framework`. Its `jest.integ.config.js` already lists the package in `setupFilesAfterEnv`, but it was never a declared dependency, so the `test-integration-pr` workflow's scoped install (`pnpm i --filter="@ledgerhq/ledger-wallet-framework"`) did not link it and the wallet-framework integration tests failed at jest bootstrap with `Module @ledgerhq/wallet-framework-test-setup in the setupFilesAfterEnv option was not found`. Declaring the dependency makes the scoped install include it.
