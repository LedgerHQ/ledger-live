---
name: devtools-import-boundary
description: |
  Enforce import boundaries inside the devtools scope.
  Use for any work in "devtools/**".
---

# DevTools import boundaries

Every `@devtools/*` package is **self-contained**. The only permitted cross-package imports within the devtools scope are listed in the table below; all others are forbidden.

## Rules

| Package | May import from `@devtools/*` |
|---|---|
| `@devtools/registry` | any `@devtools/<tool>` |
| `@devtools/shell` | `@devtools/transport`, `@devtools/registry` |
| `@devtools/bindings` | `@devtools/registry` only |
| `@devtools/wire` | `@devtools/transport`, `@devtools/protocols` |
| `@devtools/protocols` | `@devtools/transport` only |
| `@devtools/relay` | `@devtools/transport` only |
| `@devtools/<tool>` | *none* |

All other `@devtools/*` → `@devtools/*` imports are forbidden.

## Why

The devtools architecture decouples tools from the shell through the registry. The shell lazy-loads tools via `metadata.loader`; tools never know the shell exists. If a tool imports the shell or another tool directly:

- The lazy-load boundary collapses — the tool is bundled eagerly.
- A circular dependency becomes likely (tool → shell → registry → tool).
- The tool can no longer be rendered standalone, outside the shell.

If `bindings` or `shell` import a tool package directly (instead of through the registry):

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
- Which `@devtools/*` packages it may import, per the table above.
- That all other `@devtools/*` imports are forbidden, with a pointer to this rule.
