---
name: domain-shared-packages
description: Read domain and shared READMEs before creating or modifying packages under domain/ or shared/.
globs: ["domain/**", "shared/**"]
user-invocable: false
---

# Domain and Shared Package Conventions

## Domain packages (`domain/**`)

Before creating or modifying any package under `domain/`, read the relevant README and follow its conventions:

- **Entity packages** (`domain/entity/`): read `domain/entity/README.md` for schema, slice, selectors, and file layout rules.
- **API packages** (`domain/api/`): read `domain/api/README.md` for RTK Query endpoint conventions and file layout rules.

## Shared packages (`shared/**`)

Before creating or modifying any package under `shared/`, read `shared/README.md` and follow its conventions for naming, structure, dependencies, and barrel exports.
