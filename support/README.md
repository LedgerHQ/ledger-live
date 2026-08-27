# support/

> [!CAUTION]
> **Status: UNSTABLE** — The layer was just introduced; only the jest preset below exists so far.

Development-only tooling: shared test, TypeScript, lint and format configuration. Packages here
never ship runtime code, and consumers depend on them through `devDependencies` only.

## Why a package per preset, and not a file at the workspace root

Configuration in this monorepo is not just `tsconfig.json`. Packages also carry `.oxlintrc.json`,
`oxfmt` settings, and a jest setup that includes setup files, environment mocks and transform rules.
A jest preset is therefore not a single JSON file — it is code — and some packages need several jest
projects in one run. That is not expressible as a root-level file.

Making each preset a package also makes it a node in the Nx graph, so `nx affected` resolves the real
blast radius when a preset changes, and `extends` / `require` names the preset explicitly instead of
relying on convention.

See [ADR: Shared Tooling Configuration via `support/` Packages](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/7353892916/2026-07-23+ADR+Shared+Tooling+Configuration+via+support+Packages).

## Naming

`support/<name>` → `@support/<name>`, following `{tool}-{preset}`.

Two kinds of preset:

- **Runtime presets** are defined by the execution environment a package targets: `base` (universal),
  `web` (browser, and the Electron renderer), `react-native`, `node`.
- **Product presets** are defined by what a group of packages *does* rather than what it targets,
  e.g. `coin`, `domain`, `features-flow`, `devtools`. A product preset must build on a runtime
  preset, must not redefine baseline options, and must document which packages it applies to.

## Packages

| Package | Applies to |
| --- | --- |
| [`jest-devtools`](./jest-devtools) | `devtools/*` — dual web/native jest presets plus themed render fixtures |
| [`jest-features-flow`](./jest-features-flow) | `features/flow/*` — dual web/native jest preset plus Lumen passthrough stubs |
| [`jest-shared`](./jest-shared) | `shared/*` — flat node preset for logic packages, dual web/native and native-only presets for UI packages |
| [`lint-rules`](./lint-rules) | monorepo-wide custom ESLint rules |

## Adding a package

Follow [docs/new-library.md](../docs/new-library.md), then:

- Add a row to the table above.
- Add a `CODEOWNERS` entry.
- If the entry points sit outside `src/`, add a `workspaces` entry to `knip.json`.

An override that shows up in more than one consumer belongs in a preset instead. Keeping the override
in the consumer is fine when it is genuinely package-specific — but it is visible in the diff, so it
is reviewable.
