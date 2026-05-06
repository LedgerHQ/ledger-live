---
name: coin-modules
description: Rules and layout for coin module packages under libs/coin-modules/. Read when adding or modifying a coin module.
applies_to:
  - libs/coin-modules
---

# Coin Modules

Each blockchain family lives in its own package under `libs/coin-modules/coin-<family>`.  
Package name: `@ledgerhq/coin-<family>`

Do not create a new coin-module if it fits the ecosystem of an existing one.  
No packages other than coin-modules are allowed in `libs/coin-modules/`.

## Directory Layout

| Directory / file   | Purpose                                                                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `api/`             | Alpaca API surface — implements `AlpacaApi` from `@ledgerhq/coin-framework/api/types`; types from `@ledgerhq/types-live` are not allowed |
| `logic/`           | Core blockchain logic, agnostic of Bridge or API; only depends on `network/` and external libs                                           |
| `network/`         | Communication with explorer / indexer / node                                                                                             |
| `types/`           | Model definitions, not related to network                                                                                                |
| `bridge/` (legacy) | `CurrencyBridge` + `AccountBridge` implementation                                                                                        |
| `signer/` (legacy) | Hardware wallet signer interface and device address resolver                                                                             |

Tests: `*.unit.test.ts` (co-located), `*.test.ts` (integration, no network), `*.integ.test.ts` (real network, separate `jest.integ.config.js`).

## Dependencies

Prefer native dependencies from the blockchain foundation and well-established open-source libraries.  
**Avoid** proprietary third-party SDKs or closed-source vendor packages.  
Internal `@ledgerhq/*` workspace deps are allowed.

## Integration Paths

**1. Alpaca path (preferred)** — export `createApi(config, currencyId)` implementing `AlpacaApi`. Listed in the `alpacaized` map in `libs/ledger-live-common/src/bridge/impl.ts`. Methods that don't apply may raise "not supported".

**2. Classic JS Bridge (legacy, do not use)** — export `createBridges(signerContext, coinConfig)` returning `{ currencyBridge, accountBridge }`. Wired via `libs/ledger-live-common/src/families/<family>/setup.ts`.

## Integ Test Requirements (Alpaca API)

- `craftTransaction` / `estimateFees`: cover each transaction type (token transfer, native, memo, delegation, …)
- `getBalance` / `listOperations`: cover each asset type in the module
- `getBlockInfo` / `getBlock` / `listOperations` / `getStakes`: compare against a reference block/op/stake to validate metadata parsing
- `getValidators`: validate metadata against a reference validator
- `lastBlock`: block height > 0, valid date, hash with expected length
- `getNextSequence`: higher than current nonce for a known account

## live-common Import Rule

In `libs/ledger-live-common/src`, runtime imports of coin-specific code (from `@ledgerhq/coin-*` or `../families/*`) are only allowed inside `src/coin-modules/` and `src/families/`. All other shared code must access coin-specific behaviour through `coinModuleLoaders` from `src/coin-modules/loaders.ts`.
