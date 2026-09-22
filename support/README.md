# support/

> [!CAUTION]
> **Status: UNSTABLE** — the layer is still being rolled out. `apps/`, `libs/ledgerjs`, `libs/ui`,
> `libs/coin-modules`, `e2e/`, `tools/` and `tests/` have not moved yet and keep their own configs.

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

`support/<tool>-<layer>` → `@support/<tool>-<layer>`.

**There is one axis, and it is the layer.** A package picks its layer once and uses that same suffix
for every tool, so `features/flow/contacts` consumes `ts-features-flow` + `lint-features-flow` +
`jest-features-flow`. The tool segment is `ts` / `lint` / `fmt` / `jest`, never the vendor's name, so
replacing oxlint or oxfmt later costs nothing.

Earlier attempts mixed a *layer* axis with a *runtime* axis (`base`, `web`, `react-native`, `node`)
and stalled three times, because you could not tell from a name which axis a package was on.
**Platform is not an axis.** A layer preset that needs it exposes `.`, `./web` and `./native`
subpaths instead — and lint needs none at all: there is no platform dimension anywhere in the repo's
oxlint configuration.

## Packages

| Package | Applies to |
| --- | --- |
| [`fmt-base`](./fmt-base) | every migrated layer — the repo's single oxfmt preset |
| [`jest-domain`](./jest-domain) | `domain/entity/*`, `domain/api/*` - node logic packages |
| [`jest-devtools`](./jest-devtools) | `devtools/*` — dual web/native jest presets plus themed render fixtures |
| [`jest-features-flow`](./jest-features-flow) | `features/flow/*` — dual web/native jest preset plus Lumen passthrough stubs |
| [`jest-shared`](./jest-shared) | `shared/*` — flat node preset for logic packages, dual web/native and native-only presets for UI packages |
| [`lint-base`](./lint-base) | the root of the lint preset chain, and the repo's custom oxlint JS plugin |
| [`lint-devtools`](./lint-devtools) | `devtools/*` |
| [`lint-domain`](./lint-domain) | `domain/entity/*`, `domain/api/*` |
| [`lint-features-flow`](./lint-features-flow) | `features/flow/*` |
| [`lint-features-platform`](./lint-features-platform) | `features/platform/*` |
| [`lint-libs-coin-tester`](./lint-libs-coin-tester) | `libs/coin-tester-modules/*` - keeps the correctness category the coin testers always had |
| [`lint-libs`](./lint-libs) | the 50 `libs/*` packages that used `libs/oxc-live-libs` |
| [`lint-shared`](./lint-shared) | `shared/*` |
| [`lint-support`](./lint-support) | `support/*` |
| [`lint-tools`](./lint-tools) | `tools/*`, including `tools/actions/*` |
| [`msw-features-flow-pay-card`](./msw-features-flow-pay-card) | `features/flow/pay-card-*` — MSW + RTK Query test store and server |
| [`ts-base`](./ts-base) | the root of the tsconfig chain; `tsconfig.base.json` is a shim over it |
| [`ts-devtools`](./ts-devtools) | `devtools/*` |
| [`ts-domain`](./ts-domain) | `domain/entity/*`, `domain/api/*` |
| [`ts-features-flow`](./ts-features-flow) | `features/flow/*` |
| [`ts-libs`](./ts-libs) | `libs/*` - packages that emit and publish; `./build` drops tests and resets `customConditions` |
| [`ts-features-platform`](./ts-features-platform) | `features/platform/*` |
| [`ts-shared`](./ts-shared) | `shared/*` |

## How a consumer uses them

Rules reach a package through a **layer config**, one file per layer, that names the preset:

```ts
// features/flow/oxlint.config.mts
export { default } from "@support/lint-features-flow/oxlint.config";
```

oxlint finds it by walking up from the file being linted. That is also how the editor extension
resolves rules, so what you see while typing is what CI runs. A consumer therefore keeps the plain
script it always had and needs no dependency on the preset:

```jsonc
{
  "scripts": { "lint": "oxlint src", "lint:fix": "oxlint src --fix" }
}
```

> [!IMPORTANT]
> A preset must **not** be invoked through a `bin` with `oxlint -c`. It works on the command line
> and leaves the editor blind: with no config to walk up to, the extension falls back to oxlint's
> built-in defaults. Measured on this repository, that was 96 rules in the editor against 219 in
> CI, in every migrated package.

A one-rule deviation goes on the command line rather than into a new config file, for example
`oxlint ./src -A no-console` or `oxlint ./src -D import/no-cycle`. A package that needs more than
that should get its own layer.

Formatting still goes through a bin, because oxfmt has no config discovery to hook into:
`fmt-base src`, with extra excludes as `!` positionals such as `fmt-base src '!src/generated/**'`.

tsconfig needs a file per package, because that is how TypeScript is told where the preset is:

```jsonc
// tsconfig.json
{ "extends": "@support/ts-features-flow", "references": [{ "path": "./tsconfig.web.json" }] }
// tsconfig.web.json - package root first, platform layer over it
{ "extends": ["./tsconfig.json", "@support/ts-features-flow/web"] }
```

Order matters: the platform layer must come **last** so its `moduleSuffixes`, `include` and
`exclude` win, and the package's own root must come **first** so its deviations survive.

`tools/scripts/validate-lint-presets.mjs` and `tools/scripts/validate-tsconfig-presets.mts` enforce
both shapes in CI. The lint one fails if a layer loses its config, if a package grows one that
shadows the layer, or if a package depends on a preset directly.

## Adding a package

Follow [docs/new-library.md](../docs/new-library.md), then:

- Add a row to the table above.
- Add a `CODEOWNERS` entry.
- If the entry points sit outside `src/`, add a `workspaces` entry to `knip.json`.
- If it is a lint preset, add its layer to `MIGRATED` in `tools/scripts/validate-lint-presets.mjs`.

An override that shows up in more than one consumer belongs in a preset instead. Keeping the override
in the consumer is fine when it is genuinely package-specific — but it is visible in the diff, so it
is reviewable.
