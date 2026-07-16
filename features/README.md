# features/

Feature packages shared across desktop and mobile apps — part of the emerging DDD layout. This model is still maturing and is not yet the default home for new code: use it only when the work clearly fits, otherwise add a new `libs/*` package.

## Layers

| Path | Purpose | README |
| --- | --- | --- |
| `platform/` | Non-functional, cross-feature hooks/selectors/NFR glue — no rendering | [platform/README.md](platform/README.md) |
| `flow/` | User-facing UI shared across apps (`.web.tsx` / `.native.tsx`) | [flow/README.md](flow/README.md) |

## Dependency direction

```
domain/entity → domain/api → features/platform → features/flow → apps/
```

- `features/flow/*` may depend on `features/platform/*`, `domain/*` and `shared/*`.
- `features/platform/*` may depend on `domain/*` and `shared/*`; it must **not** depend on `features/flow/*`.
- App-specific screen composition stays in `apps/`, not here.

Package naming: `@features/platform-<name>`, `@features/flow-<name>`. All packages are `"private": true`.
