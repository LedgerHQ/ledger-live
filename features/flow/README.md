# features/flow/

> Part of the [monorepo architecture](../../docs/monorepo-architecture.md).

User-facing feature packages shared across desktop and mobile apps. Each subdirectory is an independent pnpm workspace package providing the UI building blocks that each app assembles into its own screens.

## Scope

`@features/flow-<name>` (e.g. `@features/flow-contacts`, `@features/flow-pay-card`)

## Responsibility

- Provide **UI components** with business context, using `.web.tsx` / `.native.tsx` extensions for platform-specific variants
- Own **feature-local state** (local Redux slices, thunks) when the feature requires it
- Own **local routing** between its own screens; the app owns navigation to and from the flow
- Must NOT contain app-specific screen composition: that belongs in `apps/`

## Conventions

- **MVVM is the flow convention**: each screen is a `useXViewModel.ts` plus `XView.web.tsx` / `XView.native.tsx`, and the View renders its props only (no store, navigation or query hook). The rules are in the [mvvm-architecture skill](../../.agents/skills/mvvm-architecture/SKILL.md)
- One flow package per user-facing feature
- Package name: `@features/flow-<name>`
- Directory name: `features/flow/<name>/`
- `package.json` must have `"private": true`
- May depend on sibling flows (`type:feature-flow`), `type:feature-platform`, `scope:domain`, and `scope:shared`
- A flow may orchestrate sub-flows: depending on another `@features/flow-*` package is allowed, so a parent flow can compose smaller ones
- Nx tag inferred automatically: `type:feature-flow`
- Platform-specific files use `.web.tsx` / `.native.tsx` suffixes; shared logic uses `.ts` / `.tsx`
- A component exported from a universal entry takes one props contract on both platforms; one that cannot goes behind a `./web` or `./native` entry: see the [universal components ADR](../../docs/adr/universal-components.md)
- Barrel exports via `src/index.ts` (web) and `src/index.native.ts` (native), which share the platform-agnostic API through `src/exports.ts` when there is one

## Testing

### In the flow package

Test shared UI, hooks, and feature-flag logic in the `@features/flow-*` package itself:

- **Web components** (`.web.tsx`): Jest + jsdom in the flow package (see `features/flow/contacts/jest.config.js`).
- **Native components** (`.native.tsx`): prefer unit tests in the flow package when behavior is platform-specific; keep assertions focused on component contracts (props, callbacks, rendered structure).

### In app integration tests

Mobile Jest maps `@features/flow-contacts` to a logic-only stub (`src/jest.native.ts`). App `__integrations__` tests spread `jest.requireActual("@features/flow-contacts")` and overlay lightweight UI stubs for Lumen RN components.

Mobile Jest is also configured to:

1. Resolve `react-native` conditional exports (`customExportConditions: ["react-native", "default"]`).
2. Resolve native peer dependencies of `@ledgerhq/lumen-ui-rnative` from the app `node_modules` when loading Lumen source via `modulePaths`.
3. Map all `@ledgerhq/lumen-ui-rnative` entry points (root, `/symbols`, `/styles`) to source so theme context is shared when rendering real flow components in package tests.

Integration tests should cover app-owned wiring only: navigation, feature-flag gating, screen composition, i18n, and analytics.

## File Structure

A flow with one screen keeps a flat `src/`; a flow with several screens puts each in `src/screens/<Screen>/`. Each view is a `useXViewModel.ts` plus `XView.web.tsx` / `XView.native.tsx`. The [flow-package skill](../../.agents/skills/flow-package/SKILL.md) is the canonical layout, with an example package for each rule.

```
screens/<Screen>/    # one folder per screen, when the flow has several (optional)
components/          # UI pieces of the views (.web.tsx / .native.tsx)
copy/                # hooks turning i18n keys into labels (optional)
logic/               # pure business rules, no React (optional)
model/               # framework-free view model, controller and ports (optional)
state/               # flow state: slice and selectors, or a React reducer (optional)
hooks/               # shared React hooks (optional)
types.ts             # types shared across the package (optional)
exports.ts           # platform-agnostic public API (optional)
index.ts             # web barrel (required)
index.native.ts      # native barrel (when the package renders native UI)
```
