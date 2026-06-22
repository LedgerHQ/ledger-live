---
name: knip-migration
description: |
  Dead-code / unused-dependency detection is migrating from the legacy `unimported` tool to
  `knip`, which requires each package to expose an explicit, minimal `package.json#exports`
  (no `./*` wildcard). Read this when adding a new package or migrating an existing one.
---

# Dead-code detection: explicit exports + knip (not unimported)

The repo is migrating dead-code / unused-dependency detection from the legacy **`unimported`**
tool to **`knip`**, one package at a time. knip is configured centrally in the root
[`knip.json`](../../../knip.json) (one `workspaces` entry per package).

## Why this isn't just "swap the tool"

knip treats everything listed in a package's `package.json#exports` as an **entry point**.
Today every package exports a `./*` wildcard mapped to `./src/*.ts` (via the `@ledgerhq/source`
custom condition declared in `tsconfig.base.json`):

```jsonc
"./*": {
  "@ledgerhq/source": "./src/*.ts",
  "import": "./lib-es/*.js",
  "require": "./lib/*.js",
  "default": "./lib/*.js"
}
```

Because of this wildcard, knip considers **every top-level `src/*.ts` file "used"** and cannot
detect unused ("zombie") top-level source files — the exact thing `unimported` caught (it
ignored `exports` and diffed against a curated entry list). So real knip parity for a package
requires **replacing the `./*` wildcard with explicit, minimal subpath exports** that enumerate
the package's true public API.

> The few libs already pointed at knip (e.g. `libs/env`, `libs/promise`) still keep the `./*`
> wildcard, so they are only *partially* migrated — **do not** copy them as the template.

## New package = born migrated

A new package has no consumers, so it should start in the target state — no `.unimportedrc.json`:

1. **Explicit `exports` only.** Enumerate the real public API; do **not** add a `./*` wildcard.
   Mirror the `.` root entry per subpath, keeping the conditions:
   ```jsonc
   "exports": {
     ".":        { "@ledgerhq/source": "./src/index.ts",  "import": "./lib-es/index.js",  "require": "./lib/index.js",  "default": "./lib/index.js" },
     "./logic":  { "@ledgerhq/source": "./src/logic.ts",  "import": "./lib-es/logic.js",  "require": "./lib/logic.js",  "default": "./lib/logic.js" },
     "./lib-es/*": "./lib-es/*.js",
     "./lib/*": "./lib/*.js",
     "./package.json": "./package.json"
   }
   ```
2. **Register in `knip.json`** — add a `workspaces` entry (`entry`, `ignore`, `ignoreDependencies`).
3. **Use knip, not unimported** — add a script that runs knip scoped to the workspace:
   `pnpm knip --directory <relative-hop-to-root> -W <workspace-path>`
   (`--directory` is the hop back to the repo root — `../..` for `libs/<x>`,
   `../../..` for `libs/coin-modules/<x>`; `-W` is the workspace path from root).

## Migrating an existing package off `unimported`

1. **Audit** the real consumers of the package's deep imports.
2. **Replace** the `./*` wildcard export with explicit subpath exports (the legit public API).
3. **Refactor** consumers that relied on now-removed arbitrary entry points.
4. **Switch** the dead-code script `unimported` → knip, delete `.unimportedrc.json`, and verify
   a deliberately-unused top-level `src` file is now reported.

Start with leaf / low-dependency packages; `ledger-live-common` (largest surface) comes last.

### Notes

- `unimported` stays until a package reaches knip parity — don't bulk-delete it.
- Unifying the script / nx-target name (`unimported` → `knip-check`) is tracked separately, so
  matching the surrounding package's existing script name is fine.

## Reviewing

For a **new** package, flag either of these and point here:

- a `.unimportedrc.json` or a script running the **bare `unimported` binary**
  (`"unimported": "unimported"`) — it must use knip via a root `knip.json` `workspaces` entry; or
- a **`./*` wildcard** in `package.json#exports` — new packages must enumerate explicit exports
  so knip can detect zombie files.
