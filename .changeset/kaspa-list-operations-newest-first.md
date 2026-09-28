---
"@ledgerhq/coin-kaspa": patch
---

listOperations pages newest-first and stops once it is a 2 h late-acceptance window past already-synced history (as the legacy bridge rescans 2 h); supports `limit` (capped at 500) and rejects `order: "asc"`. Indexer reads retry HTTP 429 with exponential backoff, honouring Retry-After.
