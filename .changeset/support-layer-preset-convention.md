---
"@support/lint-base": minor
"@support/lint-devtools": minor
"@support/lint-domain": minor
"@support/lint-features-flow": minor
"@support/lint-features-platform": minor
"@support/lint-libs": minor
"@support/lint-shared": minor
"@support/lint-support": minor
"@support/lint-tools": minor
"@support/fmt-base": minor
"@support/jest-domain": minor
"@support/ts-base": minor
"@support/ts-devtools": minor
"@support/ts-domain": minor
"@support/ts-features-flow": minor
"@support/ts-features-platform": minor
"@support/ts-shared": minor
---

Give `support/` one naming axis, the layer, and apply it to oxlint, oxfmt and tsconfig.

- A package picks its layer once and uses that suffix for every tool, so `features/flow/contacts`
  consumes `ts-features-flow` + `lint-features-flow` + `jest-features-flow`. The tool segment is
  `ts` / `lint` / `fmt` / `jest`, never the vendor's name. Platform is not an axis: a layer preset
  exposes `.`, `./web` and `./native` subpaths, and lint needs none.
- A migrated package carries **no lint or format config file**. Each lint preset ships a `bin` that
  pnpm links into the consumer, and that bin runs the tool with `-c` against the preset's own config,
  which also disables upward config discovery. Deviations go on the command line.
- `lint-rules` merges into `lint-base`, so one package holds the custom oxlint plugin and the
  baseline rules. The preset resolves its plugin from its own `import.meta.url`, which is what stops
  a `jsPlugins` path from having to be repeated in every consumer config.
- `libs/oxc-live-libs` is deleted; its 50 consumers move to `@support/lint-libs` and
  `@support/fmt-base`.
- `tsconfig.base.json` becomes a shim over `@support/ts-base`, so `apps/`, `libs/`, `tools/` and
  `e2e/` keep exactly the options they have today.
- `tools/` and the 27 `domain/*` jest configs join too: `tools/.oxlintrc.json` named nothing that
  `lint-base` did not already say, and the domain jest configs were three distinct contents with
  21 byte-identical copies.

No rule becomes fatal anywhere: lint gains 61 previously-unlinted packages and 663 warnings, and the
set of packages exiting non-zero is unchanged. `tools/scripts/lint-diagnostics-snapshot.mjs` and
`tools/scripts/typecheck-snapshot.mjs` capture the before/after evidence.
