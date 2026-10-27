# @support/jest/shared

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

Shared jest configuration for `shared/*` packages.

## Exports

### `shared/*` logic packages

#### `createSharedJestConfig(overrides?, options?)`

Flat node config for the majority of `shared/*` packages.

```js
// shared/<pkg>/jest.config.js
const { createSharedJestConfig } = require("@support/jest/shared");
module.exports = createSharedJestConfig();
```

Optional overrides:

```js
module.exports = createSharedJestConfig({ passWithNoTests: true });
```

`setupFilesAfterEnv` adds to the preset's test quarantine retries; every other key replaces the
preset's. `retries: false` leaves the retries out, for suites where a retry that passes would hide a
real failure:

```js
module.exports = createSharedJestConfig({ rootDir: __dirname }, { retries: false });
```

#### `jestSonarReporter` / `sharedReporters`

`jestSonarReporter` is the sonar reporter tuple. `sharedReporters` is the tail every node config
reports to (`[jestSonarReporter, "@ledgerhq/test-quarantine/jest"]`), after `default` and, on CI,
`github-actions`. A package does not override `reporters`: the `jest` rule of
`pnpm lint:tool-config` rejects the key.

### `shared/ui-*` UI packages

#### `createSharedUiJestConfig(options?)`

Dual-project config for UI packages with both web and native tests:

- **web** (`*.web.test.ts?(x)` and unsuffixed `*.test.ts?(x)`): jsdom environment,
  `@testing-library/jest-dom`.
- **native** (`*.native.test.ts?(x)`) — node environment, Lumen/RN stubs.

Both projects retry a failing test once on CI (`@ledgerhq/test-quarantine/jest-retries`), and the
config reports to sonar, test quarantine and, on CI, `github-actions`. A consumer declares
`"@ledgerhq/test-quarantine": "workspace:*"` in its `devDependencies`: jest resolves the reporter
and the setup file from the consumer.

Requires `jest-environment-jsdom` and `@testing-library/jest-dom` in devDependencies.

```js
const { createSharedUiJestConfig } = require("@support/jest/shared");
module.exports = createSharedUiJestConfig();
```

Per-project customisation via `webOverrides` / `nativeOverrides`. `moduleNameMapper` and
`setupFilesAfterEnv` **add** to the project's defaults (an entry with the same pattern replaces
that mock); any other key replaces the project's value:

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
const { createSharedUiNativeJestConfig } = require("@support/jest/shared");
module.exports = createSharedUiNativeJestConfig();
```

`moduleNameMapper` and `setupFilesAfterEnv` add to the preset's, as in the dual preset; any other
key replaces it. Pass extra `moduleNameMapper` entries to add package-specific mocks alongside the
base ones:

```js
module.exports = createSharedUiNativeJestConfig({
  moduleNameMapper: {
    "^my-custom-dep$": path.join(__dirname, "jest/mocks/my-custom-dep.js"),
  },
});
```

### ESM-only dependencies

#### `withEsmDeps(config, options?)`

Makes jest transform ESM-only dependencies (`@noble/*` v2) so CJS code can `require` them instead of
failing with `Must use import to load ES Module`. Merges a swc transform into `config.transform` and
replaces `config.transformIgnorePatterns`, so everything else in `node_modules/.pnpm` stays ignored.

```js
const { withEsmDeps } = require("@support/jest/shared");
module.exports = withEsmDeps({ testEnvironment: "node" });
```

`extraDeps` keeps more packages transformed, as pnpm store prefixes (`@scope+name`, so `\\+`):

```js
module.exports = withEsmDeps(config, { extraDeps: ["@ledgerhq\\+"] });
```

## Lumen handling

Identical to `@support/jest/features-flow`, from the same core: Lumen barrels and
`@ledgerhq/crypto-icons` are redirected to Proxy passthrough stubs so tests don't need to
transform them or install their peer graph. See `../core/mocks/passthrough-web.js` and
`../core/mocks/passthrough-native.js`, exported as `@support/jest/shared/mocks/*` for a consumer
that wraps one.

## Usage

Add the dependencies (every preset here reports to test quarantine):

```jsonc
// package.json
"devDependencies": {
  "@ledgerhq/test-quarantine": "workspace:*",
  "@support/jest": "workspace:*"
}
```
