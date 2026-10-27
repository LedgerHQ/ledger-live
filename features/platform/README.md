# features/platform/

> Part of the [monorepo architecture](../../docs/monorepo-architecture.md).

Feature-level packages that know the business, serve several flows or use cases and own no journey of their own. Each subdirectory is an independent pnpm workspace package providing hooks, selectors, cross-feature helpers and UI that several flows share.

## Scope

`@features/platform-<name>` (e.g. `@features/platform-feature-flags`, `@features/platform-contacts`)

## Responsibility

- Provide **hooks** and **selectors** that resolve domain state for use in flow packages
- Implement **cross-feature domain-aware helpers** and React glue (e.g. context providers, `<FeatureToggle>`)
- Enforce **NFR business rules** that apply across multiple features (feature flags, device intents, etc.)
- Render **UI shared by several flows**: business-aware components such as the contact avatar and confirmation dialog of `@features/platform-contacts`, or the device animations of `@features/platform-device-action-content`

## Conventions

- One platform package per concern
- Package name: `@features/platform-<name>`
- Directory name: `features/platform/<name>/`
- `package.json` must have `"private": true`
- May depend on `scope:domain` and `scope:shared`; must NOT depend on `type:feature-flow`
- Nx tag inferred automatically: `type:feature-platform`
- No screens, no global routing, no app-specific logic and no single-flow internals: code one flow uses stays in that flow until a second one needs it
- A component with no business meaning goes to `shared/ui-*`, not here
- Barrel export via `src/index.ts`

## File Structure

Each package follows this layout inside `src/`:

```
components/          # Components shared by several flows, visual (contact avatar) or not (<FeatureToggle>)
hooks/               # Hooks and selectors exposing domain state or NFR logic to flow packages
helpers/             # Cross-feature domain-aware helpers (optional)
index.ts             # Barrel exports (required)
```

Files that do not fit a subdirectory (e.g. a single-file integration adapter) live directly under `src/`.
