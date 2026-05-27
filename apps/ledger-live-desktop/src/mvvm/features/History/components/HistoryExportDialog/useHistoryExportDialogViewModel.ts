import { useState, useCallback, useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import type { Account } from "@ledgerhq/types-live";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { useBatchMaybeAccountName } from "~/renderer/reducers/wallet";
import { useExportOperationsCsv } from "~/renderer/hooks/useExportOperationsCsv";
import { track } from "~/renderer/analytics/segment";
import {
  HISTORY_EXPORT_DIALOG_SUCCESS_TRACKING_PAGE_NAME,
  HISTORY_EXPORT_DIALOG_TRACKING_BUTTON,
  HISTORY_EXPORT_DIALOG_TRACKING_PAGE_NAME,
} from "./constants";

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
  onDoneClick: () => void;
  resetState: () => void;
};

type UseHistoryExportDialogViewModelArgs = {
  setDialogHeight?: (h: "fixed" | "fit") => void;
};

export function useHistoryExportDialogViewModel({
  setDialogHeight,
}: UseHistoryExportDialogViewModelArgs = {}): HistoryExportDialogViewModel {
  const rawAccounts = useSelector(accountsSelector);
  const names = useBatchMaybeAccountName(rawAccounts);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  const handleResult = useCallback(() => setDialogHeight?.("fit"), [setDialogHeight]);

  const {
    success,
    error,
    isLoading,
    exportCsv,
    resetState: resetExportState,
  } = useExportOperationsCsv({
    accounts: rawAccounts,
    checkedIds,
    onSuccess: handleResult,
    onError: handleResult,
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

  const handleExportCsv = useCallback(async () => {
    track("button_clicked", {
      button: HISTORY_EXPORT_DIALOG_TRACKING_BUTTON.export,
      page: HISTORY_EXPORT_DIALOG_TRACKING_PAGE_NAME,
    });
    await exportCsv();
  }, [exportCsv]);

  const onDoneClick = useCallback(() => {
    track("button_clicked", {
      button: HISTORY_EXPORT_DIALOG_TRACKING_BUTTON.done,
      page: HISTORY_EXPORT_DIALOG_SUCCESS_TRACKING_PAGE_NAME,
    });
  }, []);

  const resetState = useCallback(() => {
    resetExportState();
    setCheckedIds([]);
    setDialogHeight?.("fixed");
  }, [resetExportState, setDialogHeight]);

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
    exportCsv: handleExportCsv,
    onDoneClick,
    resetState,
  };
}
