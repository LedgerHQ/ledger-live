---
"@ledgerhq/coin-hedera": minor
"@ledgerhq/live-common": minor
---

Add an optional mirror-node timestamp path for Hedera transaction creation to reduce INVALID_TRANSACTION_START failures caused by local clock drift, with safe fallback to system time behind a feature flag.
