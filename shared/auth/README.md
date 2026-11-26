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

Register `createAuthMiddleware` in the store to provide the `authProvider`. The base
query gets it by dispatching an action that the middleware answers, the way RTK's
`dispatch(addListener(...))` returns an unsubscribe function, so the thunk
`extraArgument` keeps only config:

```ts
const store = configureStore({
  reducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(
      createAuthMiddleware<State>({
        isFeatureEnabled: state => selectFeature(state, "lwdAuth").enabled ?? false,
        createAuthProvider: getState =>
          new AuthSDK(authConfig, {
            provider: new LkrpIdentityProvider(() => getState().trustchain),
          }),
      }),
    ),
});
```

Its place in the chain does not matter, but adding it before the app's own middlewares
keeps the provider request, dispatched before every authenticated request, out of
them. `createAuthProvider` runs once, when the store is created. `isFeatureEnabled` is
read before every request: while it returns `false`, queries are called without a
token. Without the middleware, authenticated endpoints fall back to unauthenticated
requests.

A thunk reads the provider with `getAuthProvider(dispatch)`.

### Several providers

A store can hold several providers, one per key: the default one has no key. Give each
extra provider a `key`, and pass the same key to the base query of the APIs that
authenticate with it. Declare the key once, so the middleware and the APIs can't drift:

```ts
const OTHER_REALM_AUTH = "other-realm";

createAuthMiddleware<State>({
  key: OTHER_REALM_AUTH,
  isFeatureEnabled: state => isOtherRealmAuthEnabled(state),
  createAuthProvider: () => new AuthSDK(otherRealmConfig, { provider: otherRealmIdentity }),
});

const otherRealmApi = createApi({
  reducerPath: "otherRealmApi",
  baseQuery: createAuthenticatedBaseQuery({ baseUrl }, { authProviderKey: OTHER_REALM_AUTH }),
  endpoints: build => ({ /* … */ }),
});
```

`isOtherRealmAuthEnabled`, `otherRealmConfig` and `otherRealmIdentity` stand for the app's
own feature check, Keycloak config and identity provider.

The middleware without a key keeps answering base queries without one and
`getAuthProvider(dispatch)`. A thunk reads a keyed provider with
`getAuthProvider(dispatch, OTHER_REALM_AUTH)`. Each provider has its own `isFeatureEnabled`.
When no middleware holds a key, base queries with that key send their requests without a
token, like a store without the middleware, and `getAuthProvider` throws
`AuthProviderMissingError`. When two middlewares share a key, the first in the chain answers.

## Scope

This package owns the RTK Query adapter and the middleware that holds the provider.
Concrete provider construction, feature selection, credentials, and platform
cryptography remain in each app's composition root.

## Validation

```sh
pnpm --filter @shared/auth test
pnpm --filter @shared/auth typecheck
pnpm --filter @shared/auth lint
```
