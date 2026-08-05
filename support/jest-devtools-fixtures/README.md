# @support/jest-devtools-fixtures

> [!CAUTION]
> **Status: UNSTABLE** — New package; the factory options are still being designed.

Shared jest configuration and themed render fixtures for the `devtools/*` packages.

Every devtools package that renders components runs two jest projects: a jsdom one for
`*.web.test.*` and a React Native one for `*.native.test.*`. Both need the same transform pair, the
same React Native mocks, the same setup files, and the same `@testing-library` `render` wrapped in
the lumen `ThemeProvider`. Before this package, each devtools package carried its own copy and they
had drifted.

## Usage

```jsonc
// package.json
"devDependencies": {
  "@support/jest-devtools-fixtures": "workspace:*"
}
```

```js
// jest.config.js
module.exports = require("@support/jest-devtools-fixtures").createWebJestConfig();
```

```js
// jest.native.config.js
module.exports = require("@support/jest-devtools-fixtures").createNativeJestConfig();
```

Both factories take an optional overrides object. `moduleNameMapper` is merged into the preset's;
every other key replaces it.

```js
// jest.native.config.js, adding a package-local mock
module.exports = require("@support/jest-devtools-fixtures").createNativeJestConfig({
  moduleNameMapper: { "^jest/mocks/transport$": "<rootDir>/jest/mocks/transport.ts" },
});
```

## Render fixtures

Re-export the platform entry point from the package's own `jest/render` folder, so tests keep
importing `jest/render` (web) and `jest/render.native` (native):

```ts
// jest/render/index.tsx
export * from "@support/jest-devtools-fixtures/web";
```

```ts
// jest/render/index.native.tsx
export * from "@support/jest-devtools-fixtures/native";
```

Both entry points re-export their `@testing-library` package, so `screen`, `userEvent`, `renderHook`
and friends come from the same import. `render` accepts a `wrapper` option for an extra provider
nested *inside* the `ThemeProvider`:

```tsx
render(<FlagEditorBottomSheetContent {...props} />, { wrapper: BottomSheetWrapper });
```

Anything that needs a provider specific to one package — `@devtools/shell`'s `NavigationContainer`
and `renderScreen`, for instance — stays in that package's `jest/render` file and builds on `render`.

## What stays in the consumer

- `babel.config.js` — babel resolves its config from the jest `rootDir`, so the file has to sit at
  the consumer's root. `babel-jest` needs the React Native preset to parse the Flow-typed `.js`
  files shipped inside `react-native`; without it the native project fails to start.
- Package-specific fixtures and mocks (`jest/test-utils.ts`, `jest/mocks/transport.ts`, …).
- The `jest/*` tsconfig path mapping and jest `modulePaths`, which resolve the two above.
