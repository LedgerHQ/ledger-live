import { useState, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import type { Account } from "@ledgerhq/types-live";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { useBatchMaybeAccountName } from "~/renderer/reducers/wallet";
import { useExportOperationsCsv } from "~/renderer/hooks/useExportOperationsCsv";

export type ExportAccount = {
  id: string;
  name: string;
  balance: Account["balance"];
  currency: Account["currency"];
};

export type HistoryExportDialogViewModel = {
  accounts: ExportAccount[];
  checkedIds: string[];
  allSelected: boolean;
  disabled: boolean;
  success: boolean;
  error: boolean;
  isLoading: boolean;
  toggleAccount: (id: string) => void;
  onSelectAllToggle: () => void;
  exportCsv: () => Promise<void>;
  resetState: () => void;
};

type UseHistoryExportDialogViewModelArgs = {
  onResult?: () => void;
};

export function useHistoryExportDialogViewModel({
  onResult,
}: UseHistoryExportDialogViewModelArgs = {}): HistoryExportDialogViewModel {
  const rawAccounts = useSelector(accountsSelector);
  const names = useBatchMaybeAccountName(rawAccounts);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  const {
    success,
    error,
    isLoading,
    exportCsv,
    resetState: resetExportState,
  } = useExportOperationsCsv({
    accounts: rawAccounts,
    checkedIds,
    onSuccess: onResult,
    onError: onResult,
  });

  const accounts: ExportAccount[] = useMemo(
    () =>
      rawAccounts.map((a, i) => ({
        id: a.id,
        name: names[i] ?? a.id,
        balance: a.balance,
        currency: a.currency,
      })),
    [rawAccounts, names],
  );

  const allSelected = accounts.length > 0 && checkedIds.length === accounts.length;
  const disabled = checkedIds.length === 0;

  const toggleAccount = useCallback((id: string) => {
    setCheckedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  }, []);

  const onSelectAllToggle = useCallback(() => {
    setCheckedIds(prev => (prev.length === rawAccounts.length ? [] : rawAccounts.map(a => a.id)));
  }, [rawAccounts]);

  const resetState = useCallback(() => {
    resetExportState();
    setCheckedIds([]);
  }, [resetExportState]);

  return {
    accounts,
    checkedIds,
    allSelected,
    disabled,
    success,
    error,
    isLoading,
    toggleAccount,
    onSelectAllToggle,
    exportCsv,
    resetState,
  };
}
