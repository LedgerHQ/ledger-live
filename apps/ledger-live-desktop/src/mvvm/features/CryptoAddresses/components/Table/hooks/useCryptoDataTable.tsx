import React, { useCallback, useMemo, useState } from "react";
import { useLumenDataTable } from "@ledgerhq/lumen-ui-react";
import { BigNumber } from "bignumber.js";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { accountNameWithDefaultSelector } from "@ledgerhq/live-wallet/store";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/walletFeaturesConfig/index";
import { useCalculateCountervalueCallback } from "~/renderer/actions/general";
import { walletSelector } from "~/renderer/reducers/wallet";
import type { ColumnDef, Row, SortingState, Updater } from "@tanstack/react-table";
import { track } from "~/renderer/analytics/segment";
import { CRYPTO_TRACKING_PAGE_NAME } from "../../../constants";
import { computeAggregatedAccountsData } from "@ledgerhq/asset-aggregation/index";
import { computeBalanceSortCountervalueByAccountId } from "../../../utils/aggregateAccounts";
import {
  AccountAddressCell,
  AccountNameCell,
  AccountRowActionCell,
  AccountValueCell,
  AggregatedAccountNameCell,
  AggregatedAccountValueCell,
} from "../Cell";
import { useSyncPhase } from "LLD/hooks/useSyncPhase";

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
  const calculateCountervalue = useCalculateCountervalueCallback();
  const syncPhase = useSyncPhase();
  const isSyncing = syncPhase === "syncing";

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
        cell: ({ row }) =>
          shouldDisplayAggregatedAssets && row.original.type === "Account" ? (
            <AggregatedAccountNameCell
              account={row.original}
              displayName={accountNameWithDefaultSelector(walletState, row.original)}
            />
          ) : (
            <AccountNameCell
              account={row.original}
              displayName={accountNameWithDefaultSelector(walletState, row.original)}
            />
          ),
      },
      {
        id: "address",
        enableSorting: false,
        header: t("cryptoAddresses.table.columns.address"),
        cell: ({ row }) => (
          <AccountAddressCell account={row.original} lookupParentAccount={lookupParentAccount} />
        ),
        meta: { align: "end" },
      },
      {
        id: "balance",
        accessorKey: "balance",
        sortingFn: (rowA, rowB) =>
          getSortCountervalue(rowA.original.id).comparedTo(getSortCountervalue(rowB.original.id)),
        header: t("cryptoAddresses.table.columns.value"),
        cell: ({ row }) => {
          const entry = aggregatedDataByAccountId?.get(row.original.id);
          const assetsCount =
            (entry?.subAccountsCount ?? 0) + (row.original.balance.isZero() ? 0 : 1);
          return shouldDisplayAggregatedAssets && aggregatedDataByAccountId ? (
            <AggregatedAccountValueCell
              aggregatedCountervalue={entry?.countervalue ?? new BigNumber(0)}
              assetsCount={assetsCount}
            />
          ) : (
            <AccountValueCell account={row.original} />
          );
        },
        meta: { align: "end" },
      },
      {
        id: "action",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <AccountRowActionCell
            account={row.original}
            editNameAriaLabel={t("cryptoAddresses.table.editName")}
            isSyncing={isSyncing}
          />
        ),
        meta: { align: "end" },
      },
    ],
    [
      t,
      walletState,
      shouldDisplayAggregatedAssets,
      lookupParentAccount,
      getSortCountervalue,
      aggregatedDataByAccountId,
      isSyncing,
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

  return { table, handleRowClick, getRowTestId };
}
