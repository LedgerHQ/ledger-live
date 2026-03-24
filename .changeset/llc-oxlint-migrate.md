---
"@ledgerhq/live-common": minor
---

Replace ESLint with oxlint for `@ledgerhq/live-common` lint scripts; optional oxfmt via `format` / `format:check`. Hoist shared ESLint plugins (`eslint-plugin-import`, `eslint-plugin-jsx-a11y`, `eslint-plugin-react`, `eslint-plugin-react-hooks`) to the repo root so other workspace packages that still use ESLint keep resolving them after they are removed from live-common.
