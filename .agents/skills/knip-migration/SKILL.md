---
name: knip-migration
description: |
  Dead-code / unused-dependency detection is migrating from the legacy `unimported` tool to
  `knip`, which requires each package to expose an explicit, minimal `package.json#exports`
  (no `./*` wildcard). Read this when adding a new package or migrating an existing one.
---

# Dead-code detection: explicit exports + knip (not unimported)

The repo is migrating dead-code / unused-dependency detection from the legacy **`unimported`**
tool to **`knip`**, one package at a time. The root [`knip.json`](../../../knip.json) holds only
the shared rules — a package needs no `workspaces` entry there, since knip derives its entry files
from `package.json` (`main`, `bin`, `exports`) and its own defaults
([entry files](https://knip.dev/explanations/entry-files)).

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
2. **Use knip, not unimported** — add a script that runs knip scoped to the workspace:
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

## Dual-platform packages run knip once per platform

knip has no notion of `moduleSuffixes`. A suffix-less `./Tool` specifier therefore resolves to
nothing when only `Tool.web.tsx` and `Tool.native.tsx` exist, and **both twins are reported as
unused files** (`files` is an `error` rule). Naming the suffix in the barrel fixes it for packages
that may do so, but not under `devtools/`, where `suffix-imports/no-platform-suffix` makes a
suffixed specifier a lint error.

So a package with platform twins gets two passes, through the shared helper
[`knip.config.base.mjs`](../../../knip.config.base.mjs):

```js
// <pkg>/knip.web.config.mjs — and the `native` mirror
import { createDualPlatformKnipConfig } from "../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "devtools/shell",
  platform: "web",
  entry: [],
});
```

```jsonc
// <pkg>/package.json — the hop in `--directory` is the depth back to the repo root
"unimported": "pnpm knip --directory ../.. -c devtools/shell/knip.web.config.mjs -W devtools/shell --tsConfig tsconfig.web.json && pnpm knip --directory ../.. -c devtools/shell/knip.native.config.mjs -W devtools/shell --tsConfig tsconfig.native.json"
```

Name the file `knip.<platform>.config.mjs`. The root `ignore` list matches `**/*.config.*`, so that
name keeps knip from reporting its own config as unused. A `.ts` config does not match and needs a
Sonar exclusion to compensate.

**These configs carry no comments.** This section is the single source for why they look as they do;
the three options below are the only reasons a config should differ from the snippet above.

### `entry` is `[]` unless `package.json` cannot yield the entry

knip derives entries from `package.json` (every `exports` condition, `main`, and specifiers in
`scripts`), and reports an `entry` it already has as a *redundant entry pattern*. Name one only
when that derivation misses a real entry point:

- the package declares no `react-native` condition, so only the web barrel is derived
  (`devtools/env`, and `devtools/feature-flags` / `devtools/pay-card`, which have no `exports` at
  all). Name `src/index.native.ts` in the native config.
- a platform file is reachable only through resolution. `devtools/bindings` pairs
  `isMockSessionSupported.ts` with a `.native.ts` override and no `.web` twin, and knip resolves
  the unsuffixed sibling first, so the native config names `src/isMockSessionSupported.native.ts`.
  Such an entry goes stale when the override is deleted; knip then reports *Refine entry pattern
  (no match)*, so treat that hint as "the pair is gone, drop the entry".

### `additionalProjectExcludes` is for an *unsuffixed* barrel

The platform glob the helper applies (`!src/**/*.native.*` on web, `!src/**/*.web.*` on native)
only matches suffixed files. A web barrel named `src/index.ts` is not excluded from the native pass
and becomes an unused file there, so the native config names it. A package whose web barrel is
`src/index.web.ts` (`devtools/transport-panel`) needs nothing.

### `additionalIgnoreDependencies` is a last resort

A dependency reached only from the excluded platform's files reads as unused, and `dependencies` is
an `error` rule. Confirm the dependency is genuinely unreachable in that platform before reaching
for this.

### Two resolution facts that look like bugs

- **An unsuffixed sibling beats the compiler extension.** With `{"web.ts": passThrough}` registered,
  `./foo` still resolves to `foo.ts` when both `foo.ts` and `foo.web.ts` exist.
- **Compilers resolve file suffixes, not directory `index` suffixes.** `from "../hooks"` never
  reaches `hooks/index.web.ts`. Import the module itself (`../hooks/useDevToolsStorage`).

A `jest/**` helper sits outside the `project` glob, so knip cannot see it importing a barrel export.
Only `typecheck` catches that, which is why it runs before trusting a clean knip report.

## Reviewing

For a **new** package, flag either of these and point here:

- a `.unimportedrc.json` or a script running the **bare `unimported` binary**
  (`"unimported": "unimported"`) — it must run knip instead; or
- a **`./*` wildcard** in `package.json#exports` — new packages must enumerate explicit exports
  so knip can detect zombie files.

## The `workspaces` block in `knip.json` is a temporary workaround

Everything must work without touching `knip.json`. The `workspaces` entries that remain are
band-aids for packages that don't declare their surface properly yet — deep imports behind a `./*`
wildcard, runtime entries invisible to `package.json` (Electron preloads, web workers), or
dependencies knip can't resolve. Each one hides a package that hasn't finished the migration above.

So: don't grow this file. Fixing the package's `exports` is the real fix, and it lets the
corresponding `workspaces` entry be deleted. If you truly cannot avoid an entry, keep it to the
smallest possible delta and remember a configured `entry` **replaces** knip's default patterns
rather than extending them.
