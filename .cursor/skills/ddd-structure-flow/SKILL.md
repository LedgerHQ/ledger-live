---
name: ddd-structure-flow
description: Apply the Ledger Wallet monorepo DDD re-architecture structure and flow guidelines. Use when creating or reviewing packages under apps, features/platform, features/flow, domain/entity, domain/api, domain/aggregate, or shared, when structuring flow steps with MVVM, and when checking dependency boundaries, package naming, Nx tags, or legacy libs imports.
---

# DDD Structure And Flow

Source: https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/6111232117/Guideline+Monorepo+DDD+Re-architecture+Structure+Flow

## Goal

Optimize code discovery with a C4-like structure:

- root: app boundaries and external connections
- one level deep: core capabilities
- two levels deep: feature or domain business logic
- colocate files that change together
- keep mobile, web, and desktop variants close with `.native` and `.web` files
- enforce boundaries with Nx tags and package dependencies, not tacit conventions

## Layers

Use four layers:

| Layer      | Purpose                                                           | Typical weight |
| ---------- | ----------------------------------------------------------------- | -------------- |
| `apps`     | Platform entry points, routing, screens, observability, analytics | 20%            |
| `features` | Shared business code split into `platform` and `flow`             | 60%            |
| `domain`   | Business objects, schemas, APIs, aggregates                       | 10%            |
| `shared`   | Business-agnostic primitives and tooling                          | 10%            |

### `apps`

Use apps for platform-specific composition:

- screens and routes
- state-manager composition
- observability and analytics wiring
- app-specific platform glue

Do not put reusable feature internals in apps. Each app composes `features/flow` packages into its own screens.

### `features/platform`

Use for feature-level non-functional requirements that are required by user-facing flows but are not screens.

Contains:

- hooks, selectors, feature-level NFR rules
- cross-feature helpers that understand domain concepts
- React glue and non-visual components such as `FeatureToggle`

Does not contain:

- screen-specific rendering
- app-specific routing or composition

Example packages:

- `@features/platform-feature-flags`
- `@features/platform-coin-loader`

### `features/flow`

Use for user-facing shared features that apps assemble into screens.

Contains:

- business-aware UI components
- local state and user-facing logic
- `.web` and `.native` component variants when needed
- `steps/<StepName>` units for screen-like MVVM flows

Does not contain:

- app-specific screen composition
- direct app routing ownership

Structure each flow as a private package:

```text
features/flow/<feature>/
├── src/
│   ├── components/
│   ├── hooks/
│   ├── router/
│   ├── steps/
│   │   └── <StepName>/
│   │       ├── components/
│   │       ├── viewModel.ts
│   │       ├── view.ts
│   │       ├── view.test.ts
│   │       └── index.ts
│   ├── state/
│   ├── utils/
│   └── index.ts
└── package.json
```

- Treat each `steps/<StepName>` as the flow equivalent of an MVVM screen.
- Keep connected state and orchestration in `viewModel`; keep `view` focused on rendering and callbacks.
- Colocate step-only components under the step. Keep components shared across steps at `src/components`.
- Export only the flow entry points that apps need. Let app screens compose those entry points.

### `domain`

Use for semantic business foundations:

- `domain/entity`: Zod schemas, inferred types, defaults, mocks, selectors, slices
- `domain/api`: network calls, API contracts, transformations, RTK Query, thunks
- `domain/aggregate`: cross-entity aggregates when a domain concept spans entities

Do not put cross-cutting feature helpers in `domain`; move those to `features/platform`.

### `shared`

Use only for business-agnostic primitives:

- no app context
- no domain business logic
- examples: `@shared/feature-flags`, primitives, schema helpers

## Dependency Rules

Allowed dependencies by source:

| Source              | May depend on                                                    |
| ------------------- | ---------------------------------------------------------------- |
| `shared`            | `shared`                                                         |
| `domain`            | `domain`, `shared`                                               |
| `features/platform` | `features/platform`, `domain`, `shared`                          |
| `features/flow`     | `features/flow`, `features/platform`, `domain`, `shared`         |
| `apps`              | `apps`, `features/flow`, `features/platform`, `domain`, `shared` |

Forbidden:

- `shared`, `domain`, and `features` must not import legacy `libs/` or `@ledgerhq/*` packages.
- New-arch core must stay legacy-free; legacy code can consume new-arch only as temporary migration glue.
- Published `libs/` packages must consume private new-arch packages through injection at the app composition root, not direct imports.
- Do not use cross-package relative imports; import through the npm package name.

## Nx Tags

Nx tags are inferred from paths by `tools/nx-plugins/project-tags/plugin.js`; do not add manual `tags` unless the local tooling requires it.

| Path prefix          | Tags                    |
| -------------------- | ----------------------- |
| `shared/`            | `scope:shared`          |
| `domain/`            | `scope:domain`          |
| `features/`          | `scope:features`        |
| `apps/`              | `scope:apps`            |
| `domain/entity/`     | `type:domain-entity`    |
| `domain/api/`        | `type:domain-api`       |
| `features/platform/` | `type:feature-platform` |
| `features/flow/`     | `type:feature-flow`     |

## Package Naming

Every layer unit is a private npm package with `package.json`, `src/`, and explicit exports.

| Location                   | Package name                |
| -------------------------- | --------------------------- |
| `shared/<name>`            | `@shared/<name>`            |
| `domain/entity/<name>`     | `@domain/entity-<name>`     |
| `domain/api/<name>`        | `@domain/api-<name>`        |
| `features/platform/<name>` | `@features/platform-<name>` |
| `features/flow/<name>`     | `@features/flow-<name>`     |

## Skeleton

```text
apps/ledger-live-desktop/screens/WalletScreen.web.tsx
apps/ledger-live-mobile/screens/WalletScreen.native.tsx
features/platform/feature-flags/src/hooks/useFeatureFlags.ts
features/flow/wallet-balance/src/components/WalletBalance/WalletBalance.web.tsx
features/flow/wallet-balance/src/components/WalletBalance/WalletBalance.native.tsx
features/flow/wallet-balance/src/steps/Overview/viewModel.ts
features/flow/wallet-balance/src/steps/Overview/view.ts
domain/entity/crypto-asset/src/data/schema.ts
domain/entity/crypto-asset/src/data/slice.ts
domain/api/crypto-asset/src/cryptoAsset.api.ts
shared/feature-flags/src/data/schema.ts
```

## Review Checklist

- The package is in the lowest layer that can own the behavior.
- Apps compose screens; flows expose reusable user-facing blocks.
- Flow steps use MVVM separation and colocate step-specific files.
- Platform features hold invisible feature infrastructure, not screens.
- Domain packages own business objects and APIs, not cross-cutting feature glue.
- Shared packages stay business-agnostic.
- Imports follow the dependency table and use package names.
- Legacy `libs/` imports are kept out of `shared`, `domain`, and `features`.
