# Creating a new library / package

This document covers the requirements and conventions for any new internal package in the monorepo.

## Where to add new code

New code goes in `shared/`, `domain/entity/`, `domain/api/`, `features/platform/` or
`features/flow/` — whichever is the lowest layer that can own the concern. `support/` for
development-only tooling.

`libs/` is [legacy](./monorepo-architecture.md#legacy-libs). Three exceptions still land there:
a new coin module or its coin-tester; a package published to npm (`shared/`, `domain/` and
`features/` packages are all `"private": true`); a proportionate fix in an existing legacy package.
`libs/ui/` and `libs/ledgerjs/` are frozen. `libs/ledger-live-common` takes no new features, and
code extracted from it goes to the layers above, not to a new `libs/*` package.

## Package checklist

**`package.json` fields**
- [ ] `"private": true`
- [ ] `"sideEffects": false` — enables bundler tree-shaking
- [ ] `"main"`, `"types"`, `"exports"` — source-only packages (domain/, features/, shared/) point directly to `src/index.ts` and expose `"./package.json"`; built/published libs/ packages use the `@ledgerhq/source` condition + `lib/`/`lib-es/` entries — copy from a neighbouring package of the same type
- [ ] `devDependencies` via `catalog:` entries — `typescript`, `jest`, `@swc/core`, `@swc/jest`, `@types/jest`, `oxfmt`, `oxlint` (never pin versions directly)
- [ ] `scripts.typecheck: "tsc --noEmit"` — required for the Nx `typecheck` target
- [ ] `scripts.test` and `scripts.coverage` — `jest` / `jest --coverage`
- [ ] `scripts.format: "oxfmt src"` — required for the Nx `format` target; add `tests` if the package keeps tests outside `src/` (e.g. `"oxfmt src tests"`)
- [ ] `scripts.format:check: "oxfmt --check src"` — CI dry-run counterpart; mirror the same paths as `scripts.format`
- [ ] `scripts.lint: "oxlint -c <path-to>/.oxlintrc.json ./src"` — required for the Nx `lint` target; path to `.oxlintrc.json` depends on depth (e.g. `../../libs/oxc-live-libs/.oxlintrc.json` from `shared/`)

**Additional files**
- [ ] `README.md` — scope, problem solved, main exports (a few paragraphs); **must include a status marker** (see [README status marker](#readme-status-marker) below)
- [ ] `tsconfig.json` — use the template below
- [ ] `jest.config.js` — `@swc/jest` transformer, `testEnvironment: "node"` (or `"jsdom"` for React), sonar reporter; copy from a neighbouring package
- [ ] `project.json` — minimum `{ "targets": { "build": { "executor": "nx:noop" } } }` for source-only packages; required for Nx task graph
- [ ] `src/errors.ts` — if the package throws custom errors, define them here as plain `class extends Error`

## TypeScript configuration

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "noEmit": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "lib"]
}
```

`ES2022` not `ESNext`: our app runtimes (Electron, React Native) only guarantee ES2022. Apps can use `esnext` because their bundler controls the final output; packages do not have that safety net.

## Naming

| Layer | npm scope | Example |
|---|---|---|
| `shared/` | `@shared/<name>` | `@shared/feature-flags` |
| `domain/entity/` | `@domain/entity-<name>` | `@domain/entity-crypto-asset` |
| `domain/api/` | `@domain/api-<name>` | `@domain/api-crypto-asset` |
| `features/platform/` | `@features/platform-<name>` | `@features/platform-feature-flags` |
| `features/flow/` | `@features/flow-<name>` | `@features/flow-wallet` |
| `support/` | `@support/<name>` | `@support/jest-devtools` |
| `libs/` (legacy) | `@ledgerhq/<name>` | `@ledgerhq/coin-evm` |

Keep names short and self-describing. No cross-package relative imports — always use the npm package name.

## README status marker

Every package README must declare its lifecycle status right after the first `# Title` heading. Use a GitHub callout block so it renders prominently on GitHub and in IDEs.

### STABLE

The package is production-ready and its public API is considered stable.

```markdown
> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.
```

### UNSTABLE

The package is in active development; its API may change without notice.

```markdown
> [!CAUTION]
> **Status: UNSTABLE** — <one-line reason, e.g. "In active development; API may change.">
```

Common reasons:
- New package with an API still being designed.
- Package is part of the emerging `domain/` / `features/` / `shared/` layer and is under active development.
- Package is being migrated from another location (e.g. out of `live-common`).

### DEPRECATED

The package is no longer receiving new features. Consumers should migrate away.

```markdown
> [!WARNING]
> **Status: DEPRECATED** — <one-line reason and/or migration target.>
```

Common reasons:
- Package is in maintenance mode and being progressively dismantled.
- Package is scheduled to be removed or extracted to another repository.
- A replacement package exists (always name it).

### Updating the marker

When a package's status changes (e.g. UNSTABLE → STABLE after an API stabilisation, or STABLE → DEPRECATED), update the marker in the README as part of the same PR that makes the change.
