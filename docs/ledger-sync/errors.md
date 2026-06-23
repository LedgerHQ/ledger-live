# User-facing errors

Errors a user can actually **see** during Ledger Sync, and where.

> [!NOTE]
> Conventions for this list:
> - Document only errors users can see — not unexpected/fixable ones (those get a Jira bug).
> - One error documented once, listing every place it can surface.
>
> This list is intentionally incomplete and grows as we refine error handling.

## TrustchainNotAllowed

The JWT carries no permission for the trustchain at the current `applicationPath`. The SDK
surfaces it instead of silently recovering (contrast with `TrustchainOutdated` /
`TrustchainEjected`, which the [watch loop recovers from automatically](./02-trustchain-sdk.md#errors--automatic-recovery)).

**Where it can be seen:**

- During a **"remove member"**, when trying to remove an instance with the **wrong device**
  (wrong seed). Verified by the deterministic scenario
  [`removeMemberWithTheWrongSeed`](./test-strategy.md#deterministic-scenario-tests-lkrp).
