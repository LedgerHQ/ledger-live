# @shared/auth

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

RTK Query helpers for APIs that authenticate through an injected token provider.

## Usage

Use `createAuthenticatedBaseQuery` like `fetchBaseQuery` when declaring an RTK
Query API. Authentication is enabled by default:

```ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { createAuthenticatedBaseQuery } from "@shared/auth";

export const customApi = createApi({
  reducerPath: "customApi",
  baseQuery: createAuthenticatedBaseQuery({
    baseUrl: "https://api.example.com/v1/",
  }),
  endpoints: build => ({
    pushDevices: build.mutation<void, PushFooRequest>({
      query: body => ({
        url: "foo/create",
        method: "POST",
        body,
      }),
    }),
    getPublicData: build.query<PublicData, void>({
      query: () => "foo/read",
      extraOptions: {
        authenticated: false,
      },
    }),
  }),
});
```

For each authenticated endpoint, the base query calls `authProvider.withToken()` and
adds:

```ts
authorization: `${token.tokenType} ${token.accessToken}`;
```

Set `extraOptions.authenticated` to `false` on endpoints that must stay public.

By default, `401` responses rejected by `fetchBaseQuery` refresh the token and retry
the request once. If an endpoint accepts these responses through
`validateStatus`, set `extraOptions.refreshAndRetryWhen` to inspect the response
metadata instead:

```ts
query: () => ({
  url: "foo/read",
  validateStatus: () => true,
}),
extraOptions: {
  refreshAndRetryWhen: result => result.meta?.response?.status === 401,
},
```

Supplying `refreshAndRetryWhen` replaces the default predicate.
Only match responses that definitively indicate an authentication failure. Retried
mutations must be idempotent or use idempotency keys to avoid duplicate side effects.

Use `authApiExtra` to provide a stable `authProvider` through RTK Query's
[`api.extra`](https://redux-toolkit.js.org/rtk-query/api/fetchBaseQuery#prepareheaders)
([Redux thunk `extraArgument`](https://redux-toolkit.js.org/api/getDefaultMiddleware#customizing-the-included-middleware)):

```ts
const store = configureStore({
  reducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      thunk: {
        extraArgument: {
          ...authApiExtra({
            isFeatureEnabled: () => selectFeature(store.getState(), "lwdAuth").enabled,
            authProvider: new AuthSDK(
              {
                ...authConfig,
                keycloakBaseUrl: () => resolveKeycloakBaseUrl(store.getState()),
              },
              { provider: identityProvider },
            ),
          }),
        },
      },
    }),
});
```

The facade evaluates `isFeatureEnabled` for every request. It calls queries without a
token while authentication is disabled and delegates to the same injected
`AuthProvider` while enabled. Provider creation, feature selection, and environment
availability remain app-owned. `AuthSDK` from `@ledgerhq/ledger-auth` is one concrete
implementation behind this thunk contract.

## Scope

This package owns the RTK Query adapter and auth environment state. Concrete provider
construction, feature selection, credentials, and platform cryptography remain in each
app's composition root.

## Validation

```sh
pnpm --filter @shared/auth test
pnpm --filter @shared/auth typecheck
pnpm --filter @shared/auth lint
```
