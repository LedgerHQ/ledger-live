# @support/tsconfig

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

TypeScript config presets, one per project archetype. Every preset extends `base`, which holds the
repository compiler options; the workspace-root `tsconfig.base.json` is a shim over it.

## Presets

Pick the archetype from what the project is, not from the directory it lives in.

| Preset | For | Adds over `base` |
| --- | --- | --- |
| `base` | Everything, through the root shim | The repository compiler options |
| `logic` | Consumed as source, no DOM | ES2022, bundler resolution, `noEmit`, `src/` |
| `node` | Node scripts and tooling run as source | ES2022, NodeNext resolution, `.ts` import extensions, `noEmit`, `src/` |
| `client` | Consumed as source, DOM, no platform split | `logic` plus DOM |
| `client-react` | A `client` package with JSX | `client` plus `react-jsx` |
| `web` | A web platform config, or a web-only package | DOM, `react-jsx`, `.web` suffixes, native files excluded |
| `native` | A native platform config | DOM, `react-jsx`, `.native` suffixes and the `react-native` condition, web files excluded |
| `dual` | The solution root of a web and native package | Shared options, owns no files |
| `lib` | Emits `lib/` | `declaration`, `declarationMap`, `outDir`, `rootDir`, DOM |
| `lib-react` | Emits `lib/`, classic JSX | `lib` plus `jsx: react` |
| `lib-node` | Emits `lib/`, no DOM | `lib` without DOM |
| `coin` | A coin module or wallet library | `lib` plus `exactOptionalPropertyTypes`, `noUnusedLocals`, `noUnusedParameters` |
| `lib/build` | The `tsconfig.build.json` of a `lib` package | Excludes tests, clears `customConditions` |
| `lib/esm` | The ES module build of a `lib` package | Bundler resolution, emits `lib-es/` |
| `lib/tests` | A `tests/` config under a `lib` package | Roots at the package, emits nothing |

## Usage

```jsonc
// tsconfig.json
{
  "extends": "@support/tsconfig/logic",
  "compilerOptions": { "types": ["jest"] }
}
```

A platform config composes over its solution root, so the root's `types` and options still apply:

```jsonc
// tsconfig.web.json
{ "extends": ["./tsconfig.json", "@support/tsconfig/web"] }
```

A build config composes the same way: `["./tsconfig.json", "@support/tsconfig/lib/build"]`, and so
do `lib/esm` and `lib/tests`.

A package declares only what a preset cannot know:

- `types`: which ambient types the package may see. No default works for everyone.
- `paths`: aliases local to the package.
- `references` on a solution root. TypeScript does not inherit it through `extends`.
- `include`, `exclude` and `files`, when the package compiles files its preset does not cover.

Any other compiler option belongs to a preset. A difference that a package needs is a new preset, or
a change to one, not an override.

The package resolves from the workspace root, so consumers do not list it in their dependencies.

## Conformance

`pnpm lint:tool-config` checks every `tsconfig*.json` of a package
([the rule](../../tools/nx-plugins/enforce-tool-config/rules/tsconfig.mjs)):

- `extends` names a preset, or a config of the same package listed before one.
- Only `extends`, `compilerOptions`, `references`, `include`, `exclude` and `files` appear.
- `compilerOptions` holds `types` and `paths`, nothing else. The one exception is a package that
  does not meet the strictness of its preset yet: it may set `noImplicitAny`, `noImplicitThis`,
  `isolatedModules` or `exactOptionalPropertyTypes` to `false` while
  [the debt list](../../tools/nx-plugins/enforce-tool-config/rules/tsconfig-debt.mjs) names the
  option for that file. The list only shrinks: an entry the config no longer relaxes is reported.
- No key repeats what the config already inherits, `include` and `exclude` included.

## Paths are relative to the consumer

Presets write paths with `${configDir}`, which TypeScript resolves to the directory of the config
being compiled. A nested config that extends a package config, such as `tests/tsconfig.json`,
therefore re-bases those paths onto its own directory and declares `rootDir` itself.
