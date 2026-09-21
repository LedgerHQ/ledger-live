---
"@ledgerhq/live-common": patch
---

Fix Zcash mock-bridge and serialization so shielded send still works

Persisting a Zcash account while `zcashShielded` is off (or under `MOCK=true`) routed `toAccountRaw` through coin-bitcoin, which dropped the viewing key and `privateInfo` the load path had just restored. Both directions now use the Zcash serialization family — unless the host never registered the standalone Zcash coin module (wallet-cli registers bitcoin, evm and solana only), in which case they keep coin-bitcoin's adapter instead of failing to resolve a bridge.

The mock bridge also omitted `getFullViewingKey`, `deriveShieldedAddress`, and `getShieldedAddress`, so activating the private balance under `MOCK=true` threw a TypeError. Those methods now return device-free stand-ins, including a well-formed unified address so the send flow still classifies a self-transfer as a private recipient.
