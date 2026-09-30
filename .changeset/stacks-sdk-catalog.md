---
"@ledgerhq/coin-stacks": patch
"@ledgerhq/coin-tester-stacks": patch
---

chore: take `@stacks/network` and `@stacks/transactions` from the pnpm catalog

`coin-stacks` used `^7.6.0` while `coin-tester-stacks` pinned `6.17.0` next to a
`@stacks/transactions-v7` alias, so both major lines were installed side by side. Both packages now
use the catalog entry (7.6.0). The coin-tester's pox-5 signer-manager setup is ported from the v6
API, and its now unused `@stacks/network` dependency is dropped. The `@noble/hashes` pin inside
`@stacks/transactions` itself is upstream and unchanged.
