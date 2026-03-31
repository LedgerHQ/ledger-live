# Contributing

:+1::tada: First off, thanks for taking the time to contribute! :tada::+1:

This repository hosts the `@ledgerhq/*` JavaScript libraries.

## JavaScript styleguide

* ES6+ features.
* **[oxfmt](https://oxc.rs/docs/guide/usage/formatter)** for formatting (Prettier-compatible options). Shared config: [`.oxfmtrc.json`](../../.oxfmtrc.json) at the monorepo root (`arrowParens: "avoid"`, aligned with [`.prettierrc`](../../.prettierrc)). **Oxfmt skips** `**/*.md` and `**/*.json` under `libs/ledgerjs/packages/` (READMEs, changelogs, fixtures, `tsconfig`, etc.). From a package directory (e.g. `libs/ledgerjs/packages/<name>`): `pnpm exec oxfmt -c ../../../../.oxfmtrc.json ./src` or the same with `--check`. From the **monorepo root**: `pnpm exec oxfmt -c .oxfmtrc.json libs/ledgerjs/packages/<name>/src`.
* **[oxlint](https://oxc.rs/docs/guide/usage/linter)** for linting. From a package directory: `pnpm lint` or `pnpm lint:fix` (`oxlint ./src --fix`). From the monorepo root: `pnpm turbo lint:fix --filter="./libs/ledgerjs/packages/**"`. Shared config: [`packages/.oxlintrc.json`](packages/.oxlintrc.json). **`--fix` only applies rules that have autofixers** (e.g. duplicate imports or some Jest patterns must be fixed by hand). **Turbo stops at the first failing package**; add `--continue` to run every package and list all failures.
* TypeScript is used to typecheck the library. Check with `pnpm build`.

> NB. For lint/format, editor integrations for Ox/Oxc or running the commands above from the package folder work best.

## Documentation

* [documentation.js](https://documentation.js.org/) for generation markdown documentations of libraries. You can run `pnpm doc` from a package directory.
