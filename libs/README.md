# libs/

> [!WARNING]
> **Legacy.** New code goes in the [DDD layers](../docs/ddd-monorepo-architecture.md). `libs/` is maintained, not grown.

| Path | Status | What to do |
| --- | --- | --- |
| [`ui/`](./ui) | Frozen, to be dropped | Use Lumen (`@ledgerhq/lumen-ui-react`, `@ledgerhq/lumen-ui-rnative`, `@ledgerhq/lumen-design-core`). |
| [`ledgerjs/`](./ledgerjs) | Frozen, moving to [ts-libs](https://github.com/LedgerHQ/ts-libs) | Never add a package. New device interaction uses the DMK. |
| [`ledger-live-common/`](./ledger-live-common) | Deprecated | No new features. Glue is still possible, but prefer `features/platform/`. |
| everything else | To migrate | Maintain; move code out when you touch it. |

Some published packages will also move to [ts-libs](https://github.com/LedgerHQ/ts-libs) rather than to the DDD layers — see [LIVE-37105](https://ledgerhq.atlassian.net/browse/LIVE-37105).

## Still adding something here?

Only for a new [coin module](./coin-modules) or its coin-tester, a package published to npm, or a
proportionate fix in an existing package. Code extracted from `ledger-live-common` goes to the DDD
layers, not to a new `libs/*` package. Anything else needs an argument in the PR description.

See [docs/new-library.md](../docs/new-library.md) for the checklist.
