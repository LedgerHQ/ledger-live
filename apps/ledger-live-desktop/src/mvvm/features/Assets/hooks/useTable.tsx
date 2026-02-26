import React, { useMemo } from "react";
import {
  TableCellContent,
  TableInfoIcon,
  useLumenDataTable,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@ledgerhq/lumen-ui-react";
import { CategorizedAssetItem } from "@ledgerhq/asset-aggregation/assetCategorization/types";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import { useTranslation } from "react-i18next";
import { ColumnDef } from "@tanstack/react-table";
import { PriceCell } from "../components/Cells/PriceCell";
import { BalanceCell } from "../components/Cells/BalanceCell";
import { CounterValueCell } from "../components/Cells/CounterValueCell";
import { TrendCell } from "../components/Cells/TrendCell";

export const useTable = (assets: CategorizedAssetItem[]) => {
  const { t } = useTranslation();

  const columns = useMemo<ColumnDef<CategorizedAssetItem>[]>(
    () => [
      {
        accessorKey: "currency",
        header: t("assets.columns.name"),
        enableSorting: false,
        cell: ({ row }) => (
          <TableCellContent
            leadingContent={<CryptoCurrencyIcon currency={row.original.currency} size={32} />}
            title={row.original.currency.name}
            description={row.original.currency.ticker}
          />
        ),
      },
      {
        accessorKey: "price",
        header: t("assets.columns.price"),
        enableSorting: false,
        cell: ({ row }) => <PriceCell currency={row.original.currency} />,
        meta: { align: "end" },
      },
      {
        accessorKey: "balance",
        header: t("assets.columns.balance"),
        enableSorting: false,
        cell: ({ row }) => (
          <BalanceCell currency={row.original.currency} balance={row.original.balance} />
        ),
        meta: { align: "end" },
      },
      {
        accessorKey: "value",
        header: t("assets.columns.value"),
        enableSorting: false,
        cell: ({ row }) => (
          <CounterValueCell currency={row.original.currency} balance={row.original.balance} />
        ),
        meta: { align: "end" },
      },
      {
        accessorKey: "priceChangePercentage24h",
        header: t("assets.columns.trend"),
        enableSorting: false,
        cell: ({ row }) => (
          <TrendCell priceChangePercentage24h={row.original.priceChangePercentage24h} />
        ),
        meta: {
          align: "end",
          headerTrailingContent: (
            <Tooltip>
              <TooltipTrigger asChild>
                <TableInfoIcon />
              </TooltipTrigger>
              <TooltipContent>{t("assets.columns.trendTooltip")}</TooltipContent>
            </Tooltip>
          ),
        },
      },
    ],
    [t],
  );

  const table = useLumenDataTable({
    data: assets,
    columns,
  });

  return table;
};
