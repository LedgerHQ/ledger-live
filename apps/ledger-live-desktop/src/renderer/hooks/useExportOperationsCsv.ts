import { files } from "~/renderer/bridge";
import type { SaveOutcome, SaveRequest } from "~/bridge/contract";
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

async function saveOperationsToFile(request: SaveRequest, csv: string): Promise<SaveOutcome> {
  try {
    return await files.exportOperations(request, csv);
  } catch {
    return "failed";
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
      const csv = accountsOpToCSV(
        accounts.filter(a => checkedIds.includes(a.id)),
        countervalueCurrency,
        countervalueState,
        walletState.accountNames,
      );
      const outcome = await saveOperationsToFile(
        {
          options: {
            title: "Exported account transactions",
            defaultPath: `ledgerwallet-operations-${getDateTxt()}.csv`,
            filters: [{ name: "All Files", extensions: ["csv"] }],
          },
          // The fixture suffixes this with the test id, so parallel runs do not race on
          // the same CSV file.
          e2ePath: process.env.PLAYWRIGHT_EXPORT_CSV_PATH || "./ledgerwallet-operations.csv",
        },
        csv,
      );
      if (outcome === "canceled") return;
      if (outcome === "saved") {
        setSuccess(true);
        onSuccess?.();
      } else {
        setError(true);
        onError?.();
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
    walletState.accountNames,
  ]);

  const resetState = useCallback(() => {
    setSuccess(false);
    setError(false);
    hasScheduledSync.current = false;
  }, []);

  return { success, error, isLoading, exportCsv, resetState };
}
