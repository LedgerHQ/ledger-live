---
"@ledgerhq/live-common": minor
"@ledgerhq/asset-detail": minor
"@ledgerhq/coin-modules-monitoring": minor
"@ledgerhq/coin-tester-evm": minor
"@ledgerhq/coin-tester-solana": minor
"@ledgerhq/coin-tester-tezos": minor
---

Privatize `@ledgerhq/live-common` so it is no longer published to npm and can depend on private workspace packages. Its published runtime dependents (`@ledgerhq/asset-detail`, `@ledgerhq/coin-modules-monitoring`, `@ledgerhq/coin-tester-evm`, `-solana`, `-tezos`) are privatized in lockstep; internal consumers keep resolving it through the workspace.
