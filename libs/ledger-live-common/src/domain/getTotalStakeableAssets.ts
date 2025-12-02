import { getTokensWithFunds } from "./getTokensWithFunds";
import { Account } from "@ledgerhq/types-live";

export function getTotalStakeableAssets(
  accounts: Account[] | null | undefined,
  stakingCurrenciesEnabled: string[] | string | undefined,
  partnerStakingCurrenciesEnabled: string[] | string | undefined,
): Set<string> {
  if (!accounts) return new Set();

  const accountsWithFundsCurrencies = accounts
    .filter(account => account?.balance.isGreaterThan(0))
    .map(account => account?.currency);

  const accountsWithFundsCurrenciesIds = new Set(
    accountsWithFundsCurrencies.map(currency => currency.id),
  );
  const tokenWithFundsIds = new Set(getTokensWithFunds(accounts, "currencyId"));
  const allStakingCurrenciesEnabled = new Set([
    ...(Array.isArray(stakingCurrenciesEnabled) ? stakingCurrenciesEnabled : []),
    ...(Array.isArray(partnerStakingCurrenciesEnabled) ? partnerStakingCurrenciesEnabled : []),
  ]);

  const filteredAccountCurrencyIds = [...accountsWithFundsCurrenciesIds].filter(id =>
    allStakingCurrenciesEnabled.has(id),
  );
  const filteredTokenIds = [...tokenWithFundsIds].filter(id => allStakingCurrenciesEnabled.has(id));
  const combinedIds = new Set([...filteredAccountCurrencyIds, ...filteredTokenIds]);

  return combinedIds;
}
