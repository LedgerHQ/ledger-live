---
"@ledgerhq/coin-tezos": minor
"@ledgerhq/live-common": minor
---

Add Tezos message signing: a `signMessage` that signs an already-watermarked payload verbatim (normalising the device signature to raw r||s), and wire it as the `tezos` family `messageSigner`.
