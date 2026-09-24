# Monorepo architecture

> **Status: default.** This is where new code goes. `libs/` is [legacy](#legacy-libs): maintained, not grown.

Source of truth: [Confluence — Monorepo architecture guideline](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/6111232117)

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

`apps/` is also the only place allowed to import both legacy and new code.

### `features/`
Split into two sub-layers:

- **`features/platform/`** — Non-Functional Requirements at feature level. Invisible to users (no screens, no global routing). Hooks, selectors, cross-feature domain-aware helpers, React glue, headless logic shared by both apps. _e.g. `@features/platform-feature-flags`, `@features/platform-coin-loader`._
- **`features/flow/`** — User-facing features shared across both apps. UI components with business context, local state, user-facing logic. Each app composes these into its own screens.

`features/platform/` is where the cross-cutting glue goes, rather than `libs/ledger-live-common`.

See [features/README.md](../features/README.md) for details.

### `domain/`
The semantic foundation of the app.

- **`domain/entity/`** — Canonical data model: Zod schemas, derived types, defaults, mock factories, selectors, Redux slice. _What a thing is._
- **`domain/api/`** — Network calls, API contracts, RTK Query (`createApi`) or `createAsyncThunk`. _How a thing is fetched or mutated._

Domain packages must not host cross-cutting helpers — code that talks about the domain but serves multiple features belongs in `features/platform/`.

See [domain/README.md](../domain/README.md) for details.

### `shared/`
No business logic, no app-specific context. Pure utilities, schemas, Redux tooling. _e.g. `@shared/feature-flags`, `@shared/schema-primitives`._

Cross-cutting app capabilities reach the lower layers by injection at the app root rather than by
props-drilling — see [`@shared/i18n`](../shared/i18n) (`<I18nProvider>` + `useTranslation`), which
lets `features/*` and `domain/*` resolve their own copy without depending on an app's i18n setup.

---

## Dependency rules (enforced by Nx)

```
apps  →  features/flow  →  features/platform  →  domain  →  shared
```

Each layer may only import from layers below it. `shared`, `domain`, and `features` must **not**
import from `libs/` — the new-arch core stays legacy-free. Enforced by
[`tools/nx-plugins/enforce-boundaries`](../tools/nx-plugins/enforce-boundaries).

---

## Legacy `libs/`

Still built and released, but not where new code goes.

| Path | Status | What to do |
| --- | --- | --- |
| `libs/ui/**` | Frozen, to be dropped | Use Lumen (`@ledgerhq/lumen-ui-react`, `@ledgerhq/lumen-ui-rnative`, `@ledgerhq/lumen-design-core`). |
| `libs/ledgerjs/**` | Frozen, moving to [ts-libs](https://github.com/LedgerHQ/ts-libs) | Never add a package. New device interaction uses the DMK. |
| `libs/ledger-live-common` | Deprecated | No new features. Glue is still possible, but prefer `features/platform/`. |
| other `libs/*` | To migrate | Maintain; move code out when you touch it. |

---

## Crossing the frontier

New code cannot import legacy code, but the product still has to work. In order of preference:

1. **Declare the contract on the new side.** The new package defines the types it needs and takes the
   implementation as an argument — see
   [`shared/cloud-sync/src/trustchain-types.ts`](../shared/cloud-sync/src/trustchain-types.ts). Such
   types are temporary: they die with the migration.
2. **Glue in `apps/`.** Only apps may import both sides. Keep it in the composition root.
3. **Legacy consumes new.** Never the reverse. For a published legacy package, inject the private
   new-arch package at the app composition root.

Never re-export a legacy type from a new-arch barrel.

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
