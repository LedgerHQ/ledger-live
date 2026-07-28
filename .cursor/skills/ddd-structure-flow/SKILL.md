---
name: ddd-structure-flow
description: Place and organize Ledger Wallet code in the DDD monorepo. Use when creating, moving, or reviewing code under apps, features, domain, shared, or support; deciding which layer owns a concern; structuring packages and flow steps; or checking package names, dependency boundaries, platform variants, and legacy imports.
---

# DDD Structure And Flow

Use the lowest layer that can own the concern without depending on a higher layer.

Source: [Structure & Flow](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/6111232117/Guideline+Monorepo+DDD+Re-architecture+Structure+Flow)

## Choose The Owner

| Concern                          | Location                      | Owns                                                                           | Does not own                    |
| -------------------------------- | ----------------------------- | ------------------------------------------------------------------------------ | ------------------------------- |
| Platform entry point             | `apps/<app>`                  | Screens, global routing, store composition, analytics, observability, app glue | Reusable feature internals      |
| User-visible capability          | `features/flow/<feature>`     | Business-aware UI, user journeys, local state, flow routing                    | App-specific screen composition |
| Invisible feature infrastructure | `features/platform/<feature>` | Domain-aware hooks, selectors, NFR rules, React glue, non-visual components    | Screens and app routing         |
| Business object                  | `domain/entity/<entity>`      | Runtime schema, inferred type, defaults, mocks, selectors, slice               | Network calls and feature state |
| Network/data access              | `domain/api/<name>`           | API contracts, calls, transformations, RTK Query, thunks                       | UI and app composition          |
| Cross-entity business concept    | `domain/aggregate/<name>`     | A cohesive concept spanning entities                                           | Generic feature helpers         |
| Business-agnostic primitive      | `shared/<name>`               | Generic schemas, utilities, Redux primitives                                   | Domain or app knowledge         |
| Development-only tooling         | `support/<name>`              | Shared test, TypeScript, lint, and format configuration                        | Runtime code                    |

Use these distinctions:

- Keep feature-scoped state in its `features/flow` package; do not promote it to an entity.
- Put domain-aware helpers shared by features in `features/platform`, not `domain`.
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
├── data/
│   ├── schema.ts
│   ├── schema.mock.ts
│   ├── selectors.ts
│   └── slice.ts
└── index.ts

domain/api/<name>/src/
├── <name>.api.ts              # or a focused thunk
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

- Never import legacy `libs/` or `@ledgerhq/*` packages from `shared`, `domain`, or `features`.
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
