# @support/jest-msw

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

msw 3 ships ESM only, and so do six of its dependencies. Jest runs CommonJS, so a test that imports
msw fails with `Must use import to load ES Module` unless its config compiles them. This package
holds that list once, so a new ESM dependency of msw is a one-line change here.

## Exports

- `mswTransform`: a `transform` entry compiling those packages, `.mjs` included, with swc. Spread it
  first, so it wins over the config's own rules.
- `mswEsmPnpmDirs`: their folders in the pnpm store (`msw@`, `@mswjs\\+interceptors@`, …), for a
  `node_modules/.pnpm/(?!…)` ignore pattern.
- `mswEsmPackages`: their package names, for a `node_modules/(?!…)/` ignore pattern.

## Usage

```js
const { mswEsmPnpmDirs, mswTransform } = require("@support/jest-msw");

module.exports = {
  transform: {
    ...mswTransform,
    "^.+\\.(t|j)sx?$": ["@swc/jest", { jsc: { target: "esnext" } }],
  },
  transformIgnorePatterns: [`node_modules/.pnpm/(?!(${mswEsmPnpmDirs.join("|")}))`],
};
```
