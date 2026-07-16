# domain/

Business domain packages — the foundation of the emerging DDD layout. This model is still maturing and is not yet the default home for new code: use it only when the work clearly fits, otherwise add a new `libs/*` package.

## Layers

| Path | Purpose | README |
| --- | --- | --- |
| `entity/` | Canonical data models (Zod schemas), entity Redux slices, selectors | [entity/README.md](entity/README.md) |
| `api/` | RTK Query `createApi` endpoints / `createAsyncThunk` actions for a domain | [api/README.md](api/README.md) |

## Dependency direction

Dependencies flow one way:

```
domain/entity → domain/api → features/platform → features/flow → apps/
```

- `domain/api-<name>` depends on `domain/entity-<name>` (never the reverse).
- `domain/*` may depend on `shared/*`; `shared/*` must not depend on `domain/*`.
- `domain/*` must not depend on `features/*` or `apps/*`.

Package naming: `@domain/entity-<name>`, `@domain/api-<name>`. All packages are `"private": true`.
