# @ledgerhq/rtk-query-auth

RTK Query helpers for APIs that must authenticate through a compatible `AuthSDK`.

## Usage

Use `createAuthenticatedBaseQuery` like `fetchBaseQuery` when declaring an RTK
Query API. Authentication is enabled by default:

```ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { createAuthenticatedBaseQuery } from "@ledgerhq/rtk-query-auth";

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

For each authenticated endpoint, the base query calls `authSDK.authenticate()`
and adds:

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

With `authSDK` implementing the package `AuthSDK` type, for example an instance
of `AuthSDK` from `@ledgerhq/ledger-auth`.

## Scope

This package only owns the RTK Query adapter. App-specific `AuthSDK` construction,
credential loading, and lifecycle management belong to the app or feature using
the adapter.

## Validation

```sh
pnpm --filter @ledgerhq/rtk-query-auth test
pnpm --filter @ledgerhq/rtk-query-auth typecheck
pnpm --filter @ledgerhq/rtk-query-auth lint
```
