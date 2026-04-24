---
"@ledgerhq/wallet-cli": minor
---

Add optional `data` (0x-prefixed hex calldata) field to `EvmTransactionIntentSchema`, enabling arbitrary EVM contract interactions. The bridge adapter propagates it to the live-common EVM transaction's `data: Buffer` field.
