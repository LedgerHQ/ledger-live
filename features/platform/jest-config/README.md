# @features/platform-jest-config

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

Shared jest configuration for `features/flow/*` packages.

`createFlowJestConfig()` returns a dual-project jest config:

- **web** (`*.web.test.ts?(x)`) — jsdom environment, for Desktop.
- **native** (`*.native.test.ts?(x)`) — node environment, for Mobile.

Both projects transpile TS/TSX with `@swc/jest`.

## Lumen handling

The Lumen barrels (`@ledgerhq/lumen-ui-react`, `@ledgerhq/lumen-ui-rnative`) and
`@ledgerhq/crypto-icons` are heavy ESM packages with large peer graphs. Instead of
transforming them and installing every peer, this package redirects them (via
`moduleNameMapper`) to a generic **Proxy passthrough stub**: every named export becomes
a simple element that renders its children, respects `as`, and forwards DOM-facing props.

As a result:

- Adding a new Lumen component to a screen needs **no** test-config change.
- Consumers don't need to install Lumen's peer dependencies (radix, class-variance-authority, …).

Tests therefore assert on your own layout/view-model wiring, not on real Lumen internals.

## Usage

```js
// features/flow/<pkg>/jest.config.js
module.exports = require("@features/platform-jest-config").createFlowJestConfig();
```

Add the dependency:

```jsonc
// package.json
"devDependencies": {
  "@features/platform-jest-config": "workspace:*"
}
```
