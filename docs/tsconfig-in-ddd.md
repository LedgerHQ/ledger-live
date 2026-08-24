# TypeScript configuration in DDD packages

## The problem

In DDD packages, platform-specific files are colocated in the same directory using the `.web` and `.native` suffixes:

```
src/
  ui/
    AddressRow.web.tsx     ← web implementation
    AddressRow.native.tsx  ← mobile implementation
  logic/
    validateAddress.ts     ← shared, no suffix
    formatAddress.web.ts   ← web-only logic
```

This colocation is intentional: it keeps related implementations close, makes diffs readable, and avoids an artificial `web/` vs `native/` split at the folder level.

The suffix convention does **not** mean every file needs both variants. A file without any suffix is shared between both platforms. A file with only `.web` or only `.native` exists solely on that platform.

### The old approach and why it was fragile

Before the tsconfig solution, consuming code had to write explicit platform suffixes in every import:

```ts
// ❌ Old way — explicit suffixes everywhere
import AddressRow from "./ui/AddressRow.native";
import { formatAddress } from "./logic/formatAddress.web";
```

This was fragile in two ways:

1. **No enforcement.** A `.native` file could freely import a `.web` file — TypeScript had no way to detect or prevent cross-platform contamination.
2. **Brittle refactoring.** Renaming or moving a file meant updating every import that referenced it with an explicit suffix, and it was easy to leave a wrong suffix pointing to the wrong file silently.

---

## The solution: platform-split tsconfig

Each DDD package carries a solution root (`tsconfig.json`) plus one config per platform it targets. A cross-platform package has `tsconfig.web.json` and `tsconfig.native.json`; a platform-only package omits what doesn't apply.

### `tsconfig.json` — solution root

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "moduleResolution": "bundler" },
  "files": [],
  "references": [
    { "path": "./tsconfig.web.json" },
    { "path": "./tsconfig.native.json" }
  ]
}
```

`"files": []` is the critical detail. It tells TypeScript that this config owns **no source files directly**. It is a shared `compilerOptions` bag plus a pointer to the platform configs. Platform-specific files (`.web.*`, `.native.*`) are included by only one child config; unsuffixed shared files are included by both and type-checked in each platform context.

### `tsconfig.web.json` — web platform

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "moduleSuffixes": [".web", ""]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "src/**/*.native.*"]
}
```

### `tsconfig.native.json` — mobile platform

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "moduleSuffixes": [".native", ""]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "src/**/*.web.*"]
}
```

---

## How it works

### `moduleSuffixes` — suffix-free imports

`moduleSuffixes` is a TypeScript 4.7 feature. When resolving a bare import like:

```ts
import AddressRow from "./ui/AddressRow";
```

TypeScript tries each suffix in order before the bare name. Under `[".web", ""]`:

1. `./ui/AddressRow.web.tsx`
2. `./ui/AddressRow.tsx`

Under `[".native", ""]`:

1. `./ui/AddressRow.native.tsx`
2. `./ui/AddressRow.tsx`

The correct platform file is picked automatically. No suffix in the import path, no ambiguity.

### `exclude` — cross-platform firewall

The web config excludes `src/**/*.native.*`; the native config excludes `src/**/*.web.*`. TypeScript cannot type-check a file it does not include. This means:

- Under `tsconfig.web.json`, `AddressRow.native.tsx` does not exist as far as the type system is concerned.
- If a web file writes `import X from "./Foo.native"` as an explicit path, tsc errors because the file is not part of the compilation.

### `files: []` — correct IDE assignment

Without `files: []` on the base config, an IDE might use the base tsconfig as the resolution context for files that have no suffix — resolving imports without any `moduleSuffixes`. Setting `files: []` ensures the base config claims no source files: platform-specific files are owned by exactly one child project; unsuffixed shared files are included in both and resolved under each platform's `moduleSuffixes`.

---

## What this enables

```ts
// ✅ No suffixes in imports
import AddressRow from "./ui/AddressRow";
import { formatAddress } from "./logic/formatAddress";
```

- Web builds resolve `.web` variants; mobile builds resolve `.native` variants; shared files resolve as-is.
- Platform-specific props are safe: `AddressRow.web.tsx` can accept a `style` prop of type `React.CSSProperties` while `AddressRow.native.tsx` accepts `ViewStyle` — no union needed, no cross-contamination.
- TypeScript will error if a `.web` file tries to import something that only exists in a `.native` file, and vice versa.

Explicit suffixes in imports (e.g. `import X from "./Foo.native"`) can still be used when a specific use case genuinely requires pinning to one platform file from shared code, but they should be removed when not strictly necessary — the tsconfig already handles the resolution.

---

## Running typechecks

Because the base `tsconfig.json` has `files: []`, running `tsc -p tsconfig.json` checks nothing. Typecheck scripts must target the platform configs explicitly:

```json
"typecheck": "tsc --noEmit -p tsconfig.web.json && tsc --noEmit -p tsconfig.native.json"
```

Both passes must succeed for the package to be considered type-safe.

---

## Web-only or native-only packages

Every package needs a solution root (`tsconfig.json`) plus one config per platform it targets — `tsconfig.web.json`, `tsconfig.native.json`, `tsconfig.node.json`, etc. Platform-only packages simply omit the configs that don't apply.

---

## Upcoming: support package simplification (WIP)

> **Status:** in progress — PR [#19921](https://github.com/LedgerHQ/ledger-live/pull/19921). Not yet merged.

The 3-file pattern described above is correct but verbose — every package repeats the same `compilerOptions`, `include`, and `exclude`. A set of `@support/ts-config-*` packages under `support/` is being introduced to eliminate that duplication.

### What changes

**`tsconfig.base.json`** becomes a one-line shim:
```json
{ "extends": "@support/ts-config-base-legacy" }
```

**Web-only packages** collapse to a single file:
```json
{ "extends": "@support/ts-config-web" }
```

**Cross-platform ("both") packages** keep 3 files but each is minimal:
```json
// tsconfig.json
{ "extends": "@support/ts-config-web-x-native", "files": [], "references": [{"path": "./tsconfig.web.json"}, {"path": "./tsconfig.native.json"}] }

// tsconfig.web.json
{ "extends": "@support/ts-config-web-x-native/tsconfig.web.json" }

// tsconfig.native.json
{ "extends": "@support/ts-config-web-x-native/tsconfig.native.json" }
```

---

## Reference: packages using this pattern

The pattern is already in use across the codebase:

- `devtools/shell`, `devtools/feature-flags`, `devtools/transport`, `devtools/transport-panel`, `devtools/pay-card`, `devtools/protocols`
- `features/flow/pay-card-*`, `features/flow/flow-contacts-*`
- `features/platform/contacts`
- `shared/ui-qr-code`, `shared/ui-queued-bottom-sheet`
- `support/jest-devtools`
