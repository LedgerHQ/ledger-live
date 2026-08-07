# @support/ts-config-base

Base TypeScript config preset for new-arch packages (`domain/*`, `shared/*`) that contain no JSX and no browser APIs.

Extends the monorepo root `tsconfig.base.json` and locks in the standard new-arch compiler profile: ES2022, ESNext modules, bundler resolution, `noEmit`, and `jest` types.

`include`/`exclude` use `${configDir}` (TypeScript 5.5+) so they resolve relative to the **consuming package's directory**, not this preset's location.

## When to use

- `domain/entity/*` — Zod schemas, selectors, slices
- `domain/api/*` — RTK Query createApi, network calls
- `shared/*` — framework-agnostic utilities, Redux tooling

## Consumption

```json
// your-package/tsconfig.json
{ "extends": "@support/ts-config-base" }
```

Override `types` when you need extras beyond the default `["jest"]`:

```json
{
  "extends": "@support/ts-config-base",
  "compilerOptions": {
    "types": ["jest", "node"]
  }
}
```

Add `@support/ts-config-base` to the package's `devDependencies`:

```json
{ "devDependencies": { "@support/ts-config-base": "workspace:*" } }
```
