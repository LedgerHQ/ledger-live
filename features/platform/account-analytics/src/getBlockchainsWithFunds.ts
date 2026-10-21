type BlockchainAccount = {
  balance?: { gt: (value: number) => boolean };
  currency?: { name?: string };
};

/** Blockchain names (e.g. "Arbitrum") with a positive native balance. Tickers stay in accountsWithFunds. */
export const getBlockchainsWithFunds = (
  accounts: readonly BlockchainAccount[] | undefined,
): string[] => {
  if (!accounts?.length) return [];

  const names = new Set<string>();
  for (const account of accounts) {
    const name = account.currency?.name;
    if (name && account.balance?.gt(0)) names.add(name);
  }
  return [...names];
};
