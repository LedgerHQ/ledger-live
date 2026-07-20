---
"@ledgerhq/coin-multiversx": minor
"@ledgerhq/live-common": minor
---

Add the CoinModuleApi (Alpaca) `createApi` factory to `coin-multiversx` alongside the existing `createBridges`. Business logic is extracted into a flat `src/logic/`, HTTP moves to `src/network/`, and `createApi` implements the Standard API for the native EGLD asset, ESDT tokens, and delegation staking. Registers the local MultiversX coin-module API in `live-common`.
