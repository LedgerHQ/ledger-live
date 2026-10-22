# @support/lint

> [!CAUTION]
> **Status: UNSTABLE** — New package; in active development.

The repository's oxlint presets, one per layer that differs, and its custom lint rules.

## How a package gets its config

Each layer root carries a one-line `oxlint.config.mts` that re-exports a preset:

```ts
// features/flow/oxlint.config.mts
export { default } from "@support/lint/features-flow";
```

oxlint finds it by walking up from the file it lints, as the editor extension does, so a package
runs plain `oxlint src` and carries no config file and no `-c`. The package resolves from the
workspace root, so consumers do not list it in their dependencies.

A package that needs one rule of its own passes it on its `lint` script, for example
`oxlint ./src -A no-console`. Only the flags in the allowlist of the
[conformance rule](../../tools/nx-plugins/enforce-tool-config/rules/lint.mjs) are accepted there; a
rule that several packages of a layer need belongs in that layer's preset.

## Presets

| Preset | Layer | Differs from `base` |
| --- | --- | --- |
| `base` | `domain/` | The baseline |
| `devtools` | `devtools/` | Automatic JSX runtime, console allowed, platform-suffix rule on, `jsx-a11y/aria-role` off in native files |
| `features-flow` | `features/flow/` | `any` and test-structure rules are errors; lodash, `expo-clipboard`, `navigator.clipboard` and live-common `lib/` restricted; React Compiler rules fatal in the packages that had them fatal; platform-suffix rule on, with waivers |
| `features-platform` | `features/platform/` | Platform-suffix rule on, with waivers |
| `shared` | `shared/` | Platform-suffix rule on, with waivers |
| `support` | `support/` | Console allowed |
| `tools` | `tools/` | Node only, console allowed, `build/` ignored |
| `libs` | `libs/` | Correctness rules as warnings, suspicious off |
| `libs-coin-tester` | `libs/coin-tester-modules/` | `libs`, with correctness as errors and suspicious as warnings |

A preset never weakens a rule a package had: where some packages of a layer are stricter than the
rest, an `overrides` entry keeps them stricter. `overrides` cannot set `categories` or
`ignorePatterns`, though, which is why each layer that differs gets its own config file rather than
an override in a root one. `ignorePatterns`, `globals` and `settings` do not survive `extends`
either, so a preset that needs them declares them itself. Globs in `overrides` and `ignorePatterns`
anchor to the directory of the layer config that re-exports the preset.

## Conformance

`lint:tool-config` rejects an oxlint config anywhere but the layer roots (the workspace root
included), a missing or edited layer config, a `-c` on an oxlint call, and a rule flag outside the
allowlist or on another script than `lint`. Subtrees that keep their own config for now (the apps, the e2e
suites, a few legacy `libs/` trees) are listed in the plugin's `exclusions.mjs`.

## Rules

### `suffix-imports/no-platform-suffix`

Platform variants are carried by file names (`Foo.web.tsx` / `Foo.native.tsx`) and resolved by
configuration: `moduleSuffixes` in tsc, `moduleFileExtensions` in jest, `resolve.extensions` in
rspack, `preferNativePlatform` in Re.Pack. A suffix in the specifier itself is redundant, hides
cross-platform contamination from tsc, and rots on a rename. See [tsconfig.md](../../docs/tsconfig.md).

`base` registers the rule off. `devtools`, `features-flow`, `features-platform` and `shared`
turn it on. It checks `import`, `export`, dynamic `import()`, `require()` and the `jest.mock`
family, and reports three shapes.

**A trailing `.web` or `.native`.** Autofixable: `oxlint --fix` strips the suffix.

```ts
// ✗
import Foo from "./Foo.native";
jest.mock("./internals/digest.web");

// ✓
import Foo from "./Foo";
jest.mock("./internals/digest");
```

**A relative `web` or `native` module.** Reported without an autofix: dropping the segment
resolves to another module, so the fix is to rename the file.

```ts
// ✗
export * from "./steps/Detail/native"; // steps/Detail/native.ts

// ✓
export * from "./steps/Detail"; // steps/Detail/index.native.ts
```

**A platform entry imported from the other platform.** A `/native` or `/web` subpath of an
`@features/*`, `@shared/*` or `@domain/*` package is a
[platform entry](../../docs/adr/universal-components.md) (R5). Only code of that platform imports
it: a `.native.*` file, a file of `apps/ledger-live-mobile/`, or a package with a
`tsconfig.native.json` and no `tsconfig.web.json`, and the mirror for `/web` with
`apps/ledger-live-desktop/`. Reported without an autofix, since the universal entry does not export
the same components.

```ts
// Lottie.web.tsx
import { Lottie } from "@shared/lottie/native"; // ✗
import { Lottie } from "@shared/lottie/web"; // ✓
```

Third-party entry points (`styled-components/native`, `@react-navigation/native`) and `@support/*`
subpaths (`@support/jest-devtools/native`) are never reported.

Each preset waives its layer's remaining violators through `platformSuffixWaivers` in
`src/suffix-imports.js`, which states the waiver policy.

Run the rule's tests with `nx run @support/lint:test`.
