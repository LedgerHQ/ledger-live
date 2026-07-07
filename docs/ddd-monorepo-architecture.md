# Monorepo DDD Re-architecture

> **Status: in progress.** This is the target architecture the repo is migrating toward. New code in `domain/`, `features/`, and `shared/` follows these rules today. `libs/` remains the default for new shared code until the migration is complete.

Source of truth: [Confluence — Guideline Monorepo DDD Re-architecture](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/6111232117)

---

## Four layers

```
apps  (20%)  — platform entry points, routing, screens
features  (60%)  — shared business code
domain  (10%)  — business objects and logic
shared  (10%)  — agnostic primitives
```

### `apps/`
Platform-specific entry points: observability, analytics, routing, screens. Desktop and mobile do not necessarily share the same screens — each app assembles `features/flow` packages into its own screens.

### `features/`
Split into two sub-layers:

- **`features/platform/`** — Non-Functional Requirements at feature level. Invisible to users (no screens, no global routing). Hooks, selectors, cross-feature domain-aware helpers, React glue. _e.g. `@features/platform-feature-flags`, `@features/platform-coin-loader`._
- **`features/flow/`** — User-facing features shared across both apps. UI components with business context, local state, user-facing logic. Each app composes these into its own screens.

See [features/README.md](../features/README.md) for details.

### `domain/`
The semantic foundation of the app.

- **`domain/entity/`** — Canonical data model: Zod schemas, derived types, defaults, mock factories, selectors, Redux slice. _What a thing is._
- **`domain/api/`** — Network calls, API contracts, RTK Query (`createApi`) or `createAsyncThunk`. _How a thing is fetched or mutated._

Domain packages must not host cross-cutting helpers — code that talks about the domain but serves multiple features belongs in `features/platform/`.

See [domain/README.md](../domain/README.md) for details.

### `shared/`
No business logic, no app-specific context. Pure utilities, schemas, Redux tooling. _e.g. `@shared/feature-flags`, `@shared/schema-primitives`._

---

## Dependency rules (enforced by Nx)

```
apps  →  features/flow  →  features/platform  →  domain  →  shared
```

Each layer may only import from layers below it. `shared`, `domain`, and `features` must **not** import from `libs/` — the new-arch core stays legacy-free. Legacy `libs/` may consume new-arch packages as migration glue, but only via injection at the app composition root.

---

## Naming

| Layer | npm scope | Example |
|---|---|---|
| `shared/` | `@shared/<name>` | `@shared/feature-flags` |
| `domain/entity/` | `@domain/entity-<name>` | `@domain/entity-crypto-asset` |
| `domain/api/` | `@domain/api-<name>` | `@domain/api-crypto-asset` |
| `features/platform/` | `@features/platform-<name>` | `@features/platform-feature-flags` |
| `features/flow/` | `@features/flow-<name>` | `@features/flow-wallet` |

No cross-package relative imports — always use the npm package name.
