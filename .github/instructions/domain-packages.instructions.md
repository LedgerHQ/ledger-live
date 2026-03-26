---
applyTo: "domain/**"
---

# Domain Package Conventions

When reviewing changes under `domain/`, read and enforce the conventions defined in:

- **Entity packages**: `domain/entity/README.md`
- **API packages**: `domain/api/README.md`

## Review Checklist

- No other top-level subdirectories are allowed under `domain/` besides `entity/` and `api/`.
- Packages must **not** use the `@ledgerhq/` scope — these are internal-only packages.
- Every `package.json` under `domain/` must include `"private": true`. Flag any package missing it.
