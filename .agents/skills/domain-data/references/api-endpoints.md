# Api endpoints: options and traps

Details behind the api part of [`domain-data`](../SKILL.md). The why of the backend split lives in
[`domain/api/README.md`](../../../../domain/api/README.md).

## Endpoints

- `build.query` reads, `build.mutation` writes (POST, PUT, DELETE).
- Type both sides: `build.query<Result, Arg>`, `void` when there is no argument.
- `keepUnusedDataFor` (seconds) sets how long an unused cache entry lives.
- `providesTags` on queries, `invalidatesTags` on mutations, with the tags this package added.

```ts
addItem: build.mutation<Item, ItemInput>({
  query: body => ({ url: "/items", method: "POST", body }),
  invalidatesTags: [...ITEM_TAGS],
}),
```

## Response schemas

| Schema | Option | Example |
| --- | --- | --- |
| Input type equals output type | `responseSchema` | `getCounterValueIdsSortedByMarketCap` |
| Transforms, brands or drops entries | `rawResponseSchema` + `transformResponse` | `getUsdToFiatRate`, `getSpotRates` |

All three sit in `domain/api/market-countervalues/src/api.ts`. A transforming Zod schema passed to
`responseSchema` fails typecheck (`TS2322 ... Types of property 'input' are incompatible`).

Set `catchSchemaFailure` on every validated endpoint. It turns a failure into a typed
`{ status: "CUSTOM_ERROR", error }` on the query's `error`, which the consuming hook can log.
`onSchemaFailure` cannot: it receives no `extra` and no `getState`, so a domain package has no
logger to reach from it. Precedent: `describeSchemaFailure` in
`domain/api/market-countervalues/src/internals/`.

## Errors in `queryFn`

A `queryFn` never throws: return `{ data }` on success and `{ error }` on failure.

```ts
queryFn: async arg => {
  try {
    return { data: await fetchData(arg) };
  } catch (error) {
    return { error: { status: "CUSTOM_ERROR", error: String(error) } };
  }
},
```

## Registration traps

- **Register the service api** in `apps/ledger-live-desktop/src/renderer/reducers/rtkQueryApi.ts`
  and `apps/ledger-live-mobile/src/context/rtkQueryApi.ts`, keyed by `reducerPath`. A duplicate key
  is `TS1117`, which catches a backend registered twice.
- **Injection is a module-level side effect.** An endpoint exists once its use-case module was
  evaluated as a value import. A type-only import does not inject. Never call endpoints on the
  api imported from `@shared/api-services`.
- **The service api declares no tags**, so its state type is narrower than an injected reference
  that added some. Type a helper that takes the app `State` on the service api
  (`WithCryptoAssetsApi` in `domain/api/currency-token/src/persistence.ts`).
- **`overrideExisting` defaults to `false`**: injecting an endpoint name that already exists is
  silently ignored.
