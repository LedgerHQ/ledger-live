# @ledgerhq/coin-module-boilerplate

Template for a new coin module. It is not registered anywhere in `ledger-live-common`.

## Configuration

The module keeps no configuration in module state. The host builds a `Context` (`config` + `logger`) and passes it to `createBridges(signerContext, context)` and to every `createApi()` method. Each call resolves `await context.config()` and passes the result down to `network/`.

Endpoints are required and named by role. Tuning values are optional: the module falls back to one named exported default when a field is absent, so the remote config can change them without a release.

| Field                   | Required | Default                                      |
| ----------------------- | -------- | -------------------------------------------- |
| `node.url`              | yes      | none                                         |
| `indexer.url`           | yes      | none                                         |
| `indexer.maxTxQuery`    | no       | `DEFAULT_MAX_TX_QUERY` (100)                 |
| `fees.fallbackFee`      | no       | `DEFAULT_FALLBACK_FEE` (1000)                |
| `fees.tooHighRatio`     | no       | `DEFAULT_FEE_TOO_HIGH_RATIO` (10)            |
| `minReserve`            | no       | `DEFAULT_MIN_RESERVE` (0)                    |

Example `config_currency_<id>` default, as declared in `ledger-live-common` for a registered currency:

```ts
const boilerplateConfig = {
  status: { type: "active" },
  name: "Boilerplate",
  unit: { name: "BOL", code: "BOL", magnitude: 8 },
  node: { url: "https://boilerplate-node.example.com" },
  indexer: { url: "https://boilerplate-indexer.example.com", maxTxQuery: 100 },
  fees: { fallbackFee: 1000 },
  minReserve: 0,
};
```

Optional fields are read as `config.x ?? DEFAULT_X`, with the default documented by `@default` on the field in `src/config.ts`.

## Logging

Log through `context.logger` (type `Logger` from `@ledgerhq/coin-module-framework/config`) and pass it down as the first parameter of the logic and network functions that need it.
