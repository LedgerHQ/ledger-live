# @shared/auth

> [!CAUTION]
> **Status: UNSTABLE** — RTK Query auth adapter; under active development.

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

For each authenticated endpoint, the base query calls `authSDK.withToken()` and
adds:

```ts
authorization: `${token.tokenType} ${token.accessToken}`;
```

Set `extraOptions.authenticated` to `false` on endpoints that must stay public.

The Redux store must provide an `authSDK` through RTK Query's
[`api.extra`](https://redux-toolkit.js.org/rtk-query/api/fetchBaseQuery#prepareheaders)
([Redux thunk `extraArgument`](https://redux-toolkit.js.org/api/getDefaultMiddleware#customizing-the-included-middleware)):

```ts
getDefaultMiddleware({
  thunk: {
    extraArgument: {
      authSDK,
    },
  },
});
```

- With `authSDK` implementing `AuthProvider`, for example an instance of `AuthSDK` from `@ledgerhq/ledger-auth`.

## Scope

This package only owns the RTK Query adapter and its authentication contract.
Concrete authentication construction, credential loading, and lifecycle
management belong to the app or feature using the adapter.

## Validation

```sh
pnpm --filter @shared/auth test
pnpm --filter @shared/auth typecheck
pnpm --filter @shared/auth lint
```
