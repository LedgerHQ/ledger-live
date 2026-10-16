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
| `base` | `domain/`, `shared/`, `features/platform/` | The baseline |
| `devtools` | `devtools/` | Automatic JSX runtime, console allowed, platform-suffix rule on |
| `features-flow` | `features/flow/` | `any` and test-structure rules are errors; lodash, `expo-clipboard`, `navigator.clipboard` and live-common `lib/` restricted; React Compiler rules fatal in the packages that had them fatal |
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

`lint:tool-config` rejects an oxlint config anywhere but the layer roots, a layer config that does
more than re-export its preset, a `-c` on an oxlint call, and a rule flag outside the allowlist or
on another script than `lint`. Subtrees that keep their own config for now (the apps, the e2e
suites, a few legacy `libs/` trees) are listed in the plugin's `exclusions.mjs`.

## Rules

### `suffix-imports/no-platform-suffix`

Disallows explicit `.web` or `.native` suffixes in import paths. Platform resolution should be left
to the bundler (Metro / webpack). `base` registers it off; `devtools` turns it on.

**Autofix available**: run `oxlint --fix` to strip the suffix automatically.

```ts
// ✗
import Foo from "./foo.native";
import Bar from "../bar.web";

// ✓
import Foo from "./foo";
import Bar from "../bar";
```
