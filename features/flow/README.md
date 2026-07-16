# features/flow/

> Part of the [DDD monorepo architecture](../../docs/ddd-monorepo-architecture.md).

User-facing feature packages shared across desktop and mobile apps. Each subdirectory is an independent pnpm workspace package providing the UI building blocks that each app assembles into its own screens.

## Scope

`@features/flow-<name>` (e.g. `@features/flow-market-banner`, `@features/flow-wallet`)

## Responsibility

- Provide **UI components** with business context, using `.web.tsx` / `.native.tsx` extensions for platform-specific variants
- Own **feature-local state** (local Redux slices, thunks) when the feature requires it
- Expose **feature-local routing** when the feature contains multiple steps or sub-views
- Must NOT contain app-specific screen composition — that belongs in `apps/`

## Conventions

- One flow package per user-facing feature
- Package name: `@features/flow-<name>`
- Directory name: `features/flow/<name>/`
- `package.json` must have `"private": true`
- May depend on `type:feature-platform`, `scope:domain`, and `scope:shared`
- Nx tag inferred automatically: `type:feature-flow`
- Platform-specific files use `.web.tsx` / `.native.tsx` suffixes; shared logic uses `.ts` / `.tsx`
- Barrel export via `src/index.ts`

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

Each package follows this layout inside `src/`:

```
components/          # UI components with business context (.web.tsx / .native.tsx)
hooks/               # Feature-local hooks (optional)
router/              # Local routing when the feature has multiple views (optional)
steps/               # Individual steps in a multi-step flow (optional)
state/               # Feature-local Redux slice or thunks (optional)
utils/               # Feature-local helpers (optional)
index.ts             # Barrel exports (required)
```
