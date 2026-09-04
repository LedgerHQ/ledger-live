# @support/jest-features-flow

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

Shared jest configuration for `features/flow/*` packages.

`createFlowJestConfig()` returns a dual-project jest config:

- **web** (`*.web.test.ts?(x)`) — jsdom environment, for Desktop.
- **native** (`*.native.test.ts?(x)`) — node environment, for Mobile.

Both projects transpile TS/TSX with `@swc/jest`.

The Native project resolves the `react-native` conditional export for workspace `@features/*`
packages only. This keeps flow package imports platform-correct without changing each consumer's
Jest config, while third-party Node dependencies retain their default resolution.

## Lumen handling

The Lumen barrels and subpaths (`@ledgerhq/lumen-ui-react`, `@ledgerhq/lumen-ui-rnative`)
and `@ledgerhq/crypto-icons` are heavy ESM packages with large peer graphs. Instead of
transforming them and installing every peer, this package redirects them (via
`moduleNameMapper`) to a generic **Proxy passthrough stub**: every named export becomes
a component that renders its children. Native `Banner` and `Button` expose their visible
description, actions, and labels, while web tooltip primitives and `InteractiveIcon` retain their
accessible test shape.

The Web `Avatar` boundary renders `fallbackText` and exposes fallback color and size through
`data-*` attributes for consumer tests. It deliberately does not reproduce Lumen's color-selection
rules.

As a result:

- Adding a new Lumen component or symbol to a screen needs **no** test-config change.
- Hook exports (`use*`) return a mutable `{ current: null }` ref stub.
- Consumers don't need to install Lumen's peer dependencies (radix, class-variance-authority, …).

Tests therefore assert on your own layout/view-model wiring, not on real Lumen internals.

## Web environment polyfills

`setup/web.js` polyfills the Encoding API (`TextEncoder` / `TextDecoder`) on the jsdom global.
jsdom doesn't implement it, unlike every runtime this code ships to (browsers, React Native,
Node), so a package reading `TextEncoder` at module-eval time — `@ledgerhq/device-contacts-kit`
does — throws `ReferenceError` the moment a web test imports it, even transitively.
It also mocks `window.matchMedia`.

## Usage

```js
// features/flow/<pkg>/jest.config.js
module.exports = require("@support/jest-features-flow").createFlowJestConfig();
```

Add the dependency:

```jsonc
// package.json
"devDependencies": {
  "@support/jest-features-flow": "workspace:*"
}
```
