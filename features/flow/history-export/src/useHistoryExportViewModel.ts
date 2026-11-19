import { useState, useCallback, useRef } from "react";
import type { AccountId } from "@domain/entity-account";
import { track, trackPage } from "@shared/analytics";
import type { HistoryExportAccount, HistoryExportOutcome, HistoryExportPort } from "./model/ports";
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
  /** An export is running: the accounts are read again, then the CSV is built and saved. */
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
  const { accounts, exportCsv: exportAccountsCsv } = port;
  const [checkedIds, setCheckedIds] = useState<AccountId[]>([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // State lags a render behind: a second press before it lands must not start another export.
  const isExportingRef = useRef(false);

  const handleResult = useCallback(() => setDialogHeight?.("fit"), [setDialogHeight]);

  const allSelected = accounts.length > 0 && checkedIds.length === accounts.length;
  const disabled = checkedIds.length === 0;

  const toggleAccount = useCallback((id: AccountId) => {
    setCheckedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  }, []);

  const onSelectAllToggle = useCallback(() => {
    setCheckedIds(prev => (prev.length === accounts.length ? [] : accounts.map(a => a.id)));
  }, [accounts]);

  const handleExportCsv = useCallback(async () => {
    if (isExportingRef.current) return;
    isExportingRef.current = true;
    setIsLoading(true);
    track("button_clicked", {
      button: HISTORY_EXPORT_DIALOG_TRACKING_BUTTON.export,
      page: HISTORY_EXPORT_DIALOG_TRACKING_PAGE_NAME,
    });
    let outcome: HistoryExportOutcome;
    try {
      outcome = await exportAccountsCsv(checkedIds);
    } catch {
      outcome = "failed";
    } finally {
      isExportingRef.current = false;
      setIsLoading(false);
    }
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
