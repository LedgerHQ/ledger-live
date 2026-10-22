# @support/jest

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

Shared jest presets, one per layer, each with the setup files, mocks and fixtures it needs. A
preset is code rather than a JSON file, which is why jest configuration lives in a package.

| Preset | Layer | Details |
| --- | --- | --- |
| [`@support/jest/devtools`](./devtools) | `devtools/*` | Dual web/native presets plus themed render fixtures (`/web`, `/native`) |
| [`@support/jest/features-flow`](./features-flow) | `features/flow/*` | Dual web/native preset plus Lumen passthrough stubs |
| [`@support/jest/lib`](./lib) | `libs/*`, uncovered node packages | Node preset with the ESM-only dependency handling of `withEsmDeps` |
| [`@support/jest/shared`](./shared) | `shared/*` | Node preset for logic packages, web/native and native-only presets for UI packages |

`lib` and the `shared` node preset both build a flat node config. `lib` adds `withEsmDeps` and the
`github-actions` reporter, keeps jest's default test files and derives the lcov root from
`rootDir`; a `shared/*` package keeps `shared`. See [`lib`](./lib#when-to-use-it-over-shared).

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
