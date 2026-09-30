type Balance = Readonly<{
  gt(value: number): boolean;
}>;

type AccountWithFunds = Readonly<{
  balance?: Balance;
  currency?: Readonly<{ ticker?: string }>;
  subAccounts?: readonly Readonly<{
    balance?: Balance;
    token?: Readonly<{ ticker?: string }>;
  }>[];
}>;

export function getTickersWithFunds(accounts: readonly AccountWithFunds[]): string[] {
  const tickers = new Set<string>();

  for (const account of accounts) {
    if (account.balance?.gt(0) && account.currency?.ticker) {
      tickers.add(account.currency.ticker);
    }

    for (const subAccount of account.subAccounts ?? []) {
      if (subAccount.balance?.gt(0) && subAccount.token?.ticker) {
        tickers.add(subAccount.token.ticker);
      }
    }
  }

  return [...tickers];
}
