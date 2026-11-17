# support/

> [!CAUTION]
> **Status: UNSTABLE**. Each tool has its preset package; the presets still change.

Development-only tooling: shared test, TypeScript, lint and format configuration. Packages here
never ship runtime code, and consumers depend on them through `devDependencies` only. They carry no
domain or feature knowledge: a support package depends only on `support/` and `shared/` packages,
which `pnpm lint:boundaries` enforces. Mocks and fixtures of a domain live in that domain package.

## Why a package per tool, and not a file at the workspace root

Configuration in this monorepo is not just `tsconfig.json`. A jest preset holds setup files,
environment mocks and transform rules: it is code, and some packages need several jest projects in
one run. A package per tool makes each preset a node in the Nx graph, so `nx affected` resolves the
real blast radius when a preset changes, and `extends` / `require` names the preset explicitly.

See [ADR: Shared Tooling Configuration via `support/` Packages](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/7353892916/2026-07-23+ADR+Shared+Tooling+Configuration+via+support+Packages).

## Packages

One package per tool. Each README holds the presets, their options and the details.

| Package | A consumer gets it through | It may add |
| --- | --- | --- |
| [`@support/tsconfig`](./tsconfig) | `extends` of a preset, one per project archetype, in each `tsconfig*.json` | `types`, `paths`, `references`, `include` / `exclude` / `files` |
| [`@support/jest`](./jest) | a one-line `jest.config.js` calling its layer's factory, and `"@support/jest": "workspace:*"` in `devDependencies` | the factory's overrides argument |
| [`@support/lint`](./lint) | the layer root's one-line `oxlint.config.mts`, which re-exports the layer's preset, and `"@support/lint": "workspace:*"` in `devDependencies` when that preset loads an npm package other than `oxlint` (today `features-flow`) | a rule flag on its `lint` script, from the allowlist |
| `@support/fmt` | nothing: the workspace-root `oxfmt.config.mts` re-exports [the one config](./fmt/oxfmt.config.mts) | nothing |

`oxlint` and `oxfmt` find their config by walking up from the file they process, so a package runs
plain `oxlint src` and `oxfmt src`, with no config file and no `-c`. `@support/tsconfig`,
`@support/lint` and `@support/fmt` resolve from the workspace root. `@support/jest` is declared,
because its presets carry code and peer dependencies. `@support/lint` is declared only where the
layer's preset loads an npm package (the `features-flow` preset loads
`@ledgerhq/lumen-lint-plugin`): Nx hashes that package in `lint`, and marks the package affected
when it changes, only through the dependency edge.

Two more packages live here. `@support/knip` holds the repository's knip configs, which the root
`knip.config.js` and `knip.config.base.mjs` re-export. [`@ledgerhq/test-quarantine`](./test-quarantine)
reports flaky jest and Playwright tests.

## Conformance

`pnpm lint:tool-config`, part of `pnpm lint:arch`, checks that each package carries only what its
tool cannot inherit from its preset, one rule per tool, plus a `hygiene` rule on the packages of
`shared/`, `domain/` and `features/` ([the plugin](../tools/nx-plugins/enforce-tool-config/)).
Its messages and their fixes are in the
[`support-config` skill](../.agents/skills/support-config/references/tool-config-rules.md).
Packages not on a preset yet are listed in the plugin's `exclusions.mjs`.

## Adding a package

A package of `shared/`, `domain/` or `features/` starts from the generator in the
[`support-config` skill](../.agents/skills/support-config/SKILL.md#create-a-package-with-the-generator),
which writes the configs these presets expect.

A new package in `support/` follows [docs/new-library.md](../docs/new-library.md), then:

- Describe it in the Packages section (the table lists one package per tool; other packages go in prose).
- Add a `CODEOWNERS` entry.
- If the entry points sit outside `src/`, add a `workspaces` entry to `support/knip/knip.json`.

An override that shows up in more than one consumer belongs in a preset instead. Keeping it in the
consumer is fine when it is genuinely package-specific: it is visible in the diff, so it is
reviewable.
