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
import type { ColumnDef, Row } from "@tanstack/react-table";
import {
  AccountAddressCell,
  AccountNameCell,
  AccountRowActionCell,
  AccountValueCell,
} from "../Cell";
const SORT_HEADER_BUTTON_CLASS = "[&_svg]:!opacity-100";

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
        header: ({ column }) => (
          <TableSortButton
            className={SORT_HEADER_BUTTON_CLASS}
            sortDirection={column.getIsSorted() || undefined}
            onClick={column.getToggleSortingHandler()}
          >
            {t("crypto.table.columns.name")}
          </TableSortButton>
        ),
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
        header: t("crypto.table.columns.address"),
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
        header: ({ column }) => (
          <TableSortButton
            className={SORT_HEADER_BUTTON_CLASS}
            align="end"
            sortDirection={column.getIsSorted() || undefined}
            onClick={column.getToggleSortingHandler()}
          >
            {t("crypto.table.columns.value")}
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
            editNameAriaLabel={t("crypto.table.editName")}
          />
        ),
        meta: { align: "end" },
      },
    ],
    [t, walletState, lookupParentAccount, balanceSortFiatByAccountId],
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
