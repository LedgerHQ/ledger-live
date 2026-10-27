# Layers: examples, dependencies, naming

Detail for [structure-flow](../SKILL.md). Every example is a package on `develop`.

## The decision tree, with examples

| Question (first yes wins)                                    | Layer                      | Example                                                      |
| ------------------------------------------------------------ | -------------------------- | ------------------------------------------------------------ |
| 1. Only used at build or test time?                          | `support/`                 | `@support/jest`, `@support/tsconfig`                         |
| 2. Zero business meaning, would compile at any company?      | `shared/`                  | `@shared/schema-primitives`, `@shared/ui-qr-code`            |
| 3. The business noun itself?                                 | `domain/entity/`           | `@domain/entity-contact`                                     |
| 3. Fetching or mutating it?                                  | `domain/api/`              | `@domain/api-push-devices`                                   |
| 4. Business-aware, several features, no journey?             | `features/platform/`       | `@features/platform-feature-flags`, `@features/platform-contacts` |
| 5. The user walks through it, entry to exit?                 | `features/flow/`           | `@features/flow-contacts-add-address`                        |
| 6. Final composition, screens, routes, store, telemetry      | `apps/`                    | `apps/ledger-live-desktop/src/mvvm/features/Contacts`        |

Traps between neighbours:

- **`shared` or `domain`.** A name that says wallet, account, coin or contact is business vocabulary,
  so the code is not `shared`. A `misc/` or `utils2/` package is a junk drawer: split it by owner.
- **`domain/entity` or `domain/api`.** The schema and the selectors of what a thing *is* stay in the
  entity; the wire schema, the transform and the endpoint that *fetch* it go in the api package, which
  depends on the entity, never the reverse.
- **`features/platform` or `features/flow`.** Code one flow uses stays in that flow, even when it looks
  reusable. It moves to `features/platform` when a second flow needs it.
- **`features/flow` or `apps`.** A screen the app routes to is app composition; the journey it shows
  is a flow. Desktop and mobile may compose the same flow into different screens.

## What may render, per layer

| Layer               | React and UI                                                                         | Example                                                         |
| ------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| `domain/entity`     | None: no `react` or `react-native`. `pnpm lint:boundaries` rejects them.              | `@domain/entity-contact`                                        |
| `domain/api`        | RTK Query hooks generated from its endpoints; no components                          | `useCheckOfacGeoBlockQuery` in `@domain/api-ofac`               |
| `shared`            | Generic UI with no business meaning, in `shared/ui-*` packages; most others none     | `@shared/ui-qr-code`, `@shared/ui-info-state`                   |
| `features/platform` | Non-visual components and UI shared by several flows                                 | `@features/platform-device-action-content`, `@features/platform-style` |
| `features/flow`     | The journey's screens and components                                                 | `@features/flow-pay-card`                                       |

A `features/platform` component is still business-aware and still has no screen of its own: a shared
dialog or animation, not a page. A component with no business meaning goes to `shared/ui-*` instead.

## `domain/api` and `@shared/api-services`

`@shared/api-services` holds one endpoint-less `createApi` per backend (`cal`, `card`,
`coinmarketcap`, `countervalues`, `dada`, `portfolio`, `push-devices`, `swap`). A `domain/api`
package calls `injectEndpoints` on one of them and owns the endpoints, wire schemas, transforms, cache
tags and hooks: see `@domain/api-push-devices`. Polling intervals are a view decision made in the
feature. Configuration reaches the endpoints through the store's thunk `extraArgument`.

## No `domain/aggregate` yet

The Confluence guideline describes `domain/aggregate` for cross-entity aggregates. No package uses it,
and no tag or constraint exists for it. Do not create the folder: orchestration over several entities
follows [data-layer-advanced](../../data-layer-advanced/SKILL.md). The first aggregate package comes
with its tag and its boundary constraint in the same PR.

## Dependency table

| Source              | May depend on                                                      |
| ------------------- | ------------------------------------------------------------------ |
| `shared`            | `shared`                                                           |
| `domain/entity`     | `domain/entity`, `shared`                                          |
| `domain/api`        | `domain/api`, `domain/entity`, `shared`                            |
| `features/platform` | `features/platform`, `domain`, `shared`                            |
| `features/flow`     | `features/flow`, `features/platform`, `domain`, `shared`           |
| `apps`              | Any layer, `devtools/` and `libs/`                                 |
| `devtools`          | `devtools` per [devtools-import-boundary](../../devtools-import-boundary/SKILL.md), `features`, `domain`, `shared` |
| `support`           | `support`, `shared`; consumed through `devDependencies` only       |

Every layer may take `support` as a devDependency. The constraints live in
[`constraints.js`](../../../../tools/nx-plugins/enforce-boundaries/constraints.js); Nx infers the tags
from the folder path, so do not add tags by hand.

## Naming

The folder path gives the package name.

| Folder                     | Package name                | Example                            |
| -------------------------- | --------------------------- | ---------------------------------- |
| `shared/<name>`            | `@shared/<name>`            | `@shared/schema-primitives`        |
| `domain/entity/<name>`     | `@domain/entity-<name>`     | `@domain/entity-contact`           |
| `domain/api/<name>`        | `@domain/api-<name>`        | `@domain/api-push-devices`         |
| `features/platform/<name>` | `@features/platform-<name>` | `@features/platform-feature-flags` |
| `features/flow/<name>`     | `@features/flow-<name>`     | `@features/flow-contacts`          |
| `support/<name>`           | `@support/<name>`           | `@support/jest`                    |
| `devtools/<name>`          | `@devtools/<name>`          | `@devtools/feature-flags`          |

Inside `<name>`, namespace first, then the qualifier, so related packages sort together:
`currency-crypto`, `currency-fiat`, `currency-token`, `currency-unit`; `market-index-altcoin-season`,
`market-index-fear-and-greed`; `account-balance`, `account-name`.

Known deviations, renamed when someone touches them, never copied:

- `domain/entity/starred-account` (`@domain/entity-starred-account`): qualifier first; the namespace-first
  name is `account-starred`.
- `features/flow/flow-contacts-*` (for example `features/flow/flow-contacts-list`, published as
  `@features/flow-contacts-list`): the folder repeats the `flow-` prefix; the folder that gives this
  name is `features/flow/contacts-list`.
- `support/test-quarantine` is published as `@ledgerhq/test-quarantine`, not `@support/test-quarantine`.

## devtools

`devtools/` is the debug tool platform the apps embed: `@devtools/shell` renders the tools,
`@devtools/registry` lists them, and each `@devtools/<tool>` is a self-contained React component that
takes its data as props. `@devtools/bindings` is the one bridge to app state: it builds those props
from the store and may depend on the layers. No layer package depends on `devtools/`, and its
internal import table is a convention, not a lint rule: see
[devtools-import-boundary](../../devtools-import-boundary/SKILL.md) and
[`devtools/README.md`](../../../../devtools/README.md).
