---
"@domain/api-aggregated-assets": minor
---

Stop the DADA category pagination walk when the server repeats a cursor, so a proxy echoing `x-ledger-next` can no longer leave the Stocks or Stablecoins query loading forever
