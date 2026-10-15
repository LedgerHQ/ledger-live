---
"@ledgerhq/coin-solana": minor
"@ledgerhq/coin-tester-solana": minor
---

Remove the Solana legacy bridge, now that the family is served by the generic coin framework: `prepareTransaction`, `getTransactionStatus`, `signOperation`, `createTransaction`, `estimateMaxSpendable`, the synchronisation, the transaction serializer, the device transaction config, the on-chain instruction parsers and the helpers and types only they used are deleted. `rxjs` goes with them.

The deterministic tester drops its legacy strategy and runs the generic adapter alone.
