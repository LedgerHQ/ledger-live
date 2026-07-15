---
"@ledgerhq/cryptoassets": patch
"@ledgerhq/ledger-wallet-framework": patch
---

Align Bittensor (TAO) on the Polkadot derivation path: use CoinType.POLKADOT (354) for the bittensor currency and reuse the polkadotbip44 derivation mode (with disableBIP44). Bittensor reuses the Polkadot app, which derives at 354 and applies the SS58 prefix (42) dynamically.
