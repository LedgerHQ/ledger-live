---
"@ledgerhq/coin-tester-solana": patch
---

chore: run the coin tester on both mainnet and devnet Agave validators

The validator was stuck on Agave 2.0.24 and missed the removal of `warmupCooldownRate` from parsed stake accounts in production. The scenario now runs against a `mainnet` validator (Agave 4.3.0-rc.1, mainnet feature set) and a `devnet` one (Agave 4.3.0, devnet feature set) to catch upcoming breaking changes before mainnet. The image uses the official Anza release on amd64 and builds Agave from source on arm64.
