# @domain/entity-account-address

> [!CAUTION]
> **Status: UNSTABLE** — New package, API still being designed.

The `address` kind: where an account receives next.

- One `AccountAddress` (`freshAddress`) per account, keyed by `AccountUUID`. A read replaces it.
- A `utxo` account's fresh address rotates as it receives, so only a source that syncs it knows it.
- An `address` descriptor's address is not always the fresh address: some families replace it once the account is onboarded, or receive on another identifier. Sources answer what the account receives on, not the descriptor's address.
- `selectAccountAddress`. Apps mount the slice at `accountAddresses`.

Pending, the last error and the source stay in `accountData`. See [the account data layer](../../../docs/account-data-layer.md).
