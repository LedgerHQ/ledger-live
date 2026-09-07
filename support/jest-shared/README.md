# @support/jest-shared

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

Shared jest configuration for `shared/*` packages.

## Exports

### `shared/*` logic packages

#### `createSharedJestConfig(overrides?)`

Flat node config for the majority of `shared/*` packages.

```js
// shared/<pkg>/jest.config.js
const { createSharedJestConfig } = require("@support/jest-shared");
module.exports = createSharedJestConfig();
```

Optional overrides:

```js
module.exports = createSharedJestConfig({ passWithNoTests: true });
```

#### `jestSonarReporter` / `sharedReporters`

`jestSonarReporter` is the sonar reporter tuple. `sharedReporters` is the full tail
(`[jestSonarReporter, "@ledgerhq/test-quarantine/jest"]`) — use it when you need to insert
an extra reporter without duplicating the rest:

```js
const { createSharedJestConfig, sharedReporters } = require("@support/jest-shared");
module.exports = createSharedJestConfig({
  reporters: [
    "default",
    ...(process.env.CI ? ["github-actions"] : []),
    ...sharedReporters,
  ],
});
```

### `shared/ui-*` UI packages

#### `createSharedUiJestConfig(options?)`

Dual-project config for UI packages with both web and native tests:

- **web** (`*.web.test.ts?(x)`) — jsdom environment, `@testing-library/jest-dom`.
- **native** (`*.native.test.ts?(x)`) — node environment, Lumen/RN stubs.

Requires `jest-environment-jsdom` and `@testing-library/jest-dom` in devDependencies.

```js
const { createSharedUiJestConfig } = require("@support/jest-shared");
module.exports = createSharedUiJestConfig();
```

Per-project customisation via `webOverrides` / `nativeOverrides`. Providing `moduleNameMapper`
inside an override **replaces** the default Lumen/RN stubs for that project:

```js
module.exports = createSharedUiJestConfig({
  nativeOverrides: {
    moduleNameMapper: {
      "^react-native$": path.join(__dirname, "jest/mocks/react-native.js"),
    },
  },
});
```

Top-level options (e.g. `passWithNoTests`) go at the root, not inside a project override:

```js
module.exports = createSharedUiJestConfig({ passWithNoTests: true });
```

#### `createSharedUiNativeJestConfig(overrides?)`

Flat node config for UI packages with **native-only** tests. Provides react-native,
safe-area-context, Lumen native, and image stubs by default. Does not require
`jest-environment-jsdom` or `@testing-library/jest-dom`.

```js
const { createSharedUiNativeJestConfig } = require("@support/jest-shared");
module.exports = createSharedUiNativeJestConfig();
```

Pass extra `moduleNameMapper` entries to add package-specific mocks alongside the base ones:

```js
module.exports = createSharedUiNativeJestConfig({
  moduleNameMapper: {
    "^my-custom-dep$": path.join(__dirname, "jest/mocks/my-custom-dep.js"),
  },
});
```

## Lumen handling

Identical to `@support/jest-features-flow`: Lumen barrels and `@ledgerhq/crypto-icons` are
redirected to Proxy passthrough stubs so tests don't need to transform them or install their
peer graph. See `mocks/passthrough-web.js` and `mocks/passthrough-native.js`.

## Usage

Add the dependency:

```jsonc
// package.json
"devDependencies": {
  "@support/jest-shared": "workspace:*"
}
```
