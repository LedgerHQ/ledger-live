import { Account } from "@ledgerhq/types-live";
import { getParentAccount } from "@ledgerhq/coin-framework/account/helpers";

export const getTokensWithFunds = (accounts: Account[]): string[] => {
  if (!accounts?.length) return [];

  const tokensMap = new Map<string, { ticker: string; networkName: string }>();

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
    });

    account.subAccounts?.forEach(subAccount => {
      const { balance, token } = subAccount || {};
      if (!balance?.gt(0) || !token) return;

      const subKey = `${token.ticker}:${networkName}`;
      tokensMap.set(subKey, {
        ticker: token.ticker,
        networkName,
      });
    });
  }

  return Array.from(tokensMap.values(), ({ ticker, networkName }) => `${ticker} on ${networkName}`);
};
