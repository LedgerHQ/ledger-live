---
name: devtools-import-boundary
description: |
  Enforce import boundaries inside the devtools scope.
  Use for any work in "devtools/**".
---

# DevTools import boundaries

Every `@devtools/*` package is **self-contained**. A `@devtools/*` package may import another one only where [`tools/nx-plugins/enforce-boundaries/constraints.js`](../../../tools/nx-plugins/enforce-boundaries/constraints.js) allows it, and `pnpm lint:boundaries` enforces it:

- `DEVTOOLS_ALLOWED_IMPORTS` lists the imports each package may make.
- `DEVTOOLS_TYPE_ONLY_IMPORTS` lists the packages each one may reach under `DEVTOOLS_TYPE_ONLY_RULE`.
- `DEVTOOLS_LAZY_IMPORTS` lists the packages each one may reach only lazily, under `DEVTOOLS_LAZY_RULE`.
- `DEVTOOLS_HOST_APPS` lists the apps that host DevTools, the one folder of each that may import `@devtools/*`, and the files of that folder product code may import statically.

To change what a package may import, edit those tables.

## Rules for the registry and the host apps

1. **The registry reaches tools lazily** (`DEVTOOLS_LAZY_RULE`). The shell loads `@devtools/registry` eagerly, so the registry may reach a tool only through `import type`, `export type … from`, `typeof import("…")` or `loader: () => import("@devtools/<tool>")`. A value import or `require()` bundles the tool with the shell.
2. **App product code does not import `@devtools/*`** (`DEVTOOLS_HOST_APP_RULE`). In each app of `DEVTOOLS_HOST_APPS`, only files under `allowedUnder` (`src/mvvm/features/DevTools/`) may import `@devtools/*`, type imports included. A product hook calling a bindings hook, or a product type derived from `DevToolsConfig` or a bindings port type, belongs in that folder.
3. **Product code enters the DevTools folder through its entries** (`DEVTOOLS_HOST_FOLDER_RULE`). A file outside `allowedUnder` may statically import only the files listed in `entries`; any other file of the folder is reachable only through `import()` or `lazy(() => import(...))`. Otherwise one hop through the folder would bypass rule 2. The rule resolves relative paths and the aliases of the app's `tsconfig.json` (`LLD/*`, `LLM/*`, `~/*`). Test files (`*.test.*`, `__tests__/`, `__integrations__/`) are exempt.

### What lint cannot catch

- **Debug work on a product path.** A debug screen, a mock or a dev-only branch written in a product file without importing `@devtools/*` passes. Keep it under the DevTools folder by review.
- **Debug controls.** `setOverride` and similar controls are used by many legitimate debug screens, so lint does not flag them. Whether product code drives them for debugging is a review question.

## Why

The devtools architecture decouples tools from the shell through the registry. The shell lazy-loads tools via `metadata.loader`; tools never know the shell exists. If a tool imports the shell or another tool directly:

- The lazy-load boundary collapses — the tool is bundled eagerly.
- A circular dependency becomes likely (tool → shell → registry → tool).
- The tool can no longer be rendered standalone, outside the shell.

`bindings` builds each tool's props, so it needs a tool's props types without loading the tool. That is what `DEVTOOLS_TYPE_ONLY_IMPORTS` grants it.

If `bindings` or `shell` import a tool package's values directly (instead of through the registry):

- The registry's discriminated union is bypassed and TypeScript loses the narrowing guarantee on `DevToolsConfig`.
- The `import()` split point disappears, defeating code-splitting.

## Consequences of a violation

- **Tool imports shell or registry:** The tool becomes coupled to shell internals; standalone rendering and unit-testing break.
- **Tool imports another tool:** Cross-tool coupling; removing or renaming one tool requires editing the other.
- **Shell or bindings import a tool directly:** Eager bundle; code-split lost; registry union integrity broken.
- **Registry imports a tool's values:** The tool is bundled with the shell, which loads the registry eagerly.
- **App product code imports `@devtools/*`, directly or through a non-entry file of the DevTools folder:** Product code depends on debug tooling and ships it eagerly.

## Correct pattern

Cross-cutting concerns (shared types, utilities) must **not** live in a tool package. Extract them to a standalone library with no `@devtools/*` scope, then import that from whichever packages need it.

App state and wiring for a tool arrive as **props**, built in `@devtools/bindings` — the single sanctioned bridge to Ledger Live internals. A tool that needs more data from the app gets new props, not a new import.

## Documentation

When adding a new package under `devtools/`, its `README.md` must state:
- Which `@devtools/*` packages it may import, per `DEVTOOLS_ALLOWED_IMPORTS`.
- That all other `@devtools/*` imports are forbidden, with a pointer to this rule.
