import { useCallback } from "react";
import { files } from "~/renderer/bridge";
import type { SaveOutcome, SaveRequest } from "~/bridge/contract";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import {
  exportAccountsOperationsCsv,
  type OperationsCsvAccountRequest,
} from "@features/platform-account-operations-csv";
import { useCountervaluesCache } from "@features/platform-market-countervalues";
import { getHistoryExportFileName } from "@features/flow-history-export";
import { findAssetCurrency } from "~/config/account-data-setup";
import logger from "~/renderer/logger";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";

async function saveOperationsToFile(request: SaveRequest, csv: string): Promise<SaveOutcome> {
  try {
    return await files.exportOperations(request, csv);
  } catch {
    return "failed";
  }
}

/** Reads the operations of accounts again, builds their CSV and saves it through the native save dialog. */
export function useOperationsCsvExporter() {
  const countervalueCurrency = useSelector(counterValueCurrencySelector);
  const countervalues = useCountervaluesCache();
  const dispatch = useDispatch();

  const exportCsv = useCallback(
    async (accounts: readonly OperationsCsvAccountRequest[]): Promise<SaveOutcome> => {
      try {
        const csv = await dispatch(
          exportAccountsOperationsCsv(accounts, {
            countervalueCurrency,
            countervalues,
            findCurrency: findAssetCurrency,
          }),
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
    [countervalueCurrency, countervalues, dispatch],
  );

  return { exportCsv };
}
