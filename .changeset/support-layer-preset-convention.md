---
"@support/lint-base": minor
"@support/lint-devtools": minor
"@support/lint-domain": minor
"@support/lint-features-flow": minor
"@support/lint-features-platform": minor
"@support/lint-libs": minor
"@support/lint-libs-coin-tester": minor
"@support/lint-shared": minor
"@support/lint-support": minor
"@support/lint-tools": minor
"@support/fmt-base": minor
"@support/jest-domain": minor
"@support/ts-base": minor
"@support/ts-preset": minor
---

Give `support/` one naming axis, the layer, and apply it to oxlint, oxfmt and tsconfig.

- A package picks its layer once and uses that suffix for every tool, so `features/flow/contacts`
  consumes `ts-features-flow` + `lint-features-flow` + `jest-features-flow`. The tool segment is
  `ts` / `lint` / `fmt` / `jest`, never the vendor's name. Platform is not an axis: a layer preset
  exposes `.`, `./web` and `./native` subpaths, and lint needs none.
- Rules reach a package through one **layer config** per layer that names the preset, which oxlint
  finds by walking up. That is how the editor extension resolves rules too, so the editor and CI
  agree by construction. Consumers keep a plain `oxlint src` script and depend on nothing.
  Deviations go on the command line, for example `-A no-console`.
- `lint-rules` merges into `lint-base`, so one package holds the custom oxlint plugin and the
  baseline rules. The preset resolves its plugin from its own `import.meta.url`, which is what stops
  a `jsPlugins` path from having to be repeated in every consumer config.
- `libs/oxc-live-libs` is deleted; its 50 consumers move to `@support/lint-libs` and
  `@support/fmt-base`.
- `tsconfig.base.json` becomes a shim over `@support/ts-base`, so `apps/`, `libs/`, `tools/` and
  `e2e/` keep exactly the options they have today.
- `@support/ts-preset` groups tsconfig by what a package structurally is rather than by which
  directory it lives in, with one entry point per archetype. The directory does not predict the
  config: three of the six layer presets it replaces covered mixed project shapes, which is why
  their consumers kept overriding them. 331 configs moved with an identical resolved program.
- `tools/` and the 27 `domain/*` jest configs join too: `tools/.oxlintrc.json` named nothing that
  `lint-base` did not already say, and the domain jest configs were three distinct contents with
  21 byte-identical copies.

No rule becomes fatal anywhere: lint gains 61 previously-unlinted packages and 663 warnings, and the
set of packages exiting non-zero is unchanged. `tools/scripts/lint-diagnostics-snapshot.mjs` and
`tools/scripts/typecheck-snapshot.mjs` capture the before/after evidence.
