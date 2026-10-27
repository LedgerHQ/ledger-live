# @features/platform-account-source-portfolio

The Portfolio service as an [account data source](../../../docs/account-data-layer.md), for balances. POC: no app ranks it. The Portfolio source devtool injects it at runtime, ranked first (`addAccountDataSource(source, { first: true })`), and removes it; it sends the accounts' addresses to the service, so it stays off until turned on.

- `createPortfolioSource({ runtime, ports })` is an `AccountDataSource` with a batch balance reader. Each batch makes sure the service knows its accounts, then reads their balances in as few calls as the service allows: one filtered call per account for a few, pages of 100 accounts for more.
- `createPortfolioSourceRuntime(options)` keeps the service portfolio in step with the app's accounts. One per app: it runs one reconcile at a time, so two batches never register an account twice. A read only adds registrations; `reconcile` also removes the ones no account needs.
- `redactPortfolioSourceAction` and `redactPortfolioSourceState` keep the portfolio id, addresses and service account ids out of logs and Redux DevTools exports.
- `portfolioSourceSlice`, mounted at `accountSourcePortfolio`, holds what the source knows and did: the portfolio id, the portfolio as last listed, the outcome of each account's last read, and the activity log. `enabled` says whether the source is injected. Once the service listed accounts, the source only claims the networks it saw.
- Registration strategies (`strategyOf`, `registrationOf`): EVM accounts register by address; one registration fans out to every EVM network, ids `<network>:<lowercase address>`. Bitcoin is left out: the portfolio does not say which xpub created an account.

An account the service has no balance for yet is rejected with `PortfolioAccountPendingError`; one on a network the registration did not fan out to, with `PortfolioAccountNotServedError`. The router has no pending state nor fall-through yet, so both show as failures.
