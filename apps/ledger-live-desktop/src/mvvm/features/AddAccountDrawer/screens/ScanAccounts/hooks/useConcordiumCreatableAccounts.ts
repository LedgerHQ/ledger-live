import { isConcordiumAccount } from "@ledgerhq/coin-concordium/bridge/serialization";
import { Account } from "@ledgerhq/types-live";
import { useMemo } from "react";

export interface UseConcordiumCreatableAccountsProps {
  scannedAccounts: Account[];
  selectedIds: string[];
}

export interface UseConcordiumCreatableAccountsReturn {
  hasConcordiumCreatableAccounts: boolean;
  concordiumCreatableAccounts: Account[];
  selectedConcordiumCreatableAccounts: Account[];
}

/**
 * Hook to check if there are any Concordium creatable accounts among the scanned accounts
 * and filter them based on selected IDs.
 *
 * @param scannedAccounts - Array of all scanned accounts
 * @param selectedIds - Array of selected account IDs
 * @returns Object containing Concordium creatable accounts information
 */
export function useConcordiumCreatableAccounts({
  scannedAccounts,
  selectedIds,
}: UseConcordiumCreatableAccountsProps): UseConcordiumCreatableAccountsReturn {
  const concordiumCreatableAccounts = useMemo(() => {
    return scannedAccounts.filter(
      account =>
        account.currency?.family === "concordium" &&
        isConcordiumAccount(account) &&
        !account.concordiumResources.isOnboarded,
    );
  }, [scannedAccounts]);

  const selectedConcordiumCreatableAccounts = useMemo(() => {
    return concordiumCreatableAccounts.filter(account => selectedIds.includes(account.id));
  }, [concordiumCreatableAccounts, selectedIds]);

  const hasConcordiumCreatableAccounts = useMemo(() => {
    return selectedConcordiumCreatableAccounts.length > 0;
  }, [selectedConcordiumCreatableAccounts]);

  return {
    hasConcordiumCreatableAccounts,
    concordiumCreatableAccounts,
    selectedConcordiumCreatableAccounts,
  };
}
