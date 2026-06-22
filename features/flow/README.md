# features/flow/

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
