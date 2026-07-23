# @support/ts-config-web

TypeScript config preset for new-arch packages that target **web only** (`features/flow/*`, `features/platform/*`).

Extends `@support/ts-config-base` and adds `jsx: react-jsx`, DOM lib, and `moduleSuffixes: [".web", ""]` so TypeScript resolves `.web.tsx` variants before plain `.tsx`.

## When to use

- `features/platform/*` — NFR platform packages (feature flags, style, analytics)
- `features/flow/*` packages that only ship web UI (no `.native.tsx` files)

## Consumption

```json
// your-package/tsconfig.json
{ "extends": "@support/ts-config-web" }
```

Override `types` when you need extras beyond the default `["jest"]`:

```json
{
  "extends": "@support/ts-config-web",
  "compilerOptions": {
    "types": ["jest", "@testing-library/jest-dom"]
  }
}
```

Add `@support/ts-config-web` to `devDependencies`:

```json
{ "devDependencies": { "@support/ts-config-web": "workspace:*" } }
```
