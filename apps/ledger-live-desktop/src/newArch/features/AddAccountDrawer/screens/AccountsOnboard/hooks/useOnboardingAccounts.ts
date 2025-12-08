import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import { useMemo } from "react";
import { hasCreatableAccounts, hasOnboarding } from "../registry";

export interface UseOnboardingAccountsProps {
  currency: CryptoCurrency;
  scannedAccounts: Account[];
  selectedIds: string[];
}

export interface UseOnboardingAccountsReturn {
  hasOnboardingCreatableAccounts: boolean;
  selectedOnboardingAccounts: Account[];
}

function filterSelectedAccounts(
  accounts: Account[],
  selectedIds: string[],
  currencyFamily: string,
): Account[] {
  const selectedIdsSet = new Set(selectedIds);
  return accounts.filter(
    account => selectedIdsSet.has(account.id) && account.currency?.family === currencyFamily,
  );
}

export function useOnboardingAccounts({
  currency,
  scannedAccounts,
  selectedIds,
}: UseOnboardingAccountsProps): UseOnboardingAccountsReturn {
  return useMemo(() => {
    if (!hasOnboarding(currency)) {
      return { selectedOnboardingAccounts: [], hasOnboardingCreatableAccounts: false };
    }

    const accounts = filterSelectedAccounts(scannedAccounts, selectedIds, currency.family);

    return {
      selectedOnboardingAccounts: accounts,
      hasOnboardingCreatableAccounts: hasCreatableAccounts(accounts),
    };
  }, [currency, scannedAccounts, selectedIds]);
}
