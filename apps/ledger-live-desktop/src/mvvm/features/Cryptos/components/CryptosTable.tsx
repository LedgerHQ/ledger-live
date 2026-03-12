import React, { useCallback, useMemo } from "react";
import {
  DataTableRoot,
  DataTable,
  TableCellContent,
  useLumenDataTable,
} from "@ledgerhq/lumen-ui-react";
import { Row } from "@tanstack/react-table";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { accountNameWithDefaultSelector } from "@ledgerhq/live-wallet/store";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import { CounterValueCell } from "LLD/features/Assets/components/Cells/CounterValueCell";
import { walletSelector } from "~/renderer/reducers/wallet";
import { ChevronRight } from "@ledgerhq/lumen-ui-react/symbols";
import { IconButton } from "@ledgerhq/lumen-ui-react";
import { ColumnDef } from "@tanstack/react-table";

type CryptosTableProps = {
  rows: AccountLike[];
  lookupParentAccount: (id: string) => Account | undefined | null;
  onRowClick: (account: AccountLike, parentAccount?: Account | null) => void;
};

function AccountNameCell({ account }: { account: AccountLike }) {
  const walletState = useSelector(walletSelector);
  const currency = getAccountCurrency(account);
  const name = accountNameWithDefaultSelector(walletState, account);
  return (
    <TableCellContent
      leadingContent={<CryptoCurrencyIcon currency={currency} size={32} />}
      title={name}
      description={currency.ticker}
    />
  );
}

function AccountAddressCell({
  account,
  lookupParentAccount,
}: {
  account: AccountLike;
  lookupParentAccount: (id: string) => Account | undefined | null;
}) {
  const address =
    account.type === "Account"
      ? account.freshAddress
      : lookupParentAccount(account.parentId)?.freshAddress ?? "";
  const formatted = formatAddress(address, { prefixLength: 5, suffixLength: 5 });
  return <TableCellContent title={formatted} />;
}

function AccountValueCell({ account }: { account: AccountLike }) {
  const currency = getAccountCurrency(account);
  const balance = account.balance.toNumber();
  return <CounterValueCell currency={currency} balance={balance} />;
}

function useCryptosTable(
  rows: AccountLike[],
  lookupParentAccount: (id: string) => Account | undefined | null,
  onRowClick: (account: AccountLike, parentAccount?: Account | null) => void,
) {
  const { t } = useTranslation();

  const columns = useMemo<ColumnDef<AccountLike>[]>(
    () => [
      {
        accessorKey: "id",
        header: t("cryptos.table.columns.name"),
        enableSorting: false,
        cell: ({ row }) => <AccountNameCell account={row.original} />,
      },
      {
        accessorKey: "freshAddress",
        header: t("cryptos.table.columns.address"),
        enableSorting: false,
        cell: ({ row }) => (
          <AccountAddressCell account={row.original} lookupParentAccount={lookupParentAccount} />
        ),
      },
      {
        accessorKey: "balance",
        header: t("cryptos.table.columns.value"),
        enableSorting: false,
        cell: ({ row }) => <AccountValueCell account={row.original} />,
        meta: { align: "end" },
      },
      {
        id: "action",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const account = row.original;
          const parentAccount =
            account.type === "TokenAccount" ? lookupParentAccount(account.parentId) : null;
          return (
            <IconButton
              size="sm"
              icon={ChevronRight}
              aria-label={t("cryptos.table.openAccount")}
              onClick={e => {
                e.stopPropagation();
                onRowClick(account, parentAccount ?? undefined);
              }}
            />
          );
        },
        meta: { align: "end" },
      },
    ],
    [t, lookupParentAccount, onRowClick],
  );

  return useLumenDataTable({
    data: rows,
    columns,
  });
}

export function CryptosTable({ rows, lookupParentAccount, onRowClick }: CryptosTableProps) {
  const table = useCryptosTable(rows, lookupParentAccount, onRowClick);

  const handleRowClick = useCallback(
    (row: Row<AccountLike>) => {
      const account = row.original;
      const parentAccount =
        account.type === "TokenAccount" ? lookupParentAccount(account.parentId) : null;
      onRowClick(account, parentAccount ?? undefined);
    },
    [lookupParentAccount, onRowClick],
  );

  return (
    <DataTableRoot table={table} appearance="plain" onRowClick={handleRowClick}>
      <DataTable />
    </DataTableRoot>
  );
}
