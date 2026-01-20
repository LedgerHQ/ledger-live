import { isConcordiumAccount } from "@ledgerhq/coin-concordium/bridge/serialization";
import { Account } from "@ledgerhq/types-live";
import { useMemo } from "react";

export interface UseConcordiumCreatableAccountsProps {
  scannedAccounts: Account[];
  selectedIds: string[];
}

export interface UseConcordiumCreatableAccountsReturn {
  hasConcordiumCreatableAccounts: boolean;
  selectedConcordiumAccounts: Account[];
}

/**
 * Hook to check if there are any Concordium creatable accounts among the scanned accounts
 * and return all selected Concordium accounts (both creatable and importable).
 *
 * @param scannedAccounts - Array of all scanned accounts
 * @param selectedIds - Array of selected account IDs
 * @returns Object containing whether there are creatable accounts and all selected Concordium accounts
 */
export function useConcordiumCreatableAccounts({
  scannedAccounts,
  selectedIds,
}: UseConcordiumCreatableAccountsProps): UseConcordiumCreatableAccountsReturn {
  return useMemo(() => {
    const selectedIdsSet = new Set(selectedIds);
    const selectedConcordiumAccounts: Account[] = [];
    let hasCreatableAccounts = false;

    for (const account of scannedAccounts) {
      if (!isConcordiumAccount(account)) continue;

      if (!selectedIdsSet.has(account.id)) continue;

      selectedConcordiumAccounts.push(account);

      if (account.concordiumResources.isOnboarded) continue;

      hasCreatableAccounts = true;
    }

    return {
      hasConcordiumCreatableAccounts: hasCreatableAccounts,
      selectedConcordiumAccounts,
    };
  }, [scannedAccounts, selectedIds]);
}
