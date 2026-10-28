# @support/jest

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

Shared jest presets, one per layer, each with the setup files, mocks and fixtures it needs. A
preset is code rather than a JSON file, which is why jest configuration lives in a package.

| Preset | Layer | Details |
| --- | --- | --- |
| [`@support/jest/devtools`](./devtools) | `devtools/*` | Dual web/native presets plus themed render fixtures (`/web`, `/native`) |
| [`@support/jest/features-flow`](./features-flow) | `features/flow/*`, `features/platform/*` | Dual web/native preset plus Lumen passthrough stubs |
| [`@support/jest/libs-coin`](#libs-coin) | `libs/coin-modules/*`, `libs/wallet-btc` | Node unit and integration presets for coin modules |
| [`@support/jest/shared`](./shared) | `shared/*`, `libs/*` | Node preset for logic packages, web/native and native-only presets for UI packages |

The dual web/native presets, `createSharedUiJestConfig` and `createFlowJestConfig` (with their
native-only variants), are built on one private core, `core/`, which is not exported. It holds
the transform, the platform extensions, the jsdom web and node native projects, the Lumen,
crypto-icons, react-native and image mocks, the web setup, coverage and reporters (sonar, test
quarantine, `github-actions` on CI), and one override rule: in `webOverrides` / `nativeOverrides`,
`moduleNameMapper` and `setupFilesAfterEnv` add to the project's own, every other key replaces
it. A preset adds only its own mocks, test matching, resolver and transform allowlist. The core's
mocks stay reachable as `@support/jest/shared/mocks/*`.

The dual presets set `coverageReporters` at the top level, since jest ignores it inside a project.
The lcov root is the repository root seen from `rootDir` when set, else the layer's depth
(`../../` for `shared/*`, `../../../` for `features/*`), so the `SF:` paths in `lcov.info` are
relative to the repository root, where Sonar reads them.

`createSharedJestConfig(overrides, options)` is the node base for `shared/*` and `libs/*` packages,
and for node packages of other layers that no layer preset covers yet. `setupFilesAfterEnv` adds to
the preset's test quarantine retries; every other key replaces the preset's. Its options:

- `retries: false` leaves the retries out, for suites where a retry that passes would hide a real
  failure.
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
  suites. `setupFilesAfterEnv`, `collectCoverageFrom` and `testPathIgnorePatterns` overrides add to
  the preset's; every other key replaces it.
- `createLibsCoinIntegJestConfig(overrides, options)`, for `jest.integ.config.js`: the
  `*.integ.test.ts` suites, which hit live networks. A 60 s timeout, `forceExit`,
  `passWithNoTests`, the wallet framework setup only and the default reporter: no quarantine and
  no sonar report. `setupFilesAfterEnv` adds to the preset's; every other key replaces it.
- `createLibsCoinJestProject(overrides, options)`, for each entry of the unit config's `projects`:
  jest does not pass a config's top-level options down to its projects, so a project starts from
  the unit defaults (node, transform, ESM dependencies, test matching, setup files) instead of
  retyping them. Its overrides follow the unit config's rule.

Two options remove a setup file the preset adds:

- `network: true` (unit config and projects) leaves out `@ledgerhq/disable-network-setup`, for
  suites that mock the network with msw, which cannot share a run with nock.
- `walletFramework: false` leaves out `@ledgerhq/wallet-framework-test-setup`, for a run that
  loads it from `setupFiles` or does without it.

```js
module.exports = createLibsCoinJestConfig({
  rootDir: __dirname,
  projects: [
    createLibsCoinJestProject({ displayName: "unit", testPathIgnorePatterns: ["\\.msw\\.test\\.ts"] }),
    createLibsCoinJestProject(
      { displayName: "msw", testMatch: ["**/*.msw.test.ts"] },
      { network: true },
    ),
  ],
});
```

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
