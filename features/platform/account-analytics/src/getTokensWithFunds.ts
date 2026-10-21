type Balance = {
  gt: (value: number) => boolean;
};

type FundsCurrency = {
  ticker: string;
  name?: string;
  id: string;
};

type FundsAccount = {
  type?: string;
  id?: string;
  parentId?: string;
  balance?: Balance;
  currency?: FundsCurrency;
  token?: { ticker: string; id: string };
  subAccounts?: readonly FundsAccount[];
};

const getParentAccount = (account: FundsAccount, accounts: readonly FundsAccount[]) => {
  switch (account.type) {
    case "Account":
      return account;
    case "TokenAccount": {
      const parentAccount = accounts.find(candidate => candidate.id == account.parentId);
      if (!parentAccount) {
        throw new Error("No 'parentAccount' account provided for token account");
      }
      return parentAccount;
    }
    default:
      return undefined;
  }
};

export const getTokensWithFundsMap = (accounts: readonly FundsAccount[]) => {
  const tokensMap = new Map<string, { ticker: string; networkName: string; id: string }>();
  for (const account of accounts) {
    const { balance, currency } = account || {};
    if (!balance?.gt(0) || !currency) continue;

    const parentAccount = getParentAccount(account, accounts);
    const networkName = parentAccount?.currency?.name;
    if (!networkName) continue;

    const mainKey = `${currency.ticker}:${networkName}`;
    tokensMap.set(mainKey, {
      ticker: currency.ticker,
      networkName,
      id: currency.id,
    });

    account.subAccounts?.forEach(subAccount => {
      const { balance: subBalance, token } = subAccount || {};
      if (!subBalance?.gt(0) || !token) return;

      const subKey = `${token.ticker}:${networkName}`;
      tokensMap.set(subKey, {
        ticker: token.ticker,
        networkName,
        id: token.id,
      });
    });
  }
  return tokensMap;
};

/** Format defaults to "USDT on Ethereum". format: "currencyId" returns each currency id. */
export const getTokensWithFunds = (
  accounts: readonly FundsAccount[] | undefined,
  customFormat: "currencyId" | "default" = "default",
) => {
  if (!accounts?.length) return [];

  const tokensMap = getTokensWithFundsMap(accounts);

  if (customFormat === "currencyId") {
    return Array.from(tokensMap.values(), token => token.id);
  }

  return Array.from(tokensMap.values(), ({ ticker, networkName }) => `${ticker} on ${networkName}`);
};
