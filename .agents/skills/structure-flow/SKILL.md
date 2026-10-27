---
name: structure-flow
description: Decide where Ledger Wallet code goes in the monorepo layers (`support/`, `shared/`, `domain/`, `features/`, `apps/`, plus `devtools/`) with a first-yes-wins decision tree, and apply the placement rules behind it - entity versus flow state, one flow per journey, namespace-first naming, each package owning its view of an entity. Use when creating, moving or reviewing code or a package in any layer, deciding which layer owns a concern, splitting a flow, naming a package, or checking dependency boundaries.
---

# Structure and flow

Place each concern in the lowest layer that can own it. New code goes in the layers; `apps/*/src/mvvm`
only holds app screens composing `@features/*` and app-only code. The layer model, the legacy `libs/`
status and the import rules live in [the architecture guide](../../../docs/monorepo-architecture.md).

## Decide the layer: first yes wins

Ask in order and stop at the first yes.

1. **Only used at build or test time?** `support/<name>`, taken as a devDependency.
2. **Zero business meaning, would compile at any company?** `shared/<name>`.
3. **The business noun itself: its schema, rules, reads?** `domain/entity/<name>`.
   **Fetching or mutating it?** `domain/api/<name>`, injecting endpoints into a base of `@shared/api-services`.
4. **Knows the business, serves several features, owns no journey?** `features/platform/<name>`.
5. **The user sees it and walks through it, entry to exit?** `features/flow/<use-case>`.
6. **None of the above:** `apps/<app>`, for final composition, screens, routes, store and telemetry.

Debug tooling embedded in the apps is a side scope, `devtools/`: see [devtools](#devtools-is-a-side-scope).
Examples per question and the traps between neighbours: [references/layers.md](references/layers.md).

## What each layer may hold

| Layer               | Holds                                                              | Never                                                   |
| ------------------- | ------------------------------------------------------------------ | ------------------------------------------------------- |
| `apps/<app>`        | Screens, global routing, store, analytics host, observability, glue | Business logic, schemas, entities, slices              |
| `features/flow`     | One journey: business-aware UI, flow state, local routing          | Another journey, app screen composition                 |
| `features/platform` | Hooks, selectors, NFR rules, React glue, UI shared by several flows | Screens, global routing, single-flow internals, a flow  |
| `domain/entity`     | Zod schema, inferred type, defaults, mocks, selectors, slice       | React, network calls, feature state                     |
| `domain/api`        | Endpoints, wire schemas, transforms, cache tags, RTK Query hooks   | UI, app composition                                     |
| `shared`            | Generic primitives, Redux tooling, generic UI in `shared/ui-*`     | Business vocabulary (wallet, account, coin), junk drawers |
| `support`           | Test, TypeScript, lint and format configuration                    | Runtime code                                            |

There is no `domain/aggregate`: code that combines several entities follows
[data-layer-advanced](../data-layer-advanced/SKILL.md) until a first aggregate package lands.

## Entity or flow state

A value is **entity** state when a backend could return it, two features speak of it, it carries its
own business rules, or a PM says the word. It is **flow** state when it describes what the UI is doing
now (names with `open`, `step`, `selected`, `draft`), lives only while the flow runs and nobody outside
reads it. Entity state goes in `domain/entity`; flow state stays in the flow's `state/`. Never promote
flow state to an entity to share it. Details: [references/heuristics.md](references/heuristics.md#entity-or-flow-state).

## One flow, one journey

One flow is one use case, with one entry and one exit: one package, one owner. Split a flow at its
journey lines when it has its own Figma file, its own sprint-review demo or its own feature flag, or
when its kebab name needs an "and". A "screen" with its own entry point is a flow in disguise. After a
split, the parent flow becomes a thin orchestrator and pieces several flows share sink to
`features/platform`, never into a `common/` folder. Example and details:
[references/heuristics.md](references/heuristics.md#one-flow-one-journey).

Inside a flow package (flat `src/` or `screens/<Screen>/`, view models, flow state, local routing):
[flow-package](../flow-package/SKILL.md).

## Each package owns its view

Two packages that need similar data do not share a type for it. Each declares the shape it needs and
maps it explicitly from the entity; the entity is the only shared vocabulary. Accidental similarity is
not intentional coupling. Example: [references/heuristics.md](references/heuristics.md#each-package-owns-its-view).

## Dependencies point down

```text
apps → features/flow → features/platform → domain/api → domain/entity → shared
```

- `shared/`, `domain/` and `features/` never import `libs/`; only `apps/` imports both sides.
- Import another package by its npm name, never a relative path; every `index.*` is a pure barrel:
  [package-public-api](../package-public-api/SKILL.md).
- A third-party runtime library is wrapped by its lowest valid owner:
  [wrap-third-party-libs](../wrap-third-party-libs/SKILL.md).
- `pnpm lint:boundaries` checks the direction. The full table: [references/layers.md](references/layers.md#dependency-table).

## Name it namespace first

The folder path gives the package name: `domain/entity/<name>` is `@domain/entity-<name>`, and so on
for every layer. Inside `<name>`, the namespace comes first, then the qualifier: `currency-crypto`,
`currency-fiat`, `market-index-fear-and-greed`, `account-name`. A package that breaks either rule is
renamed when someone touches it, never copied. Table and known deviations:
[references/layers.md](references/layers.md#naming).

## Moving legacy code

Code leaves `libs/` and `apps/*/src` in three PRs, addition, deprecation, deletion, and reaches what
only legacy code has through injection: [legacy-migration](../legacy-migration/SKILL.md).

## devtools is a side scope

`devtools/` holds the debug tool platform the apps embed (`@devtools/<tool>`). It may depend on
the layers; no layer depends on it. App state reaches a tool as props built in `@devtools/bindings`.
Imports between devtools packages: [devtools-import-boundary](../devtools-import-boundary/SKILL.md).

## Review

- The decision tree, asked in order, lands on the package's layer.
- Entity data lives in `domain/entity`; flow state stays in its flow.
- Each flow package is one journey; shared pieces sit in `features/platform`, not in a `common/` folder.
- No package reuses another package's view type instead of mapping from the entity.
- The folder path gives the package name, namespace first.
- Imports follow the dependency table; apps only compose.
