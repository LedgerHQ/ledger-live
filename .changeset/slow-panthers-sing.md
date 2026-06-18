---
"@ledgerhq/coin-stellar": minor
---

fetchOperations no longer loops internally on empty pages. Returns empty results + cursor, lets caller paginate.
