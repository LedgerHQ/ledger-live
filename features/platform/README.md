# features/platform/

Non-functional requirement (NFR) packages at the features layer. Each subdirectory is an independent pnpm workspace package providing hooks, selectors, and cross-feature helpers that are invisible to users but required for the system to deliver user-facing features reliably.

## Scope

`@features/platform-<name>` (e.g. `@features/platform-feature-flags`, `@features/platform-coin-loader`)

## Responsibility

- Provide **hooks** and **selectors** that resolve domain state for use in flow packages
- Implement **cross-feature domain-aware helpers** and React glue (e.g. context providers, non-rendering components)
- Enforce **NFR business rules** that apply across multiple features (feature flags, coin loading, etc.)

## Conventions

- One platform package per concern
- Package name: `@features/platform-<name>`
- Directory name: `features/platform/<name>/`
- `package.json` must have `"private": true`
- May depend on `scope:domain` and `scope:shared`; must NOT depend on `type:feature-flow`
- Nx tag inferred automatically: `type:feature-platform`
- Does not contain component/screen-specific rendering — only non-visual components (e.g. `<FeatureToggle>`), generic or small reusable building blocks for flow packages, and no app-specific logic
- Barrel export via `src/index.ts`

## File Structure

Each package follows this layout inside `src/`:

```
components/          # Non-visual components (e.g. <FeatureToggle>) and generic reusable building blocks for flow packages
hooks/               # Hooks and selectors exposing domain state or NFR logic to flow packages
helpers/             # Cross-feature domain-aware helpers (optional)
index.ts             # Barrel exports (required)
```

Files that do not fit a subdirectory (e.g. a single-file integration adapter) live directly under `src/`.
