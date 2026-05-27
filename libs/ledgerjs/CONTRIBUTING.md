# Contributing

:+1::tada: First off, thanks for taking the time to contribute! :tada::+1:

This repository hosts the `@ledgerhq/*` JavaScript libraries.

## JavaScript styleguide

* ES6+ features.
* **[oxfmt](https://oxc.rs/docs/guide/usage/formatter)** for formatting (Prettier-compatible options). Shared config: [`packages/.oxfmtrc.json`](packages/.oxfmtrc.json) (`arrowParens: "avoid"`, aligned with the monorepo [`.prettierrc`](../../.prettierrc)). **Oxfmt skips** `**/*.md` and `**/*.json` under `packages/` (READMEs, changelogs, fixtures, `tsconfig`, etc.). From a package directory (e.g. `libs/ledgerjs/packages/<name>`): `pnpm exec oxfmt ./src` or `pnpm exec oxfmt ./src --check`. From the **monorepo root**: `pnpm exec oxfmt -c libs/ledgerjs/packages/.oxfmtrc.json libs/ledgerjs/packages/<name>/src`.
* **[oxlint](https://oxc.rs/docs/guide/usage/linter)** for linting. From a package directory: `pnpm lint` or `pnpm lint:fix` (`oxlint ./src --fix`). From the monorepo root: `nx run-many -t lint:fix --projects=tag:scope:libs-ledgerjs`. Shared config: [`packages/.oxlintrc.json`](packages/.oxlintrc.json). **`--fix` only applies rules that have autofixers** (e.g. duplicate imports or some Jest patterns must be fixed by hand).
* TypeScript is used to typecheck the library. Check with `pnpm build`.

> NB. For lint/format, editor integrations for Ox/Oxc or running the commands above from the package folder work best.

## Documentation

* [documentation.js](https://documentation.js.org/) for generation markdown documentations of libraries. You can run `pnpm doc` from a package directory.
