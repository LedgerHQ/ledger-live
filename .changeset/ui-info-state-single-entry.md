---
"@shared/ui-info-state": minor
"@features/flow-account-detail-settings": minor
---

Reach `@shared/ui-info-state` through its universal entry only: the `./native` and `./web` subpaths, which repeated it, are gone, and their importers use `@shared/ui-info-state`. `@features/flow-account-detail-settings` renames its web entry to `src/index.web.ts`, so its native typecheck no longer compiles the web components.
