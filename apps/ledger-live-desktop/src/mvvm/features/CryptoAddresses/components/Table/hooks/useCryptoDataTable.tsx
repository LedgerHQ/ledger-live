import { useCallback, useMemo, useState } from "react";
import { useLumenDataTable } from "@ledgerhq/lumen-ui-react";
import { BigNumber } from "bignumber.js";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { accountNameWithDefaultSelector, walletSelector } from "~/renderer/reducers/wallet";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { useCalculateCountervalueCallback } from "~/renderer/actions/general";
import { blacklistedTokenIdsSelector } from "~/renderer/reducers/settings";
import type { ColumnDef, Row, SortingState, Updater } from "@tanstack/react-table";
import { track } from "@shared/analytics";
import { CRYPTO_TRACKING_PAGE_NAME } from "../../../constants";
import { computeAggregatedAccountsData } from "@ledgerhq/asset-aggregation/index";
import { computeBalanceSortCountervalueByAccountId } from "../../../utils/aggregateAccounts";
import { getCryptoAccountAddress } from "LLD/features/CryptoAddresses/utils/getCryptoAccountAddress";
import { useSyncPhase } from "LLD/hooks/useSyncPhase";
import { useEditNameDialog } from "./useEditNameDialog";
import {
  ActionCell,
  AddressCell,
  AssetsCell,
  BalanceCell,
  NameCell,
  type CryptoTableCellData,
} from "../CryptoTableCells";

type UseCryptoDataTableParams = {
  readonly rows: AccountLike[];
  readonly lookupParentAccount: (id: string) => Account | undefined | null;
  readonly onRowClick: (account: AccountLike, parentAccount?: Account | null) => void;
};

export function useCryptoDataTable({
  rows,
  lookupParentAccount,
  onRowClick,
}: UseCryptoDataTableParams) {
  const { t } = useTranslation();
  const { shouldDisplayAggregatedAssets } = useWalletFeaturesConfig("desktop");
  const walletState = useSelector(walletSelector);
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const calculateCountervalue = useCalculateCountervalueCallback();
  const syncPhase = useSyncPhase();
  const isSyncing = syncPhase === "syncing";
  const { openEditName, editNameDialog } = useEditNameDialog(rows);

  const aggregatedDataByAccountId = useMemo(
    () =>
      shouldDisplayAggregatedAssets
        ? computeAggregatedAccountsData(rows, calculateCountervalue)
        : null,
    [shouldDisplayAggregatedAssets, rows, calculateCountervalue],
  );

  const getSortCountervalue = useMemo(() => {
    if (aggregatedDataByAccountId) {
      return (id: string) => aggregatedDataByAccountId.get(id)?.countervalue ?? new BigNumber(0);
    }
    const countervalueByAccountId = computeBalanceSortCountervalueByAccountId(
      rows,
      calculateCountervalue,
    );
    return (id: string) => countervalueByAccountId.get(id) ?? new BigNumber(0);
  }, [aggregatedDataByAccountId, rows, calculateCountervalue]);

  const columns = useMemo<ColumnDef<AccountLike>[]>(
    () => [
      {
        id: "name",
        accessorFn: row => accountNameWithDefaultSelector(walletState, row),
        sortingFn: (rowA, rowB) =>
          accountNameWithDefaultSelector(walletState, rowA.original).localeCompare(
            accountNameWithDefaultSelector(walletState, rowB.original),
            undefined,
            { sensitivity: "base" },
          ),
        header: t("cryptoAddresses.table.columns.name"),
        cell: NameCell,
      },
      {
        id: "address",
        accessorFn: row => getCryptoAccountAddress(row, lookupParentAccount),
        sortingFn: (rowA, rowB) =>
          getCryptoAccountAddress(rowA.original, lookupParentAccount).localeCompare(
            getCryptoAccountAddress(rowB.original, lookupParentAccount),
            undefined,
            { sensitivity: "base" },
          ),
        header: t("cryptoAddresses.table.columns.address"),
        cell: AddressCell,
        meta: { align: "end" },
      },
      ...(shouldDisplayAggregatedAssets
        ? [
            {
              id: "assets",
              header: t("cryptoAddresses.table.columns.asset"),
              enableSorting: false,
              cell: AssetsCell,
              meta: { align: "end" },
            } satisfies ColumnDef<AccountLike>,
          ]
        : []),
      {
        id: "balance",
        accessorKey: "balance",
        sortingFn: (rowA, rowB) =>
          getSortCountervalue(rowA.original.id).comparedTo(getSortCountervalue(rowB.original.id)),
        header: t("cryptoAddresses.table.columns.value"),
        cell: BalanceCell,
        meta: { align: "end" },
      },
      {
        id: "action",
        header: "",
        enableSorting: false,
        cell: ActionCell,
        meta: { align: "end" },
      },
    ],
    [t, walletState, shouldDisplayAggregatedAssets, lookupParentAccount, getSortCountervalue],
  );

  const cellData = useMemo<CryptoTableCellData>(
    () => ({
      walletState,
      shouldDisplayAggregatedAssets,
      lookupParentAccount,
      blacklistedTokenIds,
      aggregatedDataByAccountId,
      isSyncing,
      onEditName: openEditName,
    }),
    [
      walletState,
      shouldDisplayAggregatedAssets,
      lookupParentAccount,
      blacklistedTokenIds,
      aggregatedDataByAccountId,
      isSyncing,
      openEditName,
    ],
  );

  const [sorting, setSorting] = useState<SortingState>([{ id: "balance", desc: true }]);

  const handleSortingChange = useCallback(
    (updater: Updater<SortingState>) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      const sort = next[0];
      if (sort) {
        track("changeSort", {
          [sort.id]: sort.desc ? "desc" : "asc",
          page: CRYPTO_TRACKING_PAGE_NAME,
        });
      }
      setSorting(next);
    },
    [sorting],
  );

  const table = useLumenDataTable({
    data: rows,
    columns,
    enableMultiSort: false,
    enableSortingRemoval: false,
    state: { sorting },
    onSortingChange: handleSortingChange,
    getRowId: row => row.id,
  });

  const handleRowClick = useCallback(
    (row: Row<AccountLike>) => {
      const account = row.original;
      const parentAccount =
        account.type === "TokenAccount" ? lookupParentAccount(account.parentId) : null;
      onRowClick(account, parentAccount ?? undefined);
    },
    [lookupParentAccount, onRowClick],
  );

  const getRowTestId = useCallback(
    (row: Row<AccountLike>) => {
      const accountName = accountNameWithDefaultSelector(walletState, row.original);
      const sanitizedName = accountName.replaceAll(/\s+/g, "-");
      return `crypto-account-row-${sanitizedName}`;
    },
    [walletState],
  );

  return { table, handleRowClick, getRowTestId, cellData, editNameDialog, isSyncing };
}
