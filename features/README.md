# features/

> Part of the [DDD monorepo architecture](../docs/ddd-monorepo-architecture.md).

Feature packages shared across desktop and mobile apps — part of the emerging DDD layout. See [docs/new-library.md](../docs/new-library.md) for where to put new code and the full package checklist.

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

For naming conventions and the full new-package checklist see [docs/new-library.md](../docs/new-library.md).
