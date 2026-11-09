# @domain/entity-account-existence

> [!WARNING]
> **Status: UNSTABLE** — first implementation, its API may change.

The `existence` kind: whether an account has any history on chain (`{ used: boolean }`). Discovery asks it for every derived account through the account data router, so a source answers it like any other kind: with a single reader, or a batch reader when its API checks many accounts in one call.

- There is no slice: discovery reads the router directly, and nothing needs the answer once the scan is over.
- The full sync source answers it for any account a bridge can sync from its descriptor, held or not: the slow path, until a coin module answers it cheaply.

See [the account data layer](../../../docs/account-models/data-layer.md) and [account discovery](../../../features/platform/account-discovery/README.md).
