# UI Packages

Design and interface resources for React and React Native projects.

Storybooks:

- [React UI](https://react-ui-storybook.vercel.app)
- [Native UI](https://native-ui-storybook.vercel.app)

Status: these libraries are still in alpha and can include breaking changes.

## Packages

- [@ledgerhq/react-ui](packages/react/README.md): React components and styles.
- [@ledgerhq/native-ui](packages/native/README.md): React Native components and styles.
- [@ledgerhq/ui-shared](packages/shared/README.md): shared assets and code used by React and Native packages.
- [@ledgerhq/icons-ui](packages/icons/README.md): shared SVG icons.

## Installation

Run commands from the repository root.

```sh
pnpm i
```

## Usage

Use package aliases as `pnpm --filter` shortcuts.

```sh
pnpm ui:react
pnpm ui:native
pnpm ui:icons
pnpm ui:shared
```

Use them as prefixes to run a command for a given package.

```sh
pnpm ui:react add -D package
pnpm ui:native storybook
pnpm ui:shared clean
pnpm ui:icons build
```
