import { getTokensWithFundsMap } from "./getTokensWithFunds";
import { Account } from "@ledgerhq/types-live";

export function getTotalStakeableAssets(
  accounts: Account[] | null | undefined,
  stakingCurrenciesEnabled: string[] | string | undefined,
  partnerStakingCurrenciesEnabled: string[] | string | undefined,
): {
  combinedIds: Set<string>;
  stakeableAssets: { ticker: string; networkName: string; id: string }[];
} {
  if (!accounts) return { combinedIds: new Set<string>(), stakeableAssets: [] };

  const accountsWithFundsCurrencies = accounts
    .filter(account => account?.balance.isGreaterThan(0))
    .map(account => account?.currency);

  //   const accountsWithFundsCurrenciesIds = new Set(
  //     accountsWithFundsCurrencies.map(currency => currency.id),
  //   );
  const allStakingCurrenciesEnabled = new Set([
    ...(Array.isArray(stakingCurrenciesEnabled) ? stakingCurrenciesEnabled : []),
    ...(Array.isArray(partnerStakingCurrenciesEnabled) ? partnerStakingCurrenciesEnabled : []),
  ]);

  const tokenWithFundsMap = getTokensWithFundsMap(accounts);
  //   const tokenWithFunds = Array.from(tokenWithFundsMap.values()).map(token => token.id);
  const filteredAccountCurrencyIds = [...accountsWithFundsCurrencies].filter(currency =>
    allStakingCurrenciesEnabled.has(currency.id),
  );
  const filteredTokenWithFunds = [...tokenWithFundsMap.values()].filter(token =>
    allStakingCurrenciesEnabled.has(token.id),
  );

  const combined = new Map<string, { ticker: string; networkName: string; id: string }>();
  for (const currency of filteredAccountCurrencyIds) {
    combined.set(currency.id, {
      ticker: currency.ticker,
      networkName: currency.name,
      id: currency.id,
    });
  }
  for (const token of filteredTokenWithFunds) {
    combined.set(token.id, token);
  }

  return {
    combinedIds: new Set(Array.from(combined.values(), details => details.id)),
    stakeableAssets: Array.from(combined.values()),
  };
}
