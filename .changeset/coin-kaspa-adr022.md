---
"@ledgerhq/coin-kaspa": minor
---

Adopt the coin-module authoring type, dropping the hand-written "not supported" stubs.

`createApi` now returns its object with `satisfies CoinModuleImpl<KaspaCoinConfig>` — which keeps the precise shape, so a caller sees exactly which methods exist — declaring the eleven the module implements: `broadcast`, `combine`, `craftTransaction`, `craftTransactionData`, `estimateFees`, `getBalance`, `getBlock`, `getBlockInfo`, `lastBlock`, `listOperations` and `validateIntent`.

The eight capabilities Kaspa has none of — `call`, `register`, `craftRawTransaction`, `validateAddress`, `getNextSequence`, `getStakes`, `getRewards` and `getValidators` — are omitted instead of each carrying a `throw new Error("… is not supported")`. Why each is absent is recorded above the factory rather than left to the stub it used to sit on: Kaspa is a UTXO / BlockDAG chain with no per-account sequence or nonce, replay protection coming from spending one-time UTXOs (and the generic-coin-framework's `createTransaction` already supplies a synthetic zero nonce for kaspa, so `signOperation` never reached that method); there is no native staking, hence no stakes, rewards or validator set; `supportedFeatures` declares `blockchain_txs: ["send"]`, so there is no in-module token standard and no read-only contract-call escape hatch; the module accepts no externally-built transaction; and on-device address validation is not exposed through this API.

Consumers see no change. They reach the module through a resolver that applies the framework's `withDefaults`, which supplies every omitted capability, so the same call still raises a `"<method> is not supported"` error — with the framework's generic wording now for `getNextSequence`, whose stub read "not applicable for Kaspa", and thrown synchronously where the `call` and `register` stubs it replaces were `async` functions returning a rejected promise. `supports(method)` now reports which capabilities are real.

The api test asserts the whole capability surface with the framework's `capabilityReport()` rather than one test per unimplemented capability: one expectation covers that each is absent, that reaching it raises `"<name> is not supported"`, and that `supports()` agrees. Being an exact comparison it is exhaustive, so implementing or dropping a capability changes the list instead of leaving a test that passes while covering less.
