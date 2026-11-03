---
name: support-config
description: Give a package its TypeScript, jest, lint and format config from the `support/` presets (`@support/tsconfig`, `@support/jest`, `@support/lint`, `@support/fmt`), pick its tsconfig archetype, declare the tools its scripts run, and fix what `pnpm lint:tool-config` reports. Use when creating a package, when creating or editing a `tsconfig*.json`, a `jest.config.*` or `jest.*.config.*`, an oxlint config (`oxlint.config.*`, `.oxlintrc.*`) or an oxfmt config (`oxfmt.config.*`, `.oxfmtrc.*`) in a package, when adding a tool (`tsc`, `oxlint`, `oxfmt`, `rimraf`, `zx`, `nx`) to a package's scripts or dependencies, or when `lint:tool-config` fails.
---

# Support config: a package carries only what its tool cannot inherit

Each tool has one `support/` package of presets. A consuming package names a preset and carries
nothing a preset could hold. The canonical sources:

- [`support/README.md`](../../../support/README.md): the packages, how a consumer gets each one, what it may add.
- [`support/tsconfig/README.md`](../../../support/tsconfig/README.md): archetypes, composition, what a config may set.
- [`support/jest/README.md`](../../../support/jest/README.md): presets per layer, factories, their options and overrides.
- [`support/lint/README.md`](../../../support/lint/README.md): presets per layer, the custom rules.
- [`support/fmt/oxfmt.config.mts`](../../../support/fmt/oxfmt.config.mts): the one format config.
- [ADR-0003](https://github.com/LedgerHQ/architecture-as-code/pull/553): each tool a script runs is a `catalog:` devDependency.
- [ADR: Shared Tooling Configuration via `support/` Packages](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/7353892916/2026-07-23+ADR+Shared+Tooling+Configuration+via+support+Packages): why it is shaped this way.

## Create a package with the generator

A package of `shared/`, `domain/entity/`, `domain/api/`, `features/platform/` or `features/flow/`
starts from the generator, which writes the manifest, the tsconfig, the jest config and the README
that `lint:tool-config` accepts:

```sh
pnpm nx g @ledgerhq/generators:package <name> --layer <shared|domain-entity|domain-api|feature-platform|feature-flow> --platform <logic|web|native|dual>
pnpm i
```

Edit what it wrote with the rules below rather than writing a config by hand.

## What a consumer declares

| Tool | The package carries | The package never carries |
| --- | --- | --- |
| TypeScript | `tsconfig.json` that `extends` a preset, plus `types`, `paths`, `references`, `include` / `exclude` / `files` when needed | any other compiler option, an `@support/tsconfig` dependency |
| Jest | a one-line `jest.config.js` calling a preset factory, `"@support/jest": "workspace:*"` in `devDependencies` | a hand-written config, a config that edits the factory's result |
| Lint | a `lint` script running plain `oxlint src` | an oxlint config, a `-c` flag, an `@support/lint` dependency |
| Format | a `format` script running plain `oxfmt src`, a `format:check` script running `oxfmt src --check` | an oxfmt config, a `-c` flag, an `@support/fmt` dependency |

Each tool a script runs is in `devDependencies` as `"catalog:"`, so Nx hashes its version
([ADR-0003](https://github.com/LedgerHQ/architecture-as-code/pull/553)): `tsc` is
`"@typescript/native": "catalog:"`, and `oxlint`, `oxfmt`, `rimraf`, `zx` and `nx` are declared
under their own names. The `hygiene` rule checks it for `shared/`, `domain/` and `features/`.
`rimraf` and `zx` have no entry in the `catalog:` of `pnpm-workspace.yaml` yet; that ends when the
catalog defines them there. Until then, a script that runs one needs that entry first.

The tsconfig, lint and fmt presets resolve from the workspace root, so the package does not declare
them. `@support/jest` is the one preset a consumer declares, because its presets carry code and peer
dependencies, and the edge tells nx which tests a preset change affects.

## Pick the tsconfig archetype

Pick from what the project is, not from the directory it lives in. The first yes wins:

1. Emits `lib/`? A `lib` preset (`lib`, `lib-react`, `lib-node`, or `coin` for a coin module or
   wallet library), with `lib/build`, `lib/esm` or `lib/tests` composed over it per extra config.
2. Ships `.web` and `.native` variants? `dual` on `tsconfig.json`, which owns no files, plus
   `tsconfig.web.json` and `tsconfig.native.json` that compose over it.
3. One platform only? `web` or `native`.
4. Needs the DOM? `client-react` with JSX, `client` without.
5. Node scripts or tooling run as source? `node`.
6. Otherwise: `logic`.

The table in [`support/tsconfig/README.md`](../../../support/tsconfig/README.md#presets) says what
each preset adds. Real consumers:

| Package | Archetype |
| --- | --- |
| [`@shared/schema-primitives`](../../../shared/schema-primitives/tsconfig.json), [`@domain/entity-contact`](../../../domain/entity/contact/tsconfig.json) | `logic` |
| [`@domain/api-push-devices`](../../../domain/api/push-devices/tsconfig.json) | `client` |
| [`@features/platform-feature-flags`](../../../features/platform/feature-flags/tsconfig.json) | `client-react` |
| [`@features/flow-contacts`](../../../features/flow/contacts/tsconfig.json) | `dual`, with `web` and `native` platform configs |

```jsonc
// tsconfig.json
{
  "extends": "@support/tsconfig/logic",
  "compilerOptions": { "types": ["jest"] }
}
```

```jsonc
// tsconfig.web.json of a dual package; tsconfig.native.json is the mirror
{ "extends": ["./tsconfig.json", "@support/tsconfig/web"] }
```

A compiler option a package seems to need is a change to a preset, or a new preset, inside
`support/tsconfig`: never an override in the package.

## Write the jest config

Pick the factory of the package's layer in
[`support/jest/README.md`](../../../support/jest/README.md) and call it with its defaults.

A node package (`shared/*`, and node packages of layers no preset covers yet):

```js
const { createSharedJestConfig } = require("@support/jest/shared");
module.exports = createSharedJestConfig({ rootDir: __dirname });
```

A dual web and native package, here a flow ([`@features/flow-contacts`](../../../features/flow/contacts/jest.config.js)):

```js
module.exports = require("@support/jest/features-flow").createFlowJestConfig();
```

What the package needs on top goes through the factory's overrides argument, never through code
after the call. An override replaces the preset's key, as in jest: to keep the preset's list and
add to it, spread the default the preset exports. Keys the preset owns throw. Both are in
[the overrides section](../../../support/jest/README.md#overrides) and the end of that README.

## Lint and format

Nothing to write in the package but its scripts. oxlint and oxfmt walk up from the file they
process: oxlint stops at the layer root's one-line `oxlint.config.mts`, which re-exports the
layer's `@support/lint` preset, and oxfmt reaches the workspace root, which re-exports
`@support/fmt`.

- A rule several packages of a layer need goes in that layer's preset in `support/lint`.
- A rule one package needs goes on its `lint` script as a flag, and only if the flag is on the
  allowlist of the lint conformance rule.
- A file a package must not format is an `ignorePatterns` entry in
  `support/fmt/oxfmt.config.mts`, written relative to the workspace root.

## Check it

```sh
pnpm lint:tool-config                                       # every package, through nx
node tools/nx-plugins/enforce-tool-config/validate.mjs features/flow/contacts  # one package
```

Each violation prints as `[rule] file: message`. The rules (`fmt`, `lint`, `tsconfig`, `jest`,
`hygiene`, and the debt lists they read) and the fix for each check are in
[references/tool-config-rules.md](references/tool-config-rules.md).

`lint:tool-config` also runs in `pnpm lint:arch`, which CI requires.
