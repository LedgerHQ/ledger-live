---
"@ledgerhq/coin-cardano": patch
---

refactor(coin-cardano): migrate off the deprecated `@ledgerhq/live-network/network` import

Replace the deprecated `@ledgerhq/live-network/network` default import with `@ledgerhq/live-network` across coin-cardano. Every call site consumes only the response `.data`, so behavior is preserved. Because the new implementation types `data` as `unknown` (instead of `any`), each call now carries an explicit `network<T>(...)` generic and the `res.data as X` casts were dropped, so response shapes are checked at compile time. `fetchDelegationInfo` now returns `APIDelegation | undefined` to match its real runtime behavior.
