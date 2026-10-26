# @features/platform-account-portfolio

> [!CAUTION]
> **Status: UNSTABLE** — Backs a development-only comparison with the Portfolio service; API may change.

`usePortfolioAccounts({ portfolioId, walletAccounts, currency })` keeps a Portfolio service portfolio registering exactly the wallet's accounts, and reads their balances in `currency` while mounted:

```ts
const { status, accounts, total, error } = usePortfolioAccounts({
  portfolioId,
  walletAccounts,
  currency: "EUR",
});
```

- Registrations are synced through `syncPortfolio`: the portfolio is created if missing, and a registration no wallet account backs anymore is removed.
- Balances are read in full through `getBalanceSnapshot`. While the currency changes, `accounts` is empty and `total` is null: values of one currency are never shown as another.
- The hook polls while the service indexes the accounts, and stops once they are settled.
- A service account carries the `accountUUID` of a wallet account only when its registration or one of its addresses proves it. Nothing is inferred from balances.

Pass the wallet accounts as a memoized array: the hook syncs again when their registrations change.
