---
name: rtk-query-api
description: RTK Query createApi best practices
---

# RTK Query - createApi

## Structure

- **One API slice per base URL / data source** — never two `createApi` calls against the same backend
- Export generated hooks alongside the API

```typescript
// ✅ GOOD - state-manager/api.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { EntityTags } from "./types";

export const myApi = createApi({
  reducerPath: "myApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: [EntityTags.Entity, EntityTags.Entities],
  endpoints: (build) => ({
    getEntity: build.query<Entity, string>({
      query: (id) => `entities/${id}`,
      providesTags: [EntityTags.Entity],
    }),
  }),
});

export const { useGetEntityQuery } = myApi;
```

Define tags as enums in `state-manager/types.ts`:

```typescript
export enum EntityTags {
  Entity = "Entity",
  Entities = "Entities",
}
```

## Sharing one backend across use cases

When a **second** use case needs the same base URL, do not add a second `createApi` — split the backend
from the use case. Declare an empty api for the backend, then add endpoints with
[`injectEndpoints`](https://redux-toolkit.js.org/rtk-query/usage/code-splitting#injecting-endpoints).
It mutates and returns the *same* api object, so one reducer, one middleware and one cache serve every
use case.

In `domain/api/`, these empty apis live in `@domain/api-services`, one file per backend, each holding
just the `extraArgument` contract, a transport-only base query and the `createApi` — see
[domain/api/README.md](../../../domain/api/README.md).

```typescript
// ✅ GOOD - the service api: base query + config, no endpoints
export const myServiceApi = createApi({
  reducerPath: "myServiceApi",
  baseQuery: myServiceBaseQuery,
  // tagTypes is ONLY accepted here, never in injectEndpoints — list every tag any injector uses.
  tagTypes: [...FIRST_USE_CASE_TAGS, ...SECOND_USE_CASE_TAGS],
  endpoints: () => ({}),
});
```

```typescript
// ✅ GOOD - a use case injecting into it
export const firstUseCaseApi = myServiceApi.injectEndpoints({
  endpoints: build => ({
    getEntity: build.query<Entity, string>({
      query: id => `entities/${id}`,
      providesTags: [...FIRST_USE_CASE_TAGS],
    }),
  }),
});

export const { useGetEntityQuery } = firstUseCaseApi;
```

- **Register the service api; call endpoints on the use case.** Only the injected reference is typed
  with the endpoints — `injectEndpoints` cannot retype the original.
- **Injection is a module-level side effect.** An endpoint exists only once its use-case module has
  been evaluated as a *value* import; a type-only import will not trigger it. Never import an api from
  `@domain/api-services` in order to call endpoints on it.
- **Keep the shared file transport-only.** If a backend's base query needs use-case knowledge (mock
  handlers keyed by endpoint URL, endpoint-name lookups), leave its `createApi` in the use-case package.
- **`overrideExisting` defaults to `false`** — injecting an endpoint name that already exists is
  silently ignored unless you opt in.

## Endpoints

- Use `build.query` for GET requests
- Use `build.mutation` for POST/PUT/DELETE
- Type both response and argument: `build.query<ResponseType, ArgType>`
- Use `void` for no arguments: `build.query<Data[], void>`

## Caching & Tags

- Define tags as **enums** in `types.ts`
- Use `providesTags` on queries for cache invalidation
- Use `invalidatesTags` on mutations to trigger refetch
- Use `keepUnusedDataFor` for custom cache duration

```typescript
endpoints: (build) => ({
  getItems: build.query<Item[], void>({
    query: () => "items",
    providesTags: [ItemTags.Items],
    keepUnusedDataFor: 60, // seconds
  }),
  addItem: build.mutation<Item, Partial<Item>>({
    query: (body) => ({ url: "items", method: "POST", body }),
    invalidatesTags: [ItemTags.Items],
  }),
}),
```

## Transform Responses

- Use `transformResponse` to reshape API data
- Use `transformErrorResponse` for custom error handling

```typescript
getItems: build.query<Item[], void>({
  query: () => "items",
  transformResponse: (response: ApiResponse) => response.data.items,
}),
```

## Error Handling

- Always catch errors in custom `baseQuery` or `queryFn`
- Return `{ data }` on success, `{ error }` on failure

```typescript
// ✅ GOOD - errors are caught and returned
queryFn: async (arg) => {
  try {
    const data = await fetchData(arg);
    return { data };
  } catch (error) {
    return { error: { status: "CUSTOM_ERROR", data: error } };
  }
},
```

## Registration

Register APIs in `reducers/rtkQueryApi.ts`, keyed by `reducerPath`. For a shared backend, register the
**service api** — its endpoints arrive via the use-case packages the view-models import. The registry
then reads as a list of the backends the app talks to:

```typescript
const APIs = {
  [myApi.reducerPath]: myApi,
  [myServiceApi.reducerPath]: myServiceApi,
};
```

Two entries whose `reducerPath` resolves to the same string is a **compile error**
(`TS1117: An object literal cannot have multiple properties with the same name`), even for computed
properties — which is what catches an accidental double-registration of one backend.
