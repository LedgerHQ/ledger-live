type AccountWithTicker = {
  balance: { isGreaterThan: (value: number) => boolean };
  currency?: { ticker?: string };
};

/** Native tickers with a positive balance. L2s that use ETH stay "ETH". */
export const getAccountsWithFunds = (
  accounts: readonly (AccountWithTicker | undefined)[] | undefined,
) => {
  if (!accounts) return [];

  const tickers = new Set<string | undefined>();
  for (const account of accounts) {
    if (!account?.balance.isGreaterThan(0)) continue;
    tickers.add(account.currency?.ticker);
  }
  return [...tickers];
};
