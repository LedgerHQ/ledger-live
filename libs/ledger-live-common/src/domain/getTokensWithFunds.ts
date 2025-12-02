import { getParentAccount } from "@ledgerhq/coin-framework/account/helpers";
import { Account } from "@ledgerhq/types-live";

/** Format defaults to "USDT on Ethereum". format: "currencyId" returns the id of each token, e.g. "ethereum/erc20/usde". */
export const getTokensWithFunds = (accounts: Account[], customFormat?: "currencyId"): string[] => {
  if (!accounts?.length) return [];

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
      const { balance, token } = subAccount || {};
      if (!balance?.gt(0) || !token) return;

      const subKey = `${token.ticker}:${networkName}`;
      tokensMap.set(subKey, {
        ticker: token.ticker,
        networkName,
        id: token.id,
      });
    });
  }

  if (customFormat === "currencyId") {
    return Array.from(tokensMap.values(), token => token.id);
  }

  return Array.from(tokensMap.values(), ({ ticker, networkName }) => `${ticker} on ${networkName}`);
};
