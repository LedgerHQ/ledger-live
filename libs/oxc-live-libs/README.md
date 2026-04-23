# Shared Oxlint / Oxfmt for `libs/live-*`

- `.oxlintrc.json` — shared linter config for packages under `libs/live-*` (use `-c ../oxc-live-libs/.oxlintrc.json`).
- `.oxfmtrc.json` — shared formatter; `live-currency-format` exposes `format` / `format:check` using this file.

From the monorepo root, example:

`pnpm exec oxfmt -c libs/oxc-live-libs/.oxfmtrc.json libs/live-currency-format/src`
