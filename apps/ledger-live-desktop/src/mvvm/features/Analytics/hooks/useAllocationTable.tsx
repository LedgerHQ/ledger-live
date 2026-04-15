import React, { useMemo } from "react";
import { TableCellContent, useLumenDataTable } from "@ledgerhq/lumen-ui-react";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/walletFeaturesConfig/index";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { getValidCryptoIconSize } from "~/renderer/utils/cryptoIconSize";
import { useTranslation } from "react-i18next";
import { ColumnDef } from "@tanstack/react-table";
import { BalanceCell } from "../../Assets/components/Cells/BalanceCell";
import { CounterValueCell } from "../../Assets/components/Cells/CounterValueCell";
import { useSelector } from "LLD/hooks/redux";
import { localeSelector } from "~/renderer/reducers/settings";
import type { AllocationTableItem } from "../types";

export const useAllocationTable = (items: AllocationTableItem[]) => {
  const { shouldDisplayAggregatedAssets } = useWalletFeaturesConfig("desktop");
  const { t } = useTranslation();
  const locale = useSelector(localeSelector);

  const columns = useMemo<ColumnDef<AllocationTableItem>[]>(
    () => [
      {
        accessorKey: "currency",
        header: t("analytics.allocation.columns.name"),
        enableSorting: false,
        cell: ({ row }) => (
          <TableCellContent
            leadingContent={
              shouldDisplayAggregatedAssets ? (
                <CryptoIcon
                  ledgerId={row.original.currency.id}
                  ticker={row.original.currency.ticker}
                  size={getValidCryptoIconSize(32)}
                />
              ) : (
                <CryptoCurrencyIcon currency={row.original.currency} size={32} />
              )
            }
            title={row.original.currency.name}
            description={row.original.currency.ticker}
          />
        ),
      },
      {
        accessorKey: "balance",
        header: t("analytics.allocation.columns.balance"),
        enableSorting: false,
        cell: ({ row }) => (
          <BalanceCell currency={row.original.currency} balance={row.original.balance} />
        ),
        meta: { align: "end" },
      },
      {
        accessorKey: "value",
        header: t("analytics.allocation.columns.value"),
        enableSorting: false,
        cell: ({ row }) => (
          <CounterValueCell currency={row.original.currency} balance={row.original.balance} />
        ),
        meta: { align: "end" },
      },
      {
        accessorKey: "distribution",
        header: t("analytics.allocation.columns.allocation"),
        enableSorting: false,
        cell: ({ row }) => {
          const formatted = row.original.distribution.toLocaleString(locale, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          });
          return (
            <TableCellContent
              align="end"
              title={<span className="text-muted">{formatted}%</span>}
            />
          );
        },
        meta: { align: "end" },
      },
    ],
    [t, locale, shouldDisplayAggregatedAssets],
  );

  return useLumenDataTable({
    data: items,
    columns,
  });
};
