---
"@domain/api-currency-token": minor
---

Restore persisted CAL tokens before the sync-hash check so a hung request does not block launch, and keep each currency's stored hash if that check fails.
