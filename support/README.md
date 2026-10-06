# support/

> [!CAUTION]
> **Status: UNSTABLE** — The layer is new and its conventions may still change.

Development-only tooling: shared TypeScript, lint, format and test configuration, plus test
fixtures. Packages here never ship runtime code.

## One package per tool

Each tool's shared configuration lives in exactly one package, and its presets are subpaths of that
package. Each tool picks the axis its presets vary along:

| Package | Axis | Presets |
| --- | --- | --- |
| [`@support/tsconfig`](./tsconfig) | Project archetype | `base`, `logic`, `client`, `web`, `native`, `dual`, `lib`, `lib-react`, `lib-node`, `lib/build` |
| [`@support/lint`](./lint) | Layer | `base`, `devtools`, `features-flow`, `support`, `tools`, `libs`, `libs-coin-tester` |
| [`@support/fmt`](./fmt) | None | One config |
| [`@support/jest`](./jest) | Layer, then platform | `devtools` (`/web`, `/native`), `features-flow`, `shared` |

A preset that a group of packages needs is a new subpath of its tool's package, never a new
package. It extends the tool's `base`, is named after the axis value it represents, and documents
which packages it applies to.

See [ADR: Shared Tooling Configuration via `support/` Packages](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/7353892916/2026-07-23+ADR+Shared+Tooling+Configuration+via+support+Packages).

## What a consuming package carries

Only what its tool cannot inherit:

| Tool | In the package | Why |
| --- | --- | --- |
| TypeScript | `tsconfig.json` with `extends`, plus `types` and, on a solution root, `references` | TypeScript needs a file per project and does not inherit `references` |
| Lint | Nothing | oxlint walks up to the layer's one-line `oxlint.config.mts` |
| Format | Nothing | oxfmt walks up to the root `oxfmt.config.mts` |
| Jest | A one-line `jest.config.js`, and `@support/jest` in `devDependencies` | Jest needs a config per project |

`@support/tsconfig`, `@support/lint` and `@support/fmt` resolve from the workspace root, where they
are devDependencies, so the editor and CI read the same configuration and published manifests stay
free of private packages. `@support/jest` is the exception: its presets carry code and peer
dependencies, so consumers declare it, which also tells nx which test targets a preset change
affects. The other three are wired as named inputs in `nx.workspace.json`.

## Other packages

| Package | Applies to |
| --- | --- |
| [`msw-features-flow-pay-card`](./msw-features-flow-pay-card) | `features/flow/pay-card-*`: MSW and RTK Query test store and server |
| [`test-quarantine`](./test-quarantine) | Flaky-test reporters for jest and Playwright |

## Adding a package

Follow [docs/new-library.md](../docs/new-library.md), then:

- Add a row to the relevant table above.
- Add a `CODEOWNERS` entry.
- If the entry points sit outside `src/`, add a `workspaces` entry to `knip.json`.

An override that shows up in more than one consumer belongs in a preset instead. Keeping it in the
consumer is fine when it is genuinely package-specific, and it stays visible in review.
