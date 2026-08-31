---
name: card-endpoint-shape
description: Read this before adding or editing an endpoint in `domain/api/card-management/src/api.ts`, or a credential-bearing call in `grants.ts`.
---

# Card endpoint shape

Every endpoint is a declaration. Four keys, always in this order:

```typescript
someEndpoint: build.query<Canonical, Request>({
  query: (request) => ({
    url: "/v1/some/path",
    method: "GET",
  }),
  rawResponseSchema: SomeWireSchema, // the wire shape
  transformResponse: transformSome, // wire -> canonical
  responseSchema: SomeSchema, // what callers receive
});
```

| Key | Answers | Lives in |
| --- | --- | --- |
| `query` | What we send | `api.ts` |
| `rawResponseSchema` | What the backend promised | `schema.ts` |
| `transformResponse` | How it becomes ours | `transforms.ts` |
| `responseSchema` | What the caller gets | `schema.ts` |

Drop the keys you do not need. An endpoint whose wire shape is already canonical declares
`responseSchema` alone — `logout` and `getUser` both do.

**Return the wire contract, nothing more.** A field the backend never sent does not belong on the
answer. If a caller needs one of its own request values afterwards, it already has it.

## Never use `queryFn`

`queryFn` is the escape hatch for endpoints that are not one HTTP call. None here is, and it costs
more than it looks:

- **RTK Query skips `transformResponse` for a `queryFn` endpoint.** `getTransformCallbackForEndpoint`
  in `buildThunks` is guarded by `endpointDefinition.query &&`. The mapper is silently ignored, so the
  mapping moves inside the function, by hand.
- The `baseQuery` result is `unknown`, so the body needs a cast or a manual `safeParse`.
- Every one brings its own `if (response.error) return { error: response.error }`.

Three lines of declaration become twenty of plumbing, and the endpoint stops reading like its
neighbours.

## An endpoint that handles a credential is not an endpoint

RTK Query and `createAsyncThunk` expose arguments and results in lifecycle actions. Credential calls
therefore use plain thunks in `grants.ts`, which dispatch nothing. They call `postCardJson` without a
Bearer or renewal, validate and transform the response, and never include the body in an error.

## Where configuration comes from

`query` receives the request argument and nothing else. It cannot reach the store, so:

- **The base query's business** — base URL, `x-client-key`, `Authorization`, the 401 refresh — comes
  from `cardApiExtra` in [`@shared/api-services`](../../../../../../shared/api-services/README.md). Never
  restate it in an endpoint.
- **Everything else is a request argument.** The OAuth client id and redirect URI are the app's to
  know, so they arrive on the `oauthConfig` prop and travel down as arguments. Reaching for `queryFn`
  to read them out of `cardApiExtra` is the trap this rule exists to close.

`transformResponse` does receive the request as its third argument, after the base query's `meta`.
Use it to map, never to staple a request value back onto the answer.

## Rules

- **Schemas are the only validation.** No `as` on `response.data`, no hand-built `PARSING_ERROR`. A
  schema failure rejects the thunk and keeps the body out of the rejected action.
- **Keep the wire schema narrow.** Zod drops undeclared keys, which is what keeps PII out of the
  cache. `PayCardUserResponseSchema` declares two fields on purpose. Do not widen it.
- **Transforms are named functions in `transforms.ts`**, `transformXxx`, one test each. Never inline.
- **Types are `z.infer`** in `types.ts`. Request-argument types are hand-written there too.
- **`build.mutation` for anything not idempotent**, even a GET. A call that changes something on the
  backend, or that cannot be repeated safely, is a mutation.

## Checklist

- [ ] `query`, not `queryFn` — and a call that handles a credential belongs in `grants.ts` instead
- [ ] No `as` and no `try`/`catch` in `api.ts`
- [ ] Wire shape validated by a schema in `schema.ts`
- [ ] Mapping in `transforms.ts`, with a test
- [ ] Nothing the base query already sends is repeated in the endpoint
