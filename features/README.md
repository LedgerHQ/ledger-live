# features/

> Part of the [monorepo architecture](../docs/monorepo-architecture.md).

Feature packages shared across desktop and mobile apps. See [docs/new-library.md](../docs/new-library.md) for where to put new code and the full package checklist.

## Layers

| Path | Purpose | README |
| --- | --- | --- |
| `platform/` | Business-aware hooks, selectors, NFR rules, React glue and UI shared by several flows; no screens, no journey | [platform/README.md](platform/README.md) |
| `flow/` | One user journey each: business-aware UI shared across apps (`.web.tsx` / `.native.tsx`) | [flow/README.md](flow/README.md) |

## Dependency direction

`features/flow/*` sits above `features/platform/*`, never the reverse: see the [dependency table](../.agents/skills/structure-flow/references/layers.md#dependency-table). App-specific screen composition stays in `apps/`, not here.

To decide between `platform/` and `flow/`, follow the [structure-flow](../.agents/skills/structure-flow/SKILL.md) decision tree. For package names see the [naming rules](../.agents/skills/structure-flow/references/layers.md#naming); for the full new-package checklist see [docs/new-library.md](../docs/new-library.md).
