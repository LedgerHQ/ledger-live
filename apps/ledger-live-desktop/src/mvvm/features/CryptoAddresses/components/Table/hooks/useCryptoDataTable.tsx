import React, { useCallback, useMemo, useState } from "react";
import { useLumenDataTable } from "@ledgerhq/lumen-ui-react";
import { BigNumber } from "bignumber.js";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { accountNameWithDefaultSelector } from "@ledgerhq/live-wallet/store";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import { useCalculateCountervalueCallback } from "~/renderer/actions/general";
import { walletSelector } from "~/renderer/reducers/wallet";
import type { ColumnDef, Row, SortingState, Updater } from "@tanstack/react-table";
import { track } from "~/renderer/analytics/segment";
import { CRYPTO_TRACKING_PAGE_NAME } from "../../../constants";
import {
  AccountAddressCell,
  AccountNameCell,
  AccountRowActionCell,
  AccountValueCell,
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
  const walletState = useSelector(walletSelector);
  const calculateCountervalue = useCalculateCountervalueCallback();
  const syncPhase = useSyncPhase();
  const isSyncing = syncPhase === "syncing";

  /** One countervalue per row; avoids recalculations in sorting. */
  const balanceSortFiatByAccountId = useMemo(() => {
    const map = new Map<string, BigNumber>();
    for (const account of rows) {
      const currency = getAccountCurrency(account);
      map.set(account.id, calculateCountervalue(currency, account.balance) ?? new BigNumber(0));
    }
    return map;
  }, [rows, calculateCountervalue]);

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
        cell: ({ row }) => (
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
        sortingFn: (rowA, rowB) => {
          const fiatA = balanceSortFiatByAccountId.get(rowA.original.id) ?? new BigNumber(0);
          const fiatB = balanceSortFiatByAccountId.get(rowB.original.id) ?? new BigNumber(0);
          return fiatA.comparedTo(fiatB);
        },
        header: t("cryptoAddresses.table.columns.value"),
        cell: ({ row }) => <AccountValueCell account={row.original} />,
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
    [t, walletState, lookupParentAccount, balanceSortFiatByAccountId, isSyncing],
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
