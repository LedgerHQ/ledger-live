# @domain/entity-account-existence

> [!CAUTION]
> **Status: EXPLORATION** — API still being designed.

The `existence` kind: whether an account has any history on chain (`{ used: boolean }`). Discovery asks it for every derived account through the account data router, so a source answers it like any other kind: with a single reader, or a batch reader when its API checks many accounts in one call.

- There is no slice: discovery reads the router directly, and nothing needs the answer once the scan is over.
- A source that only knows the accounts the app holds (the full sync source) does not declare a reader for it.

See [the account data layer](../../../docs/account-data-layer.md) and [account discovery](../../../features/platform/account-discovery/README.md).
