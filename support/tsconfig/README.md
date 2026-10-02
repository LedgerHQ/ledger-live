# @support/tsconfig

> [!CAUTION]
> **Status: UNSTABLE** — New package; in active development.

TypeScript config presets, one per project archetype. Every preset extends `base`, which holds the
repository compiler options; the workspace-root `tsconfig.base.json` is a shim over it.

## Presets

Pick the archetype from what the project is, not from the directory it lives in.

| Preset | For | Adds over `base` |
| --- | --- | --- |
| `base` | Everything, through the root shim | The repository compiler options |
| `logic` | Consumed as source, no DOM | ES2022, bundler resolution, `noEmit`, `src/` |
| `client` | Consumed as source, DOM, no JSX | `logic` plus DOM |
| `web` | A web platform config, or a web-only package | DOM, `react-jsx`, `.web` suffixes, native files excluded |
| `native` | A native platform config | DOM, `react-jsx`, `.native` suffixes, web files excluded |
| `dual` | The solution root of a web and native package | Shared options, owns no files |
| `lib` | Emits `lib/` | `declaration`, `declarationMap`, `outDir`, `rootDir`, DOM |
| `lib-react` | Emits `lib/`, classic JSX | `lib` plus `jsx: react` |
| `lib-node` | Emits `lib/`, no DOM | `lib` without DOM |
| `lib/build` | The `tsconfig.build.json` of a `lib` package | Excludes tests, clears `customConditions` |

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

A build config composes the same way: `["./tsconfig.json", "@support/tsconfig/lib/build"]`.

A package declares only what a preset cannot know:

- `types`: which ambient types the package may see. No default works for everyone.
- `references` on a solution root. TypeScript does not inherit it through `extends`.
- A genuine difference from its archetype. One that shows up in several packages belongs here.

The package resolves from the workspace root, so consumers do not list it in their dependencies.

## Paths are relative to the consumer

Presets write paths with `${configDir}`, which TypeScript resolves to the directory of the config
being compiled. A nested config that extends a package config, such as `tests/tsconfig.json`,
therefore re-bases those paths onto its own directory and declares `rootDir` itself.
