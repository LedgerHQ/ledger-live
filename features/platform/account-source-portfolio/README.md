# @features/platform-account-source-portfolio

Balances from the Portfolio service, as an [account data source](../../../docs/account-data-layer.md). No app ranks it: the Portfolio source devtool injects it at runtime, ranked first (`addAccountDataSource(source, { first: true })`), and removes it.

- `createPortfolioSource({ runtime, ports })`: a batch balance reader. Each batch registers the accounts the service does not know, then reads their balances: one filtered call per account for up to three, else one scan of the portfolio shared by the batches of a refresh. An account it cannot answer (not synced yet, network not tracked, failed group, failed call) is rejected with `AccountDataNotServedError`, so the next ranked source answers it.
- `createPortfolioSourceRuntime()`: keeps the service portfolio in step with the app's accounts, one reconcile at a time. A read only adds registrations; `reconcile` also removes the ones no account needs.
- `portfolioSourceSlice`, mounted at `accountSourcePortfolio`: whether the source is injected, the portfolio as last listed, the outcome of each account's last read, the activity log. Once the service listed accounts, the source only claims the networks it saw.
- `redactPortfolioSourceAction`, `redactPortfolioSourceState`: keep addresses and service account ids out of logs and Redux DevTools exports.
- Registration strategies (`strategyOf`, `registrationOf`): EVM accounts register by address; one registration fans out to every EVM network, ids `<network>:<lowercase address>`. Bitcoin is left out: the portfolio does not say which xpub created an account.

The portfolio is the install's `PortfolioId` from `@domain/entity-client-identity`, exported only in `client.ts`, at the request.
