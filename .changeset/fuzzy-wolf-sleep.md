---
"@support/jest-shared": patch
"@shared/api-services": patch
"@shared/auth": patch
"@shared/cloud-sync-module": patch
"@shared/cloud-sync": patch
"@shared/env": patch
"@shared/feature-flags": patch
"@shared/password-verifier": patch
"@shared/schema-primitives": patch
"@shared/ui-qr-code": patch
"@shared/ui-queued-bottom-sheet": patch
---

Introduce `@support/jest-shared` with `createSharedJestConfig` and `createSharedUiJestConfig` factories; wire all `shared/*` jest configs to use them.
