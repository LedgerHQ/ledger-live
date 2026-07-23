---
"@ledgerhq/coin-aleo": minor
---

Refactor Aleo network apiClient and sdkClient to receive coin config directly instead of resolving it via currency lookup, removing redundant currency plumbing throughout the sync/signing paths
