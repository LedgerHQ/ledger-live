---
applyTo: "shared/**"
---

# Shared Package Conventions

When reviewing changes under `shared/`, read and enforce the conventions defined in `shared/README.md`.

## Review Checklist

- Packages must **not** use the `@ledgerhq/` scope — these are internal-only packages.
- Every `package.json` under `shared/` must include `"private": true`. Flag any package missing it.
- Shared packages must have **no dependencies** on `domain/` packages.
