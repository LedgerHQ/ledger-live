---
"@shared/api-services": minor
---

Bound every CAL request with a 10s timeout and retry only network errors and 5xx, so a hung CAL no longer blocks app start or token account sync
