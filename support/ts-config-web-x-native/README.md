# @support/ts-config-web-x-native

TypeScript config preset for packages that target **both web and React Native** using `.web.tsx` / `.native.tsx` file extensions.

Uses TypeScript [project references](https://www.typescriptlang.org/docs/handbook/project-references.html) so each platform gets its own `moduleSuffixes` and exclusion list. `${configDir}` (TypeScript 5.5+) makes `include`/`exclude` in this preset resolve relative to the consuming package's directory.

## When to use

`features/flow/*` packages that ship both `.web.tsx` and `.native.tsx` variants of the same component.

## Consumption

Each consuming package needs **3 files** (TypeScript project references require local sub-configs):

```json
// tsconfig.json — solution file, orchestrates sub-configs
{
  "extends": "@support/ts-config-web-x-native",
  "files": [],
  "references": [
    { "path": "./tsconfig.web.json" },
    { "path": "./tsconfig.native.json" }
  ]
}
```

```json
// tsconfig.web.json
{ "extends": "@support/ts-config-web-x-native/tsconfig.web.json" }
```

```json
// tsconfig.native.json
{ "extends": "@support/ts-config-web-x-native/tsconfig.native.json" }
```

Add `@support/ts-config-web-x-native` to `devDependencies`:

```json
{ "devDependencies": { "@support/ts-config-web-x-native": "workspace:*" } }
```

## What each sub-config provides

| File | `moduleSuffixes` | Excludes |
|------|-----------------|---------|
| `tsconfig.web.json` | `[".web", ""]` | `src/**/*.native.*` |
| `tsconfig.native.json` | `[".native", ""]` | `src/**/*.web.*` |

The solution `tsconfig.json` (`extends @support/ts-config-base` + `jsx: react-jsx`) is used as the base by both sub-configs — **no DOM lib** since React Native does not have `window`/`document`.
