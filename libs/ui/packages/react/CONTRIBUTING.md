# Contributing

First off, thanks for taking some time to contribute! 🎉👍

This file will guide you through the local setup and contains the guidelines you will need
to follow to get your code merged.

## Guidelines

### Requirements

In order to get merged, a pull request must:

- Pass the linter (`pnpm ui:react lint`)
- Pass the typechecker (`pnpm ui:react typecheck`)

If you are using VSCode, you can use the [`oxc`](https://marketplace.visualstudio.com/items?itemName=oxc.oxc-vscode) plugin to lint and format your code on save.

### Code practices

- Export your components and make them consumable from the root.

The components should be importable from `@ledgerhq/react-ui`, so do not forget to add export statements
in the `src/components/index.ts` file.

- Export required typescript types.

Types should also be importable (but not from root because of name conflicts!).

- Avoid non-standard imports in the code (`.png`, `.svg`…).

The library is agnostic, it does not make any assumptions on the consumer setup and will not force the use of any kind of non-standard bundler.

- Avoid installing new packages unless necessary.

To keep the dependencies short and the size small.

## Local development

This package is private and has no build. Its `exports` point at `src/`, so the apps of the monorepo
read its current source. A `.tsx` subpath needs its own entry in `exports`.
