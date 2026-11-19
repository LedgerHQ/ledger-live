import { useCallback } from "react";
import { files } from "~/renderer/bridge";
import type { SaveOutcome, SaveRequest } from "~/bridge/contract";
import { useSelector } from "LLD/hooks/redux";
import { useCountervaluesCache } from "@features/platform-market-countervalues";
import { useBridgeSync, useBridgeSyncState } from "@ledgerhq/live-common/bridge/react/index";
import { accountsOpToCSV } from "@ledgerhq/live-common/csvExport";
import type { Account } from "@ledgerhq/types-live";
import logger from "~/renderer/logger";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { walletSelector } from "~/renderer/reducers/wallet";
import { getHistoryExportFileName } from "@features/flow-history-export";

async function saveOperationsToFile(request: SaveRequest, csv: string): Promise<SaveOutcome> {
  try {
    return await files.exportOperations(request, csv);
  } catch {
    return "failed";
  }
}

/** Syncs accounts, then builds their operations CSV and saves it through the native save dialog. */
export function useOperationsCsvExporter() {
  const countervalueCurrency = useSelector(counterValueCurrencySelector);
  const countervalueState = useCountervaluesCache();
  const walletState = useSelector(walletSelector);
  const sync = useBridgeSync();
  const syncState = useBridgeSyncState();

  const syncAccounts = useCallback(
    (accountIds: readonly string[]) => {
      sync({
        type: "SYNC_SOME_ACCOUNTS",
        accountIds: [...accountIds],
        priority: 10,
        reason: "export-operations",
      });
    },
    [sync],
  );

  const isSyncing = useCallback(
    (accounts: readonly Account[]) =>
      accounts.some(
        account =>
          syncState[account.id]?.pending ||
          account.subAccounts?.some(subAccount => syncState[subAccount.id]?.pending),
      ),
    [syncState],
  );

  const exportCsv = useCallback(
    async (accounts: readonly Account[]): Promise<SaveOutcome> => {
      try {
        const csv = accountsOpToCSV(
          [...accounts],
          countervalueCurrency,
          countervalueState,
          walletState.accountNames,
        );
        return await saveOperationsToFile(
          {
            options: {
              title: "Exported account transactions",
              defaultPath: `${getHistoryExportFileName(new Date())}.csv`,
              filters: [{ name: "All Files", extensions: ["csv"] }],
            },
            // The fixture suffixes this with the test id, so parallel runs do not race on
            // the same CSV file.
            e2ePath: process.env.PLAYWRIGHT_EXPORT_CSV_PATH || "./ledgerwallet-operations.csv",
          },
          csv,
        );
      } catch (error) {
        logger.error(error);
        return "failed";
      }
    },
    [countervalueCurrency, countervalueState, walletState.accountNames],
  );

  return { syncAccounts, isSyncing, exportCsv };
}
