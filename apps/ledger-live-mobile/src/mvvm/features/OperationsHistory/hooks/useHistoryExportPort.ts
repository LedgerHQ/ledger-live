import { useCallback, useMemo } from "react";
import Config from "react-native-config";
import Share from "react-native-share";
import { AccountIdSchema, type AccountId } from "@domain/entity-account";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import {
  getHistoryExportFileName,
  type HistoryExportAccount,
  type HistoryExportOutcome,
  type HistoryExportPort,
} from "@features/flow-history-export";
import {
  exportAccountsOperationsCsv,
  type OperationsCsvAccountRequest,
} from "@features/platform-account-operations-csv";
import { useCountervaluesCache } from "@features/platform-market-countervalues";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { findAssetCurrency } from "~/config/account-data-setup";
import { useDispatch, useSelector } from "~/context/hooks";
import { useLocale, useTranslation } from "~/context/Locale";
import { sendFile } from "~/e2e/bridge/client";
import logger from "~/logger";
import { accountsSelector } from "~/reducers/accounts";
import { counterValueCurrencySelector, discreetModeSelector } from "~/reducers/settings";
import { accountNameWithDefaultSelector, walletSelector } from "~/reducers/wallet";
import { leaveAppFor } from "LLM/features/AppLock/adapters/appVisibility";

/** iOS rejects a cancelled "Save to Files" picker with this code; Android resolves `dismissedAction`. */
const PICKER_CANCELED_CODE = "CANCELLED";

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
  const countervalues = useCountervaluesCache();
  const dispatch = useDispatch();

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

  const csvRequests = useMemo<OperationsCsvAccountRequest[]>(
    () =>
      rawAccounts.map((account, index) => ({
        id: accounts[index].id,
        name: accounts[index].name,
        xpub: account.xpub || account.freshAddress,
      })),
    [rawAccounts, accounts],
  );

  const exportCsv = useCallback(
    async (accountIds: readonly AccountId[]): Promise<HistoryExportOutcome> => {
      try {
        const requested = new Set<string>(accountIds);
        const csv = await dispatch(
          exportAccountsOperationsCsv(
            csvRequests.filter(({ id }) => requested.has(id)),
            { countervalueCurrency, countervalues, findCurrency: findAssetCurrency },
          ),
        );
        const fileName = getHistoryExportFileName(new Date());

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
    [csvRequests, countervalueCurrency, countervalues, dispatch, t],
  );

  return useMemo(() => ({ accounts, exportCsv }), [accounts, exportCsv]);
}
