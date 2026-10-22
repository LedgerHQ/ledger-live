# @support/jest/lib

> [!CAUTION]
> **Status: UNSTABLE**. New preset, in active development.

Jest configuration for node lib packages: `libs/*`, and node packages of other layers that no layer
preset covers yet, such as `features/platform/app-update`.

## When to use it over `shared`

Both build a flat node config. Pick `lib` when the package needs what `shared` leaves out:

| | `createLibJestConfig` | `createSharedJestConfig` |
| --- | --- | --- |
| ESM-only dependencies (`withEsmDeps`) | Applied, `extraEsmDeps` adds more | Not applied |
| Test files | Jest's defaults, anywhere but `lib/` and `lib-es/` | `src/**/*.test.ts` |
| `github-actions` reporter on CI | Yes | No |
| swc transform | `.ts`/`.tsx` only, no parser set | `.js`/`.jsx`/`.ts`/`.tsx`, TypeScript parser |
| lcov `projectRoot` | Derived from `rootDir` | `../../`, for `shared/*` |

A `shared/*` package keeps `createSharedJestConfig`.

## `createLibJestConfig(overrides, options?)`

```js
// libs/<pkg>/jest.config.js
const { createLibJestConfig } = require("@support/jest/lib");
module.exports = createLibJestConfig({ rootDir: __dirname });
```

The preset sets:

- `testEnvironment: "node"`
- an swc `esnext` transform for TypeScript files, plus the `withEsmDeps` transform and
  `transformIgnorePatterns`
- `testPathIgnorePatterns: ["lib/", "lib-es/"]`
- reporters `default`, `github-actions` on CI, `jest-sonar`, `@ledgerhq/test-quarantine/jest`
- `setupFilesAfterEnv: ["@ledgerhq/test-quarantine/jest-retries"]`
- coverage reporters `json`, `lcov` (paths relative to the repository root) and `text`

The consumer needs `@ledgerhq/test-quarantine` in its `devDependencies` for the last two items.

### Overrides

`overrides` replace the preset's keys, as with the other presets. `rootDir: __dirname` is required
unless `options.projectRoot` is given: the preset derives the lcov `projectRoot` from it.

`setupFilesAfterEnv` is the key a caller usually appends to. List the retries file again before
the package's own setup files:

```js
module.exports = createLibJestConfig({
  rootDir: __dirname,
  setupFilesAfterEnv: ["@ledgerhq/test-quarantine/jest-retries", "./tests/setup.ts"],
});
```

`transform` and `transformIgnorePatterns` stay under `withEsmDeps`, which runs after the
overrides: a `transform` override still gets the ESM-only entry, and `transformIgnorePatterns` is
always the one `withEsmDeps` builds.

### Options

- `extraEsmDeps`: more pnpm store prefixes to transform, passed to `withEsmDeps` as `extraDeps`
  (`@scope+name`, so `\\+`).
- `projectRoot`: the lcov reporter's `projectRoot`, when it is not derived from `rootDir`.

```js
module.exports = createLibJestConfig(
  {
    rootDir: __dirname,
    testEnvironmentOptions: { customExportConditions: ["@ledgerhq/source"] },
  },
  { extraEsmDeps: ["@ledgerhq\\+"] },
);
```
