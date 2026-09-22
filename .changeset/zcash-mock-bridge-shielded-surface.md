---
"@ledgerhq/live-common": minor
---

Fix Zcash mock-bridge and serialization so shielded send still works

Persisting a *mock* Zcash account (under `MOCK=true`) routed `toAccountRaw` through coin-bitcoin's mock bridge, which declares no assign hooks at all and so dropped both the viewing key/`privateInfo` and the transparent `bitcoinResources` the load path had just restored. A real account was never affected: coin-bitcoin's real bridge already round-trips `privateInfo` unconditionally via its Zcash chain-adapter. Mock account ids now resolve through the standalone Zcash serialization family instead — unless the host never registered that coin module (wallet-cli registers bitcoin, evm and solana only), in which case they keep coin-bitcoin's adapter instead of failing to resolve a bridge. A real account id keeps resolving through `currency.family` as before, so it never eager-loads the standalone module merely by being deserialized.

The mock bridge also omitted `getFullViewingKey`, `deriveShieldedAddress`, and `getShieldedAddress`, so activating the private balance under `MOCK=true` threw a TypeError. Those methods now return device-free stand-ins, including a well-formed unified address so the send flow still classifies a self-transfer as a private recipient.
