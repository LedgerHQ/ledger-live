---
"@ledgerhq/live-common": minor
"@ledgerhq/wallet-cli": patch
---

Coin modules declare their AccountDescriptor type; the legacy account converters read it instead of the bitcoin family, so Cardano, Kaspa and Zcash map to utxo descriptors
