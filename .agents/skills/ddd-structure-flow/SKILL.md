---
name: ddd-structure-flow
description: Place and organize Ledger Wallet code in the DDD monorepo. Use when creating, moving, or reviewing code under apps, features, domain, shared, or support; deciding which layer owns a concern; structuring packages and flow steps; or checking package names, dependency boundaries, platform variants, and legacy imports.
---

# DDD Structure And Flow

Use the lowest layer that can own the concern without depending on a higher layer.

Read [the canonical architecture guide](../../../docs/ddd-monorepo-architecture.md) and [the package creation checklist](../../../docs/new-library.md) before creating a package.

Upstream source: [Structure & Flow](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/6111232117/Guideline+Monorepo+DDD+Re-architecture+Structure+Flow)

## Choose The Owner

| Concern                                  | Location                      | Owns                                                                                             | Does not own                                       |
| ---------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| Platform entry point                     | `apps/<app>`                  | Screens, global routing, store composition, analytics, observability, app glue                   | Reusable feature internals                         |
| User-visible capability                  | `features/flow/<feature>`     | Business-aware UI, user journeys, local state, flow routing                                      | App-specific screen composition                    |
| Capability shared across flows           | `features/platform/<feature>` | Hooks, selectors, NFR rules, React glue, and components shared by several flows or use cases     | Single-flow internals and fully generic components |
| Business object                          | `domain/entity/<entity>`      | Runtime schema, inferred type, defaults, mocks, selectors, slice                                 | Network calls and feature state                    |
| Network/data access                      | `domain/api/<name>`           | API contracts, calls, transformations, RTK Query, thunks                                         | UI and app composition                             |
| Business-agnostic primitive or component | `shared/<name>`               | Generic schemas, utilities, Redux primitives, and components without domain or feature knowledge | Domain or app knowledge                            |
| Development-only tooling                 | `support/<name>`              | Shared test, TypeScript, lint, and format configuration                                          | Runtime code                                       |

Use these distinctions:

- Keep feature-scoped state in its `features/flow` package; do not promote it to an entity.
- Keep an element in `features/flow` when it belongs to one flow or use case.
- Move a feature-level element to `features/platform` when several flows or use cases need it, especially when it connects them to the domain.
- Keep fully generic, business-agnostic elements in `shared` or the existing design-system package.
- Keep app screens in each app. Let them compose exported flow entry points.
- Keep `.web` and `.native` variants beside each other inside the owning feature.

## Organize The Package

Every unit is a private package with `package.json`, `src/`, explicit exports, and no cross-package relative imports.

```text
features/flow/<feature>/src/
├── components/                # shared by several steps
├── hooks/
├── router/                    # flow-local routing only
├── state/                     # feature-scoped state
├── steps/<StepName>/
│   ├── components/            # used only by this step
│   ├── viewModel.ts           # state and orchestration
│   ├── view.ts                # rendering and callbacks
│   ├── view.test.ts
│   └── index.ts
├── utils/
└── index.ts                   # minimal public API

domain/entity/<entity>/src/
├── schema.ts
├── schema.mock.ts
├── selectors.ts
├── slice.ts
└── index.ts

domain/api/<name>/src/
├── api.ts
└── index.ts
```

Colocate tests with the files they cover. Add folders only when they group files that change together.

## Respect Boundaries

Dependencies flow downward:

```text
apps → features/flow → features/platform → domain → shared
```

More precisely:

| Source              | May depend on                                                  |
| ------------------- | -------------------------------------------------------------- |
| `shared`            | `shared`                                                       |
| `domain/entity`     | `domain/entity`, `shared`                                      |
| `domain/api`        | `domain/api`, `domain/entity`, `shared`                        |
| `features/platform` | `features/platform`, `domain`, `shared`                        |
| `features/flow`     | `features/flow`, `features/platform`, `domain`, `shared`       |
| `apps`              | Any new-architecture layer                                     |
| `support`           | Development tooling only; consume it through `devDependencies` |

- Keep composition one-way: a parent package may depend on the packages it composes, never the reverse. Dependency cycles between `shared`, `domain`, and `features` packages fail `pnpm lint:boundaries`. When a sub-flow needs something the parent owns, move it down to `features/platform`.
- Never import internal legacy `libs/*` packages from `shared`, `domain`, or `features`.
- Let legacy code consume new architecture only as migration glue.
- Inject private new-architecture packages into published legacy packages at the app composition root.
- Import another package through its npm name, never through a relative path.
- Let Nx infer tags from paths; do not add manual tags unless local tooling requires them.

## Name Packages

| Location                   | Package name                |
| -------------------------- | --------------------------- |
| `shared/<name>`            | `@shared/<name>`            |
| `domain/entity/<name>`     | `@domain/entity-<name>`     |
| `domain/api/<name>`        | `@domain/api-<name>`        |
| `features/platform/<name>` | `@features/platform-<name>` |
| `features/flow/<name>`     | `@features/flow-<name>`     |
| `support/<name>`           | `@support/<name>`           |

## Review

- Confirm the concern sits in the lowest valid layer.
- Confirm folders express ownership and colocation, not arbitrary categories.
- Confirm apps only compose reusable flows and platform concerns.
- Confirm feature, entity, API, and development-only state have distinct owners.
- Confirm imports follow the dependency table and package public APIs.
