# @domain/api-services

> [!CAUTION]
> **Status: UNSTABLE** — Part of the emerging DDD layer; under active development.

One **endpoint-less** RTK Query api per backend service. Each file owns everything about *reaching*
one service — base URL, base query, retry policy, cache tags, reducer path and the thunk
`extraArgument` contract — and nothing about *what* is fetched from it.

Use-case packages add their endpoints with
[`injectEndpoints`](https://redux-toolkit.js.org/rtk-query/usage/code-splitting#injecting-endpoints),
which mutates and returns the *same* api object. One reducer, one middleware and one cache therefore
serve every use case on a given service.

| File | Service | Reducer path | Injectors |
| --- | --- | --- | --- |
| `cal.ts` | Crypto Asset List | `calApi` | `@domain/api-currency-token` |
| `coinmarketcap.ts` | CoinMarketCap | `coinMarketCapApi` | `@domain/api-altcoins-sentiment`, `@domain/api-market-sentiment` |
| `countervalues.ts` | Countervalues Service | `countervaluesApi` | `@domain/api-currency-fiat` |
| `pushDevices.ts` | Push Devices Service | `pushDevicesApi` | `@domain/api-push-devices` |

Each file stays deliberately small: the `extraArgument` contract, a base query that is *only*
transport, and the `createApi`. Nothing about what is fetched.

`@domain/api-pay-card` is intentionally **not** here. Its base query is mostly a mock harness — delay,
handlers keyed by endpoint URL, typed from its own response schemas — so a split would either drag that
wire contract in here or leave this file owning nothing real. It keeps its own `createApi` until it has
a second use case or a real base URL ([LIVE-33829](https://ledgerhq.atlassian.net/browse/LIVE-33829)).

## Usage

**Register the service api; call endpoints on the use-case package.**

```ts
import { calApi, calApiExtra } from "@domain/api-services";

configureStore({
  reducer: { [calApi.reducerPath]: calApi.reducer },
  middleware: gdm =>
    gdm({
      thunk: {
        extraArgument: calApiExtra({
          calServiceUrl: getEnv("CAL_SERVICE_URL"),
          ledgerClientVersion: getEnv("LEDGER_CLIENT_VERSION"),
        }),
      },
    }).concat(calApi.middleware),
});
```

Injection is a module-level side effect: an endpoint only exists once its use-case module has been
evaluated as a *value* import. A type-only import will not trigger it, and the api exported from here
is never typed with anyone's endpoints — only the injected reference is.

## Adding a service

1. Add `src/<service>.ts` with the schema, builder, reader, base query and
   `createApi({ ..., endpoints: () => ({}) })`.
2. Re-export it from `src/index.ts`.
3. Declare **every** cache tag its use cases will provide — `tagTypes` is only accepted by
   `createApi`, never by `injectEndpoints`.
4. Register it in both apps' `rtkQueryApi.ts`.

Each service's `extraArgument` builder stays separate — there is deliberately no aggregate builder,
because consumers like `apps/web-tools`, `apps/cli` and `buildStandaloneCryptoAssetsStore` configure
one service only and must not be forced to supply config for services they never call.

> [!NOTE]
> `@domain/api-aggregated-assets` on `develop` is a placeholder for **DADA**, which currently lives as
> `assetsDataApi` in `libs/ledger-live-common`. When it migrates, its base belongs here as
> `src/dada.ts` rather than as another standalone `createApi`.
