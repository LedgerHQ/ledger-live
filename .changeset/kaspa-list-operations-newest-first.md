---
"@ledgerhq/coin-kaspa": patch
---

listOperations pages newest-first and stops once it is a 2 h late-acceptance window past already-synced history (as the legacy bridge rescans 2 h); supports `limit` (capped at 500) and rejects `order: "asc"`. REST calls retry through the shared `retry` with exponential backoff (1, 2, 4, 8 s): reads on HTTP 429, 5xx and network errors; broadcasts on 429 only — never after a 5xx or a network error, when the transaction may already have been sent.
