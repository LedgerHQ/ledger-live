# `ui`

### Design and interface resources for React and React-Native projects

**This is a monorepo comprised of the following packages:**

- [**`@ledgerhq/react-ui`**](https://github.com/LedgerHQ/ui/tree/main/packages/react): [React](https://reactjs.org/) components and styles.

- [**`@ledgerhq/native-ui`**](https://github.com/LedgerHQ/ui/tree/main/packages/native): [React Native](https://reactnative.dev/) components and styles

- [**`@ledgerhq/ui-shared`**](https://github.com/LedgerHQ/ui/tree/main/packages/shared): Shared assets and code shared between react and native modules.

- [**`@ledgerhq/icons-ui`**](https://github.com/LedgerHQ/ui/tree/main/packages/icons): Shared SVG icons.

### Installation

This repo is setup with [`yarn workspaces`](https://classic.yarnpkg.com/en/docs/workspaces).

```sh
# Running yarn should install and hoist the dependencies for every package.
yarn
# Generate the icons.
yarn workspace @ledgerhq/icons-ui build
```
