# Nx project tags

Workspace packages get **inferred tags** from their path (and a few well-known package names) via `./tools/nx-plugins/project-tags/plugin.js`, registered in `nx.json`. Tags merge with any `tags` set in `package.json` (`nx.tags`) or `project.json`.

## Scope tags (path slices)

| Tag | Meaning |
| --- | --- |
| `scope:libs` | Under `libs/` |
| `scope:libs-non-ui` | Under `libs/` but not `libs/ui/` |
| `scope:libs-ui` | Under `libs/ui/` |
| `scope:libs-ledgerjs` | Under `libs/ledgerjs/` |
| `scope:features` | Under `features/` |
| `scope:apps` | Desktop, mobile, CLI, web-tools, or Playwright/Detox E2E app projects (see type tags) |
| `scope:e2e` | Under `e2e/` |
| `scope:tools` | Under `tools/` |
| `scope:no-apps` | Project root is not under `apps/` (includes libs, features, tools, e2e, tests, root package, etc.) |

## Type tags (role)

| Tag | Meaning |
| --- | --- |
| `type:app-desktop` | `apps/ledger-live-desktop` |
| `type:app-mobile` | `apps/ledger-live-mobile` |
| `type:app-cli` | `apps/cli` / `@ledgerhq/live-cli` |
| `type:app-web-tools` | `apps/web-tools` / `@ledgerhq/web-tools` |
| `type:e2e-desktop` | Desktop E2E (`e2e/desktop`, `ledger-live-desktop-e2e-tests`) |
| `type:e2e-mobile` | Mobile E2E (`e2e/mobile`, `ledger-live-mobile-e2e-tests`) |
| `type:coin-module` | Under `libs/coin-modules/`, or package name `@ledgerhq/coin-*` except `@ledgerhq/coin-tester*` |
| `type:coin-tester` | `libs/coin-tester`, `libs/coin-tester-modules/**`, or package name `@ledgerhq/coin-tester*` |
| `type:live-common` | `libs/ledger-live-common` (and nested workspace packages under that path) |

## Example commands

```bash
# Libraries (similar to many CI `./libs/**` filters)
pnpm exec nx run-many -t typecheck --projects=tag:scope:libs

# Libraries excluding design system / UI packages
pnpm exec nx run-many -t coverage --projects=tag:scope:libs-non-ui

# Design system only
pnpm exec nx run-many -t test --projects=tag:scope:libs-ui

# Features only
pnpm exec nx run-many -t coverage --projects=tag:scope:features

# Coin modules
pnpm exec nx run-many -t build --projects=tag:type:coin-module

# Coin tester (framework + chain modules)
pnpm exec nx run-many -t build --projects=tag:type:coin-tester

# Everything except roots under apps/ (see scope:no-apps above)
pnpm exec nx run-many -t typecheck --projects=tag:scope:no-apps
```

## CI vs local

CI often uses **pnpm/turbo dependency selectors** (e.g. `ledger-live-desktop^...`). In Nx, run an app target with **`--with-deps`** (or depend on the graph via `dependsOn` in targets) instead of memorising those filters.

Path-based CI jobs map to **`tag:scope:*`** and **`tag:type:*`** as in the tables above.
