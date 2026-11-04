---
name: domain-data
description: Build the data layer of one entity in `domain/`. The `domain/entity` package holds Zod schemas, inferred types, branded ids, the slice, mocks and selectors. The `domain/api` package injects RTK Query endpoints into an `@shared/api-services` base. Use when creating or reviewing a package under `domain/entity/` or `domain/api/`, a Zod schema, a `createSlice`, a selector, a mock factory or an RTK Query endpoint.
---

# Domain data: one entity, one api

One backend resource maps to one entity. Use [`data-layer-advanced`](../data-layer-advanced/SKILL.md)
when one response hydrates several entities. Placement comes from
[`structure-flow`](../structure-flow/SKILL.md), barrels from
[`package-public-api`](../package-public-api/SKILL.md).

| Package | Owns | Never |
| --- | --- | --- |
| `@domain/entity-<name>` | schemas, inferred types, branded ids, slice, mocks, selectors | React, network calls, an app store type |
| `@domain/api-<name>` | endpoints, wire schemas, transforms, cache tags, hooks | `createApi`, base URL, env reads |

Reference packages: [`@domain/entity-contact`](../../../domain/entity/contact/src/) and
[`@domain/api-push-devices`](../../../domain/api/push-devices/src/).

## Entity package

```text
domain/entity/<name>/src/
├── schema.ts         # Zod schemas (required)
├── types.ts          # z.infer types and the state type
├── schema.mock.ts    # mock factories, parsed by the schema (required)
├── slice.ts          # createSlice, initial state, default reducer
├── slice.mock.ts     # mock slice state (required with a slice)
├── selectors.ts
└── index.ts          # export * only
```

Every source file has its `*.test.ts`. Slice, selectors and their mocks are optional: an entity
can be schema-only.

**Schema first.** Write the Zod schema, then infer the type. Never hand-write a type the schema
already describes, and never add Typia.

```ts
// schema.ts
export const ContactNameSchema = z.string().min(1).max(CONTACT_NAME_MAX_LENGTH).brand<"ContactName">();

// types.ts
export type ContactName = z.infer<typeof ContactNameSchema>;
```

- **Brand ids and constrained strings** (`.brand<"ContactName">()`, `CryptoCurrencyIdSchema` in
  `@domain/entity-currency-crypto`) so two strings of different meaning cannot be swapped.
- **Reuse primitives** from `@shared/schema-primitives` (`NonEmptyStringSchema`,
  `DateTimeIsoSchema`, `HttpUrlSchema`) and other entities' schemas, never a local copy.
- **Nullable means `.nullable()`.** A field the backend sends as `null` is `.nullable()`; a field it
  may leave out is `.optional()`. They are not interchangeable.
- **Build values through the schema.** A constructor such as `contact(data)` in `define.ts` returns
  `ContactSchema.parse(data)`, so a branded value always passed validation.

**Slice.** The initial state is a named export typed with `satisfies`, every property set. The
reducer is the default export of `slice.ts`, re-exported by the barrel with
`export { default } from "./slice"`, the one form `package-public-api` tolerates. An app then
registers `contacts: contactsReducer` from `import contactsReducer from "@domain/entity-<name>"`.

```ts
export const contactsInitialState = { contacts: [defaultMeContact] } satisfies ContactsState;

export const contactsSlice = createSlice({ name: "contacts", initialState: contactsInitialState, reducers: { ... } });

export const { setContacts, addContact } = contactsSlice.actions;
export default contactsSlice.reducer;
```

`@domain/entity-contact` predates the default export and `slice.mock.ts`: its apps register
`contactsSlice.reducer`. Add both when you touch it.

- One state transition per reducer; use Immer's mutable syntax.
- Type payloads with `PayloadAction<T>`, using the entity's branded types.
- Handle another slice's or a thunk's actions in `extraReducers` with the builder callback.

**Mocks.** `schema.mock.ts` builds one valid value per schema, with overrides
(`mockContact(overrides)`), and passes it through the schema. `slice.mock.ts` builds a slice state
from those mocks, for store preloading and selector tests. Mocks stay out of the barrel: expose
them as `package.json#exports` subpaths (`"./schema.mock"`, `"./slice.mock"`).

**Selectors** take a minimal local root type, never an app `State`:

```ts
type ContactsStateRoot = { contacts: ContactsState };

export function selectContacts(state: ContactsStateRoot): Contact[] {
  return state.contacts.contacts;
}
```

Use `createSelector` only for a derived value that allocates (a filtered list, a mapped object).

## Api package

Every backend has one endpoint-less api in `@shared/api-services` (`calApi`, `cardApi`,
`coinMarketCapApi`, `countervaluesApi`, `dadaApi`, `portfolioApi`, `pushDevicesApi`, `swapApi`).
The use case adds its tags and endpoints to it; it never calls `createApi`. A new backend gets its
base there first ([`shared/api-services`](../../../shared/api-services/README.md#adding-a-service)).

```ts
export const FEAR_AND_GREED_TAGS = ["FearAndGreedLatest"] as const;

export const fearAndGreedApi = coinMarketCapApi
  .enhanceEndpoints({ addTagTypes: FEAR_AND_GREED_TAGS })
  .injectEndpoints({
    endpoints: build => ({
      getFearAndGreedLatest: build.query<FearAndGreedIndex, void>({
        query: () => ({ url: "/fear-and-greed/latest" }),
        providesTags: [...FEAR_AND_GREED_TAGS],
      }),
    }),
  });

export const { useGetFearAndGreedLatestQuery } = fearAndGreedApi;
```

- **Config comes through `extraArgument`.** The app builds it with the service's builder
  (`pushDevicesApiExtra({ ... })`) and the base query reads it. A domain package never reads an
  env var, a global or a module-level setter.
- **Tags belong to the use case**, declared with `enhanceEndpoints({ addTagTypes })` next to the
  endpoints that provide them. Never add a tag to the shared base.
- **Validate the response.** `responseSchema` when the schema does not transform. A transforming
  schema (`.transform()`, branded output) fails that typecheck: use `rawResponseSchema` plus
  `transformResponse`. Add `catchSchemaFailure` so a failure reaches the query's `error`.
- **Hooks are allowed here**, unlike in `domain/entity`: export the generated `use*Query` /
  `use*Mutation`.
- **Apps register the service api**; features import hooks from the use-case package, whose value
  import is what runs the injection.

Endpoint options, error handling and registration traps:
[references/api-endpoints.md](references/api-endpoints.md). The why of the split:
[`domain/api/README.md`](../../../domain/api/README.md).

## Test

- Schema: accepts a mock, rejects an invalid payload, covers each refinement.
- Mock: returns schema-valid data and honors overrides.
- Slice: `reducer(undefined, { type: "" })` returns the initial state; each reducer has a case.
- Selectors: direct and derived values on a `slice.mock.ts` state.
- Api: a local `configureStore` with the service api's reducer, middleware and `extraArgument`
  builder, the request faked with MSW (see [`testing`](../testing/SKILL.md)); cover success, a
  schema failure and a transport failure.

## Review checklist

- [ ] No `createApi` in `domain/api`; endpoints injected into an `@shared/api-services` base
- [ ] No handwritten type next to a schema; no Typia; nullable fields use `.nullable()`
- [ ] Ids and constrained strings branded; primitives reused from `@shared/schema-primitives`
- [ ] Slice has a complete initial state and a default-exported reducer; `slice.mock.ts` exists
- [ ] No React and no app store import in `domain/entity`
- [ ] Barrels hold `export *` only (plus `export { default } from "./slice"`)
