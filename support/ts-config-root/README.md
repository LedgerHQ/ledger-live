# @support/ts-config-root

Package wrapper for the monorepo root `tsconfig.base.json`.

Provides a stable package-name reference so presets don't need to depend on a relative path to the root. Relative paths break if a package ever moves to a different directory depth.

## When to use

Only `@support/ts-config-*` presets should extend this. Application packages and `libs/*` should continue to use the root `tsconfig.base.json` directly (they already know their relative depth).

## Consumption (for support presets only)

```json
{ "extends": "@support/ts-config-root" }
```

Add to `devDependencies`:

```json
{ "devDependencies": { "@support/ts-config-root": "workspace:*" } }
```
