# @support/jest

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

Shared jest presets, one per layer, each with the setup files, mocks and fixtures it needs. A
preset is code rather than a JSON file, which is why jest configuration lives in a package.

| Preset | Layer | Details |
| --- | --- | --- |
| [`@support/jest/devtools`](./devtools) | `devtools/*` | Dual web/native presets plus themed render fixtures (`/web`, `/native`) |
| [`@support/jest/features-flow`](./features-flow) | `features/flow/*` | Dual web/native preset plus Lumen passthrough stubs |
| [`@support/jest/libs-coin`](#libs-coin) | `libs/coin-modules/*`, `libs/wallet-btc` | Node unit and integration presets for coin modules |
| [`@support/jest/shared`](./shared) | `shared/*`, `libs/*` | Node preset for logic packages, web/native and native-only presets for UI packages |

`createSharedJestConfig(overrides, options)` is the node base for `shared/*` and `libs/*` packages,
and for node packages of other layers that no layer preset covers yet. Its options:

- `esm: true` applies `withEsmDeps` to the result, after the overrides, for a package that
  `require`s an ESM-only dependency (`@noble/*` v2). `extraEsmDeps` keeps more pnpm store prefixes
  transformed (`["@ledgerhq\\+"]`).
- `projectRoot` sets the lcov reporter's root. Without it, the preset derives it from
  `overrides.rootDir` when set (pass `rootDir: __dirname` from a package that is not two levels
  deep), else uses `../../`.

```js
module.exports = createSharedJestConfig({ rootDir: __dirname }, { esm: true });
```

Tests live in `src/` and match `*.test.ts`; a package whose tests live elsewhere overrides `roots`
and `testMatch`. The preset reports to `github-actions` on CI.

## libs-coin

A coin module, or a library that ships coin logic the same way (`libs/wallet-btc`), builds its
configs from `@support/jest/libs-coin` rather than from `createSharedJestConfig` directly. Both
factories sit on `createSharedJestConfig` and take the same options (`esm`, `extraEsmDeps`,
`projectRoot`).

- `createLibsCoinJestConfig(overrides, options)`, for `jest.config.js`: the unit tests. It adds
  `passWithNoTests`, the coin setup files (`@ledgerhq/wallet-framework-test-setup`,
  `@ledgerhq/disable-network-setup`, `@ledgerhq/test-quarantine/jest-retries`), coverage of
  `src/**/*.ts` minus the tests, and leaves out the `*.integ.test.ts` and `*.integration.test.ts`
  suites. `collectCoverageFrom` and `testPathIgnorePatterns` overrides add to the preset's; every
  other key replaces it, so a package that needs other setup files passes its whole list.
- `createLibsCoinIntegJestConfig(overrides, options)`, for `jest.integ.config.js`: the
  `*.integ.test.ts` suites, which hit live networks. A 60 s timeout, `forceExit`,
  `passWithNoTests`, the wallet framework setup only and the default reporter: no quarantine and
  no sonar report. Every override replaces the preset's key.

`esm` is on by default: the bitcoin family (`coin-bitcoin`, `coin-zcash`, `wallet-btc`) reaches
`@noble/curves` v2, which is ESM-only, and fails to load without it. A module that reaches no
ESM-only dependency can pass `{ esm: false }`. Without the lcov `projectRoot` option or `rootDir`, the root is `../../../`, the depth
of `libs/coin-modules/*`.

```js
module.exports = createLibsCoinJestConfig({
  rootDir: __dirname,
  modulePathIgnorePatterns: ["__tests__/fixtures"],
});
```

A consumer declares `"@support/jest": "workspace:*"` in its `devDependencies` and keeps a
`jest.config.js` built by a preset factory:

```js
module.exports = require("@support/jest/features-flow").createFlowJestConfig();
```

What the package needs on top of the preset goes through the factory's overrides argument. The
`jest` rule of `pnpm lint:tool-config` checks that every jest config of a consumer exports a
`create*Config` call from `@support/jest/*`; what the overrides contain is the package's call.

Unlike the lint, format and TypeScript presets, consumers keep the dependency: the presets carry
code and peer dependencies, and the dependency tells nx which test targets a preset change
affects. Each preset needs only part of the peer dependencies listed in `package.json`, so they are
all optional; the consuming package provides what its preset uses.

`<rootDir>` in a preset is the consumer's root, not this package's. A path inside this package is
resolved from `__dirname` instead.
