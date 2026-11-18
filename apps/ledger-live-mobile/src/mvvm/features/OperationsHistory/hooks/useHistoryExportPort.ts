import { useCallback, useMemo } from "react";
import Config from "react-native-config";
import Share from "react-native-share";
import type { Account } from "@ledgerhq/types-live";
import { AccountIdSchema, type AccountId } from "@domain/entity-account";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import type {
  HistoryExportAccount,
  HistoryExportOutcome,
  HistoryExportPort,
} from "@features/flow-history-export";
import { useCountervaluesCache } from "@features/platform-market-countervalues";
import { useBridgeSync, useBridgeSyncState } from "@ledgerhq/live-common/bridge/react/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { accountsOpToCSV } from "@ledgerhq/live-common/csvExport";
import { useSelector } from "~/context/hooks";
import { useLocale, useTranslation } from "~/context/Locale";
import { sendFile } from "~/e2e/bridge/client";
import logger from "~/logger";
import { accountsSelector } from "~/reducers/accounts";
import { counterValueCurrencySelector, discreetModeSelector } from "~/reducers/settings";
import { accountNameWithDefaultSelector, walletSelector } from "~/reducers/wallet";
import { leaveAppFor } from "LLM/features/AppLock/adapters/appVisibility";

/** iOS rejects a cancelled "Save to Files" picker with this code; Android resolves `dismissedAction`. */
const PICKER_CANCELED_CODE = "CANCELLED";

const pad = (value: number) => String(value).padStart(2, "0");

/** Without extension: the share sheet adds `.csv` from the `text/csv` type. */
export const getExportFileName = (date: Date) =>
  `ledgerwallet-operations-${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;

const isPickerCanceled = (error: unknown) =>
  error instanceof Error && "code" in error && error.code === PICKER_CANCELED_CODE;

const toError = (error: unknown) => (error instanceof Error ? error : new Error(String(error)));

export function useHistoryExportPort(): HistoryExportPort {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const rawAccounts = useSelector(accountsSelector);
  const discreet = useSelector(discreetModeSelector);
  const countervalueCurrency = useSelector(counterValueCurrencySelector);
  const walletState = useSelector(walletSelector);
  const countervalueState = useCountervaluesCache();
  const sync = useBridgeSync();
  const syncState = useBridgeSyncState();

  const accounts = useMemo<HistoryExportAccount[]>(
    () =>
      rawAccounts.map(account => ({
        id: AccountIdSchema.parse(account.id),
        name: accountNameWithDefaultSelector(walletState, account),
        formattedBalance: formatCurrencyUnit(account.currency.units[0], account.balance, {
          showCode: true,
          locale,
          discreet,
        }),
        currency: {
          id: CryptoOrTokenCurrencyIdSchema.parse(account.currency.id),
          ticker: account.currency.ticker,
        },
      })),
    [rawAccounts, walletState, locale, discreet],
  );

  const findAccounts = useCallback(
    (accountIds: readonly AccountId[]): Account[] => {
      const requestedIds = new Set<string>(accountIds);
      return rawAccounts.filter(account => requestedIds.has(account.id));
    },
    [rawAccounts],
  );

  const syncAccounts = useCallback(
    (accountIds: readonly AccountId[]) => {
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
    (accountIds: readonly AccountId[]) =>
      findAccounts(accountIds).some(
        account =>
          syncState[account.id]?.pending ||
          account.subAccounts?.some(subAccount => syncState[subAccount.id]?.pending),
      ),
    [findAccounts, syncState],
  );

  const exportCsv = useCallback(
    async (accountIds: readonly AccountId[]): Promise<HistoryExportOutcome> => {
      try {
        const csv = accountsOpToCSV(
          findAccounts(accountIds),
          countervalueCurrency,
          countervalueState,
          walletState.accountNames,
        );
        const fileName = getExportFileName(new Date());

        if (Config.DETOX) {
          sendFile({ fileName: `${fileName}.csv`, fileContent: csv });
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
        if (isPickerCanceled(error)) return "canceled";
        logger.critical(toError(error));
        return "failed";
      }
    },
    [countervalueCurrency, countervalueState, findAccounts, t, walletState],
  );

  return useMemo(
    () => ({ accounts, syncAccounts, isSyncing, exportCsv }),
    [accounts, exportCsv, isSyncing, syncAccounts],
  );
}
