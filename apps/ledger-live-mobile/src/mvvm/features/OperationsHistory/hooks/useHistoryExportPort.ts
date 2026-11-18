import { useCallback, useMemo } from "react";
import Share from "react-native-share";
import type { Account } from "@ledgerhq/types-live";
import type {
  HistoryExportAccount,
  HistoryExportOutcome,
  HistoryExportPort,
} from "@features/flow-history-export";
import { useCountervaluesCache } from "@features/platform-market-countervalues";
import { useBridgeSync, useBridgeSyncState } from "@ledgerhq/live-common/bridge/react/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { accountsOpToCSV } from "@ledgerhq/live-common/csvExport";
import { getEnv } from "@shared/env";
import { useSelector } from "~/context/hooks";
import { useLocale, useTranslation } from "~/context/Locale";
import { sendFile } from "~/e2e/bridge/client";
import logger from "~/logger";
import { accountsSelector } from "~/reducers/accounts";
import { counterValueCurrencySelector, discreetModeSelector } from "~/reducers/settings";
import { useBatchMaybeAccountName, walletSelector } from "~/reducers/wallet";
import { leaveAppFor } from "LLM/features/AppLock/adapters/appVisibility";

const SHARE_CANCELED_CODE = "ECANCELLED500";

const pad = (value: number) => String(value).padStart(2, "0");

export const getExportFileName = (date: Date) =>
  `ledgerwallet-operations-${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}.csv`;

const isShareCanceled = (error: unknown) =>
  (error as { error?: { code?: string } } | undefined)?.error?.code === SHARE_CANCELED_CODE;

export function useHistoryExportPort(): HistoryExportPort {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const rawAccounts = useSelector(accountsSelector);
  const names = useBatchMaybeAccountName(rawAccounts);
  const discreet = useSelector(discreetModeSelector);
  const countervalueCurrency = useSelector(counterValueCurrencySelector);
  const walletState = useSelector(walletSelector);
  const countervalueState = useCountervaluesCache();
  const sync = useBridgeSync();
  const syncState = useBridgeSyncState();

  const accounts = useMemo<HistoryExportAccount[]>(
    () =>
      rawAccounts.map((account, index) => ({
        id: account.id,
        name: names[index] ?? account.id,
        formattedBalance: formatCurrencyUnit(account.currency.units[0], account.balance, {
          showCode: true,
          locale,
          discreet,
        }),
        currency: { id: account.currency.id, ticker: account.currency.ticker },
      })),
    [rawAccounts, names, locale, discreet],
  );

  const findAccounts = useCallback(
    (accountIds: readonly string[]): Account[] =>
      rawAccounts.filter(account => accountIds.includes(account.id)),
    [rawAccounts],
  );

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
    (accountIds: readonly string[]) =>
      findAccounts(accountIds).some(
        account =>
          syncState[account.id]?.pending ||
          account.subAccounts?.some(subAccount => syncState[subAccount.id]?.pending),
      ),
    [findAccounts, syncState],
  );

  const exportCsv = useCallback(
    async (accountIds: readonly string[]): Promise<HistoryExportOutcome> => {
      try {
        const csv = accountsOpToCSV(
          findAccounts(accountIds),
          countervalueCurrency,
          countervalueState,
          walletState.accountNames,
        );
        const fileName = getExportFileName(new Date());

        if (getEnv("DETOX")) {
          sendFile({ fileName, fileContent: csv });
          return "saved";
        }

        const result = await leaveAppFor(() =>
          Share.open({
            title: t("history.exportDialog.title"),
            failOnCancel: false,
            saveToFiles: true,
            type: "text/csv",
            filename: fileName,
            url: `data:text/csv;base64,${Buffer.from(csv).toString("base64")}`,
          }),
        );
        return result.dismissedAction ? "canceled" : "saved";
      } catch (error) {
        if (isShareCanceled(error)) return "canceled";
        logger.critical(error as Error);
        return "failed";
      }
    },
    [countervalueCurrency, countervalueState, findAccounts, t, walletState.accountNames],
  );

  return useMemo(
    () => ({ accounts, syncAccounts, isSyncing, exportCsv }),
    [accounts, exportCsv, isSyncing, syncAccounts],
  );
}
