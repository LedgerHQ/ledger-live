# `ui` <br/> [![react storybook](https://img.shields.io/badge/storybook%20📚-react-61DBFB)](https://react-ui-storybook.vercel.app) [![native storybook](https://img.shields.io/badge/storybook%20📚-native-9665B7)](https://native-ui-storybook.vercel.app)

### Design and interface resources for React and React Native projects.

##### Status: while perfectly useable the libraries are still in alpha state and are subject to breaking changes without notice :fire:.

## About

**The `ui` umbrella is a comprised of the following packages:**

- [**`@ledgerhq/react-ui`**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ui/packages/react): [React](https://reactjs.org/) components and styles.

- [**`@ledgerhq/native-ui`**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ui/packages/native): [React Native](https://reactnative.dev/) components and styles

- [**`@ledgerhq/ui-shared`**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ui/packages/shared): Shared assets and code shared between react and native modules.

- [**`@ledgerhq/icons-ui`**](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ui/packages/icons): Shared SVG icons.

## Installation

> Reminder: all commands should be run at the root of the monorepository

```sh
pnpm i
```

## Usage

Several aliases to the `pnpm --filter` command can be used for convenience.

```sh
# pnpm --filter react-ui
pnpm ui:react
# pnpm --filter native-ui
pnpm ui:native
# pnpm --filter icons-ui
pnpm ui:icons
# pnpm --filter shared-ui
pnpm ui:shared
```

You can use them as prefixes to set the scope and run a command for a given submodule.

```sh
# Prefix the command you want to run with an alias like this:
pnpm ui:react add -D package
pnpm ui:native storybook
pnpm ui:shared clean
pnpm ui:icons build
```

## Examples

The [examples folder](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ui/examples) contains some code samples and minimal projects that you can look into in order to understand how to use the UI libraries with popular development stacks.
