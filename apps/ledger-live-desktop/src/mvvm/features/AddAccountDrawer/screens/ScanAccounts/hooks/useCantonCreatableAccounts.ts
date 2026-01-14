import { isCantonAccount } from "@ledgerhq/coin-canton/bridge/serialization";
import { Account } from "@ledgerhq/types-live";
import { useMemo } from "react";

export interface UseCantonCreatableAccountsProps {
  scannedAccounts: Account[];
  selectedIds: string[];
}

export interface UseCantonCreatableAccountsReturn {
  hasCantonCreatableAccounts: boolean;
  cantonCreatableAccounts: Account[];
  selectedCantonCreatableAccounts: Account[];
}

/**
 * Hook to check if there are any Canton creatable accounts among the scanned accounts
 * and filter them based on selected IDs.
 *
 * @param scannedAccounts - Array of all scanned accounts
 * @param selectedIds - Array of selected account IDs
 * @returns Object containing Canton creatable accounts information
 */
export function useCantonCreatableAccounts({
  scannedAccounts,
  selectedIds,
}: UseCantonCreatableAccountsProps): UseCantonCreatableAccountsReturn {
  const cantonCreatableAccounts = useMemo(() => {
    return scannedAccounts.filter(
      account =>
        account.currency?.family === "canton" &&
        isCantonAccount(account) &&
        !account.cantonResources.isOnboarded,
    );
  }, [scannedAccounts]);

  const selectedCantonCreatableAccounts = useMemo(() => {
    return cantonCreatableAccounts.filter(account => selectedIds.includes(account.id));
  }, [cantonCreatableAccounts, selectedIds]);

  const hasCantonCreatableAccounts = useMemo(() => {
    return selectedCantonCreatableAccounts.length > 0;
  }, [selectedCantonCreatableAccounts]);

  return {
    hasCantonCreatableAccounts,
    cantonCreatableAccounts,
    selectedCantonCreatableAccounts,
  };
}
