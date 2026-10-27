# features/

> Part of the [monorepo architecture](../docs/monorepo-architecture.md).

Feature packages shared across desktop and mobile apps. See [docs/new-library.md](../docs/new-library.md) for where to put new code and the full package checklist.

## Layers

| Path | Purpose | README |
| --- | --- | --- |
| `platform/` | Business-aware hooks, selectors, NFR rules, React glue and UI shared by several flows; no screens, no journey | [platform/README.md](platform/README.md) |
| `flow/` | One user journey each: business-aware UI shared across apps (`.web.tsx` / `.native.tsx`) | [flow/README.md](flow/README.md) |

## Dependency direction

```
apps/ → features/flow → features/platform → domain/ → shared/
```

- `features/flow/*` may depend on `features/platform/*`, `domain/*` and `shared/*`.
- `features/platform/*` may depend on `domain/*` and `shared/*`; it must **not** depend on `features/flow/*`.
- App-specific screen composition stays in `apps/`, not here.

To decide between `platform/` and `flow/`, follow the [structure-flow](../.agents/skills/structure-flow/SKILL.md) decision tree. For naming conventions and the full new-package checklist see [docs/new-library.md](../docs/new-library.md).
