---
"@ledgerhq/wallet-cli": minor
---

wallet-cli: `account discover` no longer exposes the raw V1 descriptor. Human output shows the session label in bold as the primary identifier; JSON output replaces the descriptor strings with `{ label, freshAddress }` objects.
