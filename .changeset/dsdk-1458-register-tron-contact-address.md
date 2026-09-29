---
"@features/platform-contacts": minor
---

Register and edit Tron contact addresses on the device: encode the base58 `T…` address as its 21-byte form instead of hex (which failed with "This address can't be saved"), and omit CHAIN_ID for non-EVM families so the registered proofs match what the Tron signer provides.
