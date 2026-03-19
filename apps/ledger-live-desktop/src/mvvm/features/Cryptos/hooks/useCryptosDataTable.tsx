import React, { useCallback, useMemo } from "react";
import { TableSortButton, useLumenDataTable } from "@ledgerhq/lumen-ui-react";
import { BigNumber } from "bignumber.js";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { accountNameWithDefaultSelector } from "@ledgerhq/live-wallet/store";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import { useCalculateCountervalueCallback } from "~/renderer/actions/general";
import { walletSelector } from "~/renderer/reducers/wallet";
import { ColumnDef, Row } from "@tanstack/react-table";
import {
  AccountAddressCell,
  AccountNameCell,
  AccountRowActionCell,
  AccountValueCell,
} from "../components/CryptosTableCells";
const SORT_HEADER_BUTTON_CLASS = "[&_svg]:!opacity-100";

type UseCryptosDataTableParams = {
  readonly rows: AccountLike[];
  readonly lookupParentAccount: (id: string) => Account | undefined | null;
  readonly onRowClick: (account: AccountLike, parentAccount?: Account | null) => void;
};

export function useCryptosDataTable({
  rows,
  lookupParentAccount,
  onRowClick,
}: UseCryptosDataTableParams) {
  const { t } = useTranslation();
  const walletState = useSelector(walletSelector);
  const calculateCountervalue = useCalculateCountervalueCallback();

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
        header: ({ column }) => (
          <TableSortButton
            className={SORT_HEADER_BUTTON_CLASS}
            sortDirection={column.getIsSorted() || undefined}
            onClick={column.getToggleSortingHandler()}
          >
            {t("cryptos.table.columns.name")}
          </TableSortButton>
        ),
        cell: ({ row }) => <AccountNameCell account={row.original} />,
      },
      {
        id: "address",
        enableSorting: false,
        header: t("cryptos.table.columns.address"),
        cell: ({ row }) => (
          <AccountAddressCell account={row.original} lookupParentAccount={lookupParentAccount} />
        ),
        meta: { align: "end" },
      },
      {
        id: "balance",
        accessorKey: "balance",
        sortingFn: (rowA, rowB) => {
          const currencyA = getAccountCurrency(rowA.original);
          const currencyB = getAccountCurrency(rowB.original);
          const fiatA = calculateCountervalue(currencyA, rowA.original.balance) ?? new BigNumber(0);
          const fiatB = calculateCountervalue(currencyB, rowB.original.balance) ?? new BigNumber(0);
          return fiatA.comparedTo(fiatB);
        },
        header: ({ column }) => (
          <TableSortButton
            className={SORT_HEADER_BUTTON_CLASS}
            align="end"
            sortDirection={column.getIsSorted() || undefined}
            onClick={column.getToggleSortingHandler()}
          >
            {t("cryptos.table.columns.value")}
          </TableSortButton>
        ),
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
            editNameAriaLabel={t("cryptos.table.editName")}
          />
        ),
        meta: { align: "end" },
      },
    ],
    [t, walletState, lookupParentAccount, calculateCountervalue],
  );

  const table = useLumenDataTable({
    data: rows,
    columns,
    enableMultiSort: false,
    enableSortingRemoval: false,
    initialState: {
      sorting: [{ id: "balance", desc: true }],
    },
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

  return { table, handleRowClick };
}
