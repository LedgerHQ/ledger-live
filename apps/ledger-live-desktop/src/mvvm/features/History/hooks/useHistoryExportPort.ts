import { useCallback, useMemo } from "react";
import type { HistoryExportAccount, HistoryExportPort } from "@features/flow-history-export";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useSelector } from "LLD/hooks/redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { useBatchMaybeAccountName } from "~/renderer/reducers/wallet";
import { discreetModeSelector, localeSelector } from "~/renderer/reducers/settings";
import { useOperationsCsvExporter } from "~/renderer/hooks/useOperationsCsvExporter";

export function useHistoryExportPort(): HistoryExportPort {
  const rawAccounts = useSelector(accountsSelector);
  const names = useBatchMaybeAccountName(rawAccounts);
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const { syncAccounts, isSyncing, exportCsv } = useOperationsCsvExporter();

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
    (accountIds: readonly string[]) =>
      rawAccounts.filter(account => accountIds.includes(account.id)),
    [rawAccounts],
  );

  return useMemo(
    () => ({
      accounts,
      syncAccounts,
      isSyncing: accountIds => isSyncing(findAccounts(accountIds)),
      exportCsv: accountIds => exportCsv(findAccounts(accountIds)),
    }),
    [accounts, exportCsv, findAccounts, isSyncing, syncAccounts],
  );
}
