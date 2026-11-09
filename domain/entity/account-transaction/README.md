# @domain/entity-account-transaction

> [!CAUTION]
> **Status: UNSTABLE** — New package, API still being designed.

The models of a send from an account, the same on every network. No slice: the flow that sends keeps them.

- `SendRequest`: the asset, recipient (and the domain it came from), amount in the asset's smallest unit (or `useAllAmount`), fee preset or custom fees, fee asset, typed memo, and `familyOptions` for what the request does not model yet.
- `PreparedTransaction`: what the source built for it, what a summary shows (`amount`, `fees`, `feeAssetId`, `totalSpent`), `errors` that block signing and `warnings`, and a `payload` only that source reads.
- `FeeEstimate`: a preset's cost for the same request.
- `SignedTransaction` and `BroadcastedTransaction` (`hash`, and the pending rows the source can tell).
- A `TransactionIssue` keeps the error name, its translation `params`, and the request `field` it is about.

See [the account data layer](../../../docs/account-models/data-layer.md#sending).
