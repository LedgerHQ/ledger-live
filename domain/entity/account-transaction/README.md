# @domain/entity-account-transaction

> [!CAUTION]
> **Status: UNSTABLE** — New package, API still being designed.

The models of a send from an account, the same on every network. No slice: the flow that sends keeps them.

- `SendRequest`: the asset, recipient, amount in the asset's smallest unit (or `useAllAmount`), fee strategy and memo.
- `PreparedTransaction`: what the source built for it, what a summary shows (`amount`, `fees`, `feeAssetId`, `totalSpent`), `errors` that block signing and `warnings`, and a `payload` only that source reads.
- `SignedTransaction` and `BroadcastedTransaction` (`hash`, and the pending rows the source can tell).
- A `TransactionIssue` keeps the error name, its translation `params`, and the request `field` it is about.

See [the account data layer](../../../docs/account-data-layer.md#sending).
