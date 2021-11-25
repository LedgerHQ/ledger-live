# `ui` <br/> [![react storybook](https://img.shields.io/badge/storybook%20📚-react-61DBFB)](https://ledger-live-ui-react.vercel.app) [![native storybook](https://img.shields.io/badge/storybook%20📚-native-9665B7)](https://ledger-live-ui-native.vercel.app)

### Design and interface resources for React and React Native projects.

##### Status: while perfectly useable the libraries are still in alpha state and are subject to breaking changes without notice :fire:.

## About

**`@leggerhq/ui` is a monorepo comprised of the following packages:**

- [**`@ledgerhq/react-ui`**](https://github.com/LedgerHQ/ui/tree/main/packages/react): [React](https://reactjs.org/) components and styles.

- [**`@ledgerhq/native-ui`**](https://github.com/LedgerHQ/ui/tree/main/packages/native): [React Native](https://reactnative.dev/) components and styles

- [**`@ledgerhq/ui-shared`**](https://github.com/LedgerHQ/ui/tree/main/packages/shared): Shared assets and code shared between react and native modules.

- [**`@ledgerhq/icons-ui`**](https://github.com/LedgerHQ/ui/tree/main/packages/icons): Shared SVG icons.

## Installation

This repo is setup with [`yarn workspaces`](https://classic.yarnpkg.com/en/docs/workspaces).

```sh
# Running yarn should install and hoist the dependencies for every package.
yarn
# Generate the icons.
yarn icons build
```

## Usage

Several aliases to the `yarn workspace` command can be used for convenience.

```sh
# yarn workspace @ledgerhq/react-ui
yarn react
# yarn workspace @ledgerhq/native-ui
yarn native
# yarn workspace @ledgerhq/ui-shared
yarn shared
# yarn workspace @ledgerhq/icons-ui
yarn icons
```

You can use them as prefixes to set the scope and run a command for a given submodule.

```sh
# Prefix the command you want to run with an alias like this:
yarn react add -D package
yarn native storybook
yarn shared clean
yarn icons build
```

## Examples

The [examples folder](https://github.com/LedgerHQ/ui/tree/main/examples) contains some code samples and minimal projects that you can look into in order to understand how to use the UI libraries with popular development stacks.
