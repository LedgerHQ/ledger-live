# `@features/platform-currencies`

App-facing currency **runtime glue**. Mirrors `@features/platform-feature-flags`:
this package owns hooks + the crypto-assets store builder; currency **state lives in
the `@domain/entity-currency-*` packages** (no slices here).

## Exports

| Export                              | Behaviour                                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------------------ |
| `buildCryptoAssetsStore(config)`    | Builds the `CryptoAssetsStore` over `@domain/api-currency-token`. Apps inject the result via the legacy `setCryptoAssetsStore` singleton. |
| `CryptoAssetsStore`                 | Local port type (typed on the domain `TokenCurrency`).                                     |
| `useCryptoCurrencyById(id)`         | Static crypto currency lookup from the domain registry.                                    |
| `useTokenById(id)`                  | CAL token lookup (RTK-Query).                                                               |
| `useTokensData(params)`             | Paginated CAL token list (RTK-Query infinite query).                                       |
| `useSupportedCurrencies(base, opts)`| Registry-backed supported set with feature-flag gating applied.                            |
| `useFeatureFlaggedCurrencies(mock)` | Feature-flag gating map + the set of currency ids deactivated by their flag.               |

## Architecture

- **Legacy store (`src/legacy/store/`, temporary)** — the single runtime cache for token data is the
  `@domain/api-currency-token` RTK-Query instance. `buildCryptoAssetsStore` adapts it to the
  `CryptoAssetsStore` port to preserve the legacy `getCryptoAssetsStore()` contract during the
  migration. It is a strangler facade scheduled for removal — see
  [`src/legacy/store/FUTURE.md`](./src/legacy/store/FUTURE.md).
- **Supported set** — support is registry-driven (coin-module loaders). This package does
  not maintain its own list: `useSupportedCurrencies` takes the registry-backed list as
  input and applies feature-flag gating via `@features/platform-feature-flags`.
- **Errors** — the store maps RTK-Query errors to a local error taxonomy (`src/errors.ts`)
  with the same stable `name`s as the legacy `@ledgerhq/errors` classes.
