# @support/jest-devtools

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
  "@support/jest-devtools": "workspace:*"
}
```

```js
// jest.config.js
module.exports = require("@support/jest-devtools").createWebJestConfig();
```

```js
// jest.native.config.js
module.exports = require("@support/jest-devtools").createNativeJestConfig();
```

Both factories take an optional overrides object. `moduleNameMapper` is merged into the preset's;
every other key replaces it.

```js
// jest.native.config.js, adding a package-local mock
module.exports = require("@support/jest-devtools").createNativeJestConfig({
  moduleNameMapper: { "^jest/mocks/transport$": "<rootDir>/jest/mocks/transport.ts" },
});
```

## Render fixtures

Tests import the entry point for their platform directly. There is no per-package indirection:

```ts
// FlagRow.web.test.tsx
import { render, screen } from "@support/jest-devtools/web";
```

```ts
// FlagRow.native.test.tsx
import { render, screen } from "@support/jest-devtools/native";
```

The subpath is explicit rather than resolved from the filename, because jest's resolver does not
apply the `react-native` export condition — the same reason the native preset maps lumen by hand.

Both entry points re-export their `@testing-library` package, so `screen`, `userEvent`, `renderHook`
and friends come from the same import. `render` accepts a `wrapper` option for an extra provider
nested *inside* the `ThemeProvider`:

```tsx
render(<FlagEditorBottomSheetContent {...props} />, { wrapper: BottomSheetWrapper });
```

A provider specific to one package stays in that package and builds on `render` — see
`devtools/shell/jest/screens.native.tsx`, which adds `NavigationContainer` and `renderScreen` and
re-exports this package so its tests still need only one import.

## What stays in the consumer

- `babel.config.js` — babel resolves its config from the jest `rootDir`, so the file has to sit at
  the consumer's root. `babel-jest` needs the React Native preset to parse the Flow-typed `.js`
  files shipped inside `react-native`; without it the native project fails to start.
- Package-specific fixtures and mocks (`jest/test-utils.ts`, `jest/mocks/transport.ts`, …).
- The `jest/*` tsconfig path mapping and jest `modulePaths`, which resolve those.
