---
"@ledgerhq/coin-solana": major
---

Remove the Solana legacy bridge, now that the family is served by the generic coin framework: `prepareTransaction`, `getTransactionStatus`, `signOperation`, `createTransaction`, `estimateMaxSpendable`, the synchronisation, the transaction serializer, the device transaction config and the on-chain instruction parsers are deleted, as they were for every family already on the framework. `rxjs` goes with them.

The deterministic tester drops its legacy strategy and runs the generic adapter alone.
