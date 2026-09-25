---
"@shared/env": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

refactor(push-devices): move PUSH_DEVICES_SERVICE_URL out of @shared/env into the app .env files, where only the production ones set it — every other build leaves it unset, which disables the device id sync instead of pushing to device-gateway.api.ledger.com
