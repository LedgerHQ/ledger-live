---
"@ledgerhq/coin-tezos": patch
"@ledgerhq/live-common": patch
---

Prepare coin-tezos for migration to coin-modules (LIVE-32021, Step 1): move all wallet-related code that depends on `@ledgerhq/types-live` out of `coin-tezos` and into `ledger-live-common`'s `families/tezos` layer. Transaction, deviceTransactionConfig, serialization, CLI, bot specs/deviceActions, the wallet-facing types and the `TezosSigner` interface now live in `families/tezos`; the `AccountLike`-coupled delegation helpers move out of `network/bakers` into `families/tezos/bakers`. `coin-tezos/src` no longer imports `@ledgerhq/types-live`, `@ledgerhq/cryptoassets` or `@ledgerhq/types-cryptoassets`, and the corresponding entrypoints (`./transaction`, `./deviceTransactionConfig`, `./specs`) are removed from its package.json.
