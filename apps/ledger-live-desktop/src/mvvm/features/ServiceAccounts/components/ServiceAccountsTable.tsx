import React, { useMemo } from "react";
import {
  Table,
  TableCellContent,
  TableCellContentDescription,
  TableCellContentTitle,
  TableCellItem,
  TableRoot,
  useLumenDataTable,
} from "@ledgerhq/lumen-ui-react";
import type { CellContext, ColumnDef } from "@tanstack/react-table";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import { useTranslation } from "react-i18next";
import { PlainCryptoTableBody } from "LLD/features/CryptoAddresses/components/PlainCryptoTable/components/PlainCryptoTableBody";
import { PlainCryptoTableHeader } from "LLD/features/CryptoAddresses/components/PlainCryptoTable/components/PlainCryptoTableHeader";
import type { ServiceAccountRowView } from "../types";

type ServiceCell = CellContext<ServiceAccountRowView, unknown>;

function NameCell({ row: { original: row } }: ServiceCell) {
  const { t } = useTranslation();
  const currency = findCryptoCurrencyById(row.network);
  const status = t(`portfolio.service.status.${row.status}`);

  return (
    <TableCellItem>
      {currency ? <CryptoCurrencyIcon currency={currency} size={32} /> : null}
      <TableCellContent>
        <TableCellContentTitle>{row.name}</TableCellContentTitle>
        <TableCellContentDescription>
          {row.error ? `${status} · ${row.error}` : status}
        </TableCellContentDescription>
      </TableCellContent>
    </TableCellItem>
  );
}

function AddressCell({ row: { original: row } }: ServiceCell) {
  return (
    <TableCellItem>
      <TableCellContent>
        <TableCellContentTitle>
          {formatAddress(row.address, { prefixLength: 5, suffixLength: 5 })}
        </TableCellContentTitle>
      </TableCellContent>
    </TableCellItem>
  );
}

function ValueCell({ row: { original: row } }: ServiceCell) {
  const { t } = useTranslation();
  const pending = row.pending ? ` · ${t("portfolio.service.pending")}` : "";
  const balance = row.balanceLabel ? `${row.balanceLabel}${pending}` : null;

  return (
    <TableCellItem align="end">
      <TableCellContent>
        <TableCellContentTitle>{row.valueLabel ?? "—"}</TableCellContentTitle>
        {balance ? <TableCellContentDescription>{balance}</TableCellContentDescription> : null}
      </TableCellContent>
    </TableCellItem>
  );
}

export function ServiceAccountsTable({
  rows,
}: {
  readonly rows: readonly ServiceAccountRowView[];
}) {
  const { t } = useTranslation();
  const data = useMemo(() => [...rows], [rows]);
  const columns = useMemo<ColumnDef<ServiceAccountRowView>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: t("cryptoAddresses.table.columns.name"),
        cell: NameCell,
      },
      {
        id: "address",
        accessorKey: "address",
        header: t("cryptoAddresses.table.columns.address"),
        cell: AddressCell,
        meta: { align: "end" },
      },
      {
        id: "balance",
        accessorFn: row => row.value ?? 0,
        header: t("cryptoAddresses.table.columns.value"),
        cell: ValueCell,
        meta: { align: "end" },
      },
    ],
    [t],
  );
  const table = useLumenDataTable({
    data,
    columns,
    enableMultiSort: false,
    enableSortingRemoval: false,
    initialState: { sorting: [{ id: "balance", desc: true }] },
    getRowId: row => row.id,
  });

  return (
    <TableRoot appearance="plain" data-testid="portfolio-service-table">
      <Table>
        <PlainCryptoTableHeader table={table} />
        <PlainCryptoTableBody table={table} getRowTestId={() => "portfolio-service-row"} />
      </Table>
    </TableRoot>
  );
}
