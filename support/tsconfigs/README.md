# @support/tsconfigs

Raw TypeScript config fragments used by `@support/generate-config`. Not consumed directly by packages.

## Fragments

Each file in `fragments/` is a JSON object with optional `root`, `web`, and `native` keys. Each key holds the tsconfig fields to merge into the corresponding output file when that fragment is included.

| Specifier | Effect |
| --- | --- |
| `@support/tsconfigs/base` | Core compiler options for devtools packages (extends root base, bundler resolution, ESNext, jsx, noEmit) |
| `@support/tsconfigs/jest` | Adds `jest/**/*` to the web include, excludes `jest/**/*.native.*`, adds `@testing-library/jest-dom` to web types, wires `paths: { "jest/*": ["./jest/*"] }` |
| `@support/tsconfigs/web-native` | Three-file pattern: wires `references` in root, writes `tsconfig.web.json` and `tsconfig.native.json` with platform-specific `moduleSuffixes` and exclusions |

## Adding a fragment

Add a file to `fragments/`. The filename becomes the trailing segment of the specifier in `tsconfig.config.json` — e.g. `fragments/my-feature.json` is referenced as `@support/tsconfigs/my-feature`. Each section (`root`, `web`, `native`) is optional — include only what the feature needs to contribute.
