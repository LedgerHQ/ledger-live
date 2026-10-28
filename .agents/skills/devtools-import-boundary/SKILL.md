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

To change what a package may import, edit those tables.

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

## Correct pattern

Cross-cutting concerns (shared types, utilities) must **not** live in a tool package. Extract them to a standalone library with no `@devtools/*` scope, then import that from whichever packages need it.

App state and wiring for a tool arrive as **props**, built in `@devtools/bindings` — the single sanctioned bridge to Ledger Live internals. A tool that needs more data from the app gets new props, not a new import.

## Documentation

When adding a new package under `devtools/`, its `README.md` must state:
- Which `@devtools/*` packages it may import, per `DEVTOOLS_ALLOWED_IMPORTS`.
- That all other `@devtools/*` imports are forbidden, with a pointer to this rule.
