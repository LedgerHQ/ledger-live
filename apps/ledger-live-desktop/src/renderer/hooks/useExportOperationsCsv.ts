import { ipcRenderer } from "electron";
import { useState, useCallback, useEffect, useRef } from "react";
import { useSelector } from "LLD/hooks/redux";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { useBridgeSync, useBridgeSyncState } from "@ledgerhq/live-common/bridge/react/index";
import { accountsOpToCSV } from "@ledgerhq/live-common/csvExport";
import type { Account } from "@ledgerhq/types-live";
import logger from "~/renderer/logger";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { walletSelector } from "~/renderer/reducers/wallet";
import { useTechnicalDateFn } from "~/renderer/hooks/useDateFormatter";

async function saveOperationsToFile(
  path: Electron.SaveDialogReturnValue,
  csv: string,
): Promise<boolean> {
  try {
    return await ipcRenderer.invoke("export-operations", path, csv);
  } catch {
    return false;
  }
}

type UseExportOperationsCsvArgs = {
  accounts: Account[];
  checkedIds: string[];
  onSuccess?: () => void;
  onError?: () => void;
};

export function useExportOperationsCsv({
  accounts,
  checkedIds,
  onSuccess,
  onError,
}: UseExportOperationsCsvArgs) {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const countervalueCurrency = useSelector(counterValueCurrencySelector);
  const countervalueState = useCountervaluesState();
  const walletState = useSelector(walletSelector);
  const sync = useBridgeSync();
  const syncState = useBridgeSyncState();
  const getDateTxt = useTechnicalDateFn();

  const hasScheduledSync = useRef(false);
  useEffect(() => {
    if (accounts.length === 0 || hasScheduledSync.current) return;
    hasScheduledSync.current = true;
    sync({
      type: "SYNC_SOME_ACCOUNTS",
      accountIds: accounts.map(a => a.id),
      priority: 10,
      reason: "export-operations",
    });
  }, [accounts, sync]);

  const selectedAccounts = accounts.filter(a => checkedIds.includes(a.id));
  const isLoading =
    selectedAccounts.length > 0 &&
    hasScheduledSync.current &&
    selectedAccounts.some(
      account =>
        syncState[account.id]?.pending ||
        account.subAccounts?.some(subAccount => syncState[subAccount.id]?.pending),
    );

  const exportCsv = useCallback(async () => {
    try {
      const path = await ipcRenderer.invoke("show-save-dialog", {
        title: "Exported account transactions",
        defaultPath: `ledgerwallet-operations-${getDateTxt()}.csv`,
        filters: [{ name: "All Files", extensions: ["csv"] }],
      });
      if (path?.filePath) {
        const csv = accountsOpToCSV(
          accounts.filter(a => checkedIds.includes(a.id)),
          countervalueCurrency,
          countervalueState,
          walletState,
        );
        const ok = await saveOperationsToFile(path, csv);
        if (ok) {
          setSuccess(true);
          onSuccess?.();
        } else {
          setError(true);
          onError?.();
        }
      }
    } catch (err) {
      logger.error(err);
      setError(true);
      onError?.();
    }
  }, [
    accounts,
    checkedIds,
    countervalueCurrency,
    countervalueState,
    getDateTxt,
    onError,
    onSuccess,
    walletState,
  ]);

  const resetState = useCallback(() => {
    setSuccess(false);
    setError(false);
    hasScheduledSync.current = false;
  }, []);

  return { success, error, isLoading, exportCsv, resetState };
}
