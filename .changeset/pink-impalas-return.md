---
"@ledgerhq/coin-sui": minor
---

feat(coin-sui): GraphQL transport for the remaining read paths (operations, validators) and the write paths (fee dry-run via `simulateTransaction`, broadcast via `executeTransaction`). Builds on the `suiGraphqlTransport` feature-flag scaffolding landed in the first PR — flipping the flag now routes the full sync + execute pipeline through GraphQL.
