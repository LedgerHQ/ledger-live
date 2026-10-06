# @support/lint

> [!CAUTION]
> **Status: UNSTABLE** — New package; in active development.

The repository's oxlint presets, and its custom lint rules.

## How a package gets its config

Each layer root carries a one-line `oxlint.config.mts` that re-exports a preset:

```ts
// features/flow/oxlint.config.mts
export { default } from "@support/lint/features-flow";
```

oxlint finds it by walking up from the file it lints, as the editor extension does, so a package
runs plain `oxlint src` and carries no config file and no `-c`. The package resolves from the
workspace root, so consumers do not list it in their dependencies.

A package that needs one rule of its own passes it on the command line, for example
`oxlint ./src -A no-console`.

## Presets

| Preset | Layer | Differs from `base` |
| --- | --- | --- |
| `base` | `domain/`, `shared/`, `features/platform/` | The baseline |
| `devtools` | `devtools/` | Automatic JSX runtime, console allowed, platform-suffix rule on |
| `features-flow` | `features/flow/` | `any` is an error, lodash and live-common `lib/` imports restricted |
| `support` | `support/` | Console allowed |
| `tools` | `tools/` | Node only, console allowed, `build/` ignored |
| `libs` | `libs/` | Rule categories off, only named rules enforced |
| `libs-coin-tester` | `libs/coin-tester-modules/` | `libs`, with the correctness categories back on |

`ignorePatterns`, `globals` and `settings` do not survive `extends`, so a preset that needs them
declares them itself. Globs in `overrides` and `ignorePatterns` anchor to the directory of the layer
config that re-exports the preset.

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
