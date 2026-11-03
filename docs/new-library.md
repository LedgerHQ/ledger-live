# Creating a new library / package

This document covers the requirements and conventions for any new internal package in the monorepo.

## Where to add new code

New code goes in `shared/`, `domain/entity/`, `domain/api/`, `features/platform/` or
`features/flow/`, whichever is the lowest layer that can own the concern. `support/` holds
development-only tooling.

Ask the first-yes-wins decision tree in
[structure-flow](../.agents/skills/structure-flow/SKILL.md) when the layer is not obvious.

`libs/` is [legacy](./monorepo-architecture.md#legacy-libs). Three exceptions still land there:
a new coin module or its coin-tester; a package published to npm (`shared/`, `domain/` and
`features/` packages are all `"private": true`); a proportionate fix in an existing legacy package.
`libs/ui/` and `libs/ledgerjs/` are frozen. `libs/ledger-live-common` takes no new features, and
code extracted from it goes to the layers above, not to a new `libs/*` package.

## Creating a package

Run the generator, then finish README, CODEOWNERS and knip as in
[new-package](../.agents/skills/new-package/SKILL.md):

```bash
pnpm nx g @ledgerhq/generators:package <name> \
  --layer <shared|domain-entity|domain-api|feature-platform|feature-flow> \
  --platform <logic|web|native|dual> \
  [--description "One line on what the package owns"]
pnpm i
```

The generator names the package from its folder, rejects a platform the layer does not allow, and
writes a package that passes the checklist below: a placeholder module, its test and an
`internals.ts` you replace with your code.

## Package checklist

Use it to review an existing package. `pnpm lint:tool-config` checks the items of this list that [`rules/hygiene.mjs`](../tools/nx-plugins/enforce-tool-config/rules/hygiene.mjs) names.

**`package.json` fields**
- [ ] `"private": true`
- [ ] `"sideEffects": false` — enables bundler tree-shaking
- [ ] `"main"`, `"types"`, `"exports"` — source-only packages (domain/, features/, shared/) point directly to `src/index.ts` and expose `"./package.json"`; built/published libs/ packages use the `@ledgerhq/source` condition + `lib/`/`lib-es/` entries — copy from a neighbouring package of the same type
- [ ] `devDependencies` via `catalog:` entries (never pin versions directly): `typescript`, `jest`, `@swc/core`, `@swc/jest`, `@types/jest`, `@typescript/native` (for `tsc`), and `rimraf`, `zx` or `nx` when a script runs them; `@support/jest` with `workspace:*` when the package has tests (see [ADR-0003](https://github.com/LedgerHQ/architecture-as-code/pull/553) and [`rules/hygiene.mjs`](../tools/nx-plugins/enforce-tool-config/rules/hygiene.mjs))
- [ ] `scripts.typecheck: "tsc --noEmit"` — required for the Nx `typecheck` target
- [ ] `scripts.test` and `scripts.coverage` — `jest` / `jest --coverage`
- [ ] `scripts.format` and `scripts.format:check`: plain `oxfmt` on the paths the package owns (see [support-config](../.agents/skills/support-config/SKILL.md))
- [ ] `scripts.lint`: plain `oxlint` on the paths the package owns, no config file in the package (see [support-config](../.agents/skills/support-config/SKILL.md))

**Additional files**
- [ ] `README.md` — scope, problem solved, main exports (a few paragraphs); **must include a status marker** (see [README status marker](#readme-status-marker) below)
- [ ] `tsconfig.json` (and platform configs when dual): pick the archetype in [support-config](../.agents/skills/support-config/SKILL.md)
- [ ] `jest.config.js`: one line calling the layer's `@support/jest` factory (see [support-config](../.agents/skills/support-config/SKILL.md))
- [ ] `project.json` — minimum `{ "targets": { "build": { "executor": "nx:noop" } } }` for source-only packages; required for Nx task graph
- [ ] `src/errors.ts` — if the package throws custom errors, define them here as plain `class extends Error`

## TypeScript configuration

Pick the tsconfig archetype from [support-config](../.agents/skills/support-config/SKILL.md). A logic
package with no DOM often looks like:

```json
{
  "extends": "@support/tsconfig/logic",
  "compilerOptions": {
    "types": ["jest"]
  }
}
```

The presets target `ES2022`, not `ESNext`: our app runtimes (Electron, React Native) only guarantee ES2022. Apps can use `esnext` because their bundler controls the final output; packages do not have that safety net.

## Naming

| Layer | npm scope | Example |
|---|---|---|
| `shared/` | `@shared/<name>` | `@shared/schema-primitives` |
| `domain/entity/` | `@domain/entity-<name>` | `@domain/entity-contact` |
| `domain/api/` | `@domain/api-<name>` | `@domain/api-push-devices` |
| `features/platform/` | `@features/platform-<name>` | `@features/platform-feature-flags` |
| `features/flow/` | `@features/flow-<name>` | `@features/flow-contacts` |
| `support/` | `@support/<name>` | `@support/jest` |
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
