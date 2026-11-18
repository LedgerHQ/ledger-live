import { useState, useCallback, useEffect, useRef } from "react";
import type { AccountId } from "@domain/entity-account";
import { track, trackPage } from "@shared/analytics";
import type { HistoryExportAccount, HistoryExportPort } from "./model/ports";
import {
  HISTORY_EXPORT_DIALOG_SUCCESS_TRACKING_PAGE,
  HISTORY_EXPORT_DIALOG_SUCCESS_TRACKING_PAGE_NAME,
  HISTORY_EXPORT_DIALOG_TRACKING_BUTTON,
  HISTORY_EXPORT_DIALOG_TRACKING_PAGE_NAME,
} from "./constants";

export type HistoryExportViewModel = {
  accounts: readonly HistoryExportAccount[];
  checkedIds: AccountId[];
  allSelected: boolean;
  disabled: boolean;
  success: boolean;
  error: boolean;
  isLoading: boolean;
  toggleAccount: (id: AccountId) => void;
  onSelectAllToggle: () => void;
  exportCsv: () => Promise<void>;
  onDoneClick: () => void;
  resetState: () => void;
};

type UseHistoryExportViewModelArgs = {
  port: HistoryExportPort;
  setDialogHeight?: (h: "fixed" | "fit") => void;
};

export function useHistoryExportViewModel({
  port,
  setDialogHeight,
}: UseHistoryExportViewModelArgs): HistoryExportViewModel {
  const { accounts, syncAccounts, isSyncing, exportCsv: exportAccountsCsv } = port;
  const [checkedIds, setCheckedIds] = useState<AccountId[]>([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  const handleResult = useCallback(() => setDialogHeight?.("fit"), [setDialogHeight]);

  const hasScheduledSync = useRef(false);
  useEffect(() => {
    if (accounts.length === 0 || hasScheduledSync.current) return;
    hasScheduledSync.current = true;
    syncAccounts(accounts.map(a => a.id));
  }, [accounts, syncAccounts]);

  const allSelected = accounts.length > 0 && checkedIds.length === accounts.length;
  const disabled = checkedIds.length === 0;
  const isLoading = checkedIds.length > 0 && isSyncing(checkedIds);

  const toggleAccount = useCallback((id: AccountId) => {
    setCheckedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  }, []);

  const onSelectAllToggle = useCallback(() => {
    setCheckedIds(prev => (prev.length === accounts.length ? [] : accounts.map(a => a.id)));
  }, [accounts]);

  const handleExportCsv = useCallback(async () => {
    track("button_clicked", {
      button: HISTORY_EXPORT_DIALOG_TRACKING_BUTTON.export,
      page: HISTORY_EXPORT_DIALOG_TRACKING_PAGE_NAME,
    });
    try {
      const outcome = await exportAccountsCsv(checkedIds);
      if (outcome === "canceled") return;
      if (outcome === "saved") {
        trackPage(
          {
            category: HISTORY_EXPORT_DIALOG_TRACKING_PAGE_NAME,
            name: HISTORY_EXPORT_DIALOG_SUCCESS_TRACKING_PAGE.name,
          },
          { updateRoutes: true },
        );
        setSuccess(true);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    }
    handleResult();
  }, [checkedIds, exportAccountsCsv, handleResult]);

  const onDoneClick = useCallback(() => {
    track("button_clicked", {
      button: HISTORY_EXPORT_DIALOG_TRACKING_BUTTON.done,
      page: HISTORY_EXPORT_DIALOG_SUCCESS_TRACKING_PAGE_NAME,
    });
  }, []);

  const resetState = useCallback(() => {
    setSuccess(false);
    setError(false);
    setCheckedIds([]);
    setDialogHeight?.("fixed");
  }, [setDialogHeight]);

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
