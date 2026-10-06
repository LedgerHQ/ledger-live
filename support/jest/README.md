# @support/jest

> [!CAUTION]
> **Status: UNSTABLE** — New package; in active development.

Shared jest presets, one per layer, each with the setup files, mocks and fixtures it needs. A
preset is code rather than a JSON file, which is why jest configuration lives in a package.

| Preset | Layer | Details |
| --- | --- | --- |
| [`@support/jest/devtools`](./devtools) | `devtools/*` | Dual web/native presets plus themed render fixtures (`/web`, `/native`) |
| [`@support/jest/features-flow`](./features-flow) | `features/flow/*` | Dual web/native preset plus Lumen passthrough stubs |
| [`@support/jest/shared`](./shared) | `shared/*` | Node preset for logic packages, web/native and native-only presets for UI packages |

A consumer declares `"@support/jest": "workspace:*"` in its `devDependencies` and keeps a one-line
`jest.config.js`:

```js
module.exports = require("@support/jest/features-flow").createFlowJestConfig();
```

Each preset only needs part of the peer dependencies listed in `package.json`, so they are all
optional; the consuming package provides what its preset uses.
