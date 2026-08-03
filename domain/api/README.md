# domain/api/

> Part of the [DDD monorepo architecture](../../docs/ddd-monorepo-architecture.md).

Domain API packages. Each subdirectory is an independent pnpm workspace package covering network
access for a domain: RTK Query endpoints, `createAsyncThunk` actions, or a re-export/composition of
existing ones under a unified access point.

## Two kinds of package

| Kind | Package | Owns |
| --- | --- | --- |
| **Use case** | `@domain/api-<name>` | Endpoints, wire schemas, transforms, hooks, persistence |
| **Services** | `@domain/api-services` | One file per backend: `extraArgument` contract, base query, cache tags, reducer path, empty `createApi` |

`@domain/api-services` holds an **endpoint-less** `createApi({ endpoints: () => ({}) })` per backend.
Use-case packages add their endpoints with
[`injectEndpoints`](https://redux-toolkit.js.org/rtk-query/usage/code-splitting#injecting-endpoints),
which mutates and returns the *same* api object — so one reducer, one middleware and one cache serve
every use case on a given service.

Each service file stays small on purpose: the `extraArgument` contract, a base query that is **only
transport**, and the `createApi`. Nothing about what is fetched.

### When a backend does *not* belong in `@domain/api-services`

When its base query carries use-case knowledge — mock handlers keyed by endpoint URL, endpoint-name
lookups, response types from its own wire schemas — the split would either drag that wire contract into
the shared package or leave the shared file owning nothing real. Such a backend keeps its own
`createApi` in its use-case package. `@domain/api-pay-card` is the current example.

### Rules for `@domain/api-services`

- **No `@domain/entity-*` dependency.** It defines zero endpoints, so it has nothing to type against.
  This is the one exception to the "must depend on the matching entity" rule below.
- **`tagTypes` must list every tag any injector will use.** RTK Query only accepts `tagTypes` at
  `createApi` time, never at `injectEndpoints` time, so adding a use case with a new tag means adding
  it to that service's file.
- **`extraArgument` builders stay per service.** There is deliberately no aggregate builder:
  `apps/web-tools`, `apps/cli` and `buildStandaloneCryptoAssetsStore` configure one service only and
  must not be forced to supply config for services they never call.

## Register the service, import hooks from the use case

The service api owns `reducerPath` / `reducer` / `middleware`, so **it is what the app store
registers**. But injection is a module-level side effect: an endpoint only exists once its use-case
module has been evaluated as a *value* import. So:

- **Apps** register the service apis in their RTK Query registry — which then reads as a list of the
  backends the app talks to, not of its use cases.
- **Features** import hooks (and any `.endpoints.*` access) from the **use-case** package. That import
  is what triggers injection, and only that reference carries the endpoint types.
- **Never** import an api from `@domain/api-services` in order to call endpoints on it. A type-only
  import will not trigger injection either.

## Scope

`@domain/api-<name>` (e.g. `@domain/api-currency-token`), plus `@domain/api-services`

## Responsibility

- **Define** RTK Query endpoints or `createAsyncThunk` actions for a domain, or **compose and
  re-export** existing ones
- Provide a single import path for all API endpoints related to a domain entity
- Use entity schemas from `@domain/entity-<name>` for request/response typing

## Conventions

- One use-case package per domain entity
- Package name: `@domain/api-<name>` — directory name matches, e.g. `domain/api/<name>/`
- `package.json` must have `"private": true`
- Use-case packages must depend on the corresponding `@domain/entity-<name>` package
- Barrel export via `src/index.ts`

## File Structure

Use-case package:

```
api.ts          # injectEndpoints on a service api, or createApi (required)
api.test.ts     # Endpoint/integration tests (required; MSW recommended if that's the project standard)
index.ts        # Barrel exports (required)
```

`@domain/api-services`:

```
<service>.ts        # extraArgument contract, base query, cache tags, empty createApi
<service>.test.ts   # reducer path, zero endpoints, extraArgument validation
index.ts            # Barrel exports
```

> [!NOTE]
> `@domain/api-aggregated-assets` is a placeholder for **DADA**, which currently lives as
> `assetsDataApi` in `libs/ledger-live-common`. When it migrates, its base belongs in
> `@domain/api-services` as `src/dada.ts` rather than as another standalone `createApi`.
