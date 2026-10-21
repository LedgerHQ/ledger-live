---
"@domain/api-currency-token": minor
---

Restore persisted CAL tokens before the sync-hash check so a hung request does not block launch. The check now evicts a currency's stale tokens before it stores the new hash, so a saved cache never pairs a new hash with old tokens; a failed check keeps both.
